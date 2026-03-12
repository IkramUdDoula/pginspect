# Railway Setup Helper Script (PowerShell)
# Generates required secrets and provides setup instructions

Write-Host "🚂 Railway Deployment Setup Helper" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Generate encryption key
Write-Host "🔐 Generating ENCRYPTION_KEY..." -ForegroundColor Yellow
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$ENCRYPTION_KEY = [Convert]::ToBase64String($bytes)
Write-Host "ENCRYPTION_KEY=$ENCRYPTION_KEY" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Railway Setup Checklist:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create Railway Project:"
Write-Host "   - Go to https://railway.app/dashboard"
Write-Host "   - Click 'New Project' → 'Deploy from GitHub repo'"
Write-Host "   - Select your repository"
Write-Host ""
Write-Host "2. Add PostgreSQL Database:"
Write-Host "   - Click '+ New' → 'Database' → 'Add PostgreSQL'"
Write-Host ""
Write-Host "3. Configure Environment Variables:"
Write-Host "   Click on your web service → Variables tab → Add:"
Write-Host ""
Write-Host "   DATABASE_URL=`${{Postgres.DATABASE_URL}}" -ForegroundColor Yellow
Write-Host "   NODE_ENV=production" -ForegroundColor Yellow
Write-Host "   PORT=3000" -ForegroundColor Yellow
Write-Host "   CORS_ORIGIN=https://`${{RAILWAY_PUBLIC_DOMAIN}}" -ForegroundColor Yellow
Write-Host "   ENCRYPTION_KEY=$ENCRYPTION_KEY" -ForegroundColor Yellow
Write-Host "   CLERK_PUBLISHABLE_KEY=pk_live_xxxxx  # From clerk.com" -ForegroundColor Yellow
Write-Host "   CLERK_SECRET_KEY=sk_live_xxxxx       # From clerk.com" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Add Build Arguments (Settings → Build):"
Write-Host "   VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx" -ForegroundColor Yellow
Write-Host "   VITE_API_URL=https://`${{RAILWAY_PUBLIC_DOMAIN}}" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Deploy:"
Write-Host "   - Push to GitHub"
Write-Host "   - Railway auto-deploys"
Write-Host "   - Check logs for migration success"
Write-Host ""
Write-Host "6. Generate Domain (Settings → Networking):"
Write-Host "   - Click 'Generate Domain'"
Write-Host "   - Get your app URL"
Write-Host ""
Write-Host "✅ Setup complete! See docs/RAILWAY_DEPLOYMENT.md for details." -ForegroundColor Green
