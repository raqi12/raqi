import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import { AreaSchema } from '../modules/areas/schemas/area.schema';
import { CitySchema } from '../modules/cities/schemas/city.schema';

function loadEnvFile(): void {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    return;
  }
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

type LegacyAreaDoc = {
  _id: mongoose.Types.ObjectId;
  name?: string;
  city?: string;
  cityId?: string;
};

async function migrateCities(): Promise<void> {
  loadEnvFile();
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/raqi';

  await mongoose.connect(mongoUri);
  const City = mongoose.models.City ?? mongoose.model('City', CitySchema);
  const Area = mongoose.models.Area ?? mongoose.model('Area', AreaSchema);

  const areas = (await Area.find().lean().exec()) as LegacyAreaDoc[];
  let migrated = 0;
  let skipped = 0;

  for (const area of areas) {
    if (area.cityId) {
      skipped += 1;
      continue;
    }

    const cityName = area.city?.trim();
    if (!cityName) {
      console.warn(`Skipping area ${String(area._id)} — missing city and cityId`);
      skipped += 1;
      continue;
    }

    let city = await City.findOne({ name: cityName }).exec();
    if (!city) {
      city = await City.create({ name: cityName });
      console.log(`Created city: ${cityName}`);
    }

    await Area.updateOne(
      { _id: area._id },
      {
        $set: { cityId: String(city._id) },
        $unset: { city: '' },
      },
    );
    migrated += 1;
  }

  console.log(`Migration complete. Migrated: ${migrated}, skipped: ${skipped}`);
  await mongoose.disconnect();
}

void migrateCities().catch((error: unknown) => {
  console.error('Failed to migrate cities:', error);
  process.exit(1);
});
