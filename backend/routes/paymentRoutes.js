const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorize, optionalProtect } = require('../middleware/authMiddleware');

router.get('/config', paymentController.getPaymentConfig);
router.post('/waafi', optionalProtect, paymentController.waafiPurchase);
router.get('/order/:orderId/status', paymentController.getOrderPaymentStatus);
router.get('/transactions', protect, authorize('admin'), paymentController.getTransactions);
router.post('/admin/verify/:orderId', protect, authorize('admin'), paymentController.verifyPayment);

module.exports = router;
