import 'dotenv/config.js';
import { sequelize } from '../config/database.js';
import { User } from '../models/User.js';

async function createAdminUser() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Get credentials from environment variables or use defaults
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const plainPassword = process.env.ADMIN_PASSWORD || 'change_me_123';
    const name = process.env.ADMIN_NAME || 'Admin';

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.log('⚠️  Using default credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD env vars for custom values.');
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      // Update existing user
      existingUser.password = plainPassword;
      existingUser.isEmployee = true;
      await existingUser.save();
      console.log('✅ Admin user updated!');
    } else {
      // Create new user
      await User.create({
        name,
        email,
        password: plainPassword,
        isEmployee: true
      });
      console.log('✅ Admin user created successfully!');
    }
    
    console.log('Email:', email);
    console.log('Password:', plainPassword);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();
