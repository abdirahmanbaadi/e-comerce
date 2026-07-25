const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, authorize, optionalProtect } = require('../middleware/authMiddleware');

router.get('/prompt', protect, reviewController.getReviewPrompt);
router.post('/prompt/:orderId/seen', protect, reviewController.markReviewPromptSeen);
router.post('/delivery/:orderId', protect, reviewController.rateDelivery);
router.get('/product/:productId', reviewController.getProductReviews);
router.get('/status/:productId', protect, reviewController.getReviewStatus);
router.post('/', protect, reviewController.createReview);
router.get('/', protect, authorize('admin'), reviewController.getAllReviews);
router.patch('/:id/status', protect, authorize('admin'), reviewController.moderateReview);
router.delete('/:id', protect, authorize('admin'), reviewController.deleteReview);

module.exports = router;
