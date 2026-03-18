'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'notification_settings', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: { newAppointments: true, confirmations: true, cancellations: true },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'notification_settings');
  },
};
