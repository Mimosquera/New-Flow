# Server Scripts

Utility scripts for database setup. These run once during environment setup, not at runtime.

---

## Active Scripts

### init-db.js

Creates the database if it does not exist. Run this first when setting up a new environment.

```bash
node scripts/init-db.js
```

### create-admin.js

Creates or updates the admin employee account. Pass credentials via environment variables.

```bash
ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="secure_password" node scripts/create-admin.js
```

Defaults are present for local development only. Do not use defaults in production.

### seeds.js

Populates the database with sample data. Clears existing data first. Development only.

```bash
node scripts/seeds.js
```

### run-migration.js

Runs pending schema migrations. Use this to apply database changes in production.

```bash
node scripts/run-migration.js
```

---

## Archived Scripts

`archive/` contains one-off scripts that have already been executed against production. They are kept for reference only and should not be run again.

- `sync-db.js` — early schema sync, superseded by migrations
- `test-login.js` — login verification for debugging
- `add-cloudinary-column.js` — added `cloudinary_id` to the updates table

---

## Notes

- Use `DATABASE_URL` for Heroku/production connections; individual `DB_*` vars for local development.
- Never commit credentials. Pass them via environment variables.
- Never run `seeds.js` in production — it destroys existing data.
