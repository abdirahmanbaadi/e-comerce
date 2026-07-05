const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    action: {
      type: String,
      required: true,
      enum: [
        'register',
        'login',
        'profile_update',
        'password_change',
        'order_placed',
        'role_changed',
        'account_activated',
        'account_deactivated',
      ],
    },
    description: { type: String, default: '' },
    metadata: { type: Object, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('UserActivity', userActivitySchema);
