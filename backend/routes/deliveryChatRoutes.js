const express = require('express');
const router = express.Router({ mergeParams: true });
const deliveryChatController = require('../controllers/deliveryChatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, deliveryChatController.listMessages);
router.post('/', protect, deliveryChatController.sendMessage);

module.exports = router;
