#!/bin/bash
# Database setup script for pgInspect
# Run this after docker-compose up to initialize the database

set -e

echo "🔧 Setting up pgInspect database..."

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    exit 1
fi

# Check if database container is running
if ! docker ps | grep -q pginspect-database-1; then
    echo "❌ Error: Database container is not running"
    echo "   Run: docker-compose up -d database"
    exit 1
fi

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 3

# Run schema
echo "📋 Running database schema..."
docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < db/schema.sql

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📊 Database tables created:"
docker exec pginspect-database-1 psql -U postgres -d pgadmin -c "\dt"
echo ""
echo "🚀 You can now start the application:"
echo "   docker-compose up"
echo ""
echo "🌐 Access the app at: http://localhost:3000"
