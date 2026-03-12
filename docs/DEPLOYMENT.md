# Deployment Guide

Quick reference for deploying pgInspect. For detailed guides, see the [docs/](docs/) folder.

## Quick Links

- **[Setup Guide](docs/SETUP.md)** - Complete installation and configuration
- **[Docker Guide](docs/DOCKER.md)** - Docker deployment and commands
- **[Authentication](docs/AUTHENTICATION.md)** - Clerk setup
- **[Connections](docs/CONNECTIONS.md)** - Database connection guide
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues

## Local Development (Recommended)

```bash
# 1. Clone and install
git clone <YOUR_GIT_URL>
cd pginspect
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Clerk keys

# 3. Start PostgreSQL
docker run --name pginspect-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pgadmin \
  -p 5432:5432 \
  -d postgres:15

# 4. Initialize database
docker exec -i pginspect-db psql -U postgres -d pgadmin < db/schema.sql

# 5. Start development servers
npm run dev

# 6. Open http://localhost:8080
```

**Ports:**
- Frontend: 8080
- Backend: 3000
- Database: 5432

## Docker Deployment

```bash
# 1. Clone and configure
git clone <YOUR_GIT_URL>
cd pginspect
cp .env.docker.example .env.docker
# Edit .env.docker with your configuration

# 2. Start all services
docker-compose up -d

# 3. Initialize database
docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < db/schema.sql

# 4. Open http://localhost:5000
```

**Ports:**
- Frontend: 5000
- Backend: 9000
- Database: 5432

## Environment Variables

### Required

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pgadmin

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Encryption (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=your-32-character-key
```

### Optional

```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:8080
QUERY_TIMEOUT=30000
MAX_RESULT_ROWS=10000
```

## Database Schema

The application uses three main tables:

- **users** - Clerk user information
- **user_connections** - Saved database connections (encrypted passwords)
- **saved_views** - User-created saved queries

Initialize with:
```bash
docker exec -i pginspect-db psql -U postgres -d pgadmin < db/schema.sql
```

## Production Deployment

### Step 1: Update Environment

Create `.env.production`:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@your-db-host:5432/dbname
LOG_LEVEL=info

# Production Clerk keys
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...

# Strong encryption key
ENCRYPTION_KEY=<generate-strong-random-key>

# Production CORS
CORS_ORIGIN=https://your-domain.com
```

### Step 2: Configure Clerk

1. Go to Clerk Dashboard
2. Update allowed origins: `https://your-domain.com`
3. Update redirect URLs:
   - Sign-in: `https://your-domain.com/sign-in`
   - Sign-up: `https://your-domain.com/sign-up`
   - After sign-in: `https://your-domain.com/app`

### Step 3: Deploy

**Docker:**
```bash
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up -d
```

### Step 4: Initialize Database

```bash
# Connect to production database
psql $DATABASE_URL < db/schema.sql
```

### Step 5: Verify

```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Check database tables
psql $DATABASE_URL -c "\dt"
```

## Connection Examples

### Local Docker Database

**When backend runs locally:**
```
Host: localhost
Port: 5432
Database: pgadmin
Username: postgres
Password: postgres
SSL Mode: disable
```

**When backend runs in Docker:**
```
Host: database
Port: 5432
Database: pgadmin
Username: postgres
Password: postgres
SSL Mode: disable
```

### Supabase Database

```
Host: aws-0-[region].pooler.supabase.com
Port: 6543
Database: postgres
Username: postgres.[your-ref]
Password: <your-password>
SSL Mode: require
```

**Important:** Use Transaction Pooler (port 6543), not direct connection.

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check port 3000 is available
- Verify `.env` file exists
- Check Clerk keys are set

**Frontend can't connect:**
- Verify backend is running: `curl http://localhost:3000/api/health`
- Check CORS_ORIGIN includes frontend URL

**Database connection failed:**
- Check PostgreSQL is running: `docker ps`
- Verify connection string in `.env`
- Test connection: `docker exec -it pginspect-db psql -U postgres -d pgadmin`

**Users not syncing:**
- Check database tables exist: `docker exec pginspect-db psql -U postgres -d pgadmin -c "\dt"`
- Reinitialize schema if needed

For detailed troubleshooting, see [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

## Additional Resources

- **[Setup Guide](docs/SETUP.md)** - Detailed installation steps
- **[Docker Guide](docs/DOCKER.md)** - Docker commands and configuration
- **[Authentication](docs/AUTHENTICATION.md)** - Clerk setup guide
- **[Connections](docs/CONNECTIONS.md)** - Database connection examples
- **[Features](docs/FEATURES.md)** - Feature documentation
- **[API Reference](docs/API.md)** - Backend API endpoints
- **[Architecture](docs/ARCHITECTURE.md)** - Technical details
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## Support

For issues:
1. Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
2. Review relevant documentation
3. Check logs: `docker-compose logs -f`
4. Create GitHub issue with error details
