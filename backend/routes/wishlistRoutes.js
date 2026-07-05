const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, wishlistController.getWishlist);
router.put('/', protect, wishlistController.syncWishlist);
router.post('/toggle', protect, wishlistController.toggleWishlistItem);

module.exports = router;
