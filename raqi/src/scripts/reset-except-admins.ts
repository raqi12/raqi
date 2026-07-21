import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import { Role } from '../common/roles.enum';

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

async function resetExceptAdmins(): Promise<void> {
  loadEnvFile();

  if (!process.argv.includes('--confirm')) {
    console.error(
      'Refusing to run without --confirm.\n' +
        'This deletes ALL database data except users with role "admin".\n' +
        'Usage: npm run db:reset-except-admins -- --confirm',
    );
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/raqi';
  await mongoose.connect(mongoUri);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection has no database handle');
  }

  const collections = await db.listCollections().toArray();
  console.log(`Connected to ${mongoUri}`);
  console.log(`Found ${collections.length} collection(s).\n`);

  let adminsKept = 0;

  for (const { name } of collections) {
    if (name.startsWith('system.')) {
      continue;
    }

    const collection = db.collection(name);

    if (name === 'users') {
      const before = await collection.countDocuments({});
      const result = await collection.deleteMany({ role: { $ne: Role.Admin } });
      adminsKept = await collection.countDocuments({ role: Role.Admin });
      console.log(
        `users: deleted ${result.deletedCount}/${before} (kept ${adminsKept} admin(s))`,
      );
      continue;
    }

    const before = await collection.countDocuments({});
    const result = await collection.deleteMany({});
    console.log(`${name}: deleted ${result.deletedCount}/${before}`);
  }

  console.log(`\nDone. ${adminsKept} admin user(s) remain.`);
  await mongoose.disconnect();
}

void resetExceptAdmins().catch((error: unknown) => {
  console.error('Failed to reset database:', error);
  process.exit(1);
});
