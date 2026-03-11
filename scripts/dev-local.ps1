#!/usr/bin/env pwsh
# Development startup script for Windows that ensures correct PORT

Write-Host "🚀 Starting pgInspect in Local Development Mode" -ForegroundColor Green
Write-Host ""

# Force PORT to 3000 for local development
$env:PORT = "3000"
$env:NODE_ENV = "development"

Write-Host "✅ Environment configured:" -ForegroundColor Cyan
Write-Host "   PORT: $env:PORT"
Write-Host "   NODE_ENV: $env:NODE_ENV"
Write-Host ""

# Start the development servers
npm run dev
