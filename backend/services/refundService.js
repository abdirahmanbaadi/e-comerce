const PaymentTransaction = require('../models/PaymentTransaction');
const { processWaafiReversal } = require('./waafiService');
const { logPaymentTransaction } = require('./paymentService');

function parseOrderAmount(amount) {
  if (typeof amount === 'number') return amount;
  return Number(String(amount || '').replace(/[^0-9.]/g, '')) || 0;
}

function isOrderPaid(order) {
  const paymentType = String(order?.paymentType || '').toLowerCase();
  const payment = String(order?.payment || '').toLowerCase();
  return paymentType === 'paid' || payment === 'paid';
}

function isOrderRefunded(order) {
  const paymentType = String(order?.paymentType || '').toLowerCase();
  const payment = String(order?.payment || '').toLowerCase();
  return paymentType === 'refunded' || payment === 'refunded';
}

async function resolvePaidTransactionId(order) {
  if (order?.transactionId && !String(order.transactionId).startsWith('ADMIN-')) {
    return order.transactionId;
  }

  const txn = await PaymentTransaction.findOne({
    orderId: order.id,
    status: 'success',
  })
    .sort({ createdAt: -1 })
    .lean();

  return txn?.transactionId || order?.transactionId || '';
}

/**
 * Attempt EVC/Waafi refund when a paid order is cancelled.
 * Unpaid or failed orders skip refund (no charge was captured).
 */
async function attemptOrderRefund(order) {
  if (!order) {
    return { attempted: false, success: false, message: 'Order not found.' };
  }

  if (!isOrderPaid(order) || isOrderRefunded(order)) {
    return {
      attempted: false,
      success: true,
      message: 'No payment to refund.',
    };
  }

  const transactionId = await resolvePaidTransactionId(order);
  if (!transactionId) {
    return {
      attempted: true,
      success: false,
      message: 'Payment was marked paid but no transaction ID was found. Contact support for a manual refund.',
    };
  }

  const amount = parseOrderAmount(order.amount);
  const reversal = await processWaafiReversal({
    transactionId,
    description: `Refund for cancelled order ${order.id}`,
  });

  if (reversal.success) {
    order.paymentType = 'refunded';
    order.payment = 'Refunded';
    order.refundTransactionId = reversal.transactionId || transactionId;
    order.refundedAt = new Date();

    await logPaymentTransaction({
      orderId: order.id,
      method: order.paymentMethod || 'EVC Plus',
      amount,
      status: 'refunded',
      phone: order.phone,
      referenceId: order.paymentReference || order.id,
      transactionId: reversal.transactionId || transactionId,
      message: reversal.message,
      source: 'waafi_reversal',
    });

    return {
      attempted: true,
      success: true,
      message: reversal.message,
      transactionId: reversal.transactionId || transactionId,
    };
  }

  return {
    attempted: true,
    success: false,
    message:
      reversal.message ||
      'Automatic refund failed. Your order will still be cancelled — contact support to receive your money back.',
    transactionId,
  };
}

module.exports = {
  attemptOrderRefund,
  isOrderPaid,
  isOrderRefunded,
};
