import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * Update/Post Model
 * Represents news updates and announcements posted by employees
 */
export const Update = sequelize.define('Update', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Employee',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  media_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  media_type: {
    type: DataTypes.ENUM('image', 'video'),
    allowNull: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true, // Allow null for existing posts
    references: {
      model: 'users',
      key: 'id',
    },
  },
  language: {
    type: DataTypes.ENUM('en', 'es'),
    allowNull: false,
    defaultValue: 'en',
  },
}, {
  tableName: 'updates',
  timestamps: true,
});
