# Docker Quick Start Guide

Get pgInspect running with Docker in 5 minutes.

## Prerequisites

- Docker Desktop installed ([Download](https://docs.docker.com/get-docker/))
- Docker Compose installed (included with Docker Desktop)

## Step 1: Clone Repository

```bash
git clone https://github.com/ikramuddoula/pginspect
cd pginspect
```

## Step 2: Configure Environment

```bash
# Copy the template
cp .env.docker .env.docker.local
```

Edit `.env.docker.local` and update these required values:

```env
# Get from https://dashboard.clerk.com
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Generate with: openssl rand -base64 32
ENCRYPTION_KEY=your-generated-key-here
```

## Step 3: Start Application

```bash
# Using Docker Compose
docker-compose --env-file .env.docker.local up -d

# Or using the setup script
bash scripts/docker-setup.sh  # Linux/Mac
# OR
.\scripts\docker-setup.ps1    # Windows

# Or using npm
npm run docker:up
```

Access at: **http://localhost:3000**

## Step 4: Create Your First Connection

1. Open http://localhost:3000
2. Sign in with Google or Microsoft
3. Click "New Connection"
4. Enter connection details:
   ```
   Name:     My Database
   Host:     your-db-host
   Port:     5432
   Database: your-db-name
   Username: your-username
   Password: your-password
   SSL Mode: prefer
   ```
5. Click "Test Connection" then "Save"

## Common Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Rebuild after code changes
docker-compose build --no-cache
docker-compose up -d

# View running containers
docker-compose ps

# Access database CLI
docker-compose exec database psql -U postgres -d pgadmin
```

## Troubleshooting

### Port Already in Use

Edit `.env.docker.local`:
```env
APP_PORT=3001
```

Then restart:
```bash
docker-compose down
docker-compose --env-file .env.docker.local up -d
```

### Can't Connect to Database

Check database is running:
```bash
docker-compose ps database
```

View database logs:
```bash
docker-compose logs database
```

### Authentication Errors

1. Verify Clerk keys in `.env.docker.local`
2. Check Clerk Dashboard settings
3. Restart application:
   ```bash
   docker-compose restart app
   ```

## Next Steps

- Read the [Full Docker Guide](DOCKER.md)
- Check [Features Documentation](docs/FEATURES.md)
- Learn about [Connections](docs/CONNECTIONS.md)

## Need Help?

- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [Setup Guide](docs/SETUP.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
