# Docker Setup Script for pgInspect (PowerShell)
# This script helps you set up the Docker environment

$ErrorActionPreference = "Stop"

Write-Host "🐳 pgInspect Docker Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "   Visit: https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Yellow
    exit 1
}

# Check if Docker Compose is installed
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ Created .env" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Edit .env and update:" -ForegroundColor Yellow
    Write-Host "   - CLERK_PUBLISHABLE_KEY" -ForegroundColor Yellow
    Write-Host "   - CLERK_SECRET_KEY" -ForegroundColor Yellow
    Write-Host "   - VITE_CLERK_PUBLISHABLE_KEY" -ForegroundColor Yellow
    Write-Host "   - ENCRYPTION_KEY (generate with: openssl rand -base64 32)" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter after updating .env"
} else {
    Write-Host "✅ .env already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting Docker deployment..." -ForegroundColor Green
docker-compose up -d

Write-Host ""
Write-Host "✅ Deployment started!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access your application:" -ForegroundColor Cyan
Write-Host "   Application: http://localhost:3000"
Write-Host ""
Write-Host "📊 Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs:    docker-compose logs -f"
Write-Host "   Stop:         docker-compose down"
Write-Host "   Restart:      docker-compose restart"
Write-Host ""
