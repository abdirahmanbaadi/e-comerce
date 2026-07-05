const PaymentTransaction = require('../models/PaymentTransaction');

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

module.exports = {
  logPaymentTransaction,
  isWaafiConfigured,
};
