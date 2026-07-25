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
  if (order.refundStatus === 'scheduled' || order.refundStatus === 'completed') {
    return false;
  }

  order.refundStatus = 'scheduled';
  order.refundDueAt = new Date(Date.now() + REFUND_PROCESSING_DELAY_MS);
  return true;
}

async function processDueRefunds() {
  if (mongoose.connection.readyState !== 1) return 0;

  const dueOrders = await Order.find({
    refundStatus: 'scheduled',
    refundDueAt: { $lte: new Date() },
    status: 'cancelled',
  });

  let processed = 0;

  for (const order of dueOrders) {
    const refund = await attemptOrderRefund(order);
    order.refundStatus = refund.success ? 'completed' : 'failed';
    if (!refund.success) {
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
    processDueRefunds().catch((err) => console.error('Refund scheduler failed:', err.message));
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
  processDueRefunds,
  startRefundSchedulerJob,
  REFUND_PROCESSING_DELAY_MS,
};
