import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/roles.enum';
import { UserSchema } from '../modules/users/schemas/user.schema';
import { DEFAULT_ADMIN } from '../modules/users/users.service';

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

async function seedAdmin(): Promise<void> {
  loadEnvFile();
  const resetPassword = process.argv.includes('--reset');
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/raqi';

  await mongoose.connect(mongoUri);
  const User = mongoose.models.User ?? mongoose.model('User', UserSchema);

  const existing = await User.findOne({ email: DEFAULT_ADMIN.email });
  if (existing) {
    existing.role = Role.Admin;
    existing.status = 'active';
    existing.name = DEFAULT_ADMIN.name;
    if (resetPassword) {
      existing.passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
    }
    await existing.save();
    console.log(resetPassword ? 'Admin password reset.' : 'Admin already exists — ensured admin role/status.');
  } else {
    await User.create({
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      passwordHash: await bcrypt.hash(DEFAULT_ADMIN.password, 10),
      role: Role.Admin,
      status: 'active',
      phoneVerified: false,
    });
    console.log('Admin created.');
  }

  console.log(`Email: ${DEFAULT_ADMIN.email}`);
  console.log(`Password: ${DEFAULT_ADMIN.password}`);
  if (!resetPassword) {
    console.log('Tip: run npm run seed:admin -- --reset to reset password.');
  }

  await mongoose.disconnect();
}

void seedAdmin().catch((error: unknown) => {
  console.error('Failed to seed admin:', error);
  process.exit(1);
});
