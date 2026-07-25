const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');
const { rejectStaffShopping } = require('../middleware/staffShoppingMiddleware');

router.get('/', protect, wishlistController.getWishlist);
router.put('/', protect, rejectStaffShopping, wishlistController.syncWishlist);
router.post('/toggle', protect, rejectStaffShopping, wishlistController.toggleWishlistItem);

module.exports = router;
