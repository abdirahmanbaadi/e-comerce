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
  driverDeliveryFeeAmount,
  sumDriverDeliveryFees,
} = require('../utils/driverRevenueUtils');
const { verifyDeliveryQr, verifyDeliveryPin, clearDeliveryQr, publicDeliveryQrState, issueDeliveryQr, isDeliveryQrPending } = require('../utils/deliveryQrUtils');
const { onOrderUpdated } = require('../services/notificationService');
const { stampDeliveredAt } = require('../services/reviewPromptService');

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
      .select('id deliveryFee amount subtotal discount deliveredAt updatedAt currentStep tipAmount bonusAmount')
      .lean();

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const orderWhen = (order) => new Date(order.deliveredAt || order.updatedAt || 0);

    const inRange = (orders, from) => orders.filter((o) => orderWhen(o) >= from);

    const buildPeriod = (orders, label) => {
      const deliveryEarnings = Math.round(sumDriverDeliveryFees(orders) * 100) / 100;
      const tips = Math.round(
        orders.reduce((sum, o) => sum + (Number(o.tipAmount) || 0), 0) * 100
      ) / 100;
      const bonus = Math.round(
        orders.reduce((sum, o) => sum + (Number(o.bonusAmount) || 0), 0) * 100
      ) / 100;
      const total = Math.round((deliveryEarnings + tips + bonus) * 100) / 100;
      const deliveries = orders.length;
      const average = deliveries > 0 ? Math.round((total / deliveries) * 100) / 100 : 0;
      return {
        label,
        total,
        deliveries,
        average,
        breakdown: {
          deliveryEarnings,
          tips,
          bonus,
        },
      };
    };

    const todayOrders = inRange(completedOrders, startOfToday);
    const weekOrders = inRange(completedOrders, startOfWeek);
    const monthOrders = inRange(completedOrders, startOfMonth);
    const allOrders = completedOrders;

    const dayKey = (d) => {
      const x = new Date(d);
      if (Number.isNaN(x.getTime())) return '';
      const y = x.getFullYear();
      const m = String(x.getMonth() + 1).padStart(2, '0');
      const day = String(x.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const historyMap = new Map();
    completedOrders.forEach((order) => {
      const when = orderWhen(order);
      const key = dayKey(when);
      if (!key) return;
      const fee = driverDeliveryFeeAmount(order);
      const tip = Number(order.tipAmount) || 0;
      const bonus = Number(order.bonusAmount) || 0;
      const prev = historyMap.get(key) || { date: key, total: 0, deliveries: 0 };
      prev.total += fee + tip + bonus;
      prev.deliveries += 1;
      historyMap.set(key, prev);
    });

    const history = Array.from(historyMap.values())
      .map((row) => ({
        date: row.date,
        total: Math.round(row.total * 100) / 100,
        deliveries: row.deliveries,
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 30);

    const totalRevenue = Math.round(sumDriverDeliveryFees(completedOrders) * 100) / 100;
    const weekRevenue = Math.round(sumDriverDeliveryFees(weekOrders) * 100) / 100;

    return res.status(200).json({
      success: true,
      earnings: {
        totalRevenue,
        weekRevenue,
        completedDeliveries: completedOrders.length,
        weekDeliveries: weekOrders.length,
        periods: {
          today: buildPeriod(todayOrders, 'Today'),
          week: buildPeriod(weekOrders, 'This Week'),
          month: buildPeriod(monthOrders, 'This Month'),
          all: buildPeriod(allOrders, 'All'),
        },
        history,
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
  if (!plain.status) {
    if (step === 0) plain.status = 'cancelled';
    else if (step >= 5) plain.status = 'delivered';
    else if (step >= 4) plain.status = 'shipped';
    else plain.status = 'processing';
  }
  delete plain.deliveryConfirmTokenHash;
  delete plain.deliveryConfirmPayload;
  delete plain.deliveryConfirmPin;
  delete plain.deliveryConfirmPinHash;
  Object.assign(plain, publicDeliveryQrState(order));
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
    clearDeliveryQr(order);
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

/**
 * Driver starts the trip: Out for Delivery (step 4).
 * Issues customer QR/PIN and notifies customer + admin (same as admin step-4 path).
 */
exports.startDelivery = async (req, res) => {
  try {
    const orderId = String(req.params.orderId || '').trim();
    const order = await Order.findOne({ id: orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (order.assignedDriverId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'This delivery is not assigned to you.' });
    }
    if ((order.assignmentStatus || 'none') !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Accept the assignment before starting delivery.',
      });
    }

    const prevStep = typeof order.currentStep === 'number' ? order.currentStep : 1;
    const prevStatus = order.status;

    if (prevStep >= 5 || String(order.status || '').toLowerCase() === 'delivered') {
      return res.status(400).json({ success: false, message: 'This order is already delivered.' });
    }
    if (prevStep >= 4) {
      return res.status(200).json({
        success: true,
        message: 'Delivery is already out for delivery.',
        order: withResolvedStatus(order),
        alreadyStarted: true,
      });
    }

    order.driverArrivedAt = null;
    issueDeliveryQr(order);
    order.currentStep = 4;
    order.status = 'shipped';
    order.estimate = 'Out for delivery — customer QR ready';
    await order.save();

    await syncDriverStatus(req.user.id);
    await onOrderUpdated(order, {
      currentStep: 4,
      currentStepChanged: prevStep !== 4,
      status: 'shipped',
      statusChanged: prevStatus !== 'shipped',
      deliveryQrIssued: isDeliveryQrPending(order),
    });

    await logOrderActivity({
      orderId: order.id,
      action: 'driver_started_delivery',
      description: `${req.user.firstName || 'Driver'} marked the order out for delivery.`,
      actorId: req.user.id,
      actorRole: 'delivery',
      metadata: { fromStep: prevStep, toStep: 4 },
    });

    return res.status(200).json({
      success: true,
      message: 'Out for delivery. Customer QR / PIN is ready.',
      order: withResolvedStatus(order),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to start delivery.' });
  }
};

/** Driver scans customer QR or enters 6-digit code → marks delivered */
exports.confirmDeliveryByQr = async (req, res) => {
  try {
    const orderId = String(req.params.orderId || '').trim();
    const { payload, pin } = req.body || {};
    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found!' });
    }

    if (order.assignedDriverId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'This order is not assigned to you.' });
    }
    if ((order.assignmentStatus || 'none') !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Accept the assignment before confirming delivery.',
      });
    }
    if ((order.currentStep || 0) < 4 || !order.driverArrivedAt) {
      return res.status(400).json({
        success: false,
        message: 'Confirm arrival at the customer before scanning their QR or entering the code.',
      });
    }

    const verified = pin
      ? verifyDeliveryPin(order, pin)
      : verifyDeliveryQr(order, payload);
    if (!verified.ok) {
      return res.status(400).json({ success: false, message: verified.message });
    }

    const prevStep = typeof order.currentStep === 'number' ? order.currentStep : 1;
    const confirmedAt = new Date();
    clearDeliveryQr(order);
    order.deliveryConfirmStatus = 'confirmed';
    order.deliveryConfirmedAt = confirmedAt;
    order.currentStep = 5;
    order.status = 'delivered';
    order.estimate =
      verified.method === 'pin'
        ? 'Delivered successfully — confirmed by 6-digit code'
        : 'Delivered successfully — confirmed by customer QR';
    stampDeliveredAt(order, prevStep);
    await order.save();

    await syncDriverStatus(req.user.id);
    await onOrderUpdated(order, {
      currentStep: 5,
      currentStepChanged: prevStep !== 5,
      status: 'delivered',
      statusChanged: true,
    });

    await logOrderActivity({
      orderId: order.id,
      action: verified.method === 'pin' ? 'delivery_pin_confirmed' : 'delivery_qr_confirmed',
      description:
        verified.method === 'pin'
          ? 'Delivery confirmed with customer 6-digit code.'
          : 'Delivery confirmed by scanning customer QR code.',
      actorId: req.user.id,
      actorRole: 'delivery',
      metadata: { confirmedAt, method: verified.method },
    });

    return res.status(200).json({
      success: true,
      message:
        verified.method === 'pin'
          ? 'Delivery confirmed with 6-digit code.'
          : 'Delivery confirmed with customer QR.',
      order: withResolvedStatus(order),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to confirm delivery QR.' });
  }
};

/** Driver live GPS ping while out for delivery. */
exports.updateDeliveryLocation = async (req, res) => {
  try {
    const orderId = String(req.params.orderId || '').trim();
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, message: 'Valid lat and lng are required.' });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: 'Coordinates out of range.' });
    }

    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (order.assignedDriverId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'This delivery is not assigned to you.' });
    }
    if ((order.assignmentStatus || 'none') !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Accept the assignment first.' });
    }
    if ((order.currentStep || 0) < 4 || String(order.status || '').toLowerCase() === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Location updates are only available while out for delivery.',
      });
    }

    order.driverLat = lat;
    order.driverLng = lng;
    order.driverLocationUpdatedAt = new Date();
    await order.save();

    return res.status(200).json({
      success: true,
      location: {
        lat: order.driverLat,
        lng: order.driverLng,
        updatedAt: order.driverLocationUpdatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update location.' });
  }
};
