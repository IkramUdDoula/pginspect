# Development Setup

This guide explains how to run the application with live file watching and hot reload.

## Prerequisites

- Docker and Docker Compose installed
- Environment variables configured (see `.env.example`)

## Running with Docker (Live Reload Enabled)

### Start the development environment:

```bash
docker-compose up
```

This will:
- Start the PostgreSQL database on port 5432
- Start the Vite dev server on port 5173 (with hot reload)
- Start the backend server on port 3000 (with file watching)
- Mount your source code as volumes for real-time updates
- Watch all file changes and automatically rebuild/restart

### Access the application:

- **Frontend**: http://localhost:5173 (Vite dev server with hot reload)
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432

### Stop the development environment:

```bash
docker-compose down
```

## Features

### Hot Reload
- **Frontend**: Changes to React/TypeScript files automatically reload in the browser
- **Backend**: Changes to server files automatically restart the server
- **Real-time**: All changes are reflected instantly without manual restart

### Development Logging
- Log level set to `debug` for detailed output
- Query logging enabled for debugging database operations

### CORS Configuration
- Configured for localhost:3000, localhost:5173, and localhost:8080

## Running Locally (Without Docker)

If you prefer to run locally without Docker:

### 1. Install dependencies:

```bash
bun install
```

### 2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start PostgreSQL (using Docker):

```bash
docker run -d \
  --name pgadmin-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pgadmin \
  -p 5432:5432 \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:16-alpine
```

### 4. Run the development server:

```bash
bun run dev
```

This will start:
- Vite dev server on http://localhost:5173 (with hot reload)
- Backend server on http://localhost:3000 (with file watching)

### 5. Stop the development server:

Press `Ctrl+C` in the terminal

## Troubleshooting

### Port already in use
If port 3000 or 5173 is already in use:

```bash
# Find process using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

### Database connection issues
Ensure PostgreSQL is running and accessible:

```bash
psql -h localhost -U postgres -d pgadmin
```

### Hot reload not working
- Check that files are being saved (not just modified in editor)
- Restart the dev server: `docker-compose restart app`
- Clear browser cache (Ctrl+Shift+Delete)

### Changes not reflecting
- Ensure volumes are properly mounted: `docker-compose ps`
- Check Docker logs: `docker-compose logs app`
- Restart containers: `docker-compose down && docker-compose up`


