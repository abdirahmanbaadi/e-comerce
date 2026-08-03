const SupportTicket = require('../models/SupportTicket');
const SupportMessage = require('../models/SupportMessage');
const User = require('../models/User');
const {
  onSupportAdminReply,
  onSupportTicketCreated,
  onSupportCustomerMessage,
} = require('../services/notificationService');
const { isDashboardRole } = require('../utils/roleUtils');

// Active SSE clients list
let sseClients = [];

// Helper function to broadcast SSE events
const broadcast = (data) => {
  sseClients.forEach(client => {
    // Send event only to:
    // - Dashboard operators (admin / staff)
    // - The user who is associated with the ticket/message
    const isTargetUser = data.ticket && String(data.ticket.userId) === String(client.userId);
    if (isDashboardRole(client.role) || isTargetUser) {
      try {
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        console.error('Error writing to client SSE connection:', err);
      }
    }
  });
};

const toPlainObject = (doc) => (doc?.toObject ? doc.toObject() : doc);

async function attachAvatarToTicket(ticket) {
  if (!ticket) return ticket;
  const plain = toPlainObject(ticket);
  if (plain.avatar) return plain;
  if (!plain.userId) return plain;
  const user = await User.findOne({ id: plain.userId }).select('avatar').lean();
  plain.avatar = user?.avatar || '';
  return plain;
}

async function attachAvatarsToTickets(tickets) {
  if (!tickets?.length) return [];
  const userIds = [...new Set(tickets.map((t) => t.userId).filter(Boolean))];
  const users = userIds.length
    ? await User.find({ id: { $in: userIds } }).select('id avatar').lean()
    : [];
  const avatarByUserId = new Map(users.map((u) => [u.id, u.avatar || '']));
  return tickets.map((ticket) => {
    const plain = toPlainObject(ticket);
    plain.avatar = plain.avatar || avatarByUserId.get(plain.userId) || '';
    return plain;
  });
}

const previewText = (messageText, imageUrl) => {
  const text = (messageText || '').trim();
  if (text) return text;
  if (imageUrl) return '📷 Photo';
  return '';
};

// SSE stream connection endpoint
exports.supportStream = (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  res.flushHeaders();

  // Send initial connected ping
  res.write('data: {"type":"init"}\n\n');

  const client = {
    id: Date.now(),
    userId: req.user.id,
    role: req.user.role,
    res
  };

  sseClients.push(client);

  // Heartbeat ping every 20 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write('data: {"type":"heartbeat"}\n\n');
    } catch (err) {
      console.error('Heartbeat failed', err);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients = sseClients.filter(c => c.id !== client.id);
  });
};

// 1. Create a new support conversation (User)
exports.createConversation = async (req, res) => {
  try {
    const { subject, messageText, imageUrl } = req.body;
    const userId = req.user.id;
    const fullName = req.user.firstName + ' ' + (req.user.lastName || '');
    const email = req.user.email;
    const text = (messageText || '').trim();
    const image = (imageUrl || '').trim();

    if (!subject || (!text && !image)) {
      return res.status(400).json({ success: false, message: 'Fadlan ku dar cinwaanka iyo fariinta ama sawir!' });
    }

    // Generate ticket ID (Format: TKT-XXXX)
    const ticketId = 'TKT-' + (Math.floor(Math.random() * 9000) + 1000);
    const today = new Date().toISOString().split('T')[0];

    // Create the ticket
    const ticket = await SupportTicket.create({
      id: ticketId,
      userId,
      name: fullName,
      email,
      subject,
      status: 'Open',
      lastMessageText: previewText(text, image),
      lastMessageAt: new Date(),
      date: today
    });

    // Create the first message
    const message = await SupportMessage.create({
      ticketId,
      senderRole: 'user',
      senderName: fullName,
      messageText: text,
      imageUrl: image,
    });

    const ticketData = toPlainObject(ticket);
    const messageData = toPlainObject(message);

    broadcast({
      type: 'ticket',
      ticket: ticketData,
      message: messageData
    });

    onSupportTicketCreated(ticket).catch((err) => console.error('Support notification failed:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Fariintaada waa la diray si guul leh!',
      ticket,
      firstMessage: message
    });
  } catch (error) {
    console.error('Error in createConversation:', error);
    return res.status(500).json({ success: false, message: 'Waxaa dhacay khalad dhanka server-ka ah.' });
  }
};

// 2. Get user conversations (User)
exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const tickets = await SupportTicket.find({ userId }).sort({ lastMessageAt: -1 });

    return res.status(200).json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    console.error('Error in getUserConversations:', error);
    return res.status(500).json({ success: false, message: 'Waxaa dhacay khalad dhanka server-ka ah.' });
  }
};

// 3. Get messages for a ticket (User or Admin)
exports.getConversationMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    // Retrieve ticket to verify ownership
    const ticket = await SupportTicket.findOne({ id: ticketId });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Wadahadalkaan lama helin!' });
    }

    // Regular users can only see their own tickets
    if (!isDashboardRole(role) && ticket.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Malahid awood aad ku aragto wadahadalkaan!' });
    }

    const messages = await SupportMessage.find({ ticketId }).sort({ createdAt: 1 });
    const ticketWithAvatar = await attachAvatarToTicket(ticket);

    return res.status(200).json({ success: true, count: messages.length, messages, ticket: ticketWithAvatar });
  } catch (error) {
    console.error('Error in getConversationMessages:', error);
    return res.status(500).json({ success: false, message: 'Waxaa dhacay khalad dhanka server-ka ah.' });
  }
};

// 4. Send message in existing conversation (User or Admin)
exports.addMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { messageText, imageUrl } = req.body;
    const userId = req.user.id;
    const role = req.user.role;
    const fullName = req.user.firstName + ' ' + (req.user.lastName || '');
    const text = (messageText || '').trim();
    const image = (imageUrl || '').trim();

    if (!text && !image) {
      return res.status(400).json({ success: false, message: 'Fariintu ma noqon karto eber!' });
    }

    const ticket = await SupportTicket.findOne({ id: ticketId });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Wadahadalkaan lama helin!' });
    }

    // Verify permission
    if (!isDashboardRole(role) && ticket.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Malahid awood aad ku fuliso hawshaan!' });
    }

    // Create the message
    const asSupport = isDashboardRole(role);
    const senderRole = asSupport ? 'admin' : 'user';
    const senderName = asSupport ? (role === 'staff' ? 'Support Staff' : 'Support Admin') : fullName;

    const message = await SupportMessage.create({
      ticketId,
      senderRole,
      senderName,
      messageText: text,
      imageUrl: image,
    });

    // Update parent ticket metadata
    ticket.lastMessageText = previewText(text, image);
    ticket.lastMessageAt = new Date();
    // Update status: 'Open' if user replies, 'Replied' if support replies
    ticket.status = asSupport ? 'Replied' : 'Open';
    await ticket.save();

    const ticketData = toPlainObject(ticket);
    const messageData = toPlainObject(message);

    broadcast({
      type: 'message',
      message: messageData,
      ticket: ticketData
    });

    const notifyText = previewText(text, image);
    if (asSupport) {
      onSupportAdminReply(ticket, notifyText).catch((err) =>
        console.error('Support notification failed:', err.message)
      );
    } else {
      onSupportCustomerMessage(ticket, notifyText).catch((err) =>
        console.error('Support notification failed:', err.message)
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Fariinta waa la diray!',
      messageObject: message,
      ticket
    });
  } catch (error) {
    console.error('Error in addMessage:', error);
    return res.status(500).json({ success: false, message: 'Waxaa dhacay khalad dhanka server-ka ah.' });
  }
};

// 5. Get all conversations (Admin)
exports.getAdminConversations = async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .select('id userId name email subject status lastMessageAt lastMessageText createdAt')
      .sort({ lastMessageAt: -1 })
      .limit(80)
      .lean();

    const enriched = await attachAvatarsToTickets(tickets);

    return res.status(200).json({ success: true, count: enriched.length, tickets: enriched });
  } catch (error) {
    console.error('Error in getAdminConversations:', error);
    return res.status(500).json({ success: false, message: 'Waxaa dhacay khalad dhanka server-ka ah.' });
  }
};

// 6. Upload support chat image (User or Admin)
exports.uploadSupportImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }
    const imagePath = `/uploads/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      imageUrl: imagePath,
    });
  } catch (error) {
    console.error('Error in uploadSupportImage:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload image.' });
  }
};

// 7. Close a support ticket (Admin)
exports.closeConversation = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await SupportTicket.findOne({ id: ticketId });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Wadahadalkaan lama helin!' });
    }

    if (ticket.status === 'Closed') {
      return res.status(200).json({
        success: true,
        message: 'Ticket is already closed.',
        ticket,
      });
    }

    ticket.status = 'Closed';
    await ticket.save();

    const ticketData = toPlainObject(ticket);
    broadcast({ type: 'ticket', ticket: ticketData });

    return res.status(200).json({
      success: true,
      message: 'Ticket closed successfully.',
      ticket,
    });
  } catch (error) {
    console.error('Error in closeConversation:', error);
    return res.status(500).json({ success: false, message: 'Waxaa dhacay khalad dhanka server-ka ah.' });
  }
};
