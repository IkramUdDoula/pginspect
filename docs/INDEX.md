# pgInspect Documentation

Complete documentation for pgInspect - Modern PostgreSQL Database Management.

## Getting Started

New to pgInspect? Start here:

1. **[Quick Start](../QUICKSTART.md)** - Get running in 3 steps
2. **[Setup Guide](SETUP.md)** - Detailed setup instructions
3. **[Deployment Guide](DEPLOYMENT.md)** - Deploy with Docker

## Core Documentation

### Setup & Deployment

- **[Setup Guide](SETUP.md)** - Complete installation and configuration
- **[Deployment Guide](DEPLOYMENT.md)** - Docker deployment instructions
- **[Docker Guide](DOCKER.md)** - Docker commands and reference
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

### Features & Usage

- **[Features Guide](FEATURES.md)** - Visual Query Builder, Saved Views, and more
- **[Connections Guide](CONNECTIONS.md)** - Connect to databases (local, cloud, Docker)
- **[Authentication](AUTHENTICATION.md)** - Clerk setup and OAuth configuration
- **[API Reference](API.md)** - Backend API endpoints

### Architecture

- **[Architecture](ARCHITECTURE.md)** - Technical implementation details

## Quick Links

### Installation

```bash
# 1. Clone repository
git clone <YOUR_GIT_URL>
cd pginspect

# 2. Configure environment
cp .env.docker.example .env.docker
# Edit .env.docker with your Clerk keys

# 3. Deploy
bash scripts/deploy.sh    # Linux/Mac
pwsh scripts/deploy.ps1   # Windows
```

### Access Points

- **Application:** http://localhost:9000
- **API:** http://localhost:9000/api
- **Database:** localhost:5432

### Built-in Database

```
Host:     localhost
Port:     5432
Database: pgadmin
Username: postgres
Password: postgres
SSL Mode: disable
```

## Documentation by Topic

### For First-Time Users

1. Read [Quick Start](../QUICKSTART.md)
2. Follow [Setup Guide](SETUP.md)
3. Learn about [Features](FEATURES.md)
4. Connect to [Databases](CONNECTIONS.md)

### For Developers

1. Review [Architecture](ARCHITECTURE.md)
2. Check [API Reference](API.md)
3. Understand [Authentication](AUTHENTICATION.md)
4. Use [Docker Guide](DOCKER.md)

### For Troubleshooting

1. Check [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review [Docker Guide](DOCKER.md) for container issues
3. See [Connections Guide](CONNECTIONS.md) for database issues
4. Check [Setup Guide](SETUP.md) for configuration issues

## Common Tasks

### Deploy Application

```bash
bash scripts/deploy.sh
```

See: [Deployment Guide](DEPLOYMENT.md)

### View Logs

```bash
docker-compose logs -f
```

See: [Docker Guide](DOCKER.md)

### Connect to Database

1. Sign in to pgInspect
2. Click "New Connection"
3. Fill in connection details
4. Click "Save & Connect"

See: [Connections Guide](CONNECTIONS.md)

### Troubleshoot Issues

1. Check [Troubleshooting Guide](TROUBLESHOOTING.md)
2. View logs: `docker-compose logs -f`
3. Restart: `docker-compose restart`

See: [Troubleshooting](TROUBLESHOOTING.md)

## Features Overview

### Visual Query Builder

Build SQL queries visually without writing code.

- Drag-and-drop interface
- Real-time SQL generation
- Support for joins, filters, sorting

See: [Features Guide](FEATURES.md)

### SQL Editor

Monaco-powered SQL editor with:

- Syntax highlighting
- Auto-completion
- Query history
- Error detection

See: [Features Guide](FEATURES.md)

### Saved Views

Save and reuse frequent queries:

- Auto-refresh capability
- Query templates
- Shareable views

See: [Features Guide](FEATURES.md)

### Schema Inspector

Explore database structure:

- Tables and columns
- Indexes and constraints
- Relationships
- Data types

See: [Features Guide](FEATURES.md)

## Security

- **Authentication:** Clerk OAuth (Google, Microsoft)
- **Encryption:** AES-256-GCM for stored passwords
- **Authorization:** JWT token verification
- **SQL Injection:** Query validation and sanitization

See: [Authentication Guide](AUTHENTICATION.md)

## Support

### Documentation

All documentation is in the `docs/` folder:

```
docs/
├── INDEX.md              # This file
├── SETUP.md              # Setup instructions
├── DEPLOYMENT.md         # Deployment guide
├── DOCKER.md             # Docker reference
├── FEATURES.md           # Features guide
├── CONNECTIONS.md        # Database connections
├── AUTHENTICATION.md     # Auth setup
├── API.md                # API reference
├── ARCHITECTURE.md       # Technical details
└── TROUBLESHOOTING.md    # Common issues
```

### Getting Help

1. **Check documentation** - Most questions are answered here
2. **View logs** - `docker-compose logs -f`
3. **Create issue** - GitHub issues for bugs/features

### Useful Commands

```bash
# View logs
docker-compose logs -f

# Restart application
docker-compose restart

# Stop application
docker-compose down

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Access database
docker exec -it pginspect-database-1 psql -U postgres -d pgadmin
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

---

**Need help?** Check [Troubleshooting Guide](TROUBLESHOOTING.md) or create a GitHub issue.
