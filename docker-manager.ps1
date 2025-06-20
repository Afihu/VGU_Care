# Docker Management Script for VGU Care - Optimized for Windows/PowerShell
# This script provides optimized Docker commands for faster builds and better performance

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "prod", "test", "clean", "reset", "logs", "status", "build", "up", "down")]
    [string]$Command,
    
    [Parameter()]
    [switch]$NoCache,
    
    [Parameter()]
    [switch]$Parallel,
    
    [Parameter()]
    [string]$Service
)

# Enable Docker BuildKit for faster builds
$env:DOCKER_BUILDKIT = 1
$env:COMPOSE_DOCKER_CLI_BUILD = 1

# Color functions for better output
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }

# Function to check Docker and Docker Compose
function Test-DockerInstallation {
    try {
        docker --version | Out-Null
        docker-compose --version | Out-Null
        Write-Success "✅ Docker and Docker Compose are installed"
        return $true
    }
    catch {
        Write-Error "❌ Docker or Docker Compose is not installed or not in PATH"
        return $false
    }
}

# Function to clean up Docker resources
function Invoke-DockerCleanup {
    Write-Info "🧹 Cleaning up Docker resources..."
    
    # Remove stopped containers
    $stoppedContainers = docker ps -a -q --filter "status=exited"
    if ($stoppedContainers) {
        docker rm $stoppedContainers
        Write-Success "Removed stopped containers"
    }
    
    # Remove dangling images
    $danglingImages = docker images -f "dangling=true" -q
    if ($danglingImages) {
        docker rmi $danglingImages
        Write-Success "Removed dangling images"
    }
    
    # Remove unused volumes
    docker volume prune -f
    Write-Success "Removed unused volumes"
    
    # Remove unused networks
    docker network prune -f
    Write-Success "Removed unused networks"
    
    # Remove build cache (if no-cache is specified)
    if ($NoCache) {
        docker builder prune -f
        Write-Success "Removed build cache"
    }
}

# Function to build with optimizations
function Invoke-OptimizedBuild {
    param($Target = "development")
    
    $buildArgs = @()
    
    if ($NoCache) {
        $buildArgs += "--no-cache"
    } else {
        $buildArgs += "--cache-from=node:18-alpine"
    }
    
    if ($Parallel) {
        $buildArgs += "--parallel"
    }
    
    $buildArgs += "--build-arg BUILDKIT_INLINE_CACHE=1"
    
    Write-Info "🔨 Building with optimizations for $Target..."
    
    if ($Target -eq "production") {
        $command = "docker-compose -f docker-compose.yml -f docker-compose.prod.yml build $($buildArgs -join ' ')"
    } else {
        $command = "docker-compose build $($buildArgs -join ' ')"
    }
    
    if ($Service) {
        $command += " $Service"
    }
    
    Write-Info "Executing: $command"
    Invoke-Expression $command
}

# Function to start services
function Start-Services {
    param($Environment = "development")
    
    Write-Info "🚀 Starting VGU Care services in $Environment mode..."
    
    if ($Environment -eq "production") {
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    } else {
        docker-compose up -d
    }
    
    Write-Success "Services started successfully!"
    Write-Info "Backend API: http://localhost:5001"
    Write-Info "Frontend: http://localhost:3000"
    Write-Info "Database: localhost:5433"
    
    if ($Environment -eq "development") {
        Write-Info "PgAdmin: http://localhost:8080 (use --profile tools to enable)"
    }
}

# Function to stop services
function Stop-Services {
    param($Environment = "development")
    
    Write-Info "🛑 Stopping VGU Care services..."
    
    if ($Environment -eq "production") {
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
    } else {
        docker-compose down
    }
    
    Write-Success "Services stopped successfully!"
}

# Function to show logs
function Show-Logs {
    if ($Service) {
        docker-compose logs -f $Service
    } else {
        docker-compose logs -f
    }
}

# Function to show status
function Show-Status {
    Write-Info "📊 VGU Care Services Status:"
    docker-compose ps
    
    Write-Info "`n💾 Docker Resource Usage:"
    docker system df
    
    Write-Info "`n🔍 Container Resource Usage:"
    docker stats --no-stream
}

# Function to run tests
function Invoke-Tests {
    Write-Info "🧪 Running tests..."
    
    # Build test image
    docker-compose --profile test build test
    
    # Run tests
    docker-compose --profile test run --rm test npm run test:all
    
    Write-Success "Tests completed!"
}

# Function to reset everything
function Reset-Environment {
    Write-Warning "⚠️  This will remove ALL containers, images, volumes, and networks for VGU Care"
    $confirmation = Read-Host "Are you sure? (y/N)"
    
    if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
        Write-Info "🔄 Resetting VGU Care environment..."
        
        # Stop all services
        docker-compose down -v --remove-orphans
        
        # Remove VGU Care images
        $vguImages = docker images --filter "reference=vgu*" -q
        if ($vguImages) {
            docker rmi -f $vguImages
        }
        
        # Clean up
        Invoke-DockerCleanup
        
        Write-Success "Environment reset completed!"
    } else {
        Write-Info "Reset cancelled."
    }
}

# Main script logic
Write-Info "🐳 VGU Care Docker Management Script"

if (-not (Test-DockerInstallation)) {
    exit 1
}

switch ($Command) {
    "dev" {
        Write-Info "Starting development environment..."
        Invoke-OptimizedBuild -Target "development"
        Start-Services -Environment "development"
    }
    
    "prod" {
        Write-Info "Starting production environment..."
        Invoke-OptimizedBuild -Target "production"
        Start-Services -Environment "production"
    }
    
    "test" {
        Invoke-Tests
    }
    
    "build" {
        $target = if ($env:NODE_ENV -eq "production") { "production" } else { "development" }
        Invoke-OptimizedBuild -Target $target
    }
    
    "up" {
        $env = if ($env:NODE_ENV -eq "production") { "production" } else { "development" }
        Start-Services -Environment $env
    }
    
    "down" {
        $env = if ($env:NODE_ENV -eq "production") { "production" } else { "development" }
        Stop-Services -Environment $env
    }
    
    "logs" {
        Show-Logs
    }
    
    "status" {
        Show-Status
    }
    
    "clean" {
        Invoke-DockerCleanup
    }
    
    "reset" {
        Reset-Environment
    }
}

Write-Success "✅ Operation completed!"
