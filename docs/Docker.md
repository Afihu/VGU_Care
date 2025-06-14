# Docker Guide

## What is Docker?

Since we are new to Docker, just think of it as running multiple computers (containers) on your device. Each will handle their own task. One for frontend, one for backend/APIs and one for database.

As the setting up will be handled by Docker, there will be consistency across all devices in our team and development will also be isolated, not messing with our own systems.

## Essential Commands

### Basic Operations
```bash
# Start all services
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs backend
docker-compose logs frontend
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

```bash
# Backend/Test dependencies (add to root package.json)
npm install package-name

# Frontend dependencies (add to frontend/package.json)
cd frontend
npm install package-name
cd ..

# Rebuild services
docker-compose up --build
```

### Troubleshooting
```bash
# Nuclear option - fix everything
docker-compose down
docker-compose up --build

# Check what's running
docker-compose ps

# Check specific service logs
docker-compose logs -f backend
```

## Quick Reference

| **Scenario** | **Command** |
|--------------|-------------|
| **Start project** | `docker-compose up --build` |
| **Code changes** | `docker-compose restart backend` |
| **Add dependency** | `docker-compose up --build --no-deps backend` |
| **Pull team changes** | `docker-compose down && docker-compose up --build` |
| **Something's broken** | `docker-compose down && docker-compose up --build` |
| **Check logs** | `docker-compose logs -f backend` |

## Performance Optimization

### Clean Up (Weekly)
```bash
# Free up disk space
docker system prune -a
```

### Move Docker Data (Windows)
1. Docker Desktop → Settings → Resources → Advanced
2. Change "Disk image location" to another drive
3. Restart Docker Desktop