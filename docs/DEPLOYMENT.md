# Deployment Guide

Complete guide for deploying pgInspect locally and to production.

## Prerequisites

- Node.js 18+ or Bun installed
- PostgreSQL 16+ installed
- Git (to clone the repository)
- Clerk account (free) for authentication

## Local Development Deployment

### Step 1: Clone Repository

```bash
git clone https://github.com/ikramuddoula/pginspect
cd pginspect
```

### Step 2: Install Dependencies

```bash
npm install
# OR
bun install
```

### Step 3: Setup Database

```bash
# Create database
createdb pgadmin

# Apply schema
psql -d pgadmin -f db/schema.sql
```

### Step 4: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and update the Clerk keys and database URL:

```env
# Get these from https://dashboard.clerk.com
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Your local PostgreSQL connection
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/pgadmin
```

See [Setup Guide](SETUP.md) for detailed instructions on getting Clerk keys.

### Step 5: Start Application

```bash
# Development mode (with hot reload)
npm run dev
# OR
bun run dev
```

### Step 6: Access Application

Open your browser:
- **Application:** http://localhost:9000
- **API:** http://localhost:9000/api

## What Gets Deployed

The application runs as a single process that serves:

1. **Frontend** (React/Vite)
   - Modern UI with dark/light theme
   - Visual query builder and SQL editor
   - Served from the built dist folder

2. **Backend** (Bun/Node.js API)
   - Handles authentication and queries
   - Manages encrypted connections
   - REST API endpoints

3. **Database** (PostgreSQL)
   - Stores users, connections, and saved views
   - Must be running separately

## Environment Variables

### Required Variables

```env
# Clerk Authentication (REQUIRED)
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Database Connection (REQUIRED)
DATABASE_URL=postgresql://user:password@host:5432/database

# Encryption Key (auto-generated, don't change)
ENCRYPTION_KEY=UEdJbnNwZWN0b3JFbmNyeXB0aW9uS2V5MjAyNFNlY3VyZVJhbmRvbUtleQ==
```

### Optional Variables

```env
# Server Configuration
PORT=9000
NODE_ENV=development
LOG_LEVEL=debug

# Security
CORS_ORIGIN=http://localhost:9000
QUERY_TIMEOUT=30000
MAX_RESULT_ROWS=1000

# Frontend
VITE_PORT=5000
VITE_API_URL=http://localhost:9000
VITE_API_TIMEOUT=30000
```

## Useful Commands

```bash
# Development mode (hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

## Database Schema

The database must have three tables:

- **users** - Clerk user information
- **user_connections** - Saved database connections (encrypted passwords)
- **saved_views** - User-created saved queries

Apply the schema:

```bash
psql -d pgadmin -f db/schema.sql
```

## Connecting to Databases

### Local Database

Connect to your local PostgreSQL:

```
Host:     localhost
Port:     5432
Database: pgadmin
Username: postgres
Password: your_password
SSL Mode: disable
```

### External Databases

You can connect to any PostgreSQL database:
- Cloud databases (Supabase, Neon, AWS RDS, etc.)
- Remote servers
- Other local databases

See [Connections Guide](CONNECTIONS.md) for detailed examples.

## Production Deployment

For production use:

### 1. Update Clerk to Production Keys

```env
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

### 2. Generate Strong Encryption Key

```bash
openssl rand -base64 32
```

### 3. Update Environment

```env
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=postgresql://user:password@production-host:5432/database
ENCRYPTION_KEY=<your-generated-key>
CORS_ORIGIN=https://your-domain.com
```

### 4. Configure Clerk Dashboard

- Update allowed origins to your production domain
- Update redirect URLs to production URLs
- Enable production mode

### 5. Build and Deploy

```bash
# Build the application
npm run build

# Start production server
npm start
```

### 6. Use a Process Manager

For production, use a process manager like PM2:

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "pginspect" -- start

# Save PM2 configuration
pm2 save

# Setup auto-restart on system reboot
pm2 startup
```

### 7. Setup Reverse Proxy (Optional)

Use Nginx or Apache as a reverse proxy:

**Nginx example:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Cloud Deployment Options

### Deploy to Railway

1. Create a new project on [Railway](https://railway.app)
2. Add PostgreSQL database service
3. Add environment variables
4. Deploy from GitHub repository

### Deploy to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Add PostgreSQL database
4. Set environment variables
5. Deploy

### Deploy to Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set CLERK_PUBLISHABLE_KEY=pk_live_...
heroku config:set CLERK_SECRET_KEY=sk_live_...
heroku config:set VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
heroku config:set ENCRYPTION_KEY=<your-key>

# Deploy
git push heroku main
```

### Deploy to VPS (DigitalOcean, Linode, etc.)

1. SSH into your server
2. Install Node.js and PostgreSQL
3. Clone repository
4. Install dependencies
5. Setup environment variables
6. Build application
7. Use PM2 to run the server
8. Setup Nginx as reverse proxy
9. Configure SSL with Let's Encrypt

## Troubleshooting

### Server Won't Start

**Solution:** Check logs for errors:
```bash
# Check terminal output
# Look for port conflicts, missing dependencies, or configuration errors
```

### Port Conflicts

**Solution:** Change port in `.env`:
```env
PORT=9001
```

### Database Connection Issues

**Solution:**
1. Verify PostgreSQL is running
2. Check DATABASE_URL is correct
3. Ensure database exists and schema is applied
4. Check firewall rules if connecting to remote database

### Build Failures

**Solution:**
```bash
# Clean install
rm -rf node_modules dist
npm install
npm run build
```

For more issues, see [Troubleshooting Guide](TROUBLESHOOTING.md).

## Performance Optimization

### 1. Enable Production Mode

```env
NODE_ENV=production
```

### 2. Optimize Database Connection Pool

```env
DB_POOL_MIN=5
DB_POOL_MAX=20
```

### 3. Enable Compression

The server automatically enables gzip compression in production mode.

### 4. Use CDN for Static Assets

Configure your reverse proxy to cache static assets.

### 5. Monitor Performance

- Use application logs to track query performance
- Monitor database connection pool usage
- Track API response times

## Security Best Practices

1. **Use HTTPS in production**
   - Configure SSL certificate
   - Redirect HTTP to HTTPS

2. **Secure environment variables**
   - Never commit `.env` to git
   - Use secrets management in production

3. **Update dependencies regularly**
   ```bash
   npm audit
   npm update
   ```

4. **Enable rate limiting**
   - Configure rate limits in production
   - Protect against brute force attacks

5. **Regular backups**
   ```bash
   pg_dump -U postgres pgadmin > backup.sql
   ```

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:9000/api/health
```

Returns: `{"status":"ok"}`

### Application Logs

Logs are written to stdout. In production, redirect to a file:

```bash
npm start > app.log 2>&1
```

Or use PM2:

```bash
pm2 logs pginspect
```

## Support

- [Setup Guide](SETUP.md) - Initial setup
- [Features Guide](FEATURES.md) - Feature documentation
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues
