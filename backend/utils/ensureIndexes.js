async function ensureIndexes() {
  const Order = require('../models/Order');
  const Product = require('../models/Product');
  const User = require('../models/User');
  const Notification = require('../models/Notification');
  const SupportTicket = require('../models/SupportTicket');
  const PaymentTransaction = require('../models/PaymentTransaction');

  await Promise.all([
    Order.collection.createIndex({ id: 1 }, { unique: true, background: true }),
    Order.collection.createIndex({ assignedDriverId: 1, currentStep: 1 }, { background: true }),
    Order.collection.createIndex({ phone: 1 }, { background: true }),
    Order.collection.createIndex({ userId: 1, createdAt: -1 }, { background: true }),
    Order.collection.createIndex({ createdAt: -1 }, { background: true }),
    Order.collection.createIndex({ paymentType: 1, createdAt: -1 }, { background: true }),
    Product.collection.createIndex({ id: 1 }, { background: true }),
    Product.collection.createIndex({ category: 1, status: 1 }, { background: true }),
    User.collection.createIndex({ email: 1 }, { background: true }),
    User.collection.createIndex({ phone: 1 }, { background: true }),
    User.collection.createIndex({ role: 1 }, { background: true }),
    User.collection.createIndex({ id: 1 }, { background: true }),
    Notification.collection.createIndex({ userId: 1, createdAt: -1 }, { background: true }),
    Notification.collection.createIndex({ audience: 1, read: 1 }, { background: true }),
    SupportTicket.collection.createIndex({ lastMessageAt: -1 }, { background: true }),
    SupportTicket.collection.createIndex({ status: 1 }, { background: true }),
    PaymentTransaction.collection.createIndex({ orderId: 1, createdAt: -1 }, { background: true }),
  ]);
}

module.exports = { ensureIndexes };
