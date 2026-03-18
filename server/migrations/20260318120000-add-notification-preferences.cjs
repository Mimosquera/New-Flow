'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'email_language', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'both',
    });
    await queryInterface.addColumn('users', 'sms_language', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'both',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'email_language');
    await queryInterface.removeColumn('users', 'sms_language');
  }
};
