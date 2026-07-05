const UserActivity = require('../models/UserActivity');

function generateActivityId() {
  return `ACT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

async function logUserActivity({ userId, action, description = '', metadata = {} }) {
  if (!userId || !action) return null;
  try {
    return await UserActivity.create({
      id: generateActivityId(),
      userId,
      action,
      description,
      metadata,
    });
  } catch (error) {
    console.error('Activity log failed:', error.message);
    return null;
  }
}

module.exports = { logUserActivity };
