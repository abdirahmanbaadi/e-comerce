const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard-stats', protect, authorize('admin', 'staff'), adminController.getDashboardStats);

module.exports = router;
