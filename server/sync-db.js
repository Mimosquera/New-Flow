import 'dotenv/config.js';
import { sequelize } from './config/database.js';
import './models/User.js';
import './models/Update.js';
import './models/Service.js';
import './models/Availability.js';
import './models/Appointment.js';
import './models/BlockedDate.js';

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database tables created/updated');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

syncDatabase();
