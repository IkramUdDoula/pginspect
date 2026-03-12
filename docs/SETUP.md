# Setup Guide

Complete setup instructions for pgInspect.

## Prerequisites

Before you begin, ensure you have:

- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop)
- **Git** - [Download here](https://git-scm.com/downloads)
- **Clerk Account** - [Sign up free](https://clerk.com)

## Step-by-Step Setup

### 1. Install Docker Desktop

1. Download Docker Desktop for your OS
2. Install and start Docker Desktop
3. Verify Docker is running:
   ```bash
   docker --version
   ```

### 2. Get Clerk Authentication Keys

pgInspect uses Clerk for secure authentication with Google and Microsoft OAuth.

#### Create Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Sign up or log in
3. Click "Add application"
4. Name it "pgInspect" (or any name you prefer)
5. Select authentication methods:
   - ✅ Email
   - ✅ Google
   - ✅ Microsoft
6. Click "Create application"

#### Get API Keys

After creating the application:

1. Go to **API Keys** in the left sidebar
2. Copy the keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

#### Configure Redirect URLs

1. Go to **Paths** in the left sidebar
2. Set the following URLs:
   - **Sign-in URL:** `/sign-in`
   - **Sign-up URL:** `/sign-up`
   - **After sign-in:** `/app`
   - **After sign-up:** `/app`

3. Go to **Domains** in the left sidebar
4. Add allowed origin:
   - `http://localhost:9000`

### 3. Clone Repository

```bash
git clone <YOUR_GIT_URL>
cd pginspect
```

### 4. Configure Environment

```bash
# Copy the example environment file
cp .env.docker.example .env.docker
```

Edit `.env.docker` and update the Clerk keys:

```env
# Replace with your Clerk keys
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

**Important:** Use the same publishable key for both `CLERK_PUBLISHABLE_KEY` and `VITE_CLERK_PUBLISHABLE_KEY`.

### 5. Deploy Application

Run the deployment script:

```bash
# Linux/Mac
bash scripts/deploy.sh

# Windows PowerShell
pwsh scripts/deploy.ps1
```

The script will:
- Check Docker is running
- Build Docker images
- Start all containers
- Initialize the database
- Display access URLs

### 6. Access Application

Open your browser and go to:
- **http://localhost:9000**

You should see the pgInspect landing page with "Sign In" button.

### 7. Sign In

1. Click "Sign In"
2. Choose authentication method:
   - Email
   - Google
   - Microsoft
3. Complete authentication
4. You'll be redirected to the dashboard

### 8. Connect to Database

Try connecting to the built-in database:

1. Click "New Connection"
2. Fill in the details:
   ```
   Name:     Local Database
   Host:     localhost
   Port:     5432
   Database: pgadmin
   Username: postgres
   Password: postgres
   SSL Mode: disable
   ```
3. Click "Save & Connect"

You should now see the database schema and can start querying!

## Environment File Explained

### Required Settings

```env
# Clerk Authentication - Get from https://dashboard.clerk.com
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Encryption Key - Used to encrypt database passwords
# Default is fine for development, generate new for production
ENCRYPTION_KEY=UEdJbnNwZWN0b3JFbmNyeXB0aW9uS2V5MjAyNFNlY3VyZVJhbmRvbUtleQ==
```

### Optional Settings

```env
# Database Connection (defaults work for Docker)
DATABASE_URL=postgresql://postgres:postgres@database:5432/pgadmin

# Server Configuration
PORT=9000                    # Backend API port
NODE_ENV=development         # Environment mode
LOG_LEVEL=debug             # Logging level

# Security
CORS_ORIGIN=http://localhost:9000
QUERY_TIMEOUT=30000         # Query timeout in ms
MAX_RESULT_ROWS=1000        # Max rows returned

# Frontend Configuration
VITE_PORT=5000              # Frontend port
VITE_API_URL=http://localhost:9000
VITE_API_TIMEOUT=30000
```

## Production Setup

For production deployment:

### 1. Use Production Clerk Keys

In Clerk Dashboard:
1. Switch to "Production" mode (top right)
2. Get production API keys (start with `pk_live_` and `sk_live_`)
3. Update allowed domains to your production domain

### 2. Generate Strong Encryption Key

```bash
openssl rand -base64 32
```

Copy the output and use it as `ENCRYPTION_KEY`.

### 3. Update Environment

```env
NODE_ENV=production
LOG_LEVEL=info
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
ENCRYPTION_KEY=<your-generated-key>
```

### 4. Configure Clerk for Production

1. Update allowed origins: `https://your-domain.com`
2. Update redirect URLs:
   - Sign-in: `https://your-domain.com/sign-in`
   - Sign-up: `https://your-domain.com/sign-up`
   - After sign-in: `https://your-domain.com/app`

### 5. Deploy

```bash
bash scripts/deploy.sh
```

## Verification

After setup, verify everything works:

### 1. Check Containers

```bash
docker-compose ps
```

You should see three containers running:
- `pginspect-app-1`
- `pginspect-database-1`

### 2. Check Logs

```bash
docker-compose logs -f
```

Look for:
- ✅ "Server running on port 9000"
- ✅ "Database connected"
- ✅ No error messages

### 3. Test Frontend

Open http://localhost:9000
- ✅ Page loads
- ✅ "Sign In" button visible
- ✅ No console errors

### 4. Test Backend

```bash
curl http://localhost:9000/api/health
```

Should return: `{"status":"ok"}`

### 5. Test Authentication

1. Click "Sign In"
2. Sign in with Google/Microsoft/Email
3. Should redirect to `/app`
4. Dashboard should load

### 6. Test Database Connection

1. Create a new connection to `localhost:5432`
2. Should connect successfully
3. Should see `pgadmin` database tables

## Troubleshooting

### Docker Not Running

**Error:** `Cannot connect to the Docker daemon`

**Solution:** Start Docker Desktop and wait for it to initialize.

### Port Already in Use

**Error:** `port is already allocated`

**Solution:** Change ports in `.env.docker`:
```env
PORT=9001
VITE_PORT=5001
```

### Clerk Authentication Failed

**Error:** `Clerk: Invalid publishable key`

**Solution:**
1. Verify keys are correct in `.env.docker`
2. Ensure no extra spaces or quotes
3. Restart containers: `docker-compose restart`

### Can't Connect to Database

**Error:** `Connection refused`

**Solution:**
1. Verify database container is running: `docker-compose ps`
2. Check logs: `docker-compose logs database`
3. Wait 10 seconds after startup for database to initialize

For more issues, see [Troubleshooting Guide](TROUBLESHOOTING.md).

## Next Steps

- [Deployment Guide](DEPLOYMENT.md) - Production deployment
- [Features Guide](FEATURES.md) - Learn about features
- [Connections Guide](CONNECTIONS.md) - Connect to cloud databases
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues

## Support

- **Documentation:** See [docs/](.) folder
- **Issues:** Create a GitHub issue
- **Logs:** Run `docker-compose logs -f`
