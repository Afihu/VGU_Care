# VGU Care - Guide To Everything

## Table of Contents
- [What is Docker?](#what-is-docker)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Essential Commands](#essential-commands)
- [Development Workflow](#development-workflow)
- [Testing with Docker](#testing-with-docker)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
- [Quick Reference](#quick-reference)

## What is Docker?

Since we are new to Docker, just think of it as running multiple computers (containers) on your device. Each will handle their own task:
- **Frontend Container**: React application (port 3000)
- **Backend Container**: Node.js API server (port 5001)
- **Database Container**: PostgreSQL database (port 5433)
- **PgAdmin Container**: Database management tool (port 8080)

As the setting up will be handled by Docker, there will be consistency across all devices in our team and development will also be isolated, not messing with our own systems.

## Installation

### 1. Install Docker Desktop
- Download from [docker.com](https://www.docker.com/get-started)
- Install and start Docker Desktop
- Wait for the whale icon 🐋 to appear in system tray
- *Note that it should say 'Engine running' not 'Engine starting'*

### 2. Clone the Repository
```bash
git clone <repository-url>
cd VGU_Care
```

## Quick Start

### Start Everything
```bash
# Start the application without pgAdmin
docker-compose up --build

# OR start with pgAdmin (recommended for database management)
docker-compose --profile tools up --build

# For subsequent runs, you can use:
docker-compose up
```
*First time takes 2-3 minutes to download everything*

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Database**: localhost:5433 (from host) or postgres:5432 (from containers)
- **PgAdmin**: http://localhost:8080 (if started with --profile tools)

### Stop the Application
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (nuclear option)
docker-compose down --volumes --remove-orphans
```

## Essential Commands

### Basic Operations
```bash
# Start all services
docker-compose up --build

# Start in background (detached)
docker-compose up -d --build

# Stop all services
docker-compose down

# View logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs -f backend  # Follow logs in real-time
```

### After Code Changes
```bash
# Quick restart (no rebuild needed for code changes)
docker-compose restart backend
docker-compose restart frontend

# Force rebuild (when you're not sure)
docker-compose up --build --no-deps backend
docker-compose up --build --no-deps frontend
```

### After Adding Dependencies

**Method 1: Edit package.json manually (Recommended)**
```bash
# 1. Edit package.json files manually in your editor
# 2. Rebuild containers to install dependencies
docker-compose up --build --no-deps backend
docker-compose up --build --no-deps frontend

# OR rebuild everything
docker-compose up --build
```

**Method 2: Install from inside running containers**
```bash
# Install dependencies inside running containers
docker-compose exec backend npm install package-name
docker-compose exec frontend npm install package-name

# Then rebuild to persist the changes in the image
docker-compose up --build
```

### Docker Management Script (Windows) - Optional
```powershell
# Optional: Use the provided PowerShell script for convenience
.\docker-manager.ps1 dev     # Start development environment (with optimizations)
.\docker-manager.ps1 prod    # Start production environment  
.\docker-manager.ps1 test    # Run tests
.\docker-manager.ps1 clean   # Clean up resources
.\docker-manager.ps1 status  # Show detailed status
.\docker-manager.ps1 logs    # Show logs

# OR use docker-compose directly (simpler)
docker-compose up --build   # Start development environment
docker-compose down         # Stop services
docker-compose logs -f      # Show logs
```

## Development Workflow

### Daily Development
1. **Start services**: `docker-compose up -d`
2. **Make code changes** (auto-reloads with volume mounts)
3. **View logs if needed**: `docker-compose logs -f backend`
4. **Stop when done**: `docker-compose down`

### When Pulling Team Changes
```bash
# Safe approach
docker-compose down
docker-compose up --build
```

### When Adding New Features
1. Make code changes
2. If adding dependencies: rebuild containers
3. If changing Docker config: `docker-compose up --build`
4. Test locally before committing

## Testing with Docker

### Prerequisites
- Docker Desktop installed and running
- No local Node.js installation required

### Running Tests

#### Quick Start (Windows)
```powershell
# Start services
docker-compose up -d

# Run all tests
bash tests/run-tests.sh

# Or run individual tests
docker-compose --profile test run --rm test node tests/<test-name>.test.js
```

#### Using the Docker Manager Script
```powershell
.\docker-manager.ps1 test
```

### Test Troubleshooting
```bash
# If tests fail, check backend logs
docker-compose logs backend

# Test backend health manually
curl http://localhost:5001/api/health

# Reset everything
docker-compose down
docker-compose up --build
```

## Performance Optimization

### Docker Settings (Windows)
**WSL Integration** (Windows):
   - Enable WSL 2 backend
   - Install Ubuntu from Microsoft Store
   - Enable WSL integration for Ubuntu

### Build Optimizations
```bash
# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Use build cache
docker-compose build --build-arg BUILDKIT_INLINE_CACHE=1
```

### Regular Cleanup
```bash
# Clean up weekly to free disk space
docker system prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune
```

### Performance Tips
- **Use .dockerignore** files to exclude unnecessary files
- **Multi-stage builds** are already configured
- **Volume mounts** use `:cached` for better performance on macOS/Windows
- **Named volumes** for node_modules improve performance

## Troubleshooting

### Common Issues

#### pgAdmin Won't Start
```bash
# Check if port 8080 is available
netstat -ano | findstr :8080

# If port is busy, modify docker-compose.yml:
# Change "8080:80" to "8081:80" and access via http://localhost:8081
```

#### Database Connection Issues
```bash
# Restart database container
docker-compose restart postgres

# Check container status
docker-compose ps

# View database logs
docker-compose logs postgres
```

#### pgAdmin Can't Connect to Database
- **Docker pgAdmin**: Use hostname `postgres` and port `5432`
- **Local pgAdmin/VSCode**: Use hostname `localhost` and port `5433`
- Ensure both containers are running: `docker-compose ps`

#### Port Already in Use
```bash
# Find what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :5001

# Kill the process using the port
taskkill /PID <process-id> /F
```

#### Build Failures
```bash
# Clear build cache
docker builder prune -f

# Rebuild without cache
docker-compose build --no-cache

# Complete reset
docker-compose down --volumes --remove-orphans
docker system prune -f
docker-compose up --build
```

#### Container Won't Start
```bash
# Check container logs
docker-compose logs <service-name>

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart <service-name>
```

### Nuclear Option (Complete Reset)
```bash
# If everything is broken, start fresh
docker-compose down --volumes --remove-orphans
docker system prune -f
docker volume prune -f
docker-compose up --build
```

## Quick Reference

| **Scenario** | **Command** |
|--------------|-------------|
| **Start project** | `docker-compose up --build` |
| **Start in background** | `docker-compose up -d` |
| **Code changes** | `docker-compose restart backend` |
| **Add dependency** | `docker-compose up --build --no-deps backend` |
| **Pull team changes** | `docker-compose down && docker-compose up --build` |
| **Something's broken** | `docker-compose down && docker-compose up --build` |
| **Check logs** | `docker-compose logs -f backend` |
| **Run tests** | `.\docker-manager.ps1 test` |
| **Clean up** | `docker system prune -a` |
| **Complete reset** | `docker-compose down --volumes && docker-compose up --build` |

### Container Access
| **Service** | **URL/Connection** |
|-------------|-------------------|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:5001 |
| **Database (External)** | localhost:5433 |
| **Database (Internal)** | postgres:5432 |
| **PgAdmin** | http://localhost:8080 |

### Environment Files
| **File** | **Purpose** |
|----------|-------------|
| `docker-compose.yml` | Main development configuration |
| `docker-compose.override.yml` | Development optimizations (auto-loaded) |
| `docker-compose.prod.yml` | Production configuration |

### Useful Docker Commands
```bash
# View running containers
docker ps

# View all containers
docker ps -a

# View images
docker images

# View volumes
docker volume ls

# View networks
docker network ls

# System information
docker system df

# Real-time stats
docker stats
```

## Tips

1. **Always use Docker**: Don't install Node.js/PostgreSQL locally
2. **Check logs first**: Most issues are visible in container logs
3. **Restart before rebuilding**: `restart` is faster than `up --build`
4. **Use profiles**: `--profile tools` for pgAdmin, `--profile test` for testing
5. **Clean regularly**: Run `docker system prune` weekly
6. **Read error messages**: Docker errors are usually informative

## Need Help?

1. Check the logs: `docker-compose logs <service>`
2. Try the troubleshooting section above
3. Use the nuclear option if everything else fails
4. Ask the team on Discord

---

*This guide covers all Docker operations for the VGU Care project. Keep it updated as the project evolves.*