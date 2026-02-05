import 'dotenv/config.js';
import { sequelize } from './config/database.js';
import { User } from './models/User.js';

async function createAdminUser() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    const email = 'michael2000ny@gmail.com';
    const plainPassword = '1234'; // Plain text password - model will hash it
    const name = 'Admin';

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
    console.log('Password: 1234');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();
