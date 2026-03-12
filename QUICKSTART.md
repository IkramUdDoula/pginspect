# pgInspect - Quick Start

Get pgInspect running in 4 simple steps.

## Prerequisites

- Node.js 18+ or Bun installed
- PostgreSQL 16+ installed locally
- Git

## Installation

### Step 1: Clone Repository

```bash
git clone <YOUR_GIT_URL>
cd pginspect
```

### Step 2: Install Dependencies

```bash
npm install
# OR
bun install
```

### Step 3: Configure Environment

```bash
# Copy environment file
cp .env.example .env
```

Edit `.env` and add your Clerk keys:

```env
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/pgadmin
```

**Get Clerk keys (free):**
1. Go to https://dashboard.clerk.com
2. Create an application
3. Copy the API keys

See [docs/SETUP.md](docs/SETUP.md) for detailed instructions.

### Step 4: Setup Database

```bash
# Create database
createdb pgadmin

# Run schema
psql -d pgadmin -f db/schema.sql
```

### Step 5: Start Application

```bash
npm run dev
# OR
bun run dev
```

That's it! Open http://localhost:9000

## What You Get

- **Application:** http://localhost:9000
- **API:** http://localhost:9000/api
- **PostgreSQL Database:** localhost:5432

## First Connection

Connect to your local database:

```
Host:     localhost
Port:     5432
Database: pgadmin
Username: postgres
Password: your_password
SSL Mode: disable
```

## Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

## Documentation

- [Setup Guide](docs/SETUP.md) - Detailed setup instructions
- [Deployment Guide](docs/DEPLOYMENT.md) - Deployment details
- [Features Guide](docs/FEATURES.md) - Feature documentation
- [Connections Guide](docs/CONNECTIONS.md) - Database connections
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues

## Support

Having issues? Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
