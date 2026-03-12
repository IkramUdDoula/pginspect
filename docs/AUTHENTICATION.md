# Authentication Guide

pgInspect uses [Clerk](https://clerk.com) for secure authentication with Google and Microsoft OAuth.

## Quick Setup

### Step 1: Create Clerk Account

1. Go to [clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application

### Step 2: Enable OAuth Providers

1. In Clerk Dashboard, go to "User & Authentication" → "Social Connections"
2. Enable **Google**
3. Enable **Microsoft**
4. Save changes

### Step 3: Get API Keys

1. Go to "API Keys" in Clerk Dashboard
2. Copy your keys:
   - Publishable Key (starts with `pk_test_`)
   - Secret Key (starts with `sk_test_`)

### Step 4: Configure Environment

Add keys to your `.env` file:

```env
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

### Step 5: Configure Allowed Origins

In Clerk Dashboard, go to "Domains":

**For Docker Deployment:**
- Add `http://localhost:9000`

**For Production:**
- Add your production domain (e.g., `https://your-domain.com`)

### Step 6: Test Authentication

1. Deploy the application: `bash scripts/deploy.sh`
2. Open http://localhost:9000
3. Click "Sign In"
4. Try signing in with Google or Microsoft

## How It Works

### User Flow

1. User clicks "Sign In" on landing page
2. Redirected to Clerk authentication page
3. User selects Google or Microsoft
4. OAuth provider authenticates user
5. Clerk creates session and returns JWT token
6. User redirected to `/app` with active session
7. Backend verifies JWT on each API request
8. User record automatically synced to database

### Security Features

- **JWT Verification**: All API requests require valid Clerk token
- **User Sync**: User data automatically synced to app database
- **Session Management**: Clerk handles session lifecycle
- **Token Refresh**: Automatic token refresh for long sessions

## Production Setup

### Step 1: Create Production Application

1. In Clerk Dashboard, create a new application for production
2. Or use "Instances" to create production instance

### Step 2: Update Environment

Use production keys in `.env.production`:

```env
CLERK_PUBLISHABLE_KEY=pk_live_your_production_key
CLERK_SECRET_KEY=sk_live_your_production_key
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_production_key
```

### Step 3: Configure Production Domain

In Clerk Dashboard:
1. Go to "Domains"
2. Add your production domain
3. Configure redirect URLs:
   - Sign-in: `https://your-domain.com/sign-in`
   - Sign-up: `https://your-domain.com/sign-up`
   - After sign-in: `https://your-domain.com/app`

## Troubleshooting

### "Missing Clerk Publishable Key" Error

**Cause**: Environment variable not set

**Solution**:
```bash
# Check if variable is set
echo $VITE_CLERK_PUBLISHABLE_KEY

# Make sure it's in .env file
cat .env | grep CLERK
```

### Authentication Fails in Production

**Cause**: Wrong domain configuration

**Solution**:
1. Check Clerk Dashboard → Domains
2. Ensure production domain is added
3. Verify redirect URLs are correct

### Users Not Syncing to Database

**Cause**: Database connection issue or missing schema

**Solution**:
```bash
# Check database tables exist
docker exec pginspect-db psql -U postgres -d pgadmin -c "\dt"

# Reinitialize schema if needed
docker exec -i pginspect-db psql -U postgres -d pgadmin < db/schema.sql
```

## Security Best Practices

1. **Never commit** `.env` files to version control
2. Use different Clerk applications for development and production
3. Rotate keys periodically
4. Enable MFA in Clerk for production
5. Monitor Clerk dashboard for suspicious activity
6. Keep dependencies updated

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk React SDK](https://clerk.com/docs/references/react/overview)
- [Clerk Backend SDK](https://clerk.com/docs/references/backend/overview)

For detailed implementation, see [ARCHITECTURE.md](ARCHITECTURE.md).
