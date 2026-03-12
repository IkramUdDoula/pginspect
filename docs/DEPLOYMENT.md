# Deployment Guide

Complete guide for deploying pgInspect with Docker.

## Prerequisites

- Docker Desktop installed and running
- Git (to clone the repository)
- Clerk account (free) for authentication

## Quick Deployment

### Step 1: Clone Repository

```bash
git clone <YOUR_GIT_URL>
cd pginspect
```

### Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.docker.example .env.docker
```

Edit `.env.docker` and update the Clerk keys:

```env
# Get these from https://dashboard.clerk.com
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

See [Setup Guide](SETUP.md) for detailed instructions on getting Clerk keys.

### Step 3: Deploy

Run the deployment script:

```bash
# Linux/Mac
bash scripts/deploy.sh

# Windows
pwsh scripts/deploy.ps1
```

The script will:
1. ✅ Check Docker is running
2. ✅ Verify environment file exists
3. 🛑 Stop any existing containers
4. 🔨 Build Docker images
5. 🚀 Start all containers
6. ⏳ Wait for database initialization
7. ✅ Confirm deployment success

### Step 4: Access Application

Open your browser:
- **Application:** http://localhost:9000
- **API:** http://localhost:9000/api
- **Database:** localhost:5432

## What Gets Deployed

The deployment creates three services:

1. **Frontend** (Port 5000)
   - React application with Vite
   - Modern UI with dark/light theme
   - Visual query builder and SQL editor

2. **Backend** (Port 9000)
   - Bun/Node.js API server
   - Handles authentication and queries
   - Manages encrypted connections

3. **Database** (Port 5432)
   - PostgreSQL 16
   - Stores users, connections, and saved views
   - Automatically initialized with schema

## Environment Variables

### Required Variables

```env
# Clerk Authentication (REQUIRED)
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Encryption Key (auto-generated, don't change)
ENCRYPTION_KEY=UEdJbnNwZWN0b3JFbmNyeXB0aW9uS2V5MjAyNFNlY3VyZVJhbmRvbUtleQ==
```

### Optional Variables

```env
# Database (defaults work for Docker)
DATABASE_URL=postgresql://postgres:postgres@database:5432/pgadmin

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
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app
docker-compose logs -f database

# Stop application
docker-compose down

# Restart application
docker-compose restart

# View running containers
docker-compose ps

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Access database directly
docker exec -it pginspect-database-1 psql -U postgres -d pgadmin
```

## Database Schema

The database is automatically initialized with three tables:

- **users** - Clerk user information
- **user_connections** - Saved database connections (encrypted passwords)
- **saved_views** - User-created saved queries

Schema is applied automatically via `docker-entrypoint-initdb.d` on first startup.

## Connecting to Databases

### Built-in Database

After deployment, you can connect to the built-in PostgreSQL database:

```
Host:     localhost
Port:     5432
Database: pgadmin
Username: postgres
Password: postgres
SSL Mode: disable
```

### External Databases

You can connect to any PostgreSQL database:
- Local databases on your machine
- Cloud databases (Supabase, Neon, AWS RDS, etc.)
- Other Docker containers

See [Connections Guide](CONNECTIONS.md) for detailed examples.

## Production Deployment

For production use:

1. **Update Clerk to Production Keys**
   ```env
   CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
   ```

2. **Generate Strong Encryption Key**
   ```bash
   openssl rand -base64 32
   ```

3. **Update Environment**
   ```env
   NODE_ENV=production
   LOG_LEVEL=info
   ```

4. **Configure Clerk Dashboard**
   - Update allowed origins
   - Update redirect URLs
   - Enable production mode

5. **Deploy**
   ```bash
   bash scripts/deploy.sh
   ```

## Troubleshooting

### Docker Not Running

```
❌ Error: Docker is not running
```

**Solution:** Start Docker Desktop and wait for it to fully initialize.

### Port Already in Use

```
Error: port is already allocated
```

**Solution:** Stop the service using the port or change ports in `.env.docker`:
```env
PORT=9001  # Backend
VITE_PORT=5001  # Frontend
```

### Environment File Missing

```
❌ Error: .env.docker file not found
```

**Solution:** Copy the example file:
```bash
cp .env.docker.example .env.docker
```

### Containers Failed to Start

```
❌ Error: Containers failed to start
```

**Solution:** Check logs for errors:
```bash
docker-compose logs
```

Common causes:
- Missing or invalid Clerk keys
- Port conflicts
- Docker resource limits

For more issues, see [Troubleshooting Guide](TROUBLESHOOTING.md).

## Support

- **Documentation:** See [docs/](.) folder
- **Issues:** Create a GitHub issue
- **Logs:** Run `docker-compose logs -f`
