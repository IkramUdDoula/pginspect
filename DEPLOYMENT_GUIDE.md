# pgInspect Deployment Guide

Complete guide for deploying pgInspect from scratch.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Fresh Installation](#fresh-installation)
- [Database Schema](#database-schema)
- [Connecting to Databases](#connecting-to-databases)
- [Docker Commands](#docker-commands)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker and Docker Compose installed
- Git
- Clerk account ([sign up free](https://clerk.com))
- Text editor

## Fresh Installation

### Step 1: Clone Repository

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### Step 2: Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pgadmin
DB_POOL_MIN=2
DB_POOL_MAX=10

# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Security
CORS_ORIGIN=http://localhost:8080,http://localhost:3000
QUERY_TIMEOUT=30000
MAX_RESULT_ROWS=10000

# Features
ENABLE_QUERY_LOGGING=true
ENABLE_EXPLAIN=true

# Frontend (Vite)
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT=30000

# Clerk Authentication (get from https://dashboard.clerk.com)
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Encryption Key (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

**Get Clerk Keys:**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create new application
3. Enable Google and Microsoft OAuth
4. Copy keys from "API Keys" section

**Generate Encryption Key:**
```bash
# Mac/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Step 3: Start Docker Services

```bash
# Start database and app
docker-compose up -d

# Verify containers are running
docker ps
```

Expected output:
```
NAMES                  STATUS                 PORTS
pginspect-app-1        Up X minutes (healthy) 0.0.0.0:3000->3000/tcp
pginspect-database-1   Up X minutes (healthy) 0.0.0.0:5432->5432/tcp
```

### Step 4: Initialize Database

Run the database schema:

**Windows (PowerShell):**
```powershell
.\scripts\setup-database.ps1
```

**Mac/Linux:**
```bash
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

**Or manually:**
```bash
# Windows PowerShell
Get-Content db/schema.sql | docker exec -i pginspect-database-1 psql -U postgres -d pgadmin

# Mac/Linux
docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < db/schema.sql
```

### Step 5: Verify Installation

```bash
# Check database tables
docker exec pginspect-database-1 psql -U postgres -d pgadmin -c "\dt"
```

Expected output:
```
 Schema |       Name       | Type  |  Owner
--------+------------------+-------+----------
 public | user_connections | table | postgres
 public | users            | table | postgres
```

```bash
# Check API health
curl http://localhost:3000/api/health
```

Expected response:
```json
{"success":true,"data":{"status":"ok","uptime":123,...}}
```

### Step 6: Access Application

Open http://localhost:3000 in your browser

### Step 7: Sign In & Connect

1. Click "Get Started" or "Sign In"
2. Authenticate with Google or Microsoft
3. Create your first database connection

## Database Schema

The application uses two tables:

### `users` Table

Stores user information from Clerk authentication.

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,  -- Clerk user ID
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**How it works:**
- Automatically populated when users sign in
- Synced from Clerk on each authentication
- No manual data entry needed

### `user_connections` Table

Stores saved database connections per user.

```sql
CREATE TABLE user_connections (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,  -- References users(id)
  name VARCHAR(255) NOT NULL,
  host VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL DEFAULT 5432,
  database VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  password_encrypted TEXT NOT NULL,  -- AES-256-GCM encrypted
  ssl_mode VARCHAR(50) DEFAULT 'prefer',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```

**How it works:**
- Created when users add connections in UI
- Passwords encrypted before storage
- One connection name per user (unique constraint)

## Connecting to Databases

### Local Docker Database

When backend runs in Docker, use `host.docker.internal`:

**Connection String:**
```
postgresql://postgres:postgres@host.docker.internal:5432/pgadmin
```

**Direct Connection:**
```
Host: host.docker.internal
Port: 5432
Database: pgadmin
Username: postgres
Password: postgres
SSL Mode: disable
```

**Why `host.docker.internal`?**
- Backend runs inside Docker container
- `localhost` refers to container itself
- `host.docker.internal` reaches host machine
- `database` connects to Docker PostgreSQL service

### Cloud Databases

For Railway, Supabase, Neon, etc., use their provided connection strings with `sslmode=require`.

See [CONNECTION_GUIDE.md](./CONNECTION_GUIDE.md) for detailed cloud database setup.

## Docker Commands

### Basic Operations

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs (all services)
docker-compose logs -f

# View specific service logs
docker-compose logs app -f
docker-compose logs database -f
```

### Database Operations

```bash
# Access PostgreSQL shell
docker exec -it pginspect-database-1 psql -U postgres -d pgadmin

# Run SQL file
docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < your-file.sql

# Backup database
docker exec pginspect-database-1 pg_dump -U postgres pgadmin > backup.sql

# Restore database
docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < backup.sql
```

### Reset Database

**WARNING: This deletes all data!**

```bash
# Stop and remove volumes
docker-compose down -v

# Start services
docker-compose up -d

# Reinitialize database
.\scripts\setup-database.ps1  # Windows
./scripts\setup-database.sh   # Mac/Linux
```

### Container Management

```bash
# Check container status
docker ps

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# View container resource usage
docker stats

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a
```

## Production Deployment

### Step 1: Update Environment

Create `.env.production`:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@your-db-host:5432/dbname
PORT=3000
LOG_LEVEL=info

# Use production Clerk keys
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...

# Strong encryption key
ENCRYPTION_KEY=<generate-strong-random-key>

# Production CORS
CORS_ORIGIN=https://your-domain.com

# Security settings
QUERY_TIMEOUT=30000
MAX_RESULT_ROWS=10000
```

### Step 2: Deploy with Docker

```bash
# Build production image
docker-compose -f docker-compose.yml build

# Start services
docker-compose -f docker-compose.yml up -d
```

### Step 3: Initialize Production Database

```bash
# Connect to your production database
psql $DATABASE_URL < db/schema.sql

# Or if using Docker
docker exec -i your-db-container psql -U user -d dbname < db/schema.sql
```

### Step 4: Verify Deployment

```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Check database tables
psql $DATABASE_URL -c "\dt"
```

### Step 5: Configure Clerk for Production

1. Go to Clerk Dashboard
2. Update allowed origins:
   - Add `https://your-domain.com`
3. Update redirect URLs:
   - Sign-in: `https://your-domain.com/sign-in`
   - Sign-up: `https://your-domain.com/sign-up`
   - After sign-in: `https://your-domain.com/app`

## Troubleshooting

### Database Connection Failed

```bash
# Check if database is running
docker ps | grep database

# Check database logs
docker-compose logs database

# Test database connection
docker exec pginspect-database-1 pg_isready -U postgres

# Verify database exists
docker exec pginspect-database-1 psql -U postgres -l
```

### App Won't Start

```bash
# Check app logs
docker-compose logs app

# Check environment variables
docker exec pginspect-app-1 env | grep CLERK

# Restart app
docker-compose restart app
```

### Schema Not Created

```bash
# Check if schema file exists
ls -la db/schema.sql

# Manually run schema
docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < db/schema.sql

# Verify tables created
docker exec pginspect-database-1 psql -U postgres -d pgadmin -c "\dt"
```

### Users Not Syncing from Clerk

```bash
# Check app logs for auth errors
docker-compose logs app | grep -i "auth\|clerk\|user"

# Verify Clerk keys are set
docker exec pginspect-app-1 env | grep CLERK

# Test authentication
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/connections
```

### Port Already in Use

```bash
# Check what's using port 3000
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000

# Kill the process or change PORT in .env
```

## Additional Resources

- [README.md](../README.md) - Main documentation
- [CONNECTION_GUIDE.md](./CONNECTION_GUIDE.md) - Database connection details
- [AUTH_SETUP_GUIDE.md](./AUTH_SETUP_GUIDE.md) - Clerk authentication setup
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing instructions
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Review troubleshooting section above
3. Check documentation in `docs/` folder
4. Create GitHub issue with logs and error messages
