# Troubleshooting Guide

Common issues and solutions for pgInspect.

## Deployment Issues

### Docker Not Running

**Symptoms:**
```
❌ Error: Docker is not running
Cannot connect to the Docker daemon
```

**Solutions:**
1. Start Docker Desktop
2. Wait for Docker to fully initialize (check system tray icon)
3. Verify: `docker --version`
4. Try again: `bash scripts/deploy.sh`

### Port Already in Use

**Symptoms:**
```
Error: port is already allocated
Bind for 0.0.0.0:5000 failed: port is already allocated
```

**Solutions:**

**Option 1:** Stop the service using the port
```bash
# Find what's using the port
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Stop the process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

**Option 2:** Change ports in `.env.docker`
```env
PORT=9001              # Backend
VITE_PORT=5001         # Frontend
VITE_API_URL=http://localhost:9001
CORS_ORIGIN=http://localhost:5001,http://localhost:9001
```

Then redeploy:
```bash
docker-compose down
bash scripts/deploy.sh
```

### Environment File Missing

**Symptoms:**
```
❌ Error: .env.docker file not found
```

**Solution:**
```bash
cp .env.docker.example .env.docker
# Edit .env.docker with your Clerk keys
bash scripts/deploy.sh
```

### Containers Failed to Start

**Symptoms:**
```
❌ Error: Containers failed to start
```

**Solutions:**

1. **Check logs:**
   ```bash
   docker-compose logs
   ```

2. **Common causes:**
   - Missing Clerk keys in `.env.docker`
   - Invalid Clerk keys
   - Port conflicts
   - Docker resource limits

3. **Clean restart:**
   ```bash
   docker-compose down -v
   docker system prune -f
   bash scripts/deploy.sh
   ```

### Build Failures

**Symptoms:**
```
Error: failed to solve
Error: build failed
```

**Solutions:**

1. **Clean build:**
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

2. **Check Docker resources:**
   - Docker Desktop → Settings → Resources
   - Increase memory to at least 4GB
   - Increase disk space

3. **Clear Docker cache:**
   ```bash
   docker system prune -a
   ```

## Authentication Issues

### Clerk Authentication Failed

**Symptoms:**
```
Clerk: Invalid publishable key
Authentication failed
401 Unauthorized
```

**Solutions:**

1. **Verify Clerk keys in `.env.docker`:**
   ```env
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

2. **Check for common mistakes:**
   - No extra spaces or quotes
   - Same publishable key for both variables
   - Keys from correct Clerk application

3. **Restart containers:**
   ```bash
   docker-compose restart
   ```

4. **Verify Clerk Dashboard settings:**
   - Allowed origins: `http://localhost:5000`
   - Redirect URLs configured correctly

### Redirect Loop After Sign In

**Symptoms:**
- Sign in successful but keeps redirecting
- Stuck on loading screen

**Solutions:**

1. **Check Clerk redirect URLs:**
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/app`
   - After sign-up: `/app`

2. **Clear browser cache:**
   - Clear cookies and cache
   - Try incognito/private mode

3. **Check CORS settings:**
   ```env
   CORS_ORIGIN=http://localhost:5000,http://localhost:9000
   ```

### OAuth Providers Not Working

**Symptoms:**
- Google/Microsoft sign-in button missing
- OAuth error messages

**Solutions:**

1. **Enable OAuth in Clerk Dashboard:**
   - Go to User & Authentication → Social Connections
   - Enable Google and Microsoft
   - Configure OAuth credentials if needed

2. **Check allowed domains:**
   - Clerk Dashboard → Domains
   - Add `http://localhost:5000`

## Database Issues

### Can't Connect to Built-in Database

**Symptoms:**
```
Connection refused
ECONNREFUSED localhost:5432
```

**Solutions:**

1. **Check database container:**
   ```bash
   docker-compose ps
   ```
   Should show `pginspect-database-1` as "Up"

2. **Check database logs:**
   ```bash
   docker-compose logs database
   ```

3. **Wait for initialization:**
   - Database takes 10-15 seconds to start
   - Wait and try again

4. **Restart database:**
   ```bash
   docker-compose restart database
   ```

5. **Use correct host:**
   - From host machine: `localhost`
   - From Docker container: `database`

### Database Schema Not Initialized

**Symptoms:**
- Tables don't exist
- "relation does not exist" errors

**Solutions:**

The schema is automatically applied on first startup. If it failed:

1. **Check if schema was applied:**
   ```bash
   docker exec -it pginspect-database-1 psql -U postgres -d pgadmin -c "\dt"
   ```

2. **Manually apply schema:**
   ```bash
   docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < db/schema.sql
   ```

3. **Fresh start:**
   ```bash
   docker-compose down -v  # Removes volumes
   bash scripts/deploy.sh
   ```

### Can't Connect to External Database

**Symptoms:**
- Connection timeout
- Connection refused
- SSL errors

**Solutions:**

**For Cloud Databases:**
- ✅ Use external/public hostname provided by your cloud provider
- ✅ Enable SSL/TLS with `sslmode=require`
- ✅ Check firewall rules allow connections
- ✅ Verify credentials are correct

**For Local Databases:**
- Use `host.docker.internal` instead of `localhost` when connecting from Docker
- Ensure database is listening on 0.0.0.0, not just 127.0.0.1

**Test connection:**
```bash
# From host machine
psql "postgresql://user:pass@host:port/database"

# From Docker container
docker exec -it pginspect-app-1 psql "postgresql://user:pass@host:port/database"
```

## Application Issues

### Frontend Not Loading

**Symptoms:**
- Blank page
- "Cannot GET /" error
- 404 errors

**Solutions:**

1. **Check frontend container:**
   ```bash
   docker-compose logs app
   ```

2. **Verify port:**
   - Should be http://localhost:5000
   - Check `.env.docker` for `VITE_PORT`

3. **Restart containers:**
   ```bash
   docker-compose restart
   ```

4. **Rebuild:**
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Backend API Not Responding

**Symptoms:**
```
Failed to fetch
Network error
ERR_CONNECTION_REFUSED
```

**Solutions:**

1. **Check backend is running:**
   ```bash
   curl http://localhost:9000/api/health
   ```
   Should return: `{"status":"ok"}`

2. **Check backend logs:**
   ```bash
   docker-compose logs app
   ```

3. **Verify API URL in `.env.docker`:**
   ```env
   VITE_API_URL=http://localhost:9000
   ```

4. **Check CORS settings:**
   ```env
   CORS_ORIGIN=http://localhost:5000,http://localhost:9000
   ```

### Query Execution Fails

**Symptoms:**
- "Query failed" errors
- Timeout errors
- Permission denied

**Solutions:**

1. **Check query timeout:**
   ```env
   QUERY_TIMEOUT=30000  # 30 seconds
   ```

2. **Check result limits:**
   ```env
   MAX_RESULT_ROWS=1000
   ```

3. **Verify database permissions:**
   - User has SELECT/INSERT/UPDATE/DELETE permissions
   - User can access the schema/table

4. **Check query syntax:**
   - Valid PostgreSQL syntax
   - No SQL injection attempts (blocked by validator)

### Saved Views Not Working

**Symptoms:**
- Can't save views
- Views not loading
- "View not found" errors

**Solutions:**

1. **Check database tables:**
   ```bash
   docker exec -it pginspect-database-1 psql -U postgres -d pgadmin -c "\dt"
   ```
   Should show `saved_views` table

2. **Check user is authenticated:**
   - Sign out and sign in again
   - Check browser console for errors

3. **Check backend logs:**
   ```bash
   docker-compose logs app | grep -i view
   ```

## Performance Issues

### Slow Query Execution

**Solutions:**

1. **Increase timeout:**
   ```env
   QUERY_TIMEOUT=60000  # 60 seconds
   ```

2. **Reduce result limit:**
   ```env
   MAX_RESULT_ROWS=500
   ```

3. **Add LIMIT to queries:**
   ```sql
   SELECT * FROM large_table LIMIT 100;
   ```

4. **Use indexes on target database**

### High Memory Usage

**Solutions:**

1. **Increase Docker memory:**
   - Docker Desktop → Settings → Resources
   - Increase memory limit

2. **Reduce connection pool:**
   ```env
   DB_POOL_MAX=3
   ```

3. **Restart containers:**
   ```bash
   docker-compose restart
   ```

## Useful Commands

### View Logs

```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f database

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart app
docker-compose restart database
```

### Clean Restart

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (deletes data!)
docker-compose down -v

# Rebuild and start
docker-compose build --no-cache
docker-compose up -d
```

### Access Database

```bash
# PostgreSQL CLI
docker exec -it pginspect-database-1 psql -U postgres -d pgadmin

# List tables
docker exec -it pginspect-database-1 psql -U postgres -d pgadmin -c "\dt"

# Query users
docker exec -it pginspect-database-1 psql -U postgres -d pgadmin -c "SELECT * FROM users;"
```

### Check Container Status

```bash
# List containers
docker-compose ps

# Container details
docker inspect pginspect-app-1

# Resource usage
docker stats
```

## Getting Help

If you're still experiencing issues:

1. **Check logs:**
   ```bash
   docker-compose logs > logs.txt
   ```

2. **Gather information:**
   - Operating system
   - Docker version: `docker --version`
   - Error messages
   - Steps to reproduce

3. **Create GitHub issue** with:
   - Description of the problem
   - Error messages
   - Logs (remove sensitive data)
   - Steps to reproduce

## Additional Resources

- [Setup Guide](SETUP.md) - Initial setup instructions
- [Deployment Guide](DEPLOYMENT.md) - Deployment details
- [Connections Guide](CONNECTIONS.md) - Database connection examples
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
