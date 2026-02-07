import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * Service Model
 * Represents services offered by the salon
 */
export const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  price: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  language: {
    type: DataTypes.ENUM('en', 'es'),
    allowNull: false,
    defaultValue: 'en',
  },
}, {
  tableName: 'services',
  timestamps: true,
});
