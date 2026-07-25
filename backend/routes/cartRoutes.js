const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const { rejectStaffShopping } = require('../middleware/staffShoppingMiddleware');

router.post('/validate', cartController.validateCart);
router.get('/', protect, cartController.getCart);
router.put('/', protect, rejectStaffShopping, cartController.syncCart);

module.exports = router;
