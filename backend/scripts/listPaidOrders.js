require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const PaymentTransaction = require('../models/PaymentTransaction');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const paid = await Order.find({
    $or: [{ paymentType: 'paid' }, { payment: { $regex: /^paid$/i } }],
  })
    .select('id customer amount subtotal paymentType payment paidAt date createdAt')
    .sort({ createdAt: -1 })
    .lean();
  const txns = await PaymentTransaction.find({ status: 'success' })
    .sort({ createdAt: -1 })
    .lean();
  console.log('PAID_ORDERS_COUNT', paid.length);
  console.log(JSON.stringify(paid, null, 2));
  console.log('SUCCESS_TXN_COUNT', txns.length);
  console.log(JSON.stringify(txns, null, 2));
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
