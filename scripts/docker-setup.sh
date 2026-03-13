#!/bin/bash
set -e

echo "🚀 pgInspect Docker Setup"
echo "=========================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    
    # Generate encryption key
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    
    # Update .env with generated key
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" .env
    else
        sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" .env
    fi
    
    echo ""
    echo "⚠️  REQUIRED: Update .env with your Clerk keys before continuing:"
    echo ""
    echo "   1. Go to https://dashboard.clerk.com"
    echo "   2. Create a new application (or use existing)"
    echo "   3. Copy these keys to .env file:"
    echo "      - CLERK_PUBLISHABLE_KEY=pk_test_..."
    echo "      - CLERK_SECRET_KEY=sk_test_..."
    echo "      - VITE_CLERK_PUBLISHABLE_KEY=pk_test_..."
    echo ""
    echo "   Note: CLERK_PUBLISHABLE_KEY and VITE_CLERK_PUBLISHABLE_KEY should be the same"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

# Validate required environment variables
echo "🔍 Validating environment variables..."
source .env

if [[ "$CLERK_PUBLISHABLE_KEY" == "pk_test_your_key_here" ]] || [[ -z "$CLERK_PUBLISHABLE_KEY" ]]; then
    echo "❌ Error: CLERK_PUBLISHABLE_KEY not set in .env"
    echo "   Get it from: https://dashboard.clerk.com"
    exit 1
fi

if [[ "$CLERK_SECRET_KEY" == "sk_test_your_key_here" ]] || [[ -z "$CLERK_SECRET_KEY" ]]; then
    echo "❌ Error: CLERK_SECRET_KEY not set in .env"
    echo "   Get it from: https://dashboard.clerk.com"
    exit 1
fi

if [[ "$VITE_CLERK_PUBLISHABLE_KEY" == "pk_test_your_key_here" ]] || [[ -z "$VITE_CLERK_PUBLISHABLE_KEY" ]]; then
    echo "❌ Error: VITE_CLERK_PUBLISHABLE_KEY not set in .env"
    echo "   Get it from: https://dashboard.clerk.com"
    exit 1
fi

echo "✅ Environment variables validated"

# Build and start containers
echo "🐳 Building Docker containers..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check health
echo "🏥 Checking service health..."
docker-compose ps

echo ""
echo "✅ Setup complete!"
echo ""
echo "📍 Access pgInspect at: http://localhost:3000"
echo ""
echo "📊 Database connection details:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: pgadmin"
echo "   Username: postgres"
echo "   Password: postgres"
echo ""
echo "🔧 Useful commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop:         docker-compose down"
echo "   Restart:      docker-compose restart"
echo "   Rebuild:      docker-compose down && docker-compose build --no-cache && docker-compose up -d"
