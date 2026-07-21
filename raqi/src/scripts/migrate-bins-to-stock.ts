import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import { BinSchema } from '../modules/bins/schemas/bin.schema';
import { BinAssignmentSchema } from '../modules/bins/schemas/bin-assignment.schema';

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

type LegacyBinDoc = {
  _id: mongoose.Types.ObjectId;
  code?: string;
  qr?: string;
  capacity?: number;
  fee?: number;
  status?: string;
  customerId?: string | null;
  active?: boolean;
  deliveryDate?: string | null;
  totalCount?: number;
  availableCount?: number;
};

type SubscriptionDoc = {
  _id: mongoose.Types.ObjectId;
  binId?: string | null;
  customerId?: string;
};

/**
 * Converts legacy one-document-per-physical-bin records into stock-based bin types.
 *
 * For each legacy bin without `totalCount`:
 * - Sets totalCount=1 and availableCount based on assignment state
 * - Creates a BinAssignment when customerId was set
 * - Removes obsolete fields (qr, status, customerId, deliveryDate)
 *
 * Safe to re-run: bins that already have totalCount are skipped.
 */
async function migrateBinsToStock(): Promise<void> {
  loadEnvFile();
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/raqi';

  await mongoose.connect(mongoUri);
  const Bin = mongoose.models.Bin ?? mongoose.model('Bin', BinSchema);
  const BinAssignment =
    mongoose.models.BinAssignment ??
    mongoose.model('BinAssignment', BinAssignmentSchema);
  const Subscription =
    mongoose.models.Subscription ??
    mongoose.model(
      'Subscription',
      new mongoose.Schema({}, { strict: false, collection: 'subscriptions' }),
    );

  const legacyBins = (await Bin.find({
    totalCount: { $exists: false },
  })
    .lean()
    .exec()) as LegacyBinDoc[];

  let migrated = 0;
  let assignmentsCreated = 0;
  let skipped = 0;

  for (const bin of legacyBins) {
    const binId = String(bin._id);
    const hasCustomer = Boolean(bin.customerId);
    const wasAssigned =
      hasCustomer || bin.status === 'assigned' || Boolean(bin.active);

    const totalCount = 1;
    const availableCount = wasAssigned ? 0 : 1;

    if (hasCustomer && bin.customerId) {
      const existingAssignment = await BinAssignment.findOne({
        binId,
        customerId: bin.customerId,
        active: true,
      }).exec();

      if (!existingAssignment) {
        const subscription = (await Subscription.findOne({
          binId,
          customerId: bin.customerId,
          status: { $in: ['active', 'requested'] },
        })
          .lean()
          .exec()) as SubscriptionDoc | null;

        await BinAssignment.create({
          binId,
          customerId: bin.customerId,
          subscriptionId: subscription ? String(subscription._id) : null,
          deliveryDate: bin.deliveryDate ?? null,
          active: true,
        });
        assignmentsCreated += 1;
      }
    }

    await Bin.updateOne(
      { _id: bin._id },
      {
        $set: {
          totalCount,
          availableCount,
          active: bin.active !== false,
          capacity: bin.capacity ?? 0,
          fee: bin.fee ?? 0,
        },
        $unset: {
          qr: '',
          status: '',
          customerId: '',
          deliveryDate: '',
        },
      },
    );
    migrated += 1;
  }

  // Also normalize any bins that somehow have totalCount but still carry legacy fields
  const cleanup = await Bin.updateMany(
    {
      $or: [
        { qr: { $exists: true } },
        { status: { $exists: true } },
        { customerId: { $exists: true } },
        { deliveryDate: { $exists: true } },
      ],
    },
    {
      $unset: {
        qr: '',
        status: '',
        customerId: '',
        deliveryDate: '',
      },
    },
  );
  skipped = cleanup.modifiedCount;

  console.log(
    `Migration complete. Migrated: ${migrated}, assignments created: ${assignmentsCreated}, legacy fields cleaned: ${skipped}`,
  );
  await mongoose.disconnect();
}

void migrateBinsToStock().catch((error: unknown) => {
  console.error('Failed to migrate bins to stock model:', error);
  process.exit(1);
});
