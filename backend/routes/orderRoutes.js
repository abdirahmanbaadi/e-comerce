const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, optionalProtect, authorize } = require('../middleware/authMiddleware');
const { rejectStaffShopping } = require('../middleware/staffShoppingMiddleware');

// Public Order Endpoints
router.post('/', protect, rejectStaffShopping, orderController.placeOrder);
router.get('/track/:orderId', orderController.trackOrder);
router.patch('/cancel/:orderId', optionalProtect, orderController.cancelOrder);

// Protected Order Endpoints (Admins can view/edit all, Delivery can view/edit assigned, Users can view their own)
router.get('/stats', protect, authorize('admin'), orderController.getOrderStats);
router.get('/', protect, orderController.getOrders);
router.get('/:orderId/details', protect, orderController.getOrderDetails);
router.patch('/:id/assign', protect, authorize('admin'), orderController.assignDriver);
router.put('/:id', protect, authorize('admin', 'delivery'), orderController.updateOrder);

module.exports = router;
