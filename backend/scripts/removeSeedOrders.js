/**
 * One-time cleanup: remove demo seed orders (#MF-250522-*) that have no real payment.
 * Run: node backend/scripts/removeSeedOrders.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Order = require('../models/Order');
const PaymentTransaction = require('../models/PaymentTransaction');
const { invalidateDashboardCache } = require('../utils/revenueUtils');

const SEED_ORDER_PATTERN = /^#MF-250522-/;

(async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

  const seedOrders = await Order.find({ id: { $regex: SEED_ORDER_PATTERN } })
    .select('id customer paymentType payment amount')
    .lean();

  console.log('SEED_ORDERS_FOUND', seedOrders.length);
  if (seedOrders.length) {
    console.log(JSON.stringify(seedOrders, null, 2));
    const result = await Order.deleteMany({ id: { $regex: SEED_ORDER_PATTERN } });
    console.log('DELETED_COUNT', result.deletedCount);
    invalidateDashboardCache();
  }

  const paidReal = await Order.find({
    $or: [{ paymentType: 'paid' }, { payment: { $regex: /^paid$/i } }],
  })
    .select('id customer amount paidAt createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const successOrderIds = new Set(
    (await PaymentTransaction.find({ status: 'success' }).select('orderId').lean()).map((t) => t.orderId)
  );
  const orphanPaid = paidReal.filter((o) => !successOrderIds.has(o.id));
  if (orphanPaid.length) {
    console.log('ORPHAN_PAID_ORDERS_NO_TXN', orphanPaid.length);
    console.log(JSON.stringify(orphanPaid, null, 2));
    const orphanIds = orphanPaid.map((o) => o.id);
    const fix = await Order.updateMany(
      { id: { $in: orphanIds } },
      { $set: { paymentType: 'pending', payment: 'Pending' } }
    );
    console.log('ORPHAN_RESET_TO_PENDING', fix.modifiedCount);
    invalidateDashboardCache();
  }

  const paidAfter = await Order.find({
    $or: [{ paymentType: 'paid' }, { payment: { $regex: /^paid$/i } }],
  })
    .select('id customer amount paidAt createdAt')
    .sort({ createdAt: -1 })
    .lean();

  console.log('REMAINING_PAID_ORDERS', paidAfter.length);
  console.log(JSON.stringify(paidAfter, null, 2));

  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
