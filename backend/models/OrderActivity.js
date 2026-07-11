const mongoose = require('mongoose');

const orderActivitySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    action: {
      type: String,
      required: true,
      enum: [
        'order_placed',
        'status_changed',
        'payment_updated',
        'driver_assigned',
        'driver_reassigned',
        'driver_accepted',
        'driver_rejected',
        'order_cancelled',
        'estimate_updated',
      ],
    },
    description: { type: String, default: '' },
    actorId: { type: String, default: '' },
    actorRole: { type: String, default: 'system' },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('OrderActivity', orderActivitySchema);
