#!/bin/bash
# pgInspect Docker Deployment Script
# This script will build and deploy the entire application with one command

set -e

echo "🚀 pgInspect Docker Deployment"
echo "================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env.docker exists
if [ ! -f .env.docker ]; then
    echo "❌ Error: .env.docker file not found"
    echo "Please copy .env.docker.example to .env.docker and configure it"
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true
echo ""

# Build and start containers
echo "🔨 Building Docker images..."
docker-compose build --no-cache
echo ""

echo "🚀 Starting containers..."
docker-compose up -d
echo ""

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if containers are running
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Error: Containers failed to start"
    echo "Run 'docker-compose logs' to see the error"
    exit 1
fi

echo "✅ Containers are running"
echo ""

# Database is automatically initialized via docker-entrypoint-initdb.d
echo "✅ Database initialized automatically"
echo ""

echo "================================"
echo "✅ Deployment Complete!"
echo "================================"
echo ""
echo "🌐 Application URLs:"
echo "   Application: http://localhost:9000"
echo "   API:         http://localhost:9000/api"
echo "   Database:    localhost:5432"
echo ""
echo "📊 Useful Commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Stop app:         docker-compose down"
echo "   Restart app:      docker-compose restart"
echo "   View containers:  docker-compose ps"
echo ""
echo "🔐 Default Database Credentials:"
echo "   Host:     localhost (or 'database' from within Docker)"
echo "   Port:     5432"
echo "   Database: pgadmin"
echo "   Username: postgres"
echo "   Password: postgres"
echo ""
