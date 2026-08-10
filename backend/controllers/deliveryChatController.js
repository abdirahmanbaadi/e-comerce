const Order = require('../models/Order');
const DeliveryChatMessage = require('../models/DeliveryChatMessage');

function newMessageId() {
  return `DCM-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function loadOrderOr404(orderId, res) {
  const id = String(orderId || '').trim();
  if (!id) {
    res.status(400).json({ success: false, message: 'Order ID is required.' });
    return null;
  }
  const order = await Order.findOne({ id });
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found.' });
    return null;
  }
  return order;
}

function accessRole(order, user) {
  if (!user?.id) return null;
  if (user.role === 'delivery' && order.assignedDriverId === user.id) return 'driver';
  if (user.role === 'user' || user.role === 'customer') {
    if (order.userId && String(order.userId) === String(user.id)) return 'customer';
  }
  if (user.role === 'admin') return 'admin';
  return null;
}

function canChat(order) {
  const step = Number(order.currentStep) || 1;
  const status = String(order.status || '').toLowerCase();
  if (status === 'cancelled') return false;
  if (!order.assignedDriverId) return false;
  if ((order.assignmentStatus || 'none') === 'pending') return true;
  if ((order.assignmentStatus || 'none') === 'accepted') return true;
  if (step >= 5 || status === 'delivered') return true;
  return true;
}

exports.listMessages = async (req, res) => {
  try {
    const order = await loadOrderOr404(req.params.orderId, res);
    if (!order) return undefined;

    const role = accessRole(order, req.user);
    if (!role) {
      return res.status(403).json({ success: false, message: 'Not allowed to view this chat.' });
    }

    const messages = await DeliveryChatMessage.find({ orderId: order.id })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    return res.status(200).json({
      success: true,
      orderId: order.id,
      canSend: canChat(order) && (role === 'driver' || role === 'customer'),
      messages,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load chat.' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const order = await loadOrderOr404(req.params.orderId, res);
    if (!order) return undefined;

    const role = accessRole(order, req.user);
    if (role !== 'driver' && role !== 'customer') {
      return res.status(403).json({ success: false, message: 'Not allowed to send in this chat.' });
    }
    if (!canChat(order)) {
      return res.status(400).json({ success: false, message: 'Chat is not available for this order.' });
    }

    const messageText = String(req.body?.messageText || '').trim();
    const imageUrl = String(req.body?.imageUrl || '').trim();
    if (!messageText && !imageUrl) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }
    if (messageText.length > 2000) {
      return res.status(400).json({ success: false, message: 'Message is too long.' });
    }

    const senderName =
      role === 'driver'
        ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Driver'
        : `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() ||
          order.customer ||
          'Customer';

    const doc = await DeliveryChatMessage.create({
      id: newMessageId(),
      orderId: order.id,
      senderRole: role,
      senderId: req.user.id,
      senderName,
      messageText,
      imageUrl,
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent.',
      chatMessage: doc.toJSON ? doc.toJSON() : doc,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};
