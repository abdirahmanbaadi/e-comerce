/**
 * One-time migration: normalize User.phone and Order.phone to canonical +252XXXXXXXXX.
 * Run: node scripts/normalizePhones.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const connectDB = require('../config/database');
const User = require('../models/User');
const Order = require('../models/Order');
const { parseSomaliPhoneInput } = require('../utils/phoneUtils');

function toCanonical(phone) {
  const raw = String(phone || '').trim();
  if (!raw) return '';

  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+') && digits.length > 0 && !digits.startsWith('252')) {
    return `+${digits}`;
  }

  const parsed = parseSomaliPhoneInput(raw);
  return parsed.ok ? parsed.e164 : raw;
}

async function migrateCollection(Model, label) {
  const docs = await Model.find({ phone: { $exists: true, $ne: '' } }).select('id phone');
  let updated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const canonical = toCanonical(doc.phone);
    if (!canonical || canonical === doc.phone) {
      skipped += 1;
      continue;
    }

    const conflict = await Model.findOne({ phone: canonical, id: { $ne: doc.id } });
    if (conflict) {
      console.warn(`[${label}] Skip ${doc.id}: ${doc.phone} → ${canonical} (conflict with ${conflict.id})`);
      skipped += 1;
      continue;
    }

    const previous = doc.phone;
    doc.phone = canonical;
    await doc.save();
    updated += 1;
    console.log(`[${label}] ${doc.id}: ${previous} → ${canonical}`);
  }

  return { updated, skipped };
}

async function main() {
  await connectDB();
  console.log('Normalizing phone numbers…\n');

  const users = await migrateCollection(User, 'User');
  const orders = await migrateCollection(Order, 'Order');

  console.log('\nDone.');
  console.log(`Users: ${users.updated} updated, ${users.skipped} unchanged/skipped`);
  console.log(`Orders: ${orders.updated} updated, ${orders.skipped} unchanged/skipped`);

  await require('mongoose').disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
