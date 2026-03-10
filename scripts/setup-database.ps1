# Database setup script for pgInspect (Windows PowerShell)
# Run this after docker-compose up to initialize the database

$ErrorActionPreference = "Stop"

Write-Host "🔧 Setting up pgInspect database..." -ForegroundColor Cyan

# Check if Docker is running
try {
    docker ps | Out-Null
} catch {
    Write-Host "❌ Error: Docker is not running" -ForegroundColor Red
    exit 1
}

# Check if database container is running
$containerRunning = docker ps | Select-String "pginspect-database-1"
if (-not $containerRunning) {
    Write-Host "❌ Error: Database container is not running" -ForegroundColor Red
    Write-Host "   Run: docker-compose up -d database" -ForegroundColor Yellow
    exit 1
}

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Run schema
Write-Host "📋 Running database schema..." -ForegroundColor Cyan
Get-Content db/schema.sql | docker exec -i pginspect-database-1 psql -U postgres -d pgadmin

Write-Host ""
Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Database tables created:" -ForegroundColor Cyan
docker exec pginspect-database-1 psql -U postgres -d pgadmin -c "\dt"
Write-Host ""
Write-Host "🚀 You can now start the application:" -ForegroundColor Cyan
Write-Host "   docker-compose up" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Access the app at: http://localhost:3000" -ForegroundColor Cyan
