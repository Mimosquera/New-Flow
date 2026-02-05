# Server Utility Scripts

This folder contains utility scripts for database setup and maintenance.

## Scripts

### `sync-db.js`
Synchronizes Sequelize models with the database, creating or updating tables as needed.

**Usage:**
```bash
# Local development
node scripts/sync-db.js

# Production (with DATABASE_URL)
DATABASE_URL="your_postgres_url" node scripts/sync-db.js
```

### `create-admin.js`
Creates or updates an admin user account.

**Usage:**
```bash
# With environment variables (recommended)
ADMIN_EMAIL="your_email@example.com" ADMIN_PASSWORD="your_password" DATABASE_URL="your_postgres_url" node scripts/create-admin.js

# Using defaults (not for production)
node scripts/create-admin.js
```

### `test-login.js`
Diagnostic tool to verify password hashing and authentication.

**Usage:**
```bash
# With environment variables (recommended)
TEST_EMAIL="your_email@example.com" TEST_PASSWORD="your_password" DATABASE_URL="your_postgres_url" node scripts/test-login.js

# Using defaults (not for production)
node scripts/test-login.js
```

### `init-db.js`
Legacy database initialization script for local development (uses individual DB env vars).

### `seeds.js`
Sample data seeding script for development/testing.

**Usage:**
```bash
node scripts/seeds.js
```

## Notes

- These scripts are meant for setup and maintenance, not for regular application runtime
- Always use environment variables for production database credentials
- Never commit credentials or production URLs to version control
