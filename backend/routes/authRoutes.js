const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public Auth Endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-phone', authController.verifyPhone);
router.post('/reset-password', authController.resetPassword);

// Protected Auth Endpoints
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);
router.put('/change-password', protect, authController.changePassword);

// Admin Only Endpoints
router.get('/users', protect, authorize('admin'), authController.getUsers);
router.delete('/users/:id', protect, authorize('admin'), authController.deleteUser);

module.exports = router;

