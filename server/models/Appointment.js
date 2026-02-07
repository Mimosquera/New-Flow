import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Service } from './Service.js';
import { User } from './User.js';

export const Appointment = sequelize.define(
  'Appointment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'services',
        key: 'id',
      },
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: true, // Null means "no preference"
      references: {
        model: 'users',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
    },
    customerNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    employeeNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    acceptedByEmployeeId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    tableName: 'appointments',
    indexes: [
      {
        fields: ['date', 'time'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['employee_id'],
      },
      {
        fields: ['customer_email'],
      },
    ],
  }
);

// Define associations
Appointment.belongsTo(Service, { foreignKey: 'serviceId', as: 'service', onDelete: 'RESTRICT' });
Appointment.belongsTo(User, { foreignKey: 'employeeId', as: 'employee' });
Appointment.belongsTo(User, { foreignKey: 'acceptedByEmployeeId', as: 'acceptedBy' });
