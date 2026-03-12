# Setup Guide

Complete guide for installing and configuring pgInspect.

## Prerequisites

- Node.js 18+ or [Bun](https://bun.sh) (recommended)
- Docker and Docker Compose
- Git
- Clerk account ([sign up free](https://clerk.com))

## Local Development Setup

### Step 1: Clone Repository

```bash
git clone <YOUR_GIT_URL>
cd pginspect
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

**Generate Encryption Key:**

```bash
# Mac/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Step 4: Start PostgreSQL Database

```bash
docker run --name pginspect-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pgadmin \
  -p 5432:5432 \
  -d postgres:15
```

### Step 5: Initialize Database

**Windows (PowerShell):**
```powershell
Get-Content db/schema.sql | docker exec -i pginspect-db psql -U postgres -d pgadmin
```

**Mac/Linux:**
```bash
docker exec -i pginspect-db psql -U postgres -d pgadmin < db/schema.sql
```

### Step 6: Verify Database

```bash
# Check tables were created
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

### Step 7: Start Development Servers

```bash
npm run dev
```

This starts:
- Frontend (Vite): http://localhost:8080
- Backend (Bun): http://localhost:3000

### Step 8: Access Application

Open http://localhost:8080 in your browser.

## Port Configuration

### Local Development

| Service | Port | URL |
|---------|------|-----|
| Frontend | 8080 | http://localhost:8080 |
| Backend | 3000 | http://localhost:3000 |
| Database | 5432 | localhost:5432 |

### Docker Deployment

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5000 | http://localhost:5000 |
| Backend | 9000 | http://localhost:9000 |
| Database | 5432 | localhost:5432 |

## Development Scripts

```bash
# Start both frontend and backend
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## Next Steps

1. **[Configure Authentication](AUTHENTICATION.md)** - Set up Clerk OAuth
2. **[Connect to Databases](CONNECTIONS.md)** - Add your first database connection
3. **[Explore Features](FEATURES.md)** - Learn about Visual Query Builder and Saved Views

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues and solutions.
