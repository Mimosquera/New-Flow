import 'dotenv/config.js';
import { User } from '../models/User.js';
import { Update } from '../models/Update.js';
import { Service } from '../models/Service.js';
import { sequelize } from '../config/database.js';

async function seed() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected');

    console.log('Syncing database...');
    await sequelize.sync({ alter: true });
    console.log('Database synced');

    console.log('Creating seed data...');
    
    // Clear existing users
    await User.destroy({ where: {} });
    console.log('Cleared existing users');

    // Create sample users
    const users = await User.bulkCreate([
      {
        name: process.env.SEED_EMPLOYEE_NAME || 'Admin',
        email: process.env.SEED_EMPLOYEE_EMAIL || 'admin@example.com',
        password: process.env.SEED_EMPLOYEE_PASSWORD || 'change_this_password',
        isEmployee: true,
      },
      {
        name: 'Marcus Johnson',
        email: 'marcus.j@newflow.com',
        password: '1234',
        isEmployee: true,
      },
      {
        name: 'Sofia Rodriguez',
        email: 'sofia.r@newflow.com',
        password: '1234',
        isEmployee: true,
      },
    ], {
      individualHooks: true
    });

    console.log(`Created ${users.length} users`);

    // Clear existing updates
    await Update.destroy({ where: {} });
    console.log('Cleared existing updates');

    // Create initial updates
    const updates = await Update.bulkCreate([
      {
        title: 'Welcome to New Flow!',
        content: 'Book your appointments online now with our new website',
        author: 'Admin',
        date: '2026-01-23',
      },
      {
        title: 'New Barbers on Staff',
        content: 'Meet our talented team of experienced barbers and stylists',
        author: 'Admin',
        date: '2026-01-20',
      },
      {
        title: 'Grand Opening Special',
        content: 'Get 20% off your first visit at New Flow this month!',
        author: 'Admin',
        date: '2026-01-18',
      },
    ]);

    console.log(`Created ${updates.length} updates`);

    // Clear existing services
    await Service.destroy({ where: {} });
    console.log('Cleared existing services');

    // Create initial services
    const services = await Service.bulkCreate([
      {
        name: 'Haircut',
        description: 'Classic men\'s haircut',
        price: '25',
      },
      {
        name: 'Fade',
        description: 'Modern fade with details',
        price: '30',
      },
      {
        name: 'Beard Trim',
        description: 'Professional beard shaping',
        price: '15',
      },
      {
        name: 'Hair Coloring',
        description: 'Professional coloring service',
        price: '50',
      },
      {
        name: 'Kids Haircut',
        description: 'Haircuts for children',
        price: '20',
      },
      {
        name: 'Styling',
        description: 'Special occasion styling',
        price: '35',
      },
    ]);

    console.log(`Created ${services.length} services`);
    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
