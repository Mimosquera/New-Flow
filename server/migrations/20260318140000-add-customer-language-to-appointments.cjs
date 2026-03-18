'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('appointments', 'customer_language', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'en',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('appointments', 'customer_language');
  },
};
