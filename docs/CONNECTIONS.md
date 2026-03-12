# Database Connections Guide

Complete guide for connecting pgInspect to various PostgreSQL databases.

## Connection Methods

### Method 1: Connection String (Recommended)

1. Click "New Connection" → "Connection String"
2. Paste your full connection string
3. Give it a name
4. Click "Save & Connect"

**Format:**
```
postgresql://username:password@host:port/database?sslmode=require
```

### Method 2: Direct Connection

1. Click "New Connection" → "Direct Connection"
2. Fill in each field manually:
   - Host
   - Port
   - Database
   - Username
   - Password
   - SSL Mode
3. Click "Save & Connect"

### Method 3: Cloud Preset

1. Click "New Connection" → "Cloud Preset"
2. Select your provider (Railway, Supabase, Neon)
3. Fill in the pre-configured form
4. Click "Save & Connect"

## Local Docker Database

### When Backend Runs Locally (Development)

```
Host: localhost
Port: 5432
Database: pgadmin
Username: postgres
Password: postgres
SSL Mode: disable
```

**Connection String:**
```
postgresql://postgres:postgres@localhost:5432/pgadmin
```

### When Backend Runs in Docker

```
Host: database
Port: 5432
Database: pgadmin
Username: postgres
Password: postgres
SSL Mode: disable
```

**Connection String:**
```
postgresql://postgres:postgres@database:5432/pgadmin
```

### Host Machine Database

If PostgreSQL is running on your host machine:

```
Host: host.docker.internal
Port: 5432
Database: your_database
Username: your_username
Password: your_password
SSL Mode: disable
```

## Cloud Databases

### Railway

1. **Enable TCP Proxy:**
   - Go to Railway dashboard
   - Select your PostgreSQL service
   - Go to Settings → Networking
   - Click "+ TCP Proxy"
   - Copy the generated hostname and port

2. **Connection:**
```
Host: <something>.proxy.rlwy.net
Port: <tcp-proxy-port>
Database: railway
Username: postgres
Password: <your-password>
SSL Mode: require
```

**Connection String:**
```
postgresql://postgres:password@abc.proxy.rlwy.net:12345/railway?sslmode=require
```

**Important:**
- ❌ Don't use `.railway.internal` hostnames (only work within Railway)
- ✅ Use `.proxy.rlwy.net` hostnames (work from anywhere)
- ✅ Always use `sslmode=require`

### Supabase

**Use Transaction Pooler (Port 6543):**

1. **Get Connection Details:**
   - Go to Supabase Dashboard → Settings → Database
   - Find "Connection string" section
   - Select **Transaction pooler** option
   - Copy the connection string

2. **Connection:**
```
Host: aws-0-[region].pooler.supabase.com
Port: 6543
Database: postgres
Username: postgres.[your-ref]
Password: [your-password]
SSL Mode: require
```

**Connection String:**
```
postgresql://postgres.[ref]:password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
```

**Password Encoding:**

If your password contains special characters, URL-encode them:
- `^` → `%5E`
- `$` → `%24`
- `*` → `%2A`
- `@` → `%40`
- `#` → `%23`

**Example:**
```
Password: P^d3CHa8OngFC$nQ3*jf
Encoded:  P%5Ed3CHa8OngFC%24nQ3%2Ajf
```

**Important:**
- ✅ Use Transaction Pooler (port 6543)
- ❌ Don't use Direct Connection (port 5432)
- ❌ Don't use Session Pooler
- ✅ Always use `sslmode=require`

### Neon

```
Host: <endpoint>.neon.tech
Port: 5432
Database: <your-database>
Username: <your-username>
Password: <your-password>
SSL Mode: require
```

**Connection String:**
```
postgresql://username:password@endpoint.neon.tech:5432/database?sslmode=require
```

## Connection Context Reference

| Backend Location | Database Location | Hostname |
|------------------|-------------------|----------|
| Local (npm run dev) | Docker container | `localhost` |
| Docker container | Docker container | `database` |
| Docker container | Host machine | `host.docker.internal` |
| Local | Host machine | `localhost` |
| Any | Cloud (Railway, Supabase, etc.) | Provider hostname |

## Testing Connections

### Via UI

Click "Test Connection" button before saving.

### Via API

```bash
curl -X POST http://localhost:3000/api/connections/test \
  -H "Content-Type: application/json" \
  -d '{"connectionString":"postgresql://user:pass@host:port/db"}'
```

### Via Command Line

```bash
# Test local Docker database
docker exec -it pginspect-db psql -U postgres -d pgadmin

# Test external database
psql "postgresql://user:pass@host:port/db"
```

## Troubleshooting

### "getaddrinfo ENOTFOUND" Error

**Cause**: Wrong hostname or DNS resolution failure

**Solutions:**
- For local Docker: Use `database` (not `localhost`)
- For Railway: Enable TCP Proxy, use `.proxy.rlwy.net` hostname
- For cloud databases: Use external/public hostname

### "Connection timeout"

**Cause**: Database not reachable or firewall blocking

**Solutions:**
```bash
# Check if containers are running
docker ps

# Check database is accessible
docker exec -it pginspect-db psql -U postgres -d pgadmin

# Check logs
docker-compose logs database --tail=50
```

### "Authentication failed"

**Cause**: Wrong username or password

**Solutions:**
- Verify credentials from database dashboard
- Check for typos in password
- For Supabase: URL-encode special characters

### "SSL connection required"

**Cause**: Cloud database requires SSL but it's disabled

**Solution:**
- Change SSL Mode to `require`
- Add `?sslmode=require` to connection string

## Security Notes

- All database passwords are encrypted with AES-256-GCM before storage
- Connections are isolated per user
- Use SSL/TLS for cloud databases
- Never commit connection strings to version control

## Additional Resources

- [Supabase Connection Guide](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Railway Database Guide](https://docs.railway.app/databases/postgresql)
- [Neon Connection Guide](https://neon.tech/docs/connect/connect-from-any-app)

For more troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
