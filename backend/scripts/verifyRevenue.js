/**
 * Verify dashboard revenue matches payment transactions.
 * Run: node backend/scripts/verifyRevenue.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const PaymentTransaction = require('../models/PaymentTransaction');
const { invalidateDashboardCache } = require('../utils/revenueUtils');
const simpleCache = require('../utils/simpleCache');
const adminController = require('../controllers/adminController');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  invalidateDashboardCache();

  const txns = await PaymentTransaction.find({ status: 'success' }).lean();
  const txnTotal = Math.round(txns.reduce((s, t) => s + (Number(t.amount) || 0), 0) * 100) / 100;

  const mockRes = { status() { return this; }, json: (body) => { global.__stats = body; } };
  await adminController.getDashboardStats({}, mockRes);
  const revenue = global.__stats?.stats?.revenue;
  const salesByDate = global.__stats?.stats?.salesByDate;

  console.log('TXN_COUNT', txns.length);
  console.log('TXN_TOTAL', txnTotal);
  console.log('DASHBOARD_REVENUE', revenue);
  console.log('MATCH', txnTotal === revenue);
  console.log('SALES_BY_DATE', JSON.stringify(salesByDate, null, 2));

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
