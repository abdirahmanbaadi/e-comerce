const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cmsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', cmsController.getPublicContent);
router.put('/', protect, authorize('admin'), cmsController.updateContent);

module.exports = router;
