#!/usr/bin/env pwsh
# pgInspect Docker Deployment Script
# This script will build and deploy the entire application with one command

Write-Host "pgInspect Docker Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Error: Docker is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if .env.docker exists
if (-not (Test-Path .env.docker)) {
    Write-Host "Error: .env.docker file not found" -ForegroundColor Red
    Write-Host "Please copy .env.docker.example to .env.docker and configure it" -ForegroundColor Yellow
    exit 1
}

Write-Host "Environment file found" -ForegroundColor Green
Write-Host ""

# Stop existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null
Write-Host ""

# Build and start containers
Write-Host "Building Docker images..." -ForegroundColor Yellow
docker-compose build --no-cache
Write-Host ""

Write-Host "Starting containers..." -ForegroundColor Yellow
docker-compose up -d
Write-Host ""

# Wait for database to be ready
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if containers are running
$running = docker-compose ps | Select-String "Up"
if (-not $running) {
    Write-Host "Error: Containers failed to start" -ForegroundColor Red
    Write-Host "Run 'docker-compose logs' to see the error" -ForegroundColor Yellow
    exit 1
}

Write-Host "Containers are running" -ForegroundColor Green
Write-Host ""

# Database is automatically initialized via docker-entrypoint-initdb.d
Write-Host "Database initialized automatically" -ForegroundColor Green
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Application URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5000"
Write-Host "   Backend:  http://localhost:9000"
Write-Host "   Database: localhost:5432"
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "   View logs:        docker-compose logs -f"
Write-Host "   Stop app:         docker-compose down"
Write-Host "   Restart app:      docker-compose restart"
Write-Host "   View containers:  docker-compose ps"
Write-Host ""
Write-Host "Default Database Credentials:" -ForegroundColor Cyan
Write-Host "   Host:     localhost (or database from within Docker)"
Write-Host "   Port:     5432"
Write-Host "   Database: pgadmin"
Write-Host "   Username: postgres"
Write-Host "   Password: postgres"
Write-Host ""
