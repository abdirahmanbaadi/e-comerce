const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    method: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    phone: { type: String, default: '' },
    referenceId: { type: String, default: '' },
    transactionId: { type: String, default: '' },
    message: { type: String, default: '' },
    source: { type: String, default: 'system' },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
