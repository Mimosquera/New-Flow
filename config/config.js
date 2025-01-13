require('dotenv').config({ path: './server/.env' });

export const development = {
  username: process.env.DB_USERNAME,
  password: String(process.env.DB_PASSWORD), // Convert to string if necessary
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  dialect: 'postgres',
  // ...existing code...
};
