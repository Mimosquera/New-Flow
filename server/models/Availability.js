import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { User } from './User.js';

export const Availability = sequelize.define(
  'Availability',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 6,
      },
      comment: '0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday',
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
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
    tableName: 'availabilities',
    indexes: [
      {
        fields: ['day_of_week'],
      },
      {
        fields: ['user_id'],
      },
    ],
  }
);

// Set up associations
Availability.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Availability, { foreignKey: 'userId', as: 'availabilities' });
