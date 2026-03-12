# Database Connections Guide

Learn how to connect pgInspect to various PostgreSQL databases.

## Quick Start

After deploying pgInspect, you can connect to:
- Built-in PostgreSQL database (included with Docker deployment)
- Local databases on your machine
- Cloud databases (Supabase, Neon, AWS RDS, etc.)
- Other Docker containers

## Built-in Database

The Docker deployment includes a PostgreSQL database ready to use.

### Connection Details

```
Name:     Local Database
Host:     localhost
Port:     5432
Database: pgadmin
Username: postgres
Password: postgres
SSL Mode: disable
```

### How to Connect

1. Open pgInspect at http://localhost:9000
2. Sign in with your account
3. Click "New Connection"
4. Fill in the details above
5. Click "Save & Connect"

You should now see three tables:
- `users` - User accounts
- `user_connections` - Saved database connections
- `saved_views` - Saved queries

## Connection Methods

pgInspect supports three ways to connect to databases:

### Method 1: Connection String (Recommended)

Best for cloud databases that provide a connection string.

1. Click "New Connection" → "Connection String"
2. Paste your full connection string
3. Give it a name
4. Click "Save & Connect"

**Format:**
```
postgresql://username:password@host:port/database?sslmode=require
```

**Example:**
```
postgresql://postgres:mypassword@db.example.com:5432/mydb?sslmode=require
```

### Method 2: Manual Connection

Best when you have individual connection details.

1. Click "New Connection" → "Manual Connection"
2. Fill in each field:
   - **Name:** Friendly name for this connection
   - **Host:** Database server hostname or IP
   - **Port:** Usually 5432
   - **Database:** Database name
   - **Username:** Database user
   - **Password:** Database password
   - **SSL Mode:** disable, prefer, or require
3. Click "Save & Connect"

### Method 3: Cloud Preset

Best for popular cloud providers with pre-configured settings.

1. Click "New Connection" → "Cloud Preset"
2. Select your provider:
   - Supabase
   - Neon
   - Render
   - AWS RDS
   - PlanetScale
3. Fill in the pre-configured form
4. Click "Save & Connect"

## Cloud Databases

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
Password: <your-password>
SSL Mode: require
```

**Connection String:**
```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require
```

**Important:**
- ✅ Use Transaction Pooler (port 6543), not direct connection
- ✅ Always use `sslmode=require`
- ❌ Don't use Session Pooler for web applications

### Neon

1. **Get Connection Details:**
   - Go to Neon Dashboard → Connection Details
   - Copy the connection string

2. **Connection:**
```
Host: <endpoint>.neon.tech
Port: 5432
Database: neondb
Username: <your-username>
Password: <your-password>
SSL Mode: require
```

**Connection String:**
```
postgresql://user:password@endpoint.neon.tech:5432/neondb?sslmode=require
```

### AWS RDS

1. **Get Connection Details:**
   - Go to RDS Console → Databases
   - Select your database
   - Find "Connectivity & security" section
   - Copy the endpoint

2. **Connection:**
```
Host: <instance>.rds.amazonaws.com
Port: 5432
Database: postgres
Username: postgres
Password: <your-password>
SSL Mode: require
```

**Important:**
- ✅ Ensure security group allows inbound connections on port 5432
- ✅ Database must be publicly accessible (or use VPN/bastion)
- ✅ Use SSL for security

### Render

1. **Get Connection Details:**
   - Go to Render Dashboard → PostgreSQL
   - Copy "External Database URL"

2. **Connection:**
```
Host: <host>.render.com
Port: 5432
Database: <database>
Username: <username>
Password: <your-password>
SSL Mode: require
```

### Other Cloud Providers

Most PostgreSQL cloud providers work with pgInspect. You need:
- External/public hostname
- Port (usually 5432)
- Database name
- Username and password
- SSL enabled (recommended)

## Local Databases

### Connecting to Host Machine Database

If you have PostgreSQL running on your host machine:

```
Host: host.docker.internal
Port: 5432
Database: your_database
Username: your_username
Password: your_password
SSL Mode: disable
```

**Note:** Use `host.docker.internal` instead of `localhost` when connecting from Docker containers.

### Connecting to Another Docker Container

If your database is in another Docker container:

1. **Ensure containers are on the same network:**
   ```bash
   docker network create my-network
   docker network connect my-network pginspect-app-1
   docker network connect my-network your-database-container
   ```

2. **Connect using container name:**
   ```
   Host: your-database-container
   Port: 5432
   Database: your_database
   Username: your_username
   Password: your_password
   SSL Mode: disable
   ```

## Connection Security

### SSL/TLS

For cloud databases, always use SSL:

```
SSL Mode: require
```

For local development, SSL can be disabled:

```
SSL Mode: disable
```

### Password Encryption

All passwords are encrypted before storage using:
- **Algorithm:** AES-256-GCM
- **Key:** From `ENCRYPTION_KEY` in `.env.docker`
- **Storage:** Encrypted in `user_connections` table

### Connection Isolation

- Each user can only see their own connections
- Connections are isolated at the database level
- No cross-user data access

## Testing Connections

### Test Before Saving

pgInspect tests the connection before saving:
1. Attempts to connect to the database
2. Verifies credentials
3. Checks permissions
4. Only saves if successful

### Manual Testing

Test connection from command line:

```bash
# Test from host machine
psql "postgresql://user:pass@host:port/database"

# Test from Docker container
docker exec -it pginspect-app-1 psql "postgresql://user:pass@host:port/database"
```

## Troubleshooting

### Connection Refused

**Symptoms:**
```
Connection refused
ECONNREFUSED
```

**Solutions:**
- Verify database is running
- Check host and port are correct
- Ensure firewall allows connections
- For cloud databases, check security groups/firewall rules

### Connection Timeout

**Symptoms:**
```
Connection timeout
ETIMEDOUT
```

**Solutions:**
- Check network connectivity
- Verify hostname is correct
- Ensure database is publicly accessible
- Check firewall rules

### Authentication Failed

**Symptoms:**
```
Authentication failed
password authentication failed
```

**Solutions:**
- Verify username and password
- Check user has access to the database
- Ensure user has necessary permissions

### SSL Required

**Symptoms:**
```
SSL connection required
no pg_hba.conf entry for host
```

**Solutions:**
- Change SSL Mode to "require"
- For cloud databases, always use SSL
- Check database SSL configuration

### Host Resolution Failed

**Symptoms:**
```
getaddrinfo ENOTFOUND
Could not resolve hostname
```

**Solutions:**
- Verify hostname is correct
- Check DNS resolution
- Try using IP address instead
- For `localhost`, use `host.docker.internal` from Docker

## Connection Limits

### Per User

- No limit on number of saved connections
- Each connection is tested before saving
- Inactive connections are automatically closed

### Connection Pooling

Backend uses connection pooling:

```env
DB_POOL_MIN=2
DB_POOL_MAX=5
```

Adjust in `.env.docker` if needed.

### Query Timeout

Queries timeout after 30 seconds by default:

```env
QUERY_TIMEOUT=30000
```

Increase for long-running queries.

## Best Practices

1. **Use descriptive names** for connections
2. **Enable SSL** for cloud databases
3. **Use read-only users** when possible
4. **Test connections** before saving
5. **Keep credentials secure** - never commit to git
6. **Use connection strings** for cloud databases
7. **Document connection details** for your team

## Connection Examples

### Development

```
Name: Local Dev
Host: localhost
Port: 5432
Database: myapp_dev
Username: developer
Password: devpass
SSL Mode: disable
```

### Staging

```
Name: Staging DB
Host: staging-db.example.com
Port: 5432
Database: myapp_staging
Username: app_user
Password: <secure-password>
SSL Mode: require
```

### Production

```
Name: Production DB (Read-Only)
Host: prod-db.example.com
Port: 5432
Database: myapp_prod
Username: readonly_user
Password: <secure-password>
SSL Mode: require
```

## Additional Resources

- [Supabase Connection Guide](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Neon Connection Guide](https://neon.tech/docs/connect/connect-from-any-app)
- [AWS RDS Connection Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ConnectToPostgreSQLInstance.html)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)

## Support

- [Setup Guide](SETUP.md) - Initial setup
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues
- [Docker Guide](DOCKER.md) - Docker commands
