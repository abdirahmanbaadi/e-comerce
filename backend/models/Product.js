const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  materialType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  materialLabel: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  material: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  oldPrice: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  discount: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  popularity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isNewest: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  stock: {
    type: DataTypes.STRING,
    defaultValue: 'in-stock',
  },
  stockVal: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active',
  },
  availability: {
    type: DataTypes.STRING,
    defaultValue: 'In Stock',
  },
  color: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  images: {
    type: DataTypes.TEXT, // JSON string representing array of image URLs/paths
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('images');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('images', JSON.stringify(value));
    }
  }
});

module.exports = Product;
