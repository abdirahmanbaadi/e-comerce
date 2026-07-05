const User = require('../models/User');
const { onDriverApplication } = require('../services/notificationService');
const { countActiveDeliveries, MAX_ACTIVE_DELIVERIES, canDriverAcceptAssignment } = require('../services/driverService');
const Order = require('../models/Order');

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
