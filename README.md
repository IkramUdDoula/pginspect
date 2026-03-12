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

### Option 1: Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/ikramuddoula/pginspect
cd pginspect

# 2. Setup environment
cp .env.example .env
# Edit .env with your Clerk keys

# 3. Start with Docker
docker-compose up -d

# Or use the setup script
bash scripts/docker-setup.sh  # Linux/Mac
# OR
.\scripts\docker-setup.ps1    # Windows
```

Access at http://localhost:3000

### Option 2: Local Development

```bash
# 1. Clone the repository
git clone https://github.com/ikramuddoula/pginspect
cd pginspect

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Clerk keys and database URL

# 4. Start the application
npm run dev
```

Access at http://localhost:8080

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[Docker Guide](DOCKER.md)** | Docker deployment (production & development) |
| **[Setup Guide](docs/SETUP.md)** | Get Clerk authentication keys |
| **[Deployment Guide](docs/DEPLOYMENT.md)** | Detailed deployment instructions |
| **[Features Guide](docs/FEATURES.md)** | Visual Query Builder, Saved Views, and more |
| **[Connections Guide](docs/CONNECTIONS.md)** | Connect to local, Docker, and cloud databases |
| **[Troubleshooting](docs/TROUBLESHOOTING.md)** | Common issues and solutions |

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

## 📊 Database Setup

Set up your local PostgreSQL database:

```bash
# Create database
createdb pgadmin

# Run schema
psql -d pgadmin -f db/schema.sql
```

Then connect using:
```
Host:     localhost
Port:     5432
Database: pgadmin
Username: postgres
Password: your_password
SSL Mode: disable
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT

---

Built with ❤️ by Ikram, for Everyone, with Claude
