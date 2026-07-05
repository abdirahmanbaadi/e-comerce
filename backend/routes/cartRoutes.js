const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.post('/validate', cartController.validateCart);
router.get('/', protect, cartController.getCart);
router.put('/', protect, cartController.syncCart);

module.exports = router;
