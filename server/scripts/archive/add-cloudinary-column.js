import 'dotenv/config.js';
import { sequelize } from '../config/database.js';

async function addColumn() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.query(`
      ALTER TABLE updates
      ADD COLUMN IF NOT EXISTS cloudinary_id VARCHAR(255);
    `);

    console.log('✓ cloudinary_id column added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addColumn();
