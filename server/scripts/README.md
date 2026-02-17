# Server Utility Scripts

This folder contains utility scripts for database setup and maintenance.

## Active Scripts

### init-db.js
Initializes the database by creating the salon_db database. Run this first when setting up a new development environment.

**Usage:**
```bash
node scripts/init-db.js
```

### create-admin.js
Creates or updates an admin user account.

**Usage:**
```bash
# With environment variables (recommended)
ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="secure_password" node scripts/create-admin.js

# Using defaults (development only)
node scripts/create-admin.js
```

**Note:** The script will display the password after creation. Only use default credentials in development.

### seeds.js
Populates the database with sample data for development/testing.

**Usage:**
```bash
node scripts/seeds.js
```

**Warning:** This script clears existing data before seeding. Only use in development.

---

## Archived Scripts

The `archive/` folder contains one-off migration scripts that have already been executed:

- `sync-db.js` - Database schema synchronization (superseded by migrations)
- `test-login.js` - Login verification tool (development/debugging)
- `add-cloudinary-column.js` - Added Cloudinary support (already executed)

These scripts are kept for reference and should not be run again.

---

## Notes

- Scripts are for setup and maintenance, not runtime
- Always use environment variables for credentials
- Never commit credentials to version control
- For production setup, use DATABASE_URL environment variable (Heroku)
- For local development, use individual DB_* environment variables
