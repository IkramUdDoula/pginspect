#!/bin/bash

# Authentication Setup Script for PG Inspector
# This script helps set up authentication and database migration

set -e

echo "🔐 PG Inspector Authentication Setup"
echo "===================================="
echo ""

# Check if .env.development exists
if [ ! -f .env.development ]; then
    echo "❌ .env.development not found!"
    echo "Creating from .env.example..."
    cp .env.example .env.development
    echo "✅ Created .env.development"
fi

# Check for required environment variables
echo "📋 Checking environment variables..."
echo ""

missing_vars=()

if ! grep -q "CLERK_PUBLISHABLE_KEY=pk_" .env.development; then
    missing_vars+=("CLERK_PUBLISHABLE_KEY")
fi

if ! grep -q "CLERK_SECRET_KEY=sk_" .env.development; then
    missing_vars+=("CLERK_SECRET_KEY")
fi

if ! grep -q "VITE_CLERK_PUBLISHABLE_KEY=pk_" .env.development; then
    missing_vars+=("VITE_CLERK_PUBLISHABLE_KEY")
fi

if grep -q "ENCRYPTION_KEY=your-32-character-encryption-key-here" .env.development; then
    missing_vars+=("ENCRYPTION_KEY")
fi

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "⚠️  Missing or placeholder values for:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please update .env.development with your actual values:"
    echo ""
    echo "1. Get Clerk keys from: https://dashboard.clerk.com"
    echo "2. Generate encryption key with:"
    echo "   openssl rand -base64 32"
    echo ""
    echo "See docs/AUTH_SETUP_GUIDE.md for detailed instructions."
    echo ""
    read -p "Press Enter to continue anyway or Ctrl+C to exit..."
else
    echo "✅ All required environment variables are set"
fi

echo ""
echo "🗄️  Setting up database..."
echo ""

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=postgresql://" .env.development; then
    echo "❌ DATABASE_URL not set in .env.development"
    exit 1
fi

# Extract database connection details
DB_URL=$(grep "DATABASE_URL=" .env.development | cut -d '=' -f2)

echo "Database URL: $DB_URL"
echo ""

# Ask if user wants to run migration
read -p "Run database migration now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running migration..."
    
    # Try to run migration using psql
    if command -v psql &> /dev/null; then
        psql "$DB_URL" -f db/migrations/001_user_connections.sql
        echo "✅ Migration completed successfully"
    else
        echo "⚠️  psql not found. Please run the migration manually:"
        echo "   psql \"$DB_URL\" -f db/migrations/001_user_connections.sql"
    fi
else
    echo "⚠️  Skipping migration. Run it manually later:"
    echo "   psql \"$DB_URL\" -f db/migrations/001_user_connections.sql"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure Clerk OAuth providers (Google, Microsoft)"
echo "   See: docs/AUTH_SETUP_GUIDE.md"
echo ""
echo "2. Start the application:"
echo "   npm run server:dev    # Terminal 1"
echo "   npm run dev           # Terminal 2"
echo ""
echo "3. Open http://localhost:8080 and sign in"
echo ""
