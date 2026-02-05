import 'dotenv/config.js';
import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize the database by running schema.sql
 */
async function initDatabase() {
  const client = new pg.Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Connect to default postgres database first
  });

  try {
    console.log('Connecting to PostgreSQL server...');
    await client.connect();
    console.log('Connected to PostgreSQL server');

    // Terminate existing connections to the database
    console.log('Terminating existing connections to salon_db...');
    try {
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = 'salon_db' 
          AND pid <> pg_backend_pid();
      `);
    } catch (e) {
      // Ignore if this query fails
    }

    // Drop and create database
    console.log('Dropping existing database...');
    try {
      await client.query('DROP DATABASE IF EXISTS salon_db;');
    } catch (e) {
      console.log('Database drop skipped');
    }

    console.log('Creating database salon_db...');
    await client.query('CREATE DATABASE salon_db;');

    console.log('Database initialization completed!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initDatabase();
