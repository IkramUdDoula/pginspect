# Troubleshooting Guide

Common issues and solutions for pgInspect.

## Setup Issues

### PostgreSQL Not Running

**Symptoms:**
```
Connection refused
ECONNREFUSED localhost:5432
```

**Solutions:**
1. Start PostgreSQL service:
   ```bash
   # Linux
   sudo systemctl start postgresql
   
   # macOS
   brew services start postgresql
   
   # Windows - Start from Services or pgAdmin
   ```
2. Verify: `psql --version`
3. Check status: `pg_isready`

### Port Already in Use

**Symptoms:**
```
Error: port is already allocated
Address already in use
```

**Solutions:**

**Option 1:** Stop the service using the port
```bash
# Find what's using the port
lsof -i :9000  # Mac/Linux
netstat -ano | findstr :9000  # Windows

# Stop the process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

**Option 2:** Change port in `.env`
```env
PORT=9001
VITE_API_URL=http://localhost:9001
CORS_ORIGIN=http://localhost:9001
```

Then restart:
```bash
npm run dev
```

### Environment File Missing

**Symptoms:**
```
Error: .env file not found
Missing environment variables
```

**Solution:**
```bash
cp .env.example .env
# Edit .env with your Clerk keys and database URL
npm run dev
```

### Dependencies Installation Failed

**Symptoms:**
```
npm ERR! code ERESOLVE
Module not found
```

**Solutions:**

1. **Clean install:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Use Bun instead:**
   ```bash
   rm -rf node_modules bun.lockb
   bun install
   ```

3. **Check Node.js version:**
   ```bash
   node --version  # Should be 18+
   ```

### Build Failures

**Symptoms:**
```
Error: build failed
TypeScript errors
```

**Solutions:**

1. **Clean build:**
   ```bash
   rm -rf dist
   npm run build
   ```

2. **Check TypeScript errors:**
   ```bash
   npm run lint
   ```

3. **Update dependencies:**
   ```bash
   npm update
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

1. **Verify Clerk keys in `.env`:**
   ```env
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

2. **Check for common mistakes:**
   - No extra spaces or quotes
   - Same publishable key for both variables
   - Keys from correct Clerk application

3. **Restart server:**
   ```bash
   # Stop with Ctrl+C
   npm run dev
   ```

4. **Verify Clerk Dashboard settings:**
   - Allowed origins: `http://localhost:9000`
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
   CORS_ORIGIN=http://localhost:9000
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
   - Add `http://localhost:9000`

## Database Issues

### Can't Connect to Database

**Symptoms:**
```
Connection refused
ECONNREFUSED localhost:5432
```

**Solutions:**

1. **Check PostgreSQL is running:**
   ```bash
   pg_isready
   # OR
   psql -U postgres -c "SELECT 1"
   ```

2. **Start PostgreSQL:**
   ```bash
   # Linux
   sudo systemctl start postgresql
   
   # macOS
   brew services start postgresql
   ```

3. **Check DATABASE_URL in `.env`:**
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/pgadmin
   ```

4. **Verify database exists:**
   ```bash
   psql -U postgres -l | grep pgadmin
   ```

### Database Schema Not Initialized

**Symptoms:**
- Tables don't exist
- "relation does not exist" errors

**Solutions:**

1. **Check if schema was applied:**
   ```bash
   psql -U postgres -d pgadmin -c "\dt"
   ```

2. **Apply schema:**
   ```bash
   psql -U postgres -d pgadmin -f db/schema.sql
   ```

3. **Create database if missing:**
   ```bash
   createdb pgadmin
   psql -U postgres -d pgadmin -f db/schema.sql
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
- Use `localhost` for local connections
- Ensure database is listening on correct port

**Test connection:**
```bash
psql "postgresql://user:pass@host:port/database"
```

## Application Issues

### Frontend Not Loading

**Symptoms:**
- Blank page
- "Cannot GET /" error
- 404 errors

**Solutions:**

1. **Check server is running:**
   ```bash
   # Should see "Server running on port 9000"
   ```

2. **Verify port:**
   - Should be http://localhost:9000
   - Check `.env` for `PORT`

3. **Rebuild:**
   ```bash
   npm run build
   npm start
   ```

4. **Check browser console for errors**

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

2. **Check server logs in terminal**

3. **Verify API URL in `.env`:**
   ```env
   VITE_API_URL=http://localhost:9000
   ```

4. **Check CORS settings:**
   ```env
   CORS_ORIGIN=http://localhost:9000
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
   psql -U postgres -d pgadmin -c "\dt"
   ```
   Should show `saved_views` table

2. **Check user is authenticated:**
   - Sign out and sign in again
   - Check browser console for errors

3. **Check server logs in terminal**

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

1. **Reduce connection pool:**
   ```env
   DB_POOL_MAX=3
   ```

2. **Restart server:**
   ```bash
   # Stop with Ctrl+C
   npm run dev
   ```

3. **Close unused connections in the app**

## Useful Commands

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

### Database

```bash
# Check PostgreSQL status
pg_isready

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS

# Create database
createdb pgadmin

# Apply schema
psql -U postgres -d pgadmin -f db/schema.sql

# Access database
psql -U postgres -d pgadmin

# List tables
psql -U postgres -d pgadmin -c "\dt"

# Query users
psql -U postgres -d pgadmin -c "SELECT * FROM users;"
```

### Debugging

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check PostgreSQL version
psql --version

# Test database connection
psql -U postgres -d pgadmin -c "SELECT 1"

# Test API endpoint
curl http://localhost:9000/api/health
```

## Getting Help

If you're still experiencing issues:

1. **Check server logs in terminal**

2. **Gather information:**
   - Operating system
   - Node.js version: `node --version`
   - PostgreSQL version: `psql --version`
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
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
