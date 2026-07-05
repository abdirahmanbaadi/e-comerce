const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendSms } = require('./smsService');

function generateNotificationId() {
  return `NTF-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

async function findUserIdByPhone(phone) {
  if (!phone) return null;
  const normalized = String(phone).trim();
  const user =
    (await User.findOne({ phone: normalized })) ||
    (await User.findOne({ phone: normalized.replace(/\s/g, '') }));
  return user?.id || null;
}

async function findUserByIdOrPhone(userId, phone) {
  if (userId) {
    const byId = await User.findOne({ id: userId });
    if (byId) return byId;
  }
  if (phone) {
    const normalized = String(phone).trim();
    return (
      (await User.findOne({ phone: normalized })) ||
      (await User.findOne({ phone: normalized.replace(/\s/g, '') }))
    );
  }
  return null;
}

async function userAllowsEmailAlerts(userId, phone) {
  const user = await findUserByIdOrPhone(userId, phone);
  if (!user) return true;
  return user.notificationPreferences?.emailAlerts !== false;
}

async function userAllowsSmsAlerts(userId, phone) {
  const user = await findUserByIdOrPhone(userId, phone);
  if (!user) return false;
  return user.notificationPreferences?.smsAlerts === true;
}

async function maybeSendSmsAlert({ userId, phone, message }) {
  const allows = await userAllowsSmsAlerts(userId, phone);
  if (!allows || !phone) return;
  try {
    await sendSms(phone, message);
  } catch (error) {
    console.error('SMS alert failed:', error.message);
  }
}

async function notifyAdmins({ type, title, message, relatedId = '', metadata = {} }) {
  return Notification.create({
    id: generateNotificationId(),
    audience: 'admin',
    userId: '',
    type,
    title,
    message,
    relatedId,
    read: false,
    metadata,
  });
}

async function notifyUser({ userId, type, title, message, relatedId = '', metadata = {} }) {
  if (!userId) return null;
  return Notification.create({
    id: generateNotificationId(),
    audience: 'user',
    userId,
    type,
    title,
    message,
    relatedId,
    read: false,
    metadata,
  });
}

async function notifyUserByPhone(phone, payload) {
  const userId = await findUserIdByPhone(phone);
  if (!userId) return null;
  return notifyUser({ userId, ...payload });
}

async function onOrderCreated(order, { userId } = {}) {
  const orderId = order.id;
  const customerPayload = {
    type: 'order_confirmed',
    title: 'Order Confirmed',
    message: `Your order ${orderId} has been confirmed.`,
    relatedId: orderId,
    metadata: { orderId, amount: order.amount },
  };

  if (userId) {
    await notifyUser({ userId, ...customerPayload });
  } else {
    await notifyUserByPhone(order.phone, customerPayload);
  }

  await notifyAdmins({
    type: 'new_order',
    title: 'New Order Received',
    message: `${order.customer} placed order ${orderId} (${order.amount}).`,
    relatedId: orderId,
    metadata: { orderId, customer: order.customer, amount: order.amount },
  });

  await maybeSendSmsAlert({
    userId,
    phone: order.phone,
    message: `Mogadishu Modern Furniture: Order ${orderId} confirmed. Total ${order.amount}. Track at our website.`,
  });
}

async function onOrderUpdated(order, changes = {}) {
  const orderId = order.id;
  const userPayload = (payload) => notifyUserByPhone(order.phone, { relatedId: orderId, ...payload });

  if (changes.paymentType === 'paid' || changes.payment === 'Paid') {
    await userPayload({
      type: 'payment_success',
      title: 'Payment Successful',
      message: `Your payment for order ${orderId} was successful.`,
      metadata: { orderId, amount: order.amount },
    });
    await maybeSendSmsAlert({
      phone: order.phone,
      message: `MMF: Payment received for order ${orderId}. Thank you!`,
    });
  }

  if (changes.paymentType === 'failed' || changes.payment === 'Failed') {
    await userPayload({
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Your payment for order ${orderId} has failed. Please try again.`,
      metadata: { orderId, amount: order.amount },
    });
  }

  if (changes.status === 'processing' && changes.statusChanged) {
    await userPayload({
      type: 'order_processing',
      title: 'Order Processing',
      message: `Your order ${orderId} is now being processed.`,
      metadata: { orderId },
    });
  }

  if (changes.status === 'shipped' && changes.statusChanged) {
    await userPayload({
      type: 'order_shipped',
      title: 'Order Shipped',
      message: `Your order ${orderId} is on the way!`,
      metadata: { orderId },
    });
    await maybeSendSmsAlert({
      phone: order.phone,
      message: `MMF: Order ${orderId} is out for delivery.`,
    });
  }

  if (changes.status === 'delivered' && changes.statusChanged) {
    await userPayload({
      type: 'order_delivered',
      title: 'Order Delivered',
      message: `Your order ${orderId} has been delivered. Thank you!`,
      metadata: { orderId },
    });
    await maybeSendSmsAlert({
      phone: order.phone,
      message: `MMF: Order ${orderId} has been delivered. Thank you for shopping with us!`,
    });
  }

  if (changes.status === 'cancelled' && changes.statusChanged) {
    await userPayload({
      type: 'order_cancelled',
      title: 'Order Cancelled',
      message: `Your order ${orderId} has been cancelled.`,
      metadata: { orderId },
    });
  }

  if (changes.driverAssigned) {
    await userPayload({
      type: 'driver_assigned',
      title: 'Driver Assigned',
      message: `A driver has been assigned to order ${orderId}.`,
      metadata: { orderId, driver: order.driver },
    });

    if (order.assignedDriverId) {
      await notifyUser({
        userId: order.assignedDriverId,
        type: 'delivery_assigned',
        title: 'New Delivery Assignment',
        message: `You have been assigned order ${orderId} for ${order.customer}.`,
        relatedId: orderId,
        metadata: { orderId, address: order.address, customer: order.customer },
      });

      const driver = await User.findOne({ id: order.assignedDriverId });
      if (driver?.phone) {
        await maybeSendSmsAlert({
          userId: driver.id,
          phone: driver.phone,
          message: `MMF Delivery: New assignment ${orderId} — ${order.address}`,
        });
      }
    }
  }
}

async function onSupportAdminReply(ticket) {
  await notifyUser({
    userId: ticket.userId,
    type: 'support_replied',
    title: 'Support Replied',
    message: `We replied to your message: "${ticket.subject}".`,
    relatedId: ticket.id,
    metadata: { ticketId: ticket.id, subject: ticket.subject },
  });
}

async function onSupportTicketCreated(ticket) {
  await notifyAdmins({
    type: 'new_support_ticket',
    title: 'New Support Ticket',
    message: `${ticket.name} opened ticket ${ticket.id}: ${ticket.subject}`,
    relatedId: ticket.id,
    metadata: { ticketId: ticket.id, subject: ticket.subject },
  });
}

async function onDriverApplication(user) {
  await notifyAdmins({
    type: 'driver_application',
    title: 'New Driver Application',
    message: `${user.firstName} ${user.lastName || ''} applied as delivery driver.`,
    relatedId: user.id,
    metadata: { userId: user.id, name: `${user.firstName} ${user.lastName || ''}`.trim() },
  });
}

module.exports = {
  notifyAdmins,
  notifyUser,
  notifyUserByPhone,
  userAllowsEmailAlerts,
  userAllowsSmsAlerts,
  onOrderCreated,
  onOrderUpdated,
  onSupportAdminReply,
  onSupportTicketCreated,
  onDriverApplication,
};
