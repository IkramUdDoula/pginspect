# Development script with hot reloading for Windows
Write-Host "Starting development environment with hot reloading..." -ForegroundColor Green

# Build and start containers
docker-compose up --build

Write-Host "Development environment stopped." -ForegroundColor Yellow