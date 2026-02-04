import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { User } from './User.js';

export const BlockedDate = sequelize.define(
  'BlockedDate',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Specific date blocked (YYYY-MM-DD)',
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Optional reason for blocking',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'blocked_dates',
    indexes: [
      {
        fields: ['date'],
      },
      {
        fields: ['user_id'],
      },
    ],
  }
);

BlockedDate.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(BlockedDate, { foreignKey: 'userId', as: 'blockedDates' });
