# Docker Guide

Complete Docker reference for pgInspect.

## Overview

pgInspect uses Docker Compose to orchestrate three services:
- **app** - Frontend (React) + Backend (Bun/Node.js)
- **database** - PostgreSQL 16

## Quick Reference

```bash
# Deploy application
bash scripts/deploy.sh          # Linux/Mac
pwsh scripts/deploy.ps1         # Windows

# View logs
docker-compose logs -f

# Stop application
docker-compose down

# Restart application
docker-compose restart

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Docker Compose Configuration

### Services

#### App Service

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "9000:9000"  # Backend API
      - "5000:5000"  # Frontend
    env_file:
      - .env.docker
    depends_on:
      database:
        condition: service_healthy
```

**Ports:**
- 5000: Frontend (React/Vite)
- 9000: Backend API (Bun/Node.js)

**Environment:** Loaded from `.env.docker`

**Dependencies:** Waits for database to be healthy before starting

#### Database Service

```yaml
  database:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=pgadmin
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./db/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**Image:** PostgreSQL 16 Alpine (lightweight)

**Ports:** 5432 (PostgreSQL default)

**Volumes:**
- `postgres-data`: Persistent database storage
- `schema.sql`: Auto-applied on first startup

**Health Check:** Ensures database is ready before app starts

### Volumes

```yaml
volumes:
  postgres-data:
    driver: local
```

**postgres-data:** Persists database data across container restarts

### Networks

```yaml
networks:
  app-network:
    driver: bridge
```

**app-network:** Allows containers to communicate using service names

## Dockerfile

Multi-stage build for optimized production images:

### Stage 1: Builder

```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package*.json ./
RUN bun install
COPY . .
RUN bun run build
```

- Installs dependencies
- Builds frontend (Vite)
- Compiles TypeScript

### Stage 2: Production

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 9000 5000
CMD ["bun", "run", "start"]
```

- Copies only production files
- Exposes ports
- Starts application

## Common Commands

### Starting and Stopping

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d app
docker-compose up -d database

# Stop all services
docker-compose down

# Stop and remove volumes (deletes data!)
docker-compose down -v

# Stop specific service
docker-compose stop app
docker-compose stop database
```

### Building

```bash
# Build all images
docker-compose build

# Build without cache (clean build)
docker-compose build --no-cache

# Build specific service
docker-compose build app
```

### Logs

```bash
# View all logs (follow mode)
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app
docker-compose logs -f database

# View last N lines
docker-compose logs --tail=100

# View logs since timestamp
docker-compose logs --since 2024-01-01T00:00:00
```

### Container Management

```bash
# List running containers
docker-compose ps

# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart app

# Execute command in container
docker-compose exec app sh
docker-compose exec database psql -U postgres -d pgadmin

# View container resource usage
docker stats
```

### Database Operations

```bash
# Access PostgreSQL CLI
docker exec -it pginspect-database-1 psql -U postgres -d pgadmin

# Run SQL file
docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < db/schema.sql

# Backup database
docker exec pginspect-database-1 pg_dump -U postgres pgadmin > backup.sql

# Restore database
docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < backup.sql

# List tables
docker exec -it pginspect-database-1 psql -U postgres -d pgadmin -c "\dt"

# View table schema
docker exec -it pginspect-database-1 psql -U postgres -d pgadmin -c "\d users"
```

## Environment Variables

Environment variables are loaded from `.env.docker`:

### Database Variables

```env
DATABASE_URL=postgresql://postgres:postgres@database:5432/pgadmin
DB_POOL_MIN=2
DB_POOL_MAX=5
```

### Server Variables

```env
PORT=9000
NODE_ENV=development
LOG_LEVEL=debug
```

### Security Variables

```env
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
ENCRYPTION_KEY=...
CORS_ORIGIN=http://localhost:5000,http://localhost:9000
```

### Frontend Variables

```env
VITE_PORT=5000
VITE_API_URL=http://localhost:9000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## Networking

### Service Communication

Containers communicate using service names:

```env
# From app container to database
DATABASE_URL=postgresql://postgres:postgres@database:5432/pgadmin
```

### Host Access

Access services from host machine:

```
Frontend:  http://localhost:5000
Backend:   http://localhost:9000
Database:  localhost:5432
```

### Container to Host

Access host services from containers:

```
# Linux
host.docker.internal

# Mac/Windows
host.docker.internal
```

## Volumes and Data Persistence

### Database Data

```yaml
volumes:
  - postgres-data:/var/lib/postgresql/data
```

Data persists across container restarts. To delete:

```bash
docker-compose down -v
```

### Schema Initialization

```yaml
volumes:
  - ./db/schema.sql:/docker-entrypoint-initdb.d/schema.sql
```

Schema is automatically applied on first startup only.

## Health Checks

### Database Health Check

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

Ensures database is ready before app starts.

### Manual Health Check

```bash
# Check database
docker exec pginspect-database-1 pg_isready -U postgres

# Check backend API
curl http://localhost:9000/api/health
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs app

# Check container status
docker-compose ps

# Inspect container
docker inspect pginspect-app-1
```

### Port Conflicts

```bash
# Find what's using the port
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Change port in .env.docker
VITE_PORT=5001
```

### Database Connection Issues

```bash
# Check database is running
docker-compose ps database

# Check database logs
docker-compose logs database

# Test connection
docker exec pginspect-database-1 pg_isready -U postgres
```

### Clean Restart

```bash
# Stop everything
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Clean Docker system
docker system prune -a

# Rebuild and start
bash scripts/deploy.sh
```

## Resource Management

### View Resource Usage

```bash
# All containers
docker stats

# Specific container
docker stats pginspect-app-1
```

### Configure Resources

Edit Docker Desktop settings:
- Memory: Minimum 4GB recommended
- CPU: 2+ cores recommended
- Disk: 10GB+ free space

### Limit Container Resources

Add to `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Production Considerations

### Security

1. **Use secrets for sensitive data:**
   ```yaml
   secrets:
     db_password:
       file: ./secrets/db_password.txt
   ```

2. **Don't expose database port:**
   ```yaml
   database:
     # Remove or comment out
     # ports:
     #   - "5432:5432"
   ```

3. **Use environment-specific configs:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

### Performance

1. **Use production builds:**
   ```env
   NODE_ENV=production
   ```

2. **Optimize connection pool:**
   ```env
   DB_POOL_MIN=5
   DB_POOL_MAX=20
   ```

3. **Enable logging:**
   ```env
   LOG_LEVEL=info
   ENABLE_QUERY_LOGGING=false
   ```

### Monitoring

1. **Health checks:**
   ```bash
   curl http://localhost:9000/api/health
   ```

2. **Container logs:**
   ```bash
   docker-compose logs -f --tail=100
   ```

3. **Resource monitoring:**
   ```bash
   docker stats
   ```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Bun Docker Image](https://hub.docker.com/r/oven/bun)

## Support

- [Setup Guide](SETUP.md) - Initial setup
- [Deployment Guide](DEPLOYMENT.md) - Deployment instructions
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues
