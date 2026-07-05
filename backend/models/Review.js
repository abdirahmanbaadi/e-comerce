const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    productId: { type: Number, required: true, index: true },
    productTitle: { type: String, required: true },
    userId: { type: String, default: '' },
    userName: { type: String, default: 'Customer' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Review', reviewSchema);
