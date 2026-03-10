# Authentication Setup Script for PG Inspector (PowerShell)
# This script helps set up authentication and database migration

$ErrorActionPreference = "Stop"

Write-Host "🔐 PG Inspector Authentication Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.development exists
if (-not (Test-Path .env.development)) {
    Write-Host "❌ .env.development not found!" -ForegroundColor Red
    Write-Host "Creating from .env.example..."
    Copy-Item .env.example .env.development
    Write-Host "✅ Created .env.development" -ForegroundColor Green
}

# Check for required environment variables
Write-Host "📋 Checking environment variables..."
Write-Host ""

$envContent = Get-Content .env.development -Raw
$missingVars = @()

if ($envContent -notmatch "CLERK_PUBLISHABLE_KEY=pk_") {
    $missingVars += "CLERK_PUBLISHABLE_KEY"
}

if ($envContent -notmatch "CLERK_SECRET_KEY=sk_") {
    $missingVars += "CLERK_SECRET_KEY"
}

if ($envContent -notmatch "VITE_CLERK_PUBLISHABLE_KEY=pk_") {
    $missingVars += "VITE_CLERK_PUBLISHABLE_KEY"
}

if ($envContent -match "ENCRYPTION_KEY=your-32-character-encryption-key-here") {
    $missingVars += "ENCRYPTION_KEY"
}

if ($missingVars.Count -gt 0) {
    Write-Host "⚠️  Missing or placeholder values for:" -ForegroundColor Yellow
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Please update .env.development with your actual values:"
    Write-Host ""
    Write-Host "1. Get Clerk keys from: https://dashboard.clerk.com"
    Write-Host "2. Generate encryption key with:"
    Write-Host '   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))'
    Write-Host ""
    Write-Host "See docs/AUTH_SETUP_GUIDE.md for detailed instructions."
    Write-Host ""
    $continue = Read-Host "Press Enter to continue anyway or Ctrl+C to exit"
} else {
    Write-Host "✅ All required environment variables are set" -ForegroundColor Green
}

Write-Host ""
Write-Host "🗄️  Setting up database..."
Write-Host ""

# Check if DATABASE_URL is set
if ($envContent -notmatch "DATABASE_URL=postgresql://") {
    Write-Host "❌ DATABASE_URL not set in .env.development" -ForegroundColor Red
    exit 1
}

# Extract database connection details
$dbUrl = ($envContent -split "`n" | Where-Object { $_ -match "^DATABASE_URL=" }) -replace "DATABASE_URL=", ""
$dbUrl = $dbUrl.Trim()

Write-Host "Database URL: $dbUrl"
Write-Host ""

# Ask if user wants to run migration
$runMigration = Read-Host "Run database migration now? (y/n)"

if ($runMigration -eq "y" -or $runMigration -eq "Y") {
    Write-Host "Running migration..."
    
    # Try to run migration using psql
    if (Get-Command psql -ErrorAction SilentlyContinue) {
        psql $dbUrl -f db/migrations/001_user_connections.sql
        Write-Host "✅ Migration completed successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  psql not found. Please run the migration manually:" -ForegroundColor Yellow
        Write-Host "   psql `"$dbUrl`" -f db/migrations/001_user_connections.sql"
    }
} else {
    Write-Host "⚠️  Skipping migration. Run it manually later:" -ForegroundColor Yellow
    Write-Host "   psql `"$dbUrl`" -f db/migrations/001_user_connections.sql"
}

Write-Host ""
Write-Host "📦 Installing dependencies..."
npm install

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Configure Clerk OAuth providers (Google, Microsoft)"
Write-Host "   See: docs/AUTH_SETUP_GUIDE.md"
Write-Host ""
Write-Host "2. Start the application:"
Write-Host "   npm run server:dev    # Terminal 1"
Write-Host "   npm run dev           # Terminal 2"
Write-Host ""
Write-Host "3. Open http://localhost:8080 and sign in"
Write-Host ""
