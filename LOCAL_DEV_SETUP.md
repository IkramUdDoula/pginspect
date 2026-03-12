# Local Development Setup

Your pgInspect app is now running locally!

## What's Running

✅ **PostgreSQL Database** (Docker)
- Container: `pginspect-db`
- Port: `5432`
- Database: `pgadmin`
- Username: `postgres`
- Password: `postgres`

✅ **Backend API Server** (Node.js)
- Port: `3000`
- URL: http://localhost:3000
- Health Check: http://localhost:3000/api/health

✅ **Frontend Dev Server** (Vite)
- Port: `8080`
- URL: http://localhost:8080

## Access Your App

Open your browser and go to:
**http://localhost:3000**

The backend proxies to the Vite dev server, so you get hot reload for frontend changes!

## Useful Commands

### Start Development
```bash
npm run dev
```

### Stop Development
Press `Ctrl+C` in the terminal

### Database Commands
```bash
# Check database status
docker ps

# Stop database
docker-compose -f docker-compose.db.yml down

# Start database
docker-compose -f docker-compose.db.yml up -d

# View database logs
docker-compose -f docker-compose.db.yml logs -f

# Access database CLI
docker exec -it pginspect-db psql -U postgres -d pgadmin

# List tables
docker exec -it pginspect-db psql -U postgres -d pgadmin -c "\dt"
```

### Build for Production
```bash
npm run build
npm start
```

## Environment Configuration

Your `.env` file is configured with:
- Database: `postgresql://postgres:postgres@localhost:5432/pgadmin`
- Backend Port: `3000`
- Frontend Port: `8080` (Vite dev server)
- Clerk Authentication: Configured ✅

## First Steps

1. Open http://localhost:3000
2. Sign in with your Clerk account (Google/Microsoft/Email)
3. Create a new connection to your local database:
   ```
   Name:     Local Database
   Host:     localhost
   Port:     5432
   Database: pgadmin
   Username: postgres
   Password: postgres
   SSL Mode: disable
   ```
4. Start querying!

## Troubleshooting

### Authentication Errors (401 Unauthorized)

If you see "Publishable key is missing" errors:

**Solution:** The server needs to load environment variables. This is already fixed with `dotenv/config` in the server file.

If you still have issues:
1. Check `.env` file exists and has correct Clerk keys
2. Restart the dev server: `Ctrl+C` then `npm run dev`
3. Verify keys in Clerk Dashboard match your `.env` file

### Database not connecting?
```bash
# Check if database is running
docker ps

# Restart database
docker-compose -f docker-compose.db.yml restart
```

### Port already in use?
Edit `.env` and change:
```env
PORT=3001
VITE_API_URL=http://localhost:3001
```

### Need to reset database?
```bash
# Stop and remove database (deletes data!)
docker-compose -f docker-compose.db.yml down -v

# Start fresh
docker-compose -f docker-compose.db.yml up -d
```

## Development Workflow

1. Make changes to your code
2. Frontend changes auto-reload (Vite HMR)
3. Backend changes require restart (Ctrl+C, then `npm run dev`)
4. Database persists data in Docker volume

Enjoy coding! 🚀
