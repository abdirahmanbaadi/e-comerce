const Order = require('../models/Order');
const User = require('../models/User');

const MAX_ACTIVE_DELIVERIES = 3;

async function countActiveDeliveries(driverId) {
  if (!driverId) return 0;
  return Order.countDocuments({
    assignedDriverId: driverId,
    assignmentStatus: 'accepted',
    currentStep: { $gte: 3, $lt: 5 },
    status: { $nin: ['cancelled'] },
  });
}

async function syncDriverStatus(driverId) {
  if (!driverId) return null;

  const driver = await User.findOne({ id: driverId, role: 'delivery' });
  if (!driver) return null;

  if (driver.driverStatus === 'offline') {
    return driver;
  }

  const activeCount = await countActiveDeliveries(driverId);
  driver.driverStatus = activeCount > 0 ? 'busy' : 'available';
  await driver.save();
  return driver;
}

function driverLabelFromUser(user) {
  const name = `${user.firstName} ${user.lastName || ''}`.trim();
  return user.phone ? `${name} - ${user.phone}` : name;
}

function canDriverAcceptAssignment(activeDeliveries, { isOffline = false, isCurrentDriver = false } = {}) {
  if (isOffline) return false;
  if (isCurrentDriver) return true;
  return activeDeliveries < MAX_ACTIVE_DELIVERIES;
}

module.exports = {
  MAX_ACTIVE_DELIVERIES,
  countActiveDeliveries,
  syncDriverStatus,
  driverLabelFromUser,
  canDriverAcceptAssignment,
};
