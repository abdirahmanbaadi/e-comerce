const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customer: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.STRING, // e.g. "$350.00" or raw numbers
    allowNull: false,
  },
  payment: {
    type: DataTypes.STRING, // 'Paid', 'Pending', 'Failed'
    defaultValue: 'Pending',
  },
  paymentType: {
    type: DataTypes.STRING, // 'paid', 'pending', 'failed'
    defaultValue: 'pending',
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  driver: {
    type: DataTypes.STRING,
    defaultValue: 'Not assigned yet',
  },
  estimate: {
    type: DataTypes.STRING,
    defaultValue: 'Waiting for payment verification',
  },
  currentStep: {
    type: DataTypes.INTEGER, // Step 0 to 5
    defaultValue: 1,
  },
  product: {
    type: DataTypes.TEXT, // Summary of product or JSON items
    allowNull: false,
  },
  date: {
    type: DataTypes.STRING, // e.g. "May 22, 2026"
    allowNull: false,
  }
});

module.exports = Order;
