const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, authorize, optionalProtect } = require('../middleware/authMiddleware');

router.get('/product/:productId', reviewController.getProductReviews);
router.post('/', protect, reviewController.createReview);
router.get('/', protect, authorize('admin'), reviewController.getAllReviews);
router.patch('/:id/status', protect, authorize('admin'), reviewController.moderateReview);
router.delete('/:id', protect, authorize('admin'), reviewController.deleteReview);

module.exports = router;
