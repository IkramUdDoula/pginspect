<div align="center">
  <img src="public/logo.png" alt="pgInspect Logo" width="120" height="120">
  
  # pgInspect
  
  ### Modern PostgreSQL Database Management
  
  A powerful, intuitive PostgreSQL database management tool with visual query builder, SQL editor, and real-time schema inspection.
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
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
- 🐳 **Docker Ready** - One-command deployment
- 🎨 **Dark/Light Theme** - Beautiful modern UI

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed and running
- Git (to clone the repository)

### Deployment (3 Simple Steps)

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd pginspect

# 2. Configure environment
cp .env.docker.example .env.docker
# Edit .env.docker with your Clerk keys (see docs/SETUP.md)

# 3. Deploy with one command
bash scripts/deploy.sh    # Linux/Mac
# OR
pwsh scripts/deploy.ps1   # Windows
```

That's it! Open http://localhost:9000 and start managing your databases.

## 📚 Documentation

| Document | Description |
|----------|-------------|
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
**Deployment:** Docker

## 🔐 Security

- OAuth authentication with Google and Microsoft
- AES-256-GCM encryption for stored database passwords
- SQL injection prevention with query validation
- User isolation at database level
- JWT token verification for all API requests
- Connection pooling with timeouts and limits

## 📊 Default Credentials

After deployment, connect to the built-in database:

```
Host:     localhost
Port:     5432
Database: pgadmin
Username: postgres
Password: postgres
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
