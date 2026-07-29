const mongoose = require('mongoose');
const Order = require('../models/Order');
const { attemptOrderRefund, isOrderPaid, isOrderRefunded } = require('./refundService');
const { onOrderUpdated } = require('./notificationService');
const { logOrderActivity } = require('./orderActivityService');
const {
  REFUND_PROCESSING_DELAY_MS,
  REFUND_JOB_INTERVAL_MS,
} = require('../config/timingConfig');

const FIRST_RUN_DELAY_MS = 30 * 1000;

function scheduleOrderRefund(order) {
  if (!order || !isOrderPaid(order) || isOrderRefunded(order)) {
    return false;
  }
  if (order.refundStatus === 'completed') {
    return false;
  }
  if (order.refundStatus === 'scheduled' && order.refundDueAt) {
    return false;
  }

  order.refundStatus = 'scheduled';
  order.refundDueAt = new Date(Date.now() + REFUND_PROCESSING_DELAY_MS);
  return true;
}

/** Paid orders cancelled without a refund job (e.g. admin cancel) — schedule on startup. */
async function reconcileMissedRefunds() {
  if (mongoose.connection.readyState !== 1) return 0;

  const missed = await Order.find({
    status: 'cancelled',
    $or: [{ paymentType: 'paid' }, { payment: { $regex: /^paid$/i } }],
    refundStatus: { $in: ['none', 'failed', null, ''] },
  });

  let scheduled = 0;
  for (const order of missed) {
    if (isOrderRefunded(order)) continue;
    if (scheduleOrderRefund(order)) {
      await order.save();
      scheduled += 1;
    }
  }

  if (scheduled > 0) {
    console.log(`Scheduled ${scheduled} missed refund(s) for cancelled paid orders.`);
  }

  return scheduled;
}

async function processDueRefunds() {
  if (mongoose.connection.readyState !== 1) return 0;

  const dueOrders = await Order.find({
    refundStatus: { $in: ['scheduled', 'failed'] },
    refundDueAt: { $lte: new Date() },
    status: 'cancelled',
  });

  let processed = 0;

  for (const order of dueOrders) {
    if (isOrderRefunded(order)) {
      order.refundStatus = 'completed';
      await order.save();
      continue;
    }

    const refund = await attemptOrderRefund(order);
    if (refund.success) {
      order.refundStatus = 'completed';
    } else {
      order.refundStatus = 'failed';
      order.refundDueAt = new Date(Date.now() + REFUND_JOB_INTERVAL_MS);
    }
    await order.save();

    await onOrderUpdated(order, {
      refundAttempted: refund.attempted,
      refundCompleted: refund.attempted && refund.success,
      refundMessage: refund.message,
    }).catch(() => {});

    await logOrderActivity({
      orderId: order.id,
      action: refund.success ? 'refund_completed' : 'refund_failed',
      description: refund.success
        ? 'Scheduled refund sent to EVC Plus.'
        : `Scheduled refund failed: ${refund.message}`,
      actorId: 'system',
      actorRole: 'system',
      metadata: { refund },
    }).catch(() => {});

    processed += 1;
  }

  if (processed > 0) {
    console.log(`Processed ${processed} scheduled refund(s).`);
  }

  return processed;
}

function startRefundSchedulerJob() {
  const firstRunTimer = setTimeout(() => {
    reconcileMissedRefunds()
      .then(() => processDueRefunds())
      .catch((err) => console.error('Refund scheduler failed:', err.message));
  }, FIRST_RUN_DELAY_MS);

  const intervalId = setInterval(() => {
    processDueRefunds().catch((err) => console.error('Refund scheduler failed:', err.message));
  }, REFUND_JOB_INTERVAL_MS);

  if (typeof firstRunTimer.unref === 'function') firstRunTimer.unref();
  if (typeof intervalId.unref === 'function') intervalId.unref();

  return intervalId;
}

module.exports = {
  scheduleOrderRefund,
  reconcileMissedRefunds,
  processDueRefunds,
  startRefundSchedulerJob,
  REFUND_PROCESSING_DELAY_MS,
};
