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
- � **Encrypted Storage** - AES-256-GCM encryption for database credentials
- 🌐 **Multi-Connection** - Manage multiple databases simultaneously
- � **Docker Ready** - One-command deployment
- 🎨 **Dark/Light Theme** - Beautiful modern UI

## 🚀 Quick Start

### Local Development

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd pginspect

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your Clerk keys (see docs/SETUP.md)

# 4. Start PostgreSQL
docker run --name pginspect-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pgadmin \
  -p 5432:5432 \
  -d postgres:15

# 5. Initialize database
docker exec -i pginspect-db psql -U postgres -d pgadmin < db/schema.sql

# 6. Start development servers
npm run dev

# 7. Open http://localhost:8080
```

### Docker Deployment

```bash
# 1. Clone and configure
git clone <YOUR_GIT_URL>
cd pginspect
cp .env.docker.example .env.docker
# Edit .env.docker with your configuration

# 2. Start all services
docker-compose up -d

# 3. Initialize database
docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < db/schema.sql

# 4. Open http://localhost:5000
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[Setup Guide](docs/SETUP.md)** | Complete installation and configuration |
| **[Deployment Guide](docs/DEPLOYMENT.md)** | Production deployment and environment setup |
| **[Authentication](docs/AUTHENTICATION.md)** | Clerk setup and OAuth configuration |
| **[Database Connections](docs/CONNECTIONS.md)** | Connect to local, Docker, and cloud databases |
| **[Features Guide](docs/FEATURES.md)** | Visual Query Builder, Saved Views, and more |
| **[Docker Guide](docs/DOCKER.md)** | Docker deployment and commands |
| **[Troubleshooting](docs/TROUBLESHOOTING.md)** | Common issues and solutions |
| **[API Reference](docs/API.md)** | Backend API endpoints |
| **[Architecture](docs/ARCHITECTURE.md)** | Technical implementation details |

## � Tech Stack

**Frontend:** React 18 • TypeScript • Vite • TailwindCSS • shadcn/ui  
**Backend:** Bun • Hono • Node.js  
**Database:** PostgreSQL 16 • postgres.js  
**Authentication:** Clerk (Google & Microsoft OAuth)  
**Security:** AES-256-GCM • JWT • SQL Injection Prevention  
**Deployment:** Docker • Railway • Render

## 🔐 Security

- OAuth authentication with Google and Microsoft
- AES-256-GCM encryption for stored database passwords
- SQL injection prevention with query validation
- User isolation at database level
- JWT token verification for all API requests
- Connection pooling with timeouts and limits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT

## � Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: See [docs/](docs/) folder

---

Built with ❤️ by Ikram, for Everyone, with Claude
