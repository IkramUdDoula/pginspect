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
    
    echo "⚠️  Please update .env with your Clerk keys:"
    echo "   - CLERK_PUBLISHABLE_KEY"
    echo "   - CLERK_SECRET_KEY"
    echo "   - VITE_CLERK_PUBLISHABLE_KEY"
    echo ""
    echo "Get them from: https://dashboard.clerk.com"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

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
