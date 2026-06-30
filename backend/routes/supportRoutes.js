const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { protect, authorize } = require('../middleware/authMiddleware');

// User support chat endpoints
router.get('/stream', protect, supportController.supportStream);
router.post('/chats', protect, supportController.createConversation);
router.get('/chats', protect, supportController.getUserConversations);
router.get('/chats/:ticketId/messages', protect, supportController.getConversationMessages);
router.post('/chats/:ticketId/messages', protect, supportController.addMessage);

// Admin-only endpoints
router.get('/admin/chats', protect, authorize('admin'), supportController.getAdminConversations);

module.exports = router;
