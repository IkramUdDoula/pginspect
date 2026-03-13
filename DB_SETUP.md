# Database Setup Guide

This guide helps administrators initialize the pgInspect database after deployment.

## Automatic Setup (Docker)

When using Docker Compose, the schema is **automatically applied** on first startup:

```bash
docker-compose up -d
```

The schema file is mounted at `/docker-entrypoint-initdb.d/01-schema.sql` and runs automatically when the database container is created for the first time.

## Manual Setup Options

### Option 1: Using npm script (Recommended)

This works for both local and Railway deployments:

```bash
npm run db:init
```

This script:
- Connects using `DATABASE_URL` or `DATABASE_PUBLIC_URL` environment variable
- Creates all tables with `IF NOT EXISTS` (safe to run multiple times)
- Verifies all tables were created successfully
- Shows detailed progress and error messages

### Option 2: Railway CLI

If deploying on Railway:

```bash
# Link to your Railway project (first time only)
railway link

# Run the schema initialization
railway run node scripts/run-schema.js
```

### Option 3: Direct Docker exec

If using Docker Compose locally:

```bash
npm run db:init:docker
```

Or manually:

```bash
docker exec -i pginspect-db psql -U postgres -d pgadmin < db/schema.sql
```

### Option 4: Direct PostgreSQL connection

If you have `psql` installed:

```bash
psql $DATABASE_URL -f db/schema.sql
```

## Environment Variables Required

The initialization script needs one of these environment variables:

- `DATABASE_PUBLIC_URL` (Railway provides this)
- `DATABASE_URL` (fallback)

Example format:
```
DATABASE_URL=postgresql://postgres:password@host:5432/pgadmin
```

## What Gets Created

The schema creates these tables:

1. **users** - User accounts synced from Clerk authentication
2. **user_connections** - Database connections per user (encrypted passwords)
3. **saved_views** - User-created saved queries and views
4. **audit_logs** - Comprehensive audit trail of all activities

Plus indexes, triggers, and functions for automatic timestamp updates.

## Verification

After running the script, you should see:

```
✓ Schema executed successfully!

Verifying database tables...

Database tables:
  ✓ audit_logs
  ✓ saved_views
  ✓ user_connections
  ✓ users

✓ All 4 tables verified successfully!
✓ Database migration complete!
```

## Troubleshooting

### "already exists" errors

This is normal! The script uses `IF NOT EXISTS` clauses, so it's safe to run multiple times. The script will show:

```
✓ Schema objects already exist (this is normal for updates)
```

### Connection errors

Check that:
- Database is running (`docker-compose ps` or Railway dashboard)
- `DATABASE_URL` environment variable is set correctly
- Database credentials are correct
- Network connectivity to database host

### SSL errors

The script uses `ssl: { rejectUnauthorized: false }` for Railway compatibility. If you need stricter SSL:

Edit `scripts/run-schema.js` and change:
```javascript
ssl: { rejectUnauthorized: true }
```

## Railway-Specific Notes

1. Railway automatically provides `DATABASE_URL` when you add PostgreSQL
2. Use `DATABASE_PUBLIC_URL` for external connections
3. Run the script after first deployment:
   ```bash
   railway run node scripts/run-schema.js
   ```
4. The script output appears in your terminal, not Railway logs

## Docker-Specific Notes

1. Schema runs automatically on first `docker-compose up`
2. To re-run manually: `npm run db:init:docker`
3. To reset database completely:
   ```bash
   docker-compose down -v  # Removes volumes
   docker-compose up -d    # Recreates with fresh schema
   ```

## Security Notes

- Passwords in `user_connections` table are encrypted with AES-256-GCM
- Requires `ENCRYPTION_KEY` environment variable (32+ characters)
- Generate key: `openssl rand -base64 32`
- Audit logs track all database operations for compliance
