const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/apply', protect, driverController.submitApplication);
router.get('/my-application', protect, driverController.getMyApplication);
router.get('/my-earnings', protect, authorize('delivery'), driverController.getMyEarnings);
router.get('/my-status', protect, authorize('delivery'), driverController.getMyStatus);
router.put('/my-status', protect, authorize('delivery'), driverController.updateMyStatus);
router.post('/assignments/:orderId/accept', protect, authorize('delivery'), driverController.acceptAssignment);
router.post('/assignments/:orderId/reject', protect, authorize('delivery'), driverController.rejectAssignment);
router.post(
  '/assignments/:orderId/confirm-delivery',
  protect,
  authorize('delivery'),
  driverController.confirmDeliveryByQr
);

router.get('/applications', protect, authorize('admin'), driverController.listApplications);
router.get('/applications/:userId', protect, authorize('admin'), driverController.getApplication);
router.post('/applications/:userId/approve', protect, authorize('admin'), driverController.approveApplication);
router.post('/applications/:userId/reject', protect, authorize('admin'), driverController.rejectApplication);
router.get('/approved', protect, authorize('admin'), driverController.listApprovedDrivers);

module.exports = router;
