import 'dotenv/config.js';
import { sequelize } from '../config/database.js';
import { User } from '../models/User.js';

async function testLogin() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Get credentials from environment variables
    const email = process.env.TEST_EMAIL || 'admin@example.com';
    const testPassword = process.env.TEST_PASSWORD || 'change_me_123';

    if (!process.env.TEST_EMAIL || !process.env.TEST_PASSWORD) {
      console.log('⚠️  Using default credentials. Set TEST_EMAIL and TEST_PASSWORD env vars.');
    }

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User found');
    console.log('Email:', user.email);
    console.log('Is Employee:', user.isEmployee);
    console.log('Password hash:', user.password.substring(0, 20) + '...');

    const isValid = await user.verifyPassword(testPassword);
    
    if (isValid) {
      console.log('✅ Password verification SUCCESS');
      console.log('Login should work!');
    } else {
      console.log('❌ Password verification FAILED');
      console.log('Password does not match');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
