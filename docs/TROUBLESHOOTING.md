# Troubleshooting Guide

Common issues and solutions for pgInspect.

## Connection Issues

### "getaddrinfo ENOTFOUND" Error

**Cause:** Wrong hostname or DNS resolution failure

**Solutions:**

**For Local Docker Database:**
- ✅ Use `database` as hostname (not `localhost`) when backend runs in Docker
- ✅ Use `localhost` when backend runs locally
- ✅ Verify containers are running: `docker ps`

**For Railway Database:**
- ❌ Don't use `.railway.internal` hostnames
- ✅ Enable TCP Proxy in Railway dashboard
- ✅ Use `.proxy.rlwy.net` hostname
- ✅ Example: `postgres-abc.proxy.rlwy.net:12345`

**For Other Cloud Databases:**
- ✅ Use external/public hostname
- ✅ Verify database allows external connections
- ✅ Check firewall/security group settings

### "Connection timeout"

**Cause:** Database not reachable or firewall blocking

**Solutions:**
```bash
# Check if containers are running
docker ps

# Check database is accessible
docker exec -it pginspect-db psql -U postgres -d pgadmin

# Check backend logs
docker-compose logs app --tail=50

# Check database logs
docker-compose logs database --tail=50

# Verify port is exposed
docker-compose ps
```

### "Authentication failed"

**Cause:** Wrong username or password

**Solutions:**
- For local Docker: Use `postgres` / `postgres`
- For cloud databases: Copy credentials from dashboard
- Check for typos in password
- Verify username is correct
- For Supabase: URL-encode special characters

### "SSL connection required"

**Cause:** Cloud database requires SSL but it's disabled

**Solution:**
- Change SSL Mode to `require`
- Add `?sslmode=require` to connection string
- Local Docker database uses `disable`

### Supabase SASL_SIGNATURE_MISMATCH

**Cause:** Special characters in password or wrong connection mode

**Solutions:**

1. **Use Transaction Pooler (Port 6543):**
```
Host: aws-0-[region].pooler.supabase.com
Port: 6543
SSL Mode: require
```

2. **URL-encode password:**
```
^ → %5E
$ → %24
* → %2A
@ → %40
# → %23
```

3. **Or reset password to alphanumeric only:**
- Go to Supabase Dashboard → Settings → Database
- Click "Reset Password"
- Use only letters and numbers (e.g., `MyPassword123`)

## Application Issues

### Backend Won't Start

**Cause:** Port conflict or missing dependencies

**Solutions:**
```bash
# Check if port 3000 is available
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000

# Kill process using port 3000
# Windows
taskkill /PID <PID> /F

# Mac/Linux
kill -9 <PID>

# Reinstall dependencies
rm -rf node_modules
npm install

# Check environment variables
cat .env
```

### Frontend Can't Connect to Backend

**Cause:** CORS or proxy configuration issue

**Solutions:**
```bash
# Check backend is running
curl http://localhost:3000/api/health

# Check CORS_ORIGIN in .env
# Should include: http://localhost:8080

# Check browser console for errors
# Press F12 → Console tab

# Clear browser cache
# Press Ctrl+Shift+Delete
```

### "Missing Clerk Publishable Key" Error

**Cause:** Environment variable not set

**Solution:**
```bash
# Check if variable is set
echo $VITE_CLERK_PUBLISHABLE_KEY

# Make sure it's in .env file
cat .env | grep CLERK

# Restart development server
npm run dev
```

### Users Not Syncing to Database

**Cause:** Database connection issue or missing schema

**Solution:**
```bash
# Check database tables exist
docker exec pginspect-db psql -U postgres -d pgadmin -c "\dt"

# Expected tables: users, user_connections, saved_views

# Reinitialize schema if needed
docker exec -i pginspect-db psql -U postgres -d pgadmin < db/schema.sql
```

## Docker Issues

### Container Won't Start

**Solutions:**
```bash
# Check logs
docker-compose logs app --tail=50

# Check environment variables
docker exec pginspect-app-1 env | grep CLERK

# Restart container
docker-compose restart app

# Rebuild container
docker-compose up --build
```

### Database Connection Failed in Docker

**Solutions:**
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

**Solutions:**
```bash
# Check what's using the port
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000

# Kill the process or change port in docker-compose.yml
```

### Docker Build Fails

**Solutions:**
```bash
# Clear Docker cache
docker system prune -a

# Remove old containers and volumes
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache

# Check Dockerfile syntax
cat Dockerfile
```

### Schema Not Created

**Solutions:**
```bash
# Check if schema file exists
ls -la db/schema.sql

# Manually run schema
docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < db/schema.sql

# Verify tables created
docker exec pginspect-database-1 psql -U postgres -d pgadmin -c "\dt"

# Expected tables: users, user_connections, saved_views
```

## Query Issues

### "Query execution failed"

**Cause:** Invalid SQL or permissions issue

**Solutions:**
- Check SQL syntax
- Only SELECT queries are allowed (security feature)
- Verify you have permissions on the table
- Check query timeout (default 30s)
- Check result row limit (default 10,000)

### Query Timeout

**Cause:** Query takes too long to execute

**Solutions:**
- Optimize query with indexes
- Add WHERE clause to limit rows
- Increase timeout in `.env`:
```env
QUERY_TIMEOUT=60000  # 60 seconds
```

### Too Many Results

**Cause:** Query returns more than row limit

**Solutions:**
- Add LIMIT clause to query
- Increase limit in `.env`:
```env
MAX_RESULT_ROWS=50000
```

## Authentication Issues

### Authentication Fails in Production

**Cause:** Wrong domain configuration

**Solution:**
1. Check Clerk Dashboard → Domains
2. Ensure production domain is added
3. Verify redirect URLs are correct:
   - Sign-in: `https://your-domain.com/sign-in`
   - Sign-up: `https://your-domain.com/sign-up`
   - After sign-in: `https://your-domain.com/app`

### OAuth Providers Not Working

**Cause:** OAuth not enabled in Clerk

**Solution:**
1. Go to Clerk Dashboard
2. Navigate to "User & Authentication" → "Social Connections"
3. Enable Google and Microsoft
4. Save changes

## Performance Issues

### Slow Query Execution

**Solutions:**
- Add indexes to frequently queried columns
- Use WHERE clauses to limit rows
- Avoid SELECT * on large tables
- Use EXPLAIN to analyze query plan

### Slow Page Load

**Solutions:**
- Check network tab in browser (F12)
- Verify backend is responding quickly
- Check database connection pool settings
- Clear browser cache

## Debug Mode

Enable detailed logging:

```bash
# In .env
LOG_LEVEL=debug

# Restart backend
npm run dev

# Or in Docker
docker-compose restart app

# View logs
docker-compose logs app -f
```

## Health Checks

```bash
# Check API health
curl http://localhost:3000/api/health

# Expected response:
# {"success":true,"data":{"status":"ok","uptime":123,...}}

# Check database health
docker exec pginspect-db pg_isready -U postgres

# Check container health
docker ps
# Both containers should show "healthy"
```

## Getting Help

If you're still having issues:

1. **Check logs:**
```bash
# Application logs
docker-compose logs app --tail=100

# Database logs
docker-compose logs database --tail=100
```

2. **Check browser console:**
- Press F12
- Go to Console tab
- Look for red errors

3. **Check network requests:**
- Press F12
- Go to Network tab
- Try the failing operation
- Check the API request/response

4. **Verify setup:**
```bash
# Check Docker version
docker --version
docker-compose --version

# Check containers
docker ps

# Check environment
cat .env
```

5. **Review documentation:**
- [SETUP.md](SETUP.md) - Installation guide
- [CONNECTIONS.md](CONNECTIONS.md) - Connection guide
- [AUTHENTICATION.md](AUTHENTICATION.md) - Auth setup
- [DOCKER.md](DOCKER.md) - Docker guide

6. **Create an issue:**
- Include error messages
- Include relevant logs
- Describe what you tried
- Mention your OS and Docker version

## Common Mistakes

1. **Using wrong hostname:**
   - Use `database` in Docker, `localhost` locally

2. **Missing environment variables:**
   - Check `.env` file exists and has all required variables

3. **Wrong Clerk keys:**
   - Use test keys for development, live keys for production

4. **Forgetting to initialize database:**
   - Run `db/schema.sql` after starting PostgreSQL

5. **Port conflicts:**
   - Check if ports 3000, 5000, 8080, 9000 are available

6. **Not restarting after config changes:**
   - Restart dev server or Docker containers after changing `.env`

For more help, see other documentation in the [docs/](.) folder.
