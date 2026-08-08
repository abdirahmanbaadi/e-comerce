const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { authLimiter, otpSendLimiter, otpVerifyLimiter } = require('../middleware/securityMiddleware');

// Public Auth Endpoints
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/google', authLimiter, authController.loginWithGoogle);
router.post('/send-reset-otp', otpSendLimiter, authController.sendResetOtp);
router.post('/verify-phone', otpSendLimiter, authController.verifyPhone);
router.post('/verify-otp', otpVerifyLimiter, authController.verifyOtp);
router.post('/reset-password', authLimiter, authController.resetPassword);

// Protected Auth Endpoints
router.get('/profile', protect, authController.getProfile);
router.get('/security-info', protect, authController.getSecurityInfo);
router.put('/profile', protect, authController.updateProfile);
router.put('/change-password', protect, authController.changePassword);
router.delete('/account', protect, authController.deleteOwnAccount);

// Admin Only Endpoints
router.get('/users', protect, authorize('admin'), authController.getUsers);
router.get('/users/:id/details', protect, authorize('admin'), authController.getUserDetails);
router.put('/users/:id', protect, authorize('admin'), authController.updateUser);
router.post('/users/:id/promote-admin', protect, authorize('admin'), authController.promoteUserToAdmin);
router.delete('/users/:id', protect, authorize('admin'), authController.deleteUser);
router.get('/admin-promotion-password/status', protect, authorize('admin'), authController.getAdminPromotionPasswordStatus);
router.put('/admin-promotion-password', protect, authorize('admin'), authController.setAdminPromotionPassword);

module.exports = router;

