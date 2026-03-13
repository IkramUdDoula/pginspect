# pgInspect Docker Setup Script for Windows
Write-Host "🚀 pgInspect Docker Setup" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    
    # Generate encryption key
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    $ENCRYPTION_KEY = [Convert]::ToBase64String($bytes)
    
    # Update .env with generated key
    (Get-Content .env) -replace 'ENCRYPTION_KEY=.*', "ENCRYPTION_KEY=$ENCRYPTION_KEY" | Set-Content .env
    
    Write-Host ""
    Write-Host "⚠️  Please update .env with your Clerk keys:" -ForegroundColor Yellow
    Write-Host "   - CLERK_PUBLISHABLE_KEY"
    Write-Host "   - CLERK_SECRET_KEY"
    Write-Host "   - VITE_CLERK_PUBLISHABLE_KEY"
    Write-Host ""
    Write-Host "Get them from: https://dashboard.clerk.com" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter after updating .env file"
}

# Build and start containers
Write-Host "🐳 Building Docker containers..." -ForegroundColor Cyan
docker-compose build

Write-Host "🚀 Starting services..." -ForegroundColor Cyan
docker-compose up -d

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check health
Write-Host "🏥 Checking service health..." -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access pgInspect at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Database connection details:" -ForegroundColor Cyan
Write-Host "   Host: localhost"
Write-Host "   Port: 5432"
Write-Host "   Database: pgadmin"
Write-Host "   Username: postgres"
Write-Host "   Password: postgres"
Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs:    docker-compose logs -f"
Write-Host "   Stop:         docker-compose down"
Write-Host "   Restart:      docker-compose restart"
Write-Host "   Rebuild:      docker-compose down; docker-compose build --no-cache; docker-compose up -d"
