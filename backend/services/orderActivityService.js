const OrderActivity = require('../models/OrderActivity');

function generateActivityId() {
  return `OACT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

async function logOrderActivity({
  orderId,
  action,
  description = '',
  metadata = {},
  actorId = '',
  actorRole = 'system',
}) {
  if (!orderId || !action) return null;
  try {
    return await OrderActivity.create({
      id: generateActivityId(),
      orderId,
      action,
      description,
      metadata,
      actorId,
      actorRole,
    });
  } catch (error) {
    console.error('Order activity log failed:', error.message);
    return null;
  }
}

module.exports = { logOrderActivity };
