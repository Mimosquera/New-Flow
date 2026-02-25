import 'dotenv/config.js';
import { sequelize } from '../config/database.js';

async function runMigration() {
  try {
    const queryInterface = sequelize.getQueryInterface();

    console.log('Running migration: add password reset fields...');

    // Add reset_password_token column
    await queryInterface.addColumn('users', 'reset_password_token', {
      type: sequelize.Sequelize.STRING,
      allowNull: true,
    });
    console.log('✓ Added reset_password_token column');

    // Add reset_password_expires column
    await queryInterface.addColumn('users', 'reset_password_expires', {
      type: sequelize.Sequelize.DATE,
      allowNull: true,
    });
    console.log('✓ Added reset_password_expires column');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);

    // Check if columns already exist
    if (error.message.includes('already exists')) {
      console.log('Columns already exist, migration not needed.');
      process.exit(0);
    }

    process.exit(1);
  }
}

runMigration();
