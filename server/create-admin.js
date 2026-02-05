import 'dotenv/config.js';
import bcrypt from 'bcryptjs';
import { sequelize } from './config/database.js';

async function createAdminUser() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    const email = 'michael2000ny@gmail.com';
    const password = await bcrypt.hash('1234', 10); // Change this password!
    const name = 'Admin';

    const [results] = await sequelize.query(`
      INSERT INTO users (id, name, email, password, is_employee, created_at, updated_at)
      VALUES (gen_random_uuid(), :name, :email, :password, true, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING *;
    `, {
      replacements: { name, email, password }
    });

    if (results.length > 0) {
      console.log('✅ Admin user created successfully!');
      console.log('Email:', email);
      console.log('Password: 1234');
    } else {
      console.log('⚠️ User already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();
