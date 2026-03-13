<div align="center">
  <img src="public/logo.png" alt="pgInspect Logo" width="120" height="120">
  
  # pgInspect
  
  ### Modern PostgreSQL Database Management
  
  A powerful, intuitive PostgreSQL database management tool with visual query builder, SQL editor, and real-time schema inspection.
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
  
</div>

---

## What is pgInspect?

pgInspect is a modern, self-hosted PostgreSQL database management tool that provides a beautiful web interface for inspecting, querying, and managing your databases. Built with React, TypeScript, and Bun, it emphasizes security, ease of use, and developer experience.

**No payment, No bullshit, just Postgres!**

## ✨ Key Features

- 🎨 **Visual Query Builder** - Build complex SQL queries without writing code
- 📝 **SQL Editor** - Monaco-powered editor with syntax highlighting
- 💾 **Saved Views** - Save and reuse frequent queries with auto-refresh
- 🔍 **Schema Inspector** - Explore tables, columns, indexes, and relationships
- 🔐 **Secure Authentication** - Google & Microsoft OAuth via Clerk
- 🔒 **Encrypted Storage** - AES-256-GCM encryption for database credentials
- 🌐 **Multi-Connection** - Manage multiple databases simultaneously
- 🎨 **Dark/Light Theme** - Beautiful modern UI

## 🚀 Quick Start

### Docker Deployment (Recommended)

```bash
# 1. Clone and navigate
git clone https://github.com/ikramuddoula/pginspect
cd pginspect

# 2. Get Clerk keys from https://dashboard.clerk.com
#    - Create a new application
#    - Copy: CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY

# 3. Run setup script (will prompt for Clerk keys)
bash scripts/docker-setup.sh     # Linux/Mac
.\scripts\docker-setup.ps1       # Windows

# 4. Access at http://localhost:3000
```

The script automatically:
- Creates `.env` with auto-generated encryption key
- Validates required Clerk authentication keys
- Builds Docker images
- Starts PostgreSQL database
- Applies database schema
- Starts the application

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/ikramuddoula/pginspect
cd pginspect

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with Clerk keys and database URL

# 4. Setup database
createdb pgadmin
npm run db:init
# Or: psql -d pgadmin -f db/schema.sql

# 5. Start development server 
# Note: make sure docker instance of the app is not running. Otherwise this will fail since local deployment need port 3000 to be open. 
npm run dev
```

Access at http://localhost:8080

## 🛠 Tech Stack

**Frontend:** React 18 • TypeScript • Vite • TailwindCSS • shadcn/ui  
**Backend:** Bun • Hono • Node.js  
**Database:** PostgreSQL 16 • postgres.js  
**Authentication:** Clerk (Google & Microsoft OAuth)  
**Security:** AES-256-GCM • JWT • SQL Injection Prevention

## 🔐 Security

- OAuth authentication with Google and Microsoft
- AES-256-GCM encryption for stored database passwords
- SQL injection prevention with query validation
- User isolation at database level
- JWT token verification for all API requests
- Connection pooling with timeouts and limits

## 🗄️ Connect Your Database

pgInspect works with any PostgreSQL database. Here's how to connect from popular providers:

### Railway

1. Go to your Railway project → PostgreSQL service
2. Copy connection details from "Connect" tab
3. Add to pgInspect:

```
Host:     centerbeam.proxy.rlwy.net
Port:     56062
Database: railway
Username: postgres
Password: [from Railway dashboard]
SSL Mode: disable
```

### Supabase

1. Go to Project
2. Press on the **Connect** button on the topbar
2. Get the connection variables
3. Add to pgInspect:

```
Host:     aws-0-ap-southeast-1.pooler.supabase.com
Port:     6543
Database: postgres
Username: postgres.[project-ref]
Password: [from Supabase dashboard]
SSL Mode: require
```

### Local Docker (included in setup)

After running the setup script, connect using:

```
Host:     localhost (or host.docker.internal from containers)
Port:     5432
Database: pgadmin
Username: postgres
Password: postgres
SSL Mode: disable
```

### Neon, Render, or Any PostgreSQL

1. Get connection details from your provider
2. Click "Add Connection" in pgInspect
3. Enter host, port, database, username, password
4. Choose SSL mode (usually "require" for cloud providers)

All credentials are encrypted with AES-256-GCM before storage.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT

## 📚 Documentation

- [Railway Deployment Guide](./RAILWAY_DEPLOY.md) - Deploy to Railway
- [Database Setup Guide](./DB_SETUP.md) - Initialize database schema
- [Audit Log Tracking](./AUDIT_LOG_TRACKING.md) - Audit logging details

---

## 🚀 Demo

Visit - https://pginspect-production-3e4b.up.railway.app/ 

**Note - You will not be able to sign up, since I am not allowing access for anyone in the demo instance. But feel free to fork and deploy in docker or railway.**

Built with ❤️ by Ikram, for Everyone, with Claude
