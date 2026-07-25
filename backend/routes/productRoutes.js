const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prodController = require('../controllers/prodController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Only accept images
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Kaliya sawirada waa la oggol yahay!'));
    }
  }
});

// Public Product Endpoints
router.get('/', prodController.getProducts);
router.get('/:id/details', protect, authorize('admin'), prodController.getProductDetails);
router.get('/:id/stock-history', protect, authorize('admin'), prodController.getProductStockHistory);
router.get('/:id/stock-inventory', protect, authorize('admin'), prodController.getProductStockInventory);
router.get('/:id/stock-consumption', protect, authorize('admin'), prodController.getProductStockConsumption);
router.get('/:id', prodController.getProductById);

// Protected Admin-Only Product Endpoints (Uses upload.array for uploading up to 5 images)
router.post('/', protect, authorize('admin'), upload.array('images', 5), prodController.createProduct);
router.put('/:id', protect, authorize('admin'), upload.array('images', 5), prodController.updateProduct);
router.delete('/:id', protect, authorize('admin'), prodController.deleteProduct);

module.exports = router;
