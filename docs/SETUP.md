# Setup Guide

Complete setup instructions for pgInspect.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** or **Bun** - [Download Node.js](https://nodejs.org/) or [Download Bun](https://bun.sh/)
- **PostgreSQL 16+** - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/downloads)
- **Clerk Account** - [Sign up free](https://clerk.com)

## Step-by-Step Setup

### 1. Install Prerequisites

#### Install Node.js or Bun

Choose one:

**Node.js:**
```bash
# Verify installation
node --version  # Should be 18+
npm --version
```

**Bun (recommended for faster performance):**
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

#### Install PostgreSQL

1. Download PostgreSQL 16+ for your OS
2. Install and start PostgreSQL service
3. Verify installation:
   ```bash
   psql --version
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

### 4. Install Dependencies

```bash
# Using npm
npm install

# OR using Bun
bun install
```

### 5. Setup Database

Create the database and apply schema:

```bash
# Create database
createdb pgadmin

# Apply schema
psql -d pgadmin -f db/schema.sql
```

If you need to use a different database name or credentials, update them in the next step.

### 6. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and update the configuration:

```env
# Replace with your Clerk keys
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Update with your PostgreSQL credentials
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/pgadmin

# Optional: Generate a secure encryption key
ENCRYPTION_KEY=UEdJbnNwZWN0b3JFbmNyeXB0aW9uS2V5MjAyNFNlY3VyZVJhbmRvbUtleQ==
```

**Important:** Use the same publishable key for both `CLERK_PUBLISHABLE_KEY` and `VITE_CLERK_PUBLISHABLE_KEY`.

### 7. Start Application

```bash
# Development mode (with hot reload)
npm run dev
# OR
bun run dev

# Production mode
npm run build
npm start
# OR
bun run build
bun start
```

The application will start on:
- **Frontend & API:** http://localhost:9000

### 8. Access Application

Open your browser and go to:
- **http://localhost:9000**

You should see the pgInspect landing page with "Sign In" button.

### 9. Sign In

1. Click "Sign In"
2. Choose authentication method:
   - Email
   - Google
   - Microsoft
3. Complete authentication
4. You'll be redirected to the dashboard

### 10. Connect to Database

Try connecting to your local database:

1. Click "New Connection"
2. Fill in the details:
   ```
   Name:     Local Database
   Host:     localhost
   Port:     5432
   Database: pgadmin
   Username: postgres
   Password: your_password
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

# Database Connection - Your local PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/pgadmin

# Encryption Key - Used to encrypt database passwords
# Default is fine for development, generate new for production
ENCRYPTION_KEY=UEdJbnNwZWN0b3JFbmNyeXB0aW9uS2V5MjAyNFNlY3VyZVJhbmRvbUtleQ==
```

### Optional Settings

```env
# Server Configuration
PORT=9000                    # Backend API port
NODE_ENV=development         # Environment mode
LOG_LEVEL=debug             # Logging level

# Security
CORS_ORIGIN=http://localhost:9000
QUERY_TIMEOUT=30000         # Query timeout in ms
MAX_RESULT_ROWS=1000        # Max rows returned

# Frontend Configuration
VITE_PORT=5000              # Frontend port (if running separately)
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
DATABASE_URL=postgresql://user:password@host:5432/database
```

### 4. Configure Clerk for Production

1. Update allowed origins: `https://your-domain.com`
2. Update redirect URLs:
   - Sign-in: `https://your-domain.com/sign-in`
   - Sign-up: `https://your-domain.com/sign-up`
   - After sign-in: `https://your-domain.com/app`

### 5. Build and Deploy

```bash
npm run build
npm start
# OR
bun run build
bun start
```

## Verification

After setup, verify everything works:

### 1. Check Server

The terminal should show:
- ✅ "Server running on port 9000"
- ✅ "Database connected"
- ✅ No error messages

### 2. Test Frontend

Open http://localhost:9000
- ✅ Page loads
- ✅ "Sign In" button visible
- ✅ No console errors

### 3. Test Backend

```bash
curl http://localhost:9000/api/health
```

Should return: `{"status":"ok"}`

### 4. Test Authentication

1. Click "Sign In"
2. Sign in with Google/Microsoft/Email
3. Should redirect to `/app`
4. Dashboard should load

### 5. Test Database Connection

1. Create a new connection to `localhost:5432`
2. Should connect successfully
3. Should see `pgadmin` database tables

## Troubleshooting

### PostgreSQL Not Running

**Error:** `Connection refused`

**Solution:** Start PostgreSQL service:
```bash
# Linux
sudo systemctl start postgresql

# macOS
brew services start postgresql

# Windows
# Start from Services or pgAdmin
```

### Port Already in Use

**Error:** `port is already allocated`

**Solution:** Change port in `.env`:
```env
PORT=9001
```

### Clerk Authentication Failed

**Error:** `Clerk: Invalid publishable key`

**Solution:**
1. Verify keys are correct in `.env`
2. Ensure no extra spaces or quotes
3. Restart the server

### Can't Connect to Database

**Error:** `Connection refused`

**Solution:**
1. Verify PostgreSQL is running
2. Check credentials in DATABASE_URL
3. Ensure database `pgadmin` exists: `createdb pgadmin`
4. Verify schema is applied: `psql -d pgadmin -f db/schema.sql`

### Module Not Found

**Error:** `Cannot find module`

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
# OR
rm -rf node_modules bun.lockb
bun install
```

For more issues, see [Troubleshooting Guide](TROUBLESHOOTING.md).

## Next Steps

- [Deployment Guide](DEPLOYMENT.md) - Production deployment
- [Features Guide](FEATURES.md) - Learn about features
- [Connections Guide](CONNECTIONS.md) - Connect to cloud databases
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues

## Support

- **Documentation:** See [docs/](.) folder
- **Issues:** Create a GitHub issue
- **Logs:** Check terminal output
