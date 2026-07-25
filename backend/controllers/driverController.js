const User = require('../models/User');
const Order = require('../models/Order');
const { onDriverApplication, onDriverAssignmentAccepted, onDriverAssignmentRejected } = require('../services/notificationService');
const { logOrderActivity } = require('../services/orderActivityService');
const {
  countActiveDeliveries,
  MAX_ACTIVE_DELIVERIES,
  canDriverAcceptAssignment,
  syncDriverStatus,
  driverLabelFromUser,
} = require('../services/driverService');
const {
  buildDriverEarningsMatch,
  sumDriverDeliveryFees,
} = require('../utils/driverRevenueUtils');

function formatDriverApplication(app) {
  if (!app) return { status: 'none' };
  return {
    status: app.status || 'none',
    district: app.district || '',
    vehicleType: app.vehicleType || '',
    experience: app.experience || '',
    availability: app.availability || '',
    appliedAt: app.appliedAt || null,
    reviewedAt: app.reviewedAt || null,
    rejectReason: app.rejectReason || '',
  };
}

function formatApplicantUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    avatar: user.avatar,
    driverApplication: formatDriverApplication(user.driverApplication),
  };
}

exports.submitApplication = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Admin accounts cannot apply for delivery.' });
    }

    if (user.role === 'delivery') {
      return res.status(400).json({ success: false, message: 'You are already an approved delivery driver.' });
    }

    const status = user.driverApplication?.status || 'none';

    if (status === 'pending') {
      return res.status(400).json({ success: false, message: 'Your application is already under review.' });
    }

    if (status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Your application was rejected. You cannot apply again.',
        driverApplication: formatDriverApplication(user.driverApplication),
      });
    }

    if (status === 'approved') {
      return res.status(400).json({ success: false, message: 'You are already approved as a driver.' });
    }

    const { district, vehicleType, experience, availability } = req.body;

    if (!district || !vehicleType || !availability) {
      return res.status(400).json({ success: false, message: 'Please fill in district, vehicle type, and availability.' });
    }

    user.driverApplication = {
      status: 'pending',
      district: district.trim(),
      vehicleType: vehicleType.trim(),
      experience: (experience || '').trim(),
      availability: availability.trim(),
      appliedAt: new Date(),
      reviewedAt: null,
      rejectReason: '',
    };

    await user.save();

    await onDriverApplication(user);

    return res.status(201).json({
      success: true,
      message: 'Application submitted! Admin will review your request.',
      driverApplication: formatDriverApplication(user.driverApplication),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to submit application.' });
  }
};

exports.getMyApplication = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }

    return res.status(200).json({
      success: true,
      role: user.role,
      driverApplication: formatDriverApplication(user.driverApplication),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load application.' });
  }
};

exports.listApplications = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const filter = { 'driverApplication.status': status };

    if (status === 'all') {
      delete filter['driverApplication.status'];
      filter['driverApplication.status'] = { $in: ['pending', 'approved', 'rejected'] };
    }

    const users = await User.find(filter).sort({ 'driverApplication.appliedAt': -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      applications: users.map(formatApplicantUser),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load applications.' });
  }
};

exports.getApplication = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.userId });
    if (!user || !user.driverApplication || user.driverApplication.status === 'none') {
      return res.status(404).json({ success: false, message: 'Application not found!' });
    }

    return res.status(200).json({ success: true, application: formatApplicantUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load application.' });
  }
};

exports.approveApplication = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }

    if (user.driverApplication?.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending applications can be approved.' });
    }

    user.role = 'delivery';
    user.driverApplication.status = 'approved';
    user.driverApplication.reviewedAt = new Date();
    user.driverApplication.rejectReason = '';
    user.driverStatus = 'available';
    await user.save();

    return res.status(200).json({
      success: true,
      message: `${user.firstName} has been approved as a delivery driver.`,
      application: formatApplicantUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to approve application.' });
  }
};

exports.rejectApplication = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findOne({ id: req.params.userId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }

    if (user.driverApplication?.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending applications can be rejected.' });
    }

    user.role = 'user';
    user.driverApplication.status = 'rejected';
    user.driverApplication.reviewedAt = new Date();
    user.driverApplication.rejectReason = (reason || 'Application not accepted at this time.').trim();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Application rejected permanently.',
      application: formatApplicantUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to reject application.' });
  }
};

exports.listApprovedDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'delivery', isActive: { $ne: false } })
      .select('id firstName lastName phone driverStatus driverApplication')
      .sort({ firstName: 1 })
      .lean();

    const activeCounts = await Order.aggregate([
      {
        $match: {
          assignedDriverId: { $ne: null },
          currentStep: { $gte: 3, $lt: 5 },
          status: { $nin: ['cancelled'] },
        },
      },
      { $group: { _id: '$assignedDriverId', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(activeCounts.map((row) => [row._id, row.count]));

    const driversWithStats = drivers.map((d) => {
      const activeDeliveries = countMap[d.id] || 0;
      const isOffline = d.driverStatus === 'offline';
      let driverStatus = d.driverStatus || 'available';
      if (!isOffline && activeDeliveries > 0) driverStatus = 'busy';

      return {
        id: d.id,
        name: `${d.firstName} ${d.lastName || ''}`.trim(),
        phone: d.phone,
        district: d.driverApplication?.district || '',
        vehicleType: d.driverApplication?.vehicleType || '',
        driverStatus,
        activeDeliveries,
        maxActiveDeliveries: MAX_ACTIVE_DELIVERIES,
        canAssign: canDriverAcceptAssignment(activeDeliveries, { isOffline }),
        atCapacity: activeDeliveries >= MAX_ACTIVE_DELIVERIES,
      };
    });

    return res.status(200).json({
      success: true,
      count: driversWithStats.length,
      maxActiveDeliveries: MAX_ACTIVE_DELIVERIES,
      drivers: driversWithStats,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load drivers.' });
  }
};

exports.updateMyStatus = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user || user.role !== 'delivery') {
      return res.status(403).json({ success: false, message: 'Only delivery drivers can update availability.' });
    }

    const { status } = req.body;
    const allowed = ['available', 'offline'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be available or offline.' });
    }

    if (status === 'offline') {
      user.driverStatus = 'offline';
    } else {
      const activeDeliveries = await countActiveDeliveries(user.id);
      user.driverStatus = activeDeliveries > 0 ? 'busy' : 'available';
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: status === 'offline' ? 'You are now offline.' : 'You are available for deliveries.',
      driverStatus: user.driverStatus,
      activeDeliveries: await countActiveDeliveries(user.id),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update driver status.' });
  }
};

exports.getMyEarnings = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user || user.role !== 'delivery') {
      return res.status(403).json({ success: false, message: 'Only delivery drivers can view earnings.' });
    }

    const match = buildDriverEarningsMatch(user.id);
    const completedOrders = await Order.find(match)
      .select('id deliveryFee amount subtotal discount deliveredAt updatedAt currentStep')
      .lean();

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const totalRevenue = Math.round(sumDriverDeliveryFees(completedOrders) * 100) / 100;
    const weekOrders = completedOrders.filter((order) => {
      const when = new Date(order.deliveredAt || order.updatedAt || 0);
      return when >= weekStart;
    });
    const weekRevenue = Math.round(sumDriverDeliveryFees(weekOrders) * 100) / 100;

    return res.status(200).json({
      success: true,
      earnings: {
        totalRevenue,
        weekRevenue,
        completedDeliveries: completedOrders.length,
        weekDeliveries: weekOrders.length,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load driver earnings.' });
  }
};

exports.getMyStatus = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user || user.role !== 'delivery') {
      return res.status(403).json({ success: false, message: 'Only delivery drivers can view availability.' });
    }

    const activeDeliveries = await countActiveDeliveries(user.id);
    let driverStatus = user.driverStatus || 'available';
    if (driverStatus !== 'offline' && activeDeliveries > 0) {
      driverStatus = 'busy';
    }

    return res.status(200).json({
      success: true,
      driverStatus,
      activeDeliveries,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load driver status.' });
  }
};

function withResolvedStatus(order) {
  const plain = order.toObject ? order.toObject() : { ...order };
  const step = typeof plain.currentStep === 'number' ? plain.currentStep : 1;
  if (plain.status) return plain;
  if (step === 0) plain.status = 'cancelled';
  else if (step >= 5) plain.status = 'delivered';
  else if (step >= 4) plain.status = 'shipped';
  else plain.status = 'processing';
  return plain;
}

exports.acceptAssignment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ id: orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (order.assignedDriverId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'This delivery is not assigned to you.' });
    }
    if (order.assignmentStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'This assignment is no longer pending.' });
    }

    order.assignmentStatus = 'accepted';
    if (!order.estimate?.trim() || order.estimate === 'Awaiting driver acceptance') {
      order.estimate = 'Driver accepted — awaiting dispatch';
    }
    await order.save();

    await syncDriverStatus(req.user.id);
    await onDriverAssignmentAccepted(order);

    await logOrderActivity({
      orderId: order.id,
      action: 'driver_accepted',
      description: `${req.user.firstName} accepted the delivery assignment.`,
      actorId: req.user.id,
      actorRole: 'delivery',
      metadata: { driverId: req.user.id },
    });

    return res.status(200).json({
      success: true,
      message: 'Delivery accepted. You can start when ready.',
      order: withResolvedStatus(order),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to accept delivery.' });
  }
};

exports.rejectAssignment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const trimmedReason = String(reason || '').trim();

    if (!trimmedReason) {
      return res.status(400).json({ success: false, message: 'Please provide a reason for declining.' });
    }

    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (order.assignedDriverId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'This delivery is not assigned to you.' });
    }
    if (order.assignmentStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'This assignment is no longer pending.' });
    }

    const driver = await User.findOne({ id: req.user.id });
    const driverName = driver ? driverLabelFromUser(driver) : 'Driver';

    order.lastRejectedDriverId = req.user.id;
    order.assignmentRejectReason = trimmedReason;
    order.assignmentStatus = 'none';
    order.assignedDriverId = '';
    order.driver = 'Not assigned yet';
    order.driverArrivedAt = null;
    order.estimate = 'Driver declined — assign another driver';
    await order.save();

    await syncDriverStatus(req.user.id);
    await onDriverAssignmentRejected(order, {
      driverId: req.user.id,
      driverName,
      reason: trimmedReason,
    });

    await logOrderActivity({
      orderId: order.id,
      action: 'driver_rejected',
      description: `${driver?.firstName || 'Driver'} declined: ${trimmedReason}`,
      actorId: req.user.id,
      actorRole: 'delivery',
      metadata: { driverId: req.user.id, reason: trimmedReason },
    });

    return res.status(200).json({
      success: true,
      message: 'Delivery declined. Admin has been notified.',
      order: withResolvedStatus(order),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to decline delivery.' });
  }
};
