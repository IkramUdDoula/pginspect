# pgInspect - Quick Start

Get pgInspect running in 3 simple steps.

## Prerequisites

- Docker Desktop installed and running
- Git

## Installation

### Step 1: Clone Repository

```bash
git clone <YOUR_GIT_URL>
cd pginspect
```

### Step 2: Configure Environment

```bash
# Copy environment file
cp .env.docker.example .env.docker
```

Edit `.env.docker` and add your Clerk keys:

```env
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

**Get Clerk keys (free):**
1. Go to https://dashboard.clerk.com
2. Create an application
3. Copy the API keys

See [docs/SETUP.md](docs/SETUP.md) for detailed instructions.

### Step 3: Deploy

```bash
# Linux/Mac
bash scripts/deploy.sh

# Windows
pwsh scripts/deploy.ps1
```

That's it! Open http://localhost:5000

## What You Get

- **Frontend:** http://localhost:5000
- **Backend API:** http://localhost:9000
- **PostgreSQL Database:** localhost:5432

## First Connection

Connect to the built-in database:

```
Host:     localhost
Port:     5432
Database: pgadmin
Username: postgres
Password: postgres
SSL Mode: disable
```

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop application
docker-compose down

# Restart application
docker-compose restart
```

## Documentation

- [Setup Guide](docs/SETUP.md) - Detailed setup instructions
- [Deployment Guide](docs/DEPLOYMENT.md) - Deployment details
- [Features Guide](docs/FEATURES.md) - Feature documentation
- [Connections Guide](docs/CONNECTIONS.md) - Database connections
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues

## Support

Having issues? Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
