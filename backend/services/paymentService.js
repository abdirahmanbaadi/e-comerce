const PaymentTransaction = require('../models/PaymentTransaction');
const Order = require('../models/Order');
const { PAID_ORDER_MATCH, parseMoney, invalidateDashboardCache } = require('../utils/revenueUtils');

function generateTransactionId() {
  return `TXN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function isWaafiConfigured() {
  return Boolean(
    process.env.WAAFI_MERCHANT_UID &&
      process.env.WAAFI_API_USER_ID &&
      process.env.WAAFI_API_KEY
  );
}

async function logPaymentTransaction({
  orderId,
  method,
  amount,
  status,
  phone = '',
  referenceId = '',
  transactionId = '',
  message = '',
  source = 'system',
}) {
  if (!orderId || !method) return null;
  try {
    return await PaymentTransaction.create({
      id: generateTransactionId(),
      orderId,
      method,
      amount: Number(amount) || 0,
      status,
      phone,
      referenceId,
      transactionId,
      message,
      source,
    });
  } catch (error) {
    console.error('Payment transaction log failed:', error.message);
    return null;
  }
}

/**
 * Ensure every paid order has at least one success PaymentTransaction (Orders ↔ Payments sync).
 */
async function syncMissingSuccessTransactions() {
  const successTxns = await PaymentTransaction.find({ status: 'success' })
    .select('orderId')
    .lean();
  const successOrderIds = new Set(successTxns.map((t) => t.orderId).filter(Boolean));

  const paidOrders = await Order.find(PAID_ORDER_MATCH)
    .select('id amount paymentMethod phone paidAt createdAt transactionId paymentReference')
    .lean();

  let created = 0;
  for (const order of paidOrders) {
    if (successOrderIds.has(order.id)) continue;
    const txn = await logPaymentTransaction({
      orderId: order.id,
      method: order.paymentMethod || 'EVC Plus',
      amount: parseMoney(order.amount),
      status: 'success',
      phone: order.phone || '',
      referenceId: order.paymentReference || '',
      transactionId: order.transactionId || '',
      message: 'Synced from paid order record.',
      source: 'order-sync',
    });
    if (txn) {
      created += 1;
      successOrderIds.add(order.id);
    }
  }

  if (created > 0) {
    invalidateDashboardCache();
  }
  return created;
}

function mapTransactionRow(txn, customerByOrderId) {
  return {
    id: txn.id,
    orderId: txn.orderId,
    customer: customerByOrderId.get(txn.orderId) || '',
    method: txn.method,
    amount: txn.amount,
    status: txn.status,
    phone: txn.phone,
    referenceId: txn.referenceId,
    transactionId: txn.transactionId || txn.referenceId || txn.id,
    message: txn.message,
    source: txn.source,
    createdAt: txn.createdAt,
  };
}

module.exports = {
  logPaymentTransaction,
  isWaafiConfigured,
  syncMissingSuccessTransactions,
  mapTransactionRow,
};
