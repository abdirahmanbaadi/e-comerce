const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { protect, authorize } = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename(_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `support-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) return cb(null, true);
    cb(new Error('Only image files are allowed (jpg, png, webp, gif).'));
  },
});

// User support chat endpoints
router.get('/stream', protect, supportController.supportStream);
router.post('/upload', protect, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Upload failed.' });
    }
    return next();
  });
}, supportController.uploadSupportImage);
router.post('/chats', protect, supportController.createConversation);
router.get('/chats', protect, supportController.getUserConversations);
router.get('/chats/:ticketId/messages', protect, supportController.getConversationMessages);
router.post('/chats/:ticketId/messages', protect, supportController.addMessage);

// Admin-only endpoints
router.get('/admin/chats', protect, authorize('admin'), supportController.getAdminConversations);
router.patch('/admin/chats/:ticketId/close', protect, authorize('admin'), supportController.closeConversation);

module.exports = router;
