# Docker Guide

Complete guide for deploying pgInspect with Docker.

## Quick Start

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

## Docker Configuration

### Environment File

Create `.env.docker` for Docker-specific configuration:

```env
# Database (Docker internal network)
DATABASE_URL=postgresql://postgres:postgres@database:5432/pgadmin

# Server
PORT=9000
NODE_ENV=development

# Security
CORS_ORIGIN=http://localhost:5000,http://localhost:9000

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Encryption Key
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

**Key Differences from Local Development:**
- Uses `database:5432` instead of `localhost:5432`
- Backend runs on port 9000
- Frontend runs on port 5000

### Port Mapping

| Service | Internal Port | External Port | URL |
|---------|--------------|---------------|-----|
| Frontend | 5000 | 5000 | http://localhost:5000 |
| Backend | 9000 | 9000 | http://localhost:9000 |
| Database | 5432 | 5432 | localhost:5432 |

## Docker Commands

### Basic Operations

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs (all services)
docker-compose logs -f

# View specific service logs
docker-compose logs app -f
docker-compose logs database -f

# Check container status
docker ps

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Database Operations

```bash
# Access PostgreSQL shell
docker exec -it pginspect-database-1 psql -U postgres -d pgadmin

# Run SQL file
docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < your-file.sql

# Backup database
docker exec pginspect-database-1 pg_dump -U postgres pgadmin > backup.sql

# Restore database
docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < backup.sql

# Check database tables
docker exec pginspect-database-1 psql -U postgres -d pgadmin -c "\dt"
```

### Container Management

```bash
# View container resource usage
docker stats

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove all volumes (WARNING: deletes data)
docker volume prune
```

### Reset Database

**WARNING: This deletes all data!**

```bash
# Stop and remove volumes
docker-compose down -v

# Start services
docker-compose up -d

# Reinitialize database
docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < db/schema.sql
```

## Docker Compose Services

### App Service

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

**Features:**
- Builds from Dockerfile
- Hot reload in development
- Health checks
- Automatic restart

### Database Service

```yaml
services:
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

**Features:**
- PostgreSQL 16 Alpine (lightweight)
- Persistent data volume
- Automatic schema initialization
- Health checks

## Dockerfile

```dockerfile
FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package*.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy application code
COPY . .

# Build frontend
RUN bun run build

# Expose ports
EXPOSE 9000 5000

# Start server
CMD ["bun", "src/server/index.ts"]
```

## Production Deployment

### Step 1: Update Environment

Create `.env.production`:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@your-db-host:5432/dbname
PORT=9000
LOG_LEVEL=info

# Production Clerk keys
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...

# Strong encryption key
ENCRYPTION_KEY=<generate-strong-random-key>

# Production CORS
CORS_ORIGIN=https://your-domain.com

# Security settings
QUERY_TIMEOUT=30000
MAX_RESULT_ROWS=10000
```

### Step 2: Build Production Image

```bash
# Build with production environment
docker-compose -f docker-compose.yml build

# Start services
docker-compose -f docker-compose.yml up -d
```

### Step 3: Initialize Database

```bash
# Connect to production database
psql $DATABASE_URL < db/schema.sql

# Or if using Docker
docker exec -i your-db-container psql -U user -d dbname < db/schema.sql
```

### Step 4: Verify Deployment

```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Check database tables
psql $DATABASE_URL -c "\dt"
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs app --tail=50

# Check environment variables
docker exec pginspect-app-1 env | grep CLERK

# Restart container
docker-compose restart app
```

### Database Connection Failed

```bash
# Check if database is running
docker ps | grep database

# Check database logs
docker-compose logs database --tail=50

# Test database connection
docker exec pginspect-database-1 pg_isready -U postgres

# Verify database exists
docker exec pginspect-database-1 psql -U postgres -l
```

### Port Already in Use

```bash
# Check what's using the port
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000

# Kill the process or change port in docker-compose.yml
```

### Build Fails

```bash
# Clear Docker cache
docker system prune -a

# Remove old containers and volumes
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache
```

## Best Practices

1. **Use volumes** for persistent data
2. **Set resource limits** in production
3. **Enable health checks** for all services
4. **Use secrets** for sensitive data
5. **Monitor logs** regularly
6. **Backup database** regularly
7. **Update images** periodically
8. **Use specific image tags** (not `latest`)

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)

For more help, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
