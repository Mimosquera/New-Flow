module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("updates", "language", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'en',
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("updates", "language");
  }
};
