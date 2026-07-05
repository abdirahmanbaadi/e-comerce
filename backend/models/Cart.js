const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    title: { type: String, required: true },
    category: { type: String, default: '' },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    image: { type: String, default: '' },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    cartItems: {
      type: [cartItemSchema],
      default: [],
    },
    savedItems: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Cart', cartSchema);
