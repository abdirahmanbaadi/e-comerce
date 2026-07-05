const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    productTitles: { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Wishlist', wishlistSchema);
