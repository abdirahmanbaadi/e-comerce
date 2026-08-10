const mongoose = require('mongoose');

const deliveryChatMessageSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    senderRole: {
      type: String,
      enum: ['driver', 'customer', 'system'],
      required: true,
    },
    senderId: {
      type: String,
      default: '',
      index: true,
    },
    senderName: {
      type: String,
      default: '',
    },
    messageText: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
  }
);

deliveryChatMessageSchema.index({ orderId: 1, createdAt: 1 });

module.exports = mongoose.model('DeliveryChatMessage', deliveryChatMessageSchema);
