const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cmsController = require('../controllers/cmsController');
const { protect, authorize } = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename(_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `cms-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) return cb(null, true);
    cb(new Error('Only image files are allowed (jpg, png, webp, gif).'));
  },
});

router.get('/', cmsController.getPublicContent);
router.get('/admin', protect, authorize('admin'), cmsController.getAdminContent);
router.put('/', protect, authorize('admin'), cmsController.updateContent);
router.post(
  '/upload',
  protect,
  authorize('admin'),
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message || 'Upload failed.' });
      }
      return next();
    });
  },
  cmsController.uploadImage
);

module.exports = router;
