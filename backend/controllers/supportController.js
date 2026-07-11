const SupportTicket = require('../models/SupportTicket');
const SupportMessage = require('../models/SupportMessage');
const {
  onSupportAdminReply,
  onSupportTicketCreated,
  onSupportCustomerMessage,
} = require('../services/notificationService');

// Active SSE clients list
let sseClients = [];

// Helper function to broadcast SSE events
const broadcast = (data) => {
  sseClients.forEach(client => {
    // Send event only to:
    // - Admin users (role === 'admin')
    // - The user who is associated with the ticket/message
    const isTargetUser = data.ticket && String(data.ticket.userId) === String(client.userId);
    if (client.role === 'admin' || isTargetUser) {
      try {
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        console.error('Error writing to client SSE connection:', err);
      }
    }
  });
};

const toPlainObject = (doc) => (doc?.toObject ? doc.toObject() : doc);

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
    const { subject, messageText } = req.body;
    const userId = req.user.id;
    const fullName = req.user.firstName + ' ' + (req.user.lastName || '');
    const email = req.user.email;

    if (!subject || !messageText) {
      return res.status(400).json({ success: false, message: 'Fadlan ku dar cinwaanka iyo fariinta!' });
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
      lastMessageText: messageText,
      lastMessageAt: new Date(),
      date: today
    });

    // Create the first message
    const message = await SupportMessage.create({
      ticketId,
      senderRole: 'user',
      senderName: fullName,
      messageText
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
    if (role !== 'admin' && ticket.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Malahid awood aad ku aragto wadahadalkaan!' });
    }

    const messages = await SupportMessage.find({ ticketId }).sort({ createdAt: 1 });

    return res.status(200).json({ success: true, count: messages.length, messages, ticket });
  } catch (error) {
    console.error('Error in getConversationMessages:', error);
    return res.status(500).json({ success: false, message: 'Waxaa dhacay khalad dhanka server-ka ah.' });
  }
};

// 4. Send message in existing conversation (User or Admin)
exports.addMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { messageText } = req.body;
    const userId = req.user.id;
    const role = req.user.role;
    const fullName = req.user.firstName + ' ' + (req.user.lastName || '');

    if (!messageText || messageText.trim() === '') {
      return res.status(400).json({ success: false, message: 'Fariintu ma noqon karto eber!' });
    }

    const ticket = await SupportTicket.findOne({ id: ticketId });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Wadahadalkaan lama helin!' });
    }

    // Verify permission
    if (role !== 'admin' && ticket.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Malahid awood aad ku fuliso hawshaan!' });
    }

    // Create the message
    const senderRole = role === 'admin' ? 'admin' : 'user';
    const senderName = role === 'admin' ? 'Support Admin' : fullName;

    const message = await SupportMessage.create({
      ticketId,
      senderRole,
      senderName,
      messageText
    });

    // Update parent ticket metadata
    ticket.lastMessageText = messageText;
    ticket.lastMessageAt = new Date();
    // Update status: 'Open' if user replies, 'Replied' if admin replies
    ticket.status = role === 'admin' ? 'Replied' : 'Open';
    await ticket.save();

    const ticketData = toPlainObject(ticket);
    const messageData = toPlainObject(message);

    broadcast({
      type: 'message',
      message: messageData,
      ticket: ticketData
    });

    if (role === 'admin') {
      onSupportAdminReply(ticket, messageText).catch((err) =>
        console.error('Support notification failed:', err.message)
      );
    } else {
      onSupportCustomerMessage(ticket, messageText).catch((err) =>
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

    return res.status(200).json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    console.error('Error in getAdminConversations:', error);
    return res.status(500).json({ success: false, message: 'Waxaa dhacay khalad dhanka server-ka ah.' });
  }
};

// 6. Close a support ticket (Admin)
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
