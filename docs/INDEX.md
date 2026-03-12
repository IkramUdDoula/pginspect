# pgInspect Documentation

Complete documentation for pgInspect - Modern PostgreSQL Database Management.

## Getting Started

New to pgInspect? Start here:

1. **[Quick Start](../QUICKSTART.md)** - Get running in 4 steps
2. **[Setup Guide](SETUP.md)** - Detailed setup instructions
3. **[Deployment Guide](DEPLOYMENT.md)** - Local and production deployment

## Core Documentation

### Setup & Deployment

- **[Setup Guide](SETUP.md)** - Complete installation and configuration
- **[Deployment Guide](DEPLOYMENT.md)** - Local and production deployment
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

### Features & Usage

- **[Features Guide](FEATURES.md)** - Visual Query Builder, Saved Views, and more
- **[Connections Guide](CONNECTIONS.md)** - Connect to databases (local, cloud, remote)
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

# 2. Install dependencies
npm install

# 3. Setup database
createdb pgadmin
psql -d pgadmin -f db/schema.sql

# 4. Configure environment
cp .env.example .env
# Edit .env with your Clerk keys and database URL

# 5. Start application
npm run dev
```

### Access Points

- **Application:** http://localhost:9000
- **API:** http://localhost:9000/api
- **Database:** localhost:5432

### Local Database

```
Host:     localhost
Port:     5432
Database: pgadmin
Username: postgres
Password: your_password
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
4. Read [Deployment Guide](DEPLOYMENT.md)

### For Troubleshooting

1. Check [Troubleshooting Guide](TROUBLESHOOTING.md)
2. See [Connections Guide](CONNECTIONS.md) for database issues
3. Check [Setup Guide](SETUP.md) for configuration issues

## Common Tasks

### Start Development Server

```bash
npm run dev
```

See: [Deployment Guide](DEPLOYMENT.md)

### Build for Production

```bash
npm run build
npm start
```

See: [Deployment Guide](DEPLOYMENT.md)

### Connect to Database

1. Sign in to pgInspect
2. Click "New Connection"
3. Fill in connection details
4. Click "Save & Connect"

See: [Connections Guide](CONNECTIONS.md)

### Troubleshoot Issues

1. Check [Troubleshooting Guide](TROUBLESHOOTING.md)
2. View server logs in terminal
3. Restart: Stop with Ctrl+C, then `npm run dev`

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
├── FEATURES.md           # Features guide
├── CONNECTIONS.md        # Database connections
├── AUTHENTICATION.md     # Auth setup
├── API.md                # API reference
├── ARCHITECTURE.md       # Technical details
└── TROUBLESHOOTING.md    # Common issues
```

### Getting Help

1. **Check documentation** - Most questions are answered here
2. **View server logs** - Check terminal output
3. **Create issue** - GitHub issues for bugs/features

### Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Access database
psql -U postgres -d pgadmin

# Check database tables
psql -U postgres -d pgadmin -c "\dt"
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
