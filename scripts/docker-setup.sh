#!/bin/bash

# Docker Setup Script for pgInspect
# This script helps you set up the Docker environment

set -e

echo "🐳 pgInspect Docker Setup"
echo "========================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "✅ Created .env"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and update:"
    echo "   - CLERK_PUBLISHABLE_KEY"
    echo "   - CLERK_SECRET_KEY"
    echo "   - VITE_CLERK_PUBLISHABLE_KEY"
    echo "   - ENCRYPTION_KEY (generate with: openssl rand -base64 32)"
    echo ""
    read -p "Press Enter after updating .env..."
else
    echo "✅ .env already exists"
fi

echo ""
echo "🚀 Starting Docker deployment..."
docker-compose up -d

echo ""
echo "✅ Deployment started!"
echo ""
echo "📍 Access your application:"
echo "   Application: http://localhost:3000"
echo ""
echo "📊 Useful commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop:         docker-compose down"
echo "   Restart:      docker-compose restart"
echo ""
