# Railway Deployment Guide

Complete guide for deploying this application to Railway with automatic GitHub integration.

## Architecture

Your Railway project will have:
- **PostgreSQL Database** - Managed by Railway with SSL
- **Web Application** - Node.js/Bun app serving both API and frontend

## Prerequisites

- Railway account ([railway.app](https://railway.app))
- GitHub repository with your code
- Clerk account for authentication ([clerk.com](https://clerk.com))

## Step-by-Step Deployment

### 1. Create Railway Project

1. Log in to [Railway Dashboard](https://railway.app/dashboard)
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Connect your GitHub account (if not already connected)
5. Select your repository
6. Railway will detect the Dockerfile and begin setup

> Note: Initial deployment will fail - this is expected. We need to configure services first.

### 2. Add PostgreSQL Database

1. In your project canvas, click **+ New**
2. Select **Database** → **Add PostgreSQL**
3. Railway provisions a managed Postgres instance with SSL
4. The database appears with a `postgres-volume` for persistence

### 3. Configure Environment Variables

Click on your **web service** → **Variables** tab and add:

#### Required Variables

```bash
# Database (auto-referenced from Postgres service)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Server
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Security
CORS_ORIGIN=https://${{RAILWAY_PUBLIC_DOMAIN}}
QUERY_TIMEOUT=30000
MAX_RESULT_ROWS=1000

# Clerk Authentication (from dashboard.clerk.com)
CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# Encryption (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=your-generated-32-char-key

# Features
ENABLE_QUERY_LOGGING=false
ENABLE_EXPLAIN=true
```

#### Build Arguments (for frontend)

In the **Settings** tab → **Build** section, add:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
VITE_API_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
VITE_API_TIMEOUT=30000
```

### 4. Railway Variable References

Railway's `${{SERVICE.VARIABLE}}` syntax automatically injects values:

- `${{Postgres.DATABASE_URL}}` - Database connection string
- `${{RAILWAY_PUBLIC_DOMAIN}}` - Your app's public URL

This ensures your services always have correct connection info.

### 5. Database Schema Migration

The schema is applied automatically on first deploy via:
- `railway.toml` defines a migration command
- `scripts/migrate.ts` runs `db/schema.sql`
- Migrations run before the app starts

You can verify in the deployment logs:
```
🚀 Starting database migration...
📄 Applying schema from db/schema.sql...
✅ Migration completed successfully!
📊 Created 3 tables:
   - users
   - user_connections
   - saved_views
```

### 6. Deploy

1. Push your code to GitHub
2. Railway automatically detects the push
3. Builds using your Dockerfile
4. Runs migrations
5. Starts the application

Monitor progress in **Deployments** tab.

### 7. Get Your App URL

1. Go to **Settings** tab
2. Under **Networking**, click **Generate Domain**
3. Railway provides: `https://your-app.up.railway.app`
4. Or add a custom domain

### 8. Configure Clerk Webhooks (Optional)

If using Clerk webhooks for user sync:

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-app.up.railway.app/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`
4. Copy signing secret to Railway variables as `CLERK_WEBHOOK_SECRET`

## Automatic Deployments

Railway auto-deploys when you push to your connected branch:

1. Push to GitHub
2. Railway detects changes
3. Builds and deploys automatically
4. Zero downtime deployment

Configure in **Settings** → **Source** → **Deploy Triggers**

## Monitoring

Railway provides built-in monitoring:

- **Deployments**: View history and status
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, network usage
- **Observability**: Performance monitoring

## Database Management

### Connect to Database

Get connection details from Postgres service → **Connect** tab:

```bash
# Using psql
psql ${{Postgres.DATABASE_URL}}

# Using GUI tools (TablePlus, pgAdmin, etc.)
Host: your-db.railway.internal
Port: 5432
Database: railway
User: postgres
Password: [from variables]
```

### Run Manual Migrations

```bash
# From your local machine
export DATABASE_URL="postgresql://..."
bun run migrate
```

### Backup Database

Railway provides automatic backups. Manual backup:

```bash
pg_dump ${{Postgres.DATABASE_URL}} > backup.sql
```

## Troubleshooting

### Build Fails

Check **Deployments** → **Build Logs**:
- Verify all environment variables are set
- Check Dockerfile syntax
- Ensure dependencies install correctly

### Database Connection Issues

- Verify `DATABASE_URL` uses `${{Postgres.DATABASE_URL}}`
- Check Postgres service is **Online**
- Use private networking URL (Railway handles this automatically)

### Migration Fails

View logs in deployment:
- Check `db/schema.sql` syntax
- Verify DATABASE_URL is available during build
- Ensure `scripts/migrate.ts` has correct permissions

### App Won't Start

- Check health check endpoint `/api/health` works
- Verify PORT environment variable (Railway sets this)
- Review application logs for errors

## Pricing

Railway uses usage-based pricing:

- **Hobby Plan**: $5/month (includes $5 credits)
  - Good for development/low-traffic apps
  - Apps may sleep after inactivity
  
- **Pro Plan**: $20/month (includes $20 credits)
  - No sleep behavior
  - Team features
  - Priority support

Typical costs for this app: $5-15/month

See [Railway Pricing](https://railway.app/pricing)

## Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database migrations completed successfully
- [ ] Health check endpoint responding
- [ ] Clerk authentication configured
- [ ] CORS origins set correctly
- [ ] Custom domain configured (optional)
- [ ] SSL enabled (automatic with Railway)
- [ ] Monitoring and alerts configured
- [ ] Backup strategy in place

## Additional Resources

- [Railway Documentation](https://docs.railway.com)
- [Railway PostgreSQL Guide](https://docs.railway.com/guides/postgresql)
- [Railway Variables Reference](https://docs.railway.com/reference/variables)
- [Clerk Documentation](https://clerk.com/docs)

## Support

- Railway: [help.railway.app](https://help.railway.app)
- Project Issues: [GitHub Issues](your-repo/issues)
