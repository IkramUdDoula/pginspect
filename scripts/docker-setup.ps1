# pgInspect Docker Setup Script for Windows
Write-Host "pgInspect Docker Setup" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    
    # Generate encryption key
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    $ENCRYPTION_KEY = [Convert]::ToBase64String($bytes)
    
    # Update .env with generated key
    (Get-Content .env) -replace 'ENCRYPTION_KEY=.*', "ENCRYPTION_KEY=$ENCRYPTION_KEY" | Set-Content .env
    
    Write-Host ""
    Write-Host "REQUIRED: Update .env with your Clerk keys before continuing:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   1. Go to https://dashboard.clerk.com"
    Write-Host "   2. Create a new application (or use existing)"
    Write-Host "   3. Copy these keys to .env file:"
    Write-Host "      - CLERK_PUBLISHABLE_KEY=pk_test_..."
    Write-Host "      - CLERK_SECRET_KEY=sk_test_..."
    Write-Host "      - VITE_CLERK_PUBLISHABLE_KEY=pk_test_..."
    Write-Host ""
    Write-Host "   Note: CLERK_PUBLISHABLE_KEY and VITE_CLERK_PUBLISHABLE_KEY should be the same"
    Write-Host ""
    Read-Host "Press Enter after updating .env file"
}

# Validate required environment variables
Write-Host "Validating environment variables..." -ForegroundColor Cyan
$envContent = Get-Content .env -Raw
$envVars = @{}
$envContent -split "`n" | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $envVars[$matches[1].Trim()] = $matches[2].Trim()
    }
}

$hasError = $false

if (($envVars['CLERK_PUBLISHABLE_KEY'] -eq 'pk_test_your_key_here') -or (-not $envVars['CLERK_PUBLISHABLE_KEY'])) {
    Write-Host "Error: CLERK_PUBLISHABLE_KEY not set in .env" -ForegroundColor Red
    Write-Host "   Get it from: https://dashboard.clerk.com"
    $hasError = $true
}

if (($envVars['CLERK_SECRET_KEY'] -eq 'sk_test_your_key_here') -or (-not $envVars['CLERK_SECRET_KEY'])) {
    Write-Host "Error: CLERK_SECRET_KEY not set in .env" -ForegroundColor Red
    Write-Host "   Get it from: https://dashboard.clerk.com"
    $hasError = $true
}

if (($envVars['VITE_CLERK_PUBLISHABLE_KEY'] -eq 'pk_test_your_key_here') -or (-not $envVars['VITE_CLERK_PUBLISHABLE_KEY'])) {
    Write-Host "Error: VITE_CLERK_PUBLISHABLE_KEY not set in .env" -ForegroundColor Red
    Write-Host "   Get it from: https://dashboard.clerk.com"
    $hasError = $true
}

if ($hasError) {
    exit 1
}

Write-Host "Environment variables validated" -ForegroundColor Green

# Build and start containers
Write-Host "Building Docker containers..." -ForegroundColor Cyan
docker-compose build

Write-Host "Starting services..." -ForegroundColor Cyan
docker-compose up -d

# Wait for database to be ready
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check health
Write-Host "Checking service health..." -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Access pgInspect at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database connection details:" -ForegroundColor Cyan
Write-Host "   Host: localhost"
Write-Host "   Port: 5432"
Write-Host "   Database: pgadmin"
Write-Host "   Username: postgres"
Write-Host "   Password: postgres"
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs:    docker-compose logs -f"
Write-Host "   Stop:         docker-compose down"
Write-Host "   Restart:      docker-compose restart"
