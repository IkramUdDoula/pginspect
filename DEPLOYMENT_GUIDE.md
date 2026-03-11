# pgInspect Deployment Guide

Complete guide for deploying pgInspect from scratch.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup (Native)](#development-setup-native)
- [Docker Deployment](#docker-deployment)
- [Database Schema](#database-schema)
- [Connecting to Databases](#connecting-to-databases)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ or [Bun](https://bun.sh) (recommended)
- Docker and Docker Compose
- Git
- Clerk account ([sign up free](https://clerk.com))
- Text editor

## Development Setup (Native)

**Recommended for development** - runs frontend and backend natively with hot reload.

### Step 1: Clone Repository

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### Step 2: Install Dependencies

```bash
npm install
# or
bun install
```

### Step 3: Configure Environment

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
LOG_LEVEL=debug

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

### Step 4: Start PostgreSQL Database

```bash
# Start PostgreSQL in Docker
docker run --name pginspect-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pgadmin \
  -p 5432:5432 \
  -d postgres:15
```

### Step 5: Initialize Database

Run the database schema:

**Windows (PowerShell):**
```powershell
Get-Content db/schema.sql | docker exec -i pginspect-db psql -U postgres -d pgadmin
```

**Mac/Linux:**
```bash
docker exec -i pginspect-db psql -U postgres -d pgadmin < db/schema.sql
```

### Step 6: Start Development Servers

```bash
# Start both frontend and backend with hot reload
npm run dev

# This starts:
# - Frontend (Vite): http://localhost:8080
# - Backend (Bun): http://localhost:3000
```

### Step 7: Verify Installation

```bash
# Check database tables
docker exec pginspect-db psql -U postgres -d pgadmin -c "\dt"
```

Expected output:
```
 Schema |       Name       | Type  |  Owner
--------+------------------+-------+----------
 public | saved_views      | table | postgres
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

### Step 8: Access Application

Open http://localhost:8080 in your browser

### Step 9: Sign In & Connect

1. Click "Get Started" or "Sign In"
2. Authenticate with Google or Microsoft
3. Create your first database connection using:
   ```
   Host: localhost
   Port: 5432
   Database: pgadmin
   Username: postgres
   Password: postgres
   SSL Mode: disable
   ```
4. Start querying and saving views

## Docker Deployment

**Recommended for production** - runs everything in containers.

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

Edit `.env` with your values (same as above, but note the DATABASE_URL difference):

```env
# Database Configuration (Docker internal network)
DATABASE_URL=postgresql://postgres:postgres@database:5432/pgadmin

# ... rest of configuration same as native setup
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

### Step 5: Access Application

Open http://localhost:3000 in your browser

### Step 6: Sign In & Connect

1. Click "Get Started" or "Sign In"
2. Authenticate with Google or Microsoft
3. Create your first database connection using:
   ```
   Host: database          ← IMPORTANT: Use "database" not "localhost"
   Port: 5432
   Database: pgadmin
   Username: postgres
   Password: postgres
   SSL Mode: disable
   ```
4. Start querying and saving views

## Port Configuration

### Native Development

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **Frontend** | `8080` | `http://localhost:8080` | React app (Vite dev server) |
| **Backend** | `3000` | `http://localhost:3000` | API server (Bun with hot reload) |
| **Database** | `5432` | `localhost:5432` | PostgreSQL (Docker container) |

### Docker Deployment

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **Application** | `3000` | `http://localhost:3000` | Full app (frontend + backend) |
| **Database** | `5432` | `localhost:5432` | PostgreSQL container |

## Database Schema

The application uses three main tables:

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

### `saved_views` Table

Stores user-created saved views with query metadata.

```sql
CREATE TABLE saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,  -- References users(id)
  connection_id INTEGER NOT NULL,  -- References user_connections(id)
  schema_name VARCHAR(255) NOT NULL,
  view_name VARCHAR(255) NOT NULL,
  description TEXT,
  query_text TEXT NOT NULL,
  query_type VARCHAR(20) NOT NULL CHECK (query_type IN ('sql', 'visual')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (connection_id) REFERENCES user_connections(id) ON DELETE CASCADE,
  UNIQUE(user_id, connection_id, view_name)
);
```

**How it works:**
- Created when users save queries as views
- Stores complete query text and metadata
- Unique view names per user per connection
- Supports both SQL and Visual query types
- Automatic cleanup when users or connections are deleted

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

**Important**: The database schema has been updated to include the new Saved Views feature. Make sure to run the latest schema:

```bash
# Connect to your production database
psql $DATABASE_URL < db/schema.sql

# Or if using Docker
docker exec -i your-db-container psql -U user -d dbname < db/schema.sql
```

**For existing deployments**: The schema includes proper migration handling with `CREATE TABLE IF NOT EXISTS`, so running the updated schema on existing databases is safe.

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

# Manually run schema (includes new saved_views table)
docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < db/schema.sql

# Verify tables created (should include saved_views)
docker exec pginspect-database-1 psql -U postgres -d pgadmin -c "\dt"

# Expected tables: users, user_connections, saved_views
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
