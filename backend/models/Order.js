const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    customer: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: String,
      required: true,
    },
    payment: {
      type: String,
      default: 'Pending',
    },
    paymentType: {
      type: String,
      default: 'pending',
    },
    address: {
      type: String,
      required: true,
    },
    driver: {
      type: String,
      default: 'Not assigned yet',
    },
    assignedDriverId: {
      type: String,
      default: '',
      index: true,
    },
    assignmentStatus: {
      type: String,
      enum: ['none', 'pending', 'accepted', 'rejected'],
      default: 'none',
      index: true,
    },
    assignmentRejectReason: {
      type: String,
      default: '',
    },
    lastRejectedDriverId: {
      type: String,
      default: '',
    },
    estimate: {
      type: String,
      default: 'Processing your order',
    },
    status: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'cancelled'],
      default: 'processing',
    },
    currentStep: {
      type: Number,
      default: 1,
    },
    product: {
      type: String,
      required: true,
    },
    items: {
      type: [
        {
          id: Number,
          title: String,
          quantity: Number,
          price: Number,
          category: String,
          image: String,
        },
      ],
      default: [],
    },
    email: {
      type: String,
      default: '',
    },
    userId: {
      type: String,
      default: '',
      index: true,
    },
    deliveryDate: {
      type: String,
      default: '',
    },
    deliveryTime: {
      type: String,
      default: '',
    },
    paymentMethod: {
      type: String,
      default: '',
    },
    paymentReference: {
      type: String,
      default: '',
    },
    transactionId: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    date: {
      type: String,
      required: true,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: '',
    },
    stockHeld: {
      type: Boolean,
      default: true,
    },
    paymentFailCount: {
      type: Number,
      default: 0,
    },
    refundTransactionId: {
      type: String,
      default: '',
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    refundDueAt: {
      type: Date,
      default: null,
    },
    refundStatus: {
      type: String,
      enum: ['none', 'scheduled', 'completed', 'failed'],
      default: 'none',
    },
    driverArrivedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    deliveryRating: {
      type: Number,
      default: null,
      min: 1,
      max: 5,
    },
    deliveryRatingComment: {
      type: String,
      default: '',
      trim: true,
    },
    deliveryRatedAt: {
      type: Date,
      default: null,
    },
    reviewPromptCount: {
      type: Number,
      default: 0,
    },
    reviewPromptLastAt: {
      type: Date,
      default: null,
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
    toObject: {
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Order', orderSchema);
