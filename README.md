<div align="center">
  <img src="public/logo.png" alt="pgInspect Logo" width="120" height="120">
  
  # pgInspect
  
  ### Modern PostgreSQL Database Management
  
  A powerful, intuitive PostgreSQL database management tool with visual query builder, SQL editor, and real-time schema inspection.
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
  
  [Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Demo](#-demo)
  
</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎨 User Experience
- 🏠 **Professional Landing Page** - Beautiful onboarding
- 🔐 **Secure Authentication** - Google & Microsoft OAuth
- 👤 **User Accounts** - Personal workspace
- 💾 **Persistent Connections** - Saved across sessions
- 🔒 **Encrypted Storage** - AES-256-GCM encryption

</td>
<td width="50%">

### 🗄️ Database Management
- 🔍 **Schema Inspector** - Explore tables & relationships
- 🎨 **Visual Query Builder** - No SQL required
- 📝 **SQL Editor** - Monaco-powered with syntax highlighting
- 📊 **Results Visualization** - Interactive data tables
- 🌐 **Multi-Connection** - Manage multiple databases

</td>
</tr>
<tr>
<td width="50%">

### ⚡ Technical Features
- 🐳 **Docker Support** - One-command deployment
- ⚡ **Real-time Execution** - Instant query results
- 🔒 **SQL Injection Prevention** - Secure validation
- 🎨 **Dark/Light Theme** - Beautiful modern UI
- 📱 **Responsive Design** - Works on all devices

</td>
<td width="50%">

### ☁️ Cloud Ready
- 🚀 **Railway** - One-click deployment
- 🟢 **Supabase** - Direct integration
- 🔵 **Neon** - Serverless PostgreSQL
- 🟣 **Render** - Easy hosting
- 🟠 **AWS RDS** - Enterprise ready

</td>
</tr>
</table>

## 🛠 Tech Stack

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18 • TypeScript • Vite • TailwindCSS • shadcn/ui • Framer Motion |
| **Backend** | Bun • Hono • PostgreSQL • Node.js |
| **Authentication** | Clerk (Google & Microsoft OAuth) |
| **Database** | PostgreSQL 16 • postgres.js |
| **Security** | AES-256-GCM • JWT • SQL Injection Prevention |
| **Deployment** | Docker • Railway • Render |
| **Dev Tools** | ESLint • TypeScript • Vitest • Monaco Editor |

</div>

## 📸 Demo

<div align="center">
  <img src="public/image-dark.png" alt="pgInspect Dark Mode" width="800">
  <p><em>Dark mode interface with visual query builder</em></p>
  
  <img src="public/image-light.png" alt="pgInspect Light Mode" width="800">
  <p><em>Light mode interface with SQL editor</em></p>
</div>

## 🚀 Quick Start

Get up and running in 5 minutes with Docker:

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd pginspect

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your Clerk keys

# 3. Start with Docker
docker-compose up

# 4. Open your browser
# http://localhost:5173
```

That's it! 🎉

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [🚀 Deployment Guide](docs/DEPLOYMENT_GUIDE.md) | Complete deployment instructions |
| [🔐 Authentication Setup](docs/AUTH_SETUP_GUIDE.md) | Clerk configuration guide |
| [🔌 Connection Guide](docs/CONNECTION_GUIDE.md) | Database connection examples |
| [💻 Development Guide](DEVELOPMENT.md) | Local development setup |
| [🏗️ Architecture](docs/AUTH_IMPLEMENTATION.md) | Technical implementation details |

## 🎯 Key Features Explained

### 🎨 Visual Query Builder
Build complex SQL queries without writing code. Drag and drop blocks for FROM, JOIN, WHERE, SELECT, ORDER BY, and LIMIT. See generated SQL in real-time.

### 📝 SQL Editor
Monaco-powered editor (same as VS Code) with PostgreSQL syntax highlighting, auto-complete, and multi-query support.

### 🔍 Schema Inspector
Explore your database structure: tables, columns, data types, indexes, foreign keys, and relationships. View row counts and storage size.

### 🔐 Secure Authentication
OAuth integration with Google and Microsoft via Clerk. All database passwords encrypted with AES-256-GCM.

### 💾 Connection Management
Save unlimited database connections. Supports local, cloud (Railway, Supabase, Neon), and self-hosted PostgreSQL.

### 📊 Results Panel
Interactive data tables with sorting, filtering, pagination, and export to CSV/JSON/SQL.

## 🔐 Authentication

pgInspect uses [Clerk](https://clerk.com) for secure authentication with Google and Microsoft OAuth.

### Quick Setup

1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Enable Google & Microsoft in "Social Connections"
4. Copy API keys to `.env`:
   ```env
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

📖 **Detailed Guide:** [docs/AUTH_SETUP_GUIDE.md](docs/AUTH_SETUP_GUIDE.md)

## 🔌 Connecting to Databases

### Local Docker Database

#### When Backend Runs in Docker (Production Mode)

If your backend is running inside Docker (`docker-compose up`), use the Docker service name:

**Connection String:**
```
postgresql://postgres:postgres@database:5432/pgadmin
```

**Direct Connection:**
```
Host: database
Port: 5432
Database: pgadmin
Username: postgres
Password: postgres
SSL Mode: disable
```

#### When Backend Runs Locally (Development Mode)

If your backend is running locally (`npm run server:dev`), but database is in Docker:

**Connection String:**
```
postgresql://postgres:postgres@localhost:5432/pgadmin
```

**Direct Connection:**
```
Host: localhost
Port: 5432
Database: pgadmin
Username: postgres
Password: postgres
SSL Mode: disable
```

#### When Backend in Docker Needs to Connect to Host Database

If your backend is in Docker but needs to reach a database on your host machine:

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

**💡 Quick Reference:**
- `database` → Docker service name (container-to-container)
- `localhost` → Your local machine (when backend runs locally)
- `host.docker.internal` → Your host machine from inside Docker

### Host Machine Database

If you have PostgreSQL running on your Windows/Mac machine:

```
Host: host.docker.internal
Port: 5432
Database: your_database
Username: your_username
Password: your_password
SSL Mode: disable
```

### Cloud Databases (Railway, Supabase, Neon, etc.)

#### Railway Database

1. **Enable TCP Proxy:**
   - Go to Railway dashboard
   - Select your PostgreSQL service
   - Go to Settings → Networking
   - Click "+ TCP Proxy"
   - Copy the generated hostname and port

2. **Connection String:**
   ```
   postgresql://username:password@<proxy-host>.proxy.rlwy.net:<port>/database?sslmode=require
   ```

3. **Direct Connection:**
   ```
   Host: <something>.proxy.rlwy.net
   Port: <tcp-proxy-port>
   Database: railway (or your database name)
   Username: postgres (or your username)
   Password: <your-password>
   SSL Mode: require
   ```

**Important:** 
- ❌ Don't use `.railway.internal` hostnames (only work within Railway)
- ✅ Use `.proxy.rlwy.net` hostnames (work from anywhere)
- ✅ Always use `sslmode=require` for cloud databases

#### Supabase

Supabase requires specific connection configuration due to IPv4/IPv6 compatibility and SCRAM authentication requirements.

**✅ WORKING SOLUTION - Transaction Pooler (Port 6543):**

1. **Get Your Connection Details:**
   - Go to Supabase Dashboard → Settings → Database
   - Copy the connection string from "Connection string" section
   - **Important**: Use the **Transaction Pooler** (port 6543), not direct connection

2. **Connection String Format:**
   ```
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require
   ```

3. **Example Working Connection:**
   ```
   postgresql://postgres.vovvpicevkybzwhraztu:P%5Ed3CHa8OngFC%24nQ3%2Ajf@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```

4. **Direct Connection Fields:**
   ```
   Host: aws-0-[region].pooler.supabase.com
   Port: 6543
   Database: postgres
   Username: postgres.[your-ref]
   Password: [your-password]
   SSL Mode: require
   ```

**🔑 Password Encoding:**
If your password contains special characters, URL-encode them:
- `^` → `%5E`
- `$` → `%24`
- `*` → `%2A`
- `@` → `%40`
- `#` → `%23`

**❌ Common Issues & Solutions:**

| Issue | Cause | Solution |
|-------|-------|----------|
| `ENOTFOUND` | IPv4 incompatibility | Use Transaction Pooler (port 6543) |
| `SASL_SIGNATURE_MISMATCH` | Special characters in password | URL-encode password or reset to alphanumeric |
| `Connection terminated` | Wrong connection mode | Use Transaction Mode, not Session Mode |

**🚨 Important Notes:**
- **Don't use Direct Connection (port 5432)** - requires IPv4 add-on
- **Don't use Session Pooler (port 5432)** - has authentication issues
- **✅ Use Transaction Pooler (port 6543)** - works reliably
- **Always use `sslmode=require`** for Supabase connections

**📋 Step-by-Step Setup:**

1. **In Supabase Dashboard:**
   - Go to Settings → Database
   - Find "Connection string" section
   - Look for the **Transaction pooler** option
   - Copy the connection string

2. **In pgInspect:**
   - Click "New Connection" → "Cloud Preset" → "Supabase"
   - Paste the full connection URI in the "Quick Fill" box
   - All fields will auto-populate
   - Click "Save & Connect"

3. **Manual Setup (Alternative):**
   ```
   Connection Name: My Supabase DB
   Host: aws-0-ap-southeast-1.pooler.supabase.com
   Port: 6543
   Database: postgres
   Username: postgres.vovvpicevkybzwhraztu
   Password: P^d3CHa8OngFC$nQ3*jf
   SSL Mode: require
   ```

**🔧 Troubleshooting:**

If you still get `SASL_SIGNATURE_MISMATCH`:
1. Reset your database password in Supabase
2. Use only letters and numbers (no special characters)
3. Example: `MyNewPassword123`
4. Update your connection string with the new password

**✅ Verified Working Configuration:**
- **Host**: `aws-0-ap-southeast-1.pooler.supabase.com`
- **Port**: `6543` (Transaction Pooler)
- **SSL**: `require`
- **Password**: URL-encoded if contains special characters

#### Neon

```
Host: <endpoint>.neon.tech
Port: 5432
Database: <your-database>
Username: <your-username>
Password: <your-password>
SSL Mode: require
```

### Connection Methods in UI

**Method 1: Connection String (Recommended)**
1. Click "New Connection" → "Connection String"
2. Paste your full connection string
3. Give it a name
4. Click "Save & Connect"

**Method 2: Direct Connection**
1. Click "New Connection" → "Direct Connection"
2. Fill in each field manually
3. Click "Save & Connect"

**Method 3: Cloud Preset**
1. Click "New Connection" → "Cloud Preset"
2. Select your provider (Railway, Supabase, Neon, etc.)
3. Fill in the pre-configured form
4. Click "Save & Connect"

### Testing Connections

**Via UI:**
- Click "Test Connection" button before saving

**Via API:**
```bash
curl -X POST http://localhost:3000/api/connections/test \
  -H "Content-Type: application/json" \
  -d '{"connectionString":"postgresql://user:pass@host:port/db"}'
```

**Via Command Line:**
```bash
# Test local Docker database
docker exec -it pginspect-database-1 psql -U postgres -d pgadmin

# Test external database
psql "postgresql://user:pass@host:port/db"
```

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 18+
- Docker (for local PostgreSQL)
- Git

### Setup

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Install dependencies:
```sh
bun install
# or
npm install
```

3. Copy environment variables:
```sh
cp .env.example .env.development
```

4. Start PostgreSQL database:
```sh
docker run -d \
  --name postgres-dev \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pgadmin \
  postgres:16-alpine
```

5. Start the development servers:

**Terminal 1 - Backend:**
```sh
bun run server:dev
# or
npm run server:dev
```

**Terminal 2 - Frontend:**
```sh
bun run dev
# or
npm run dev
```

6. Open http://localhost:8080 in your browser

### Development Scripts

```sh
# Frontend development server
bun run dev

# Backend development server (with hot reload)
bun run server:dev

# Build frontend for production
bun run build

# Run tests
bun test

# Lint code
bun run lint
```

## 🐳 Docker Deployment

### Local Docker Setup

1. **Build and start all services:**
```bash
docker-compose up --build
```

2. **Access the application:**
   - Application: http://localhost:3000
   - API Health: http://localhost:3000/api/health

3. **Create your first connection:**
   - Click "New Connection" in the app
   - Use these credentials to connect to the local Docker database:
     ```
     Host: database          ← IMPORTANT: Use "database" not "localhost"
     Port: 5432
     Database: pgadmin
     User: postgres
     Password: postgres
     SSL Mode: disable
     ```

4. **Stop services:**
```bash
docker-compose down
```

### Why "database" as hostname?

The backend API runs inside a Docker container and connects to the PostgreSQL container using Docker's internal network. The hostname `database` is the service name defined in `docker-compose.yml`.

**Connection Context:**
- ✅ Use `database` - connects to Docker PostgreSQL
- ✅ Use `host.docker.internal` - connects to your host machine
- ✅ Use external hostnames - connects to cloud databases
- ❌ Don't use `localhost` - refers to the container itself

### Docker Commands

```bash
# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs app
docker-compose logs database

# Restart services
docker-compose restart

# Stop and remove volumes
docker-compose down -v

# Check container status
docker ps
```

### Sample Data

The local Docker database includes:
- 5 users (John Doe, Jane Smith, Bob Wilson, Alice Brown, Charlie Davis)
- 5 orders with various statuses
- 5 products (Laptop, Mouse, Keyboard, Monitor, Headphones)
- Order items linking orders to products
- Order summary view

### Test Database Connection

```bash
# Test from command line
docker exec -it pginspect-database-1 psql -U postgres -d pgadmin -c "SELECT * FROM users;"

# Test API health
curl http://localhost:3000/api/health
```

## Railway Deployment

### Initial Setup

1. Install Railway CLI:
```sh
npm i -g @railway/cli
```

2. Login to Railway:
```sh
railway login
```

3. Initialize project:
```sh
railway init
```

4. Add PostgreSQL database:
```sh
railway add --database postgres
```

5. Set environment variables in Railway dashboard:
   - `NODE_ENV=production`
   - `LOG_LEVEL=info`
   - `CORS_ORIGIN=https://your-domain.railway.app`
   - Other variables from `.env.example`

6. Deploy:
```sh
railway up
```

### Automatic Deployment

Connect your GitHub repository in Railway dashboard for automatic deployments on push to main branch.

### Database Migration

After first deployment, run the initialization script:

```sh
railway connect postgres
\i db/init.sql
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Connections
- `POST /api/connections/test` - Test database connection
- `POST /api/connections/connect` - Create new connection
- `DELETE /api/connections/:id` - Close connection

### Schema
- `GET /api/schema/:connectionId/schemas` - List schemas
- `GET /api/schema/:connectionId/:schemaName/tables` - List tables
- `GET /api/schema/:connectionId/:schemaName/:tableName` - Table details

### Queries
- `POST /api/query/execute` - Execute SQL query
- `POST /api/query/explain` - Get query execution plan

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origins
- `QUERY_TIMEOUT` - Query execution timeout (ms)
- `MAX_RESULT_ROWS` - Maximum rows returned per query

## Security

- **Authentication**: Clerk-based authentication with OAuth (Google, Microsoft)
- **Password Encryption**: AES-256-GCM encryption for stored database passwords
- **User Isolation**: Database-level user isolation for connections
- **SQL Injection Prevention**: Query validation and parameterized queries
- **Connection Pooling**: Limits and timeouts to prevent resource exhaustion
- **Query Timeout**: Enforcement of maximum query execution time
- **CORS Configuration**: Restricted origins for API access
- **JWT Verification**: All API requests require valid authentication token
- **Rate Limiting**: Recommended for production (via Clerk)

### Security Best Practices

1. **Never commit** `.env.development` or `.env.production` files
2. Use different Clerk applications for development and production
3. Rotate encryption keys periodically
4. Use strong, unique keys for production
5. Enable MFA in Clerk for production applications
6. Monitor Clerk dashboard for suspicious activity
7. Keep dependencies updated
8. Review Clerk security logs regularly

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Bun
- Hono
- PostgreSQL
- Docker

## Deployment

### Railway (Recommended)

1. Push your code to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Add PostgreSQL database service
4. Connect your GitHub repository
5. Configure environment variables
6. Deploy automatically on push

### Docker

Build and deploy using the included Dockerfile:

```sh
docker build -t pgadmin .
docker run -p 3000:3000 --env-file .env pgadmin
```

## Troubleshooting

### Backend won't start
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify port 3000 is available

### Frontend can't connect to backend
- Check VITE_API_URL in .env
- Ensure backend is running on port 3000
- Verify CORS_ORIGIN includes frontend URL

### Docker build fails
- Clear Docker cache: `docker system prune -a`
- Check .dockerignore file
- Ensure all dependencies are in package.json

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: See BACKEND_IMPLEMENTATION_PLAN.md

---

Built with ❤️ using React, Bun, and PostgreSQL


## 🐛 Troubleshooting

### Common Issues

#### 1. "getaddrinfo ENOTFOUND" Error

**Cause:** Wrong hostname or DNS resolution failure

**Solutions:**

**For Local Docker Database:**
- ✅ Use `database` as hostname (not `localhost`)
- ✅ Verify containers are running: `docker ps`
- ✅ Check you're using the connection form correctly

**For Railway Database:**
- ❌ Don't use `.railway.internal` hostnames
- ✅ Enable TCP Proxy in Railway dashboard
- ✅ Use `.proxy.rlwy.net` hostname
- ✅ Example: `postgres-abc.proxy.rlwy.net:12345`

**For Other Cloud Databases:**
- ✅ Use external/public hostname
- ✅ Verify database allows external connections
- ✅ Check firewall/security group settings

#### 2. "Connection timeout"

**Cause:** Database is not reachable or firewall is blocking

**Solutions:**
```bash
# Check if containers are running
docker ps

# Check if database is accessible
docker exec -it pginspect-database-1 psql -U postgres -d pgadmin

# Check backend logs
docker-compose logs app --tail=50

# Check database logs
docker-compose logs database --tail=50

# Verify port is exposed
docker-compose ps
```

#### 3. "Authentication failed"

**Cause:** Wrong username or password

**Solutions:**
- For local Docker: Use `postgres` / `postgres`
- For cloud databases: Copy credentials from dashboard
- Check for typos in password
- Verify username is correct

#### 4. "SSL connection required"

**Cause:** Cloud database requires SSL but it's disabled

**Solution:**
- Change SSL Mode to `require` for cloud databases
- Use `?sslmode=require` in connection string
- Local Docker database uses `disable`

#### 5. Backend won't start

**Cause:** Port conflict or missing dependencies

**Solutions:**
```bash
# Check if port 3000 is available
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000

# Kill process using port 3000
# Windows
taskkill /PID <PID> /F

# Mac/Linux
kill -9 <PID>

# Reinstall dependencies
rm -rf node_modules
bun install

# Check environment variables
cat .env.development
```

#### 6. Frontend can't connect to backend

**Cause:** CORS or proxy configuration issue

**Solutions:**
```bash
# Check backend is running
curl http://localhost:3000/api/health

# Check CORS_ORIGIN in .env.development
# Should include: http://localhost:8080

# Check vite.config.ts proxy settings
# Should proxy /api to http://localhost:3000

# Clear browser cache
# Press Ctrl+Shift+Delete

# Check browser console for errors
# Press F12 → Console tab
```

#### 7. Docker build fails

**Cause:** Dependency issues or Docker cache

**Solutions:**
```bash
# Clear Docker cache
docker system prune -a

# Remove old containers and volumes
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache

# Check Dockerfile syntax
cat Dockerfile

# Check .dockerignore
cat .dockerignore
```

#### 8. "Query execution failed"

**Cause:** Invalid SQL or permissions issue

**Solutions:**
- Check SQL syntax
- Only SELECT queries are allowed (security feature)
- Verify you have permissions on the table
- Check query timeout (default 30s)
- Check result row limit (default 10,000)

#### 9. Railway Connection Issues

**Problem:** Can't connect to Railway database from local Docker

**Solution:**
1. Go to Railway dashboard
2. Select your PostgreSQL service
3. Go to Settings → Networking
4. Click "+ TCP Proxy" button
5. Copy the generated hostname (e.g., `abc.proxy.rlwy.net:12345`)
6. Use this in your connection string:
   ```
   postgresql://user:pass@abc.proxy.rlwy.net:12345/db?sslmode=require
   ```

**Important:**
- Internal hostnames (`.railway.internal`) only work within Railway
- External hostnames (`.proxy.rlwy.net`) work from anywhere
- Always use `sslmode=require` for Railway

#### 11. Supabase Connection Issues

**Problem:** `SASL_SIGNATURE_MISMATCH` or `ENOTFOUND` errors with Supabase

**Root Causes:**
- IPv4/IPv6 compatibility issues
- SCRAM authentication problems with special characters
- Wrong connection mode (Session vs Transaction pooler)

**✅ SOLUTION - Use Transaction Pooler:**

1. **Correct Connection String:**
   ```
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require
   ```

2. **Working Example:**
   ```
   postgresql://postgres.vovvpicevkybzwhraztu:P%5Ed3CHa8OngFC%24nQ3%2Ajf@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```

3. **Key Points:**
   - ✅ Use port **6543** (Transaction Pooler)
   - ✅ Use `pooler.supabase.com` hostname
   - ✅ URL-encode special characters in password
   - ❌ Don't use port 5432 (requires IPv4 add-on)
   - ❌ Don't use `db.*.supabase.co` (direct connection)

**Password Encoding:**
```bash
# If password is: P^d3CHa8OngFC$nQ3*jf
# Encoded becomes: P%5Ed3CHa8OngFC%24nQ3%2Ajf

^ → %5E
$ → %24  
* → %2A
@ → %40
# → %23
```

**Alternative - Reset Password:**
1. Go to Supabase Dashboard → Settings → Database
2. Click "Reset Password"
3. Generate password with **only letters and numbers**
4. Example: `MyPassword123`
5. Use new password in connection string

**Testing Your Connection:**
```bash
# Test with psql (if available)
psql "postgresql://postgres.ref:password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require"

# Should connect successfully and show PostgreSQL prompt
```

#### 10. Sample Data Not Loading

**Cause:** Database initialization script didn't run

**Solutions:**
```bash
# Check if tables exist
docker exec -it pginspect-database-1 psql -U postgres -d pgadmin -c "\dt"

# Manually run initialization script
docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < db/init.sql

# Or recreate database
docker-compose down -v
docker-compose up --build
```

### Debug Mode

Enable debug logging:

```bash
# In .env.development
LOG_LEVEL=debug

# Restart backend
docker-compose restart app

# View detailed logs
docker-compose logs app -f
```

### Health Checks

```bash
# Check API health
curl http://localhost:3000/api/health

# Expected response:
# {"success":true,"data":{"status":"ok","uptime":123,...}}

# Check database health
docker exec pginspect-database-1 pg_isready -U postgres

# Check container health
docker ps
# Both containers should show "healthy"
```

### Getting Help

If you're still having issues:

1. **Check logs:**
   ```bash
   docker-compose logs app --tail=100
   docker-compose logs database --tail=100
   ```

2. **Check browser console:**
   - Press F12
   - Go to Console tab
   - Look for red errors

3. **Check network requests:**
   - Press F12
   - Go to Network tab
   - Try creating a connection
   - Check the API request/response

4. **Verify Docker setup:**
   ```bash
   docker --version
   docker-compose --version
   docker ps
   docker network ls
   ```

5. **Review documentation:**
   - [CONNECTION_GUIDE.md](./CONNECTION_GUIDE.md) - Detailed connection scenarios
   - [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Comprehensive testing guide
   - [BACKEND_IMPLEMENTATION_PLAN.md](./BACKEND_IMPLEMENTATION_PLAN.md) - Architecture details

6. **Create an issue:**
   - Include error messages
   - Include relevant logs
   - Describe what you tried
   - Mention your OS and Docker version

## 🗺️ Application Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page with features and CTAs |
| `/sign-in` | Public | Sign in with Google, Microsoft, or email |
| `/sign-up` | Public | Create account with OAuth or email |
| `/app` | Protected | Main application (requires authentication) |
| `*` | Public | 404 Not Found page |

### Route Behavior

- **Landing Page** (`/`): If user is signed in, auto-redirects to `/app`
- **Sign In/Up**: After authentication, redirects to `/app`
- **App** (`/app`): If not signed in, redirects to `/` (landing page)
- **Protected Routes**: All require valid Clerk session

## 📚 Additional Resources

### Documentation
- **LANDING_PAGE_IMPLEMENTATION.md** - Landing page details and user flow
- **AUTH_SETUP_GUIDE.md** - Complete authentication setup guide
- **AUTH_IMPLEMENTATION.md** - Technical implementation details
- **AUTH_VISUAL_GUIDE.md** - Visual walkthrough with diagrams
- **UI_UPDATE_SUMMARY.md** - Sign-in UI design system
- **DOCKER_DEPLOYMENT.md** - Complete Docker deployment guide
- **DOCKER_FIXES.md** - Common Docker issues and solutions
- **CONNECTION_GUIDE.md** - Detailed guide for different connection scenarios
- **TESTING_GUIDE.md** - Comprehensive testing instructions
- **CLERK_SETUP_CHECKLIST.md** - Step-by-step authentication checklist
- **BACKEND_IMPLEMENTATION_PLAN.md** - Architecture and implementation details

### Quick References
- **DEPLOYMENT_SUCCESS.md** - Deployment checklist and verification
- **CLERK_SETUP_CHECKLIST.md** - Step-by-step Clerk configuration
- **AUTH_VISUAL_GUIDE.md** - Visual guide to authentication flow
- **AUTHENTICATION_SUMMARY.md** - Quick authentication overview

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT

## 🙏 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: See guides in the repository

## 🎉 What Makes pgInspect Special

### Professional Experience
- **Landing Page**: Beautiful first impression with clear value proposition
- **Seamless Auth**: One-click sign-in with Google or Microsoft
- **Persistent Data**: Your connections saved securely across devices
- **Modern UI**: Dark theme with smooth animations and transitions

### Powerful Features
- **Visual Query Builder**: Build complex queries without SQL knowledge
- **Schema Inspector**: Explore database structure with detailed metadata
- **SQL Editor**: Monaco-powered editor with syntax highlighting
- **Real-time Results**: Instant query execution with interactive tables

### Enterprise Security
- **AES-256-GCM Encryption**: Military-grade password protection
- **User Isolation**: Database-level separation of user data
- **OAuth Authentication**: Secure sign-in via trusted providers
- **SQL Injection Prevention**: Validated and sanitized queries

### Developer Friendly
- **Docker Ready**: One command to deploy
- **Cloud Compatible**: Works with any PostgreSQL database
- **Open Source**: MIT licensed, fully customizable
- **Well Documented**: Comprehensive guides and examples

---

Built with ❤️ by developers, for developers


## 🎉 Quick Start Summary

### For Impatient Developers

```bash
# 1. Clone and setup
git clone <YOUR_REPO>
cd pginspect

# 2. Add Clerk keys to .env
# Get from https://dashboard.clerk.com
echo "CLERK_PUBLISHABLE_KEY=pk_test_..." >> .env
echo "CLERK_SECRET_KEY=sk_test_..." >> .env
echo "VITE_CLERK_PUBLISHABLE_KEY=pk_test_..." >> .env
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env

# 3. Start with Docker
docker-compose up --build

# 4. Open browser
open http://localhost:3000
```

### What You Get

- ✅ Professional landing page at `/`
- ✅ Google & Microsoft OAuth sign-in
- ✅ Persistent database connections
- ✅ Encrypted password storage
- ✅ Visual query builder
- ✅ SQL editor with Monaco
- ✅ Schema inspector
- ✅ Real-time results
- ✅ Multi-connection support
- ✅ Dark theme UI

### Test Database Connection

Use the included Docker PostgreSQL:
```
Host: database
Port: 5432
Database: pgadmin
Username: postgres
Password: postgres
SSL: disable
```

Sample data included:
- 5 users
- 5 orders
- 5 products
- Order items
- Order summary view

---

**Built with ❤️ for developers who love PostgreSQL**

