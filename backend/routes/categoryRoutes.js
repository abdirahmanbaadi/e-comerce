const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', categoryController.getCategories);
router.get('/all', protect, authorize('admin', 'staff'), categoryController.getAllCategories);
router.post('/', protect, authorize('admin', 'staff'), categoryController.createCategory);
router.put('/:id', protect, authorize('admin', 'staff'), categoryController.updateCategory);
router.delete('/:id', protect, authorize('admin', 'staff'), categoryController.deleteCategory);

module.exports = router;
