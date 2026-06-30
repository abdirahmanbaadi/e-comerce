const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupportMessage = sequelize.define('SupportMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ticketId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  senderRole: {
    type: DataTypes.STRING, // 'user' or 'admin'
    allowNull: false,
  },
  senderName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  messageText: {
    type: DataTypes.TEXT,
    allowNull: false,
  }
});

module.exports = SupportMessage;
