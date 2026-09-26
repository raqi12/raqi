/**
 * Rebuild deleted subscription documents from tasks, bin assignments, and wallet ledger.
 * Run on the server (inside mongo container):
 *   mongosh raqi --file /path/restore-subscriptions-from-tasks.mongosh.js
 *
 * Idempotent: skips subscription IDs that already exist.
 */

function normalizeArabic(text) {
  return String(text || '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function inferPlanId(description, plans) {
  const norm = normalizeArabic(description);
  if (!norm) return null;
  let best = null;
  let bestScore = 0;
  for (const plan of plans) {
    const name = normalizeArabic(plan.name);
    if (!name) continue;
    if (norm.includes(name) || name.includes(norm)) {
      const score = name.length;
      if (score > bestScore) {
        bestScore = score;
        best = plan;
      }
    }
  }
  if (best) return String(best._id);
  const keywords = [
    ['فضيه', 'فضية'],
    ['برونزيه', 'برونزية'],
    ['دهبيه', 'ذهبية'],
    ['عاديه', 'عادية'],
    ['اسبوعي', 'أسبوعي'],
  ];
  for (const [a, b] of keywords) {
    if (norm.includes(a) || norm.includes(b)) {
      const hit = plans.find((p) => normalizeArabic(p.name).includes(a) || normalizeArabic(p.name).includes(b));
      if (hit) return String(hit._id);
    }
  }
  return null;
}

function pickAddress(customerId, areaId) {
  const addresses = db.addresses
    .find({ customerId })
    .sort({ isActive: -1, createdAt: 1 })
    .toArray();
  const inArea = addresses.find((a) => String(a.areaId) === String(areaId));
  if (inArea) return String(inArea._id);
  if (addresses[0]) return String(addresses[0]._id);
  return null;
}

const plans = db.plans.find({}).toArray();
const today = new Date().toISOString().slice(0, 10);

const groups = db.tasks
  .aggregate([
    {
      $group: {
        _id: '$subscriptionId',
        customerId: { $first: '$customerId' },
        areaId: { $first: '$areaId' },
        driverId: { $last: '$driverId' },
        dates: { $addToSet: '$scheduledDate' },
        minCreated: { $min: '$createdAt' },
        maxCreated: { $max: '$createdAt' },
        hasOpen: {
          $max: {
            $cond: [
              {
                $in: [
                  '$status',
                  ['pending', 'assigned', 'in_progress'],
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ])
  .toArray();

let inserted = 0;
let skipped = 0;

for (const group of groups) {
  const subscriptionId = String(group._id);
  if (!subscriptionId || subscriptionId === 'null' || subscriptionId === 'undefined') {
    continue;
  }

  const exists = db.subscriptions.findOne({ _id: ObjectId(subscriptionId) });
  if (exists) {
    skipped += 1;
    continue;
  }

  const area = db.areas.findOne({ _id: ObjectId(group.areaId) });
  const cityId = area ? String(area.cityId) : null;

  const binAssignment = db.binassignments
    .find({ subscriptionId })
    .sort({ updatedAt: -1 })
    .limit(1)
    .toArray()[0];
  const binId = binAssignment ? String(binAssignment.binId) : null;

  const walletTx = db.wallettransactions.findOne({
    referenceType: 'subscription',
    referenceId: subscriptionId,
  });

  const planId = inferPlanId(walletTx?.description, plans);
  const addressId = pickAddress(group.customerId, group.areaId);
  const collectionDates = (group.dates || [])
    .filter(Boolean)
    .map(String)
    .sort();

  const maxDate = collectionDates.length ? collectionDates[collectionDates.length - 1] : null;
  const hasFuture = collectionDates.some((d) => d >= today);
  const status = group.hasOpen || hasFuture ? 'active' : 'expired';

  const doc = {
    _id: ObjectId(subscriptionId),
    customerId: String(group.customerId),
    planId,
    addressId,
    binId,
    cityId,
    areaId: String(group.areaId),
    driverId: group.driverId ? String(group.driverId) : null,
    collectionDates,
    status,
    paymentStatus: walletTx ? 'paid' : 'unpaid',
    renewedAt: walletTx?.createdAt ?? null,
    autoRenew: false,
    expiresAt: maxDate ? new Date(`${maxDate}T23:59:59.999Z`) : null,
    renewalGraceUntil: null,
    createdAt: group.minCreated ?? new Date(),
    updatedAt: group.maxCreated ?? new Date(),
    __v: 0,
  };

  db.subscriptions.insertOne(doc);
  inserted += 1;
}

print(
  JSON.stringify({
    inserted,
    skipped,
    totalGroups: groups.length,
    subscriptionsNow: db.subscriptions.countDocuments(),
  }),
);
