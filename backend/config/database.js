const { Sequelize } = require('sequelize');
const path = require('path');

// Configure Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: false, // Set to console.log to see SQL queries during debugging
});

module.exports = sequelize;
