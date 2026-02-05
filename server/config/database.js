import 'dotenv/config.js';
import { Sequelize } from 'sequelize';

// Heroku provides DATABASE_URL, local dev uses individual variables
const databaseUrl = process.env.DATABASE_URL;

export const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: 'postgres',
      protocol: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false // Heroku uses self-signed certs
        }
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
      },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: {
          timestamps: true,
          underscored: true,
        },
      }
    );
