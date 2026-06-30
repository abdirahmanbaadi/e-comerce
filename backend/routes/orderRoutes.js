const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public Order Endpoints
router.post('/', orderController.placeOrder);
router.get('/track/:orderId', orderController.trackOrder);

// Protected Order Endpoints (Admins can view/edit all, Delivery can view/edit assigned, Users can view their own)
router.get('/', protect, orderController.getOrders);
router.put('/:id', protect, authorize('admin', 'delivery'), orderController.updateOrder);

module.exports = router;
