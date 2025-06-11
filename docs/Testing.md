# Testing Guide

## Running Tests with Docker

### Prerequisites
- Docker Desktop installed and running
- No local Node.js installation required

### Quick Start (Windows)
```powershell
# Start services
docker-compose up -d

# Run all tests
bash tests/run-tests.sh

# Or run individual tests
docker-compose --profile test run --rm test node tests/auth-service.test.js
docker-compose --profile test run --rm test node tests/backend.test.js  
docker-compose --profile test run --rm test node tests/profile.test.js
docker-compose --profile test run --rm test node tests/appointment.test.js
```

### Troubleshooting
```bash
# If tests fail, check backend logs
docker-compose logs backend

# Test backend health manually
curl http://localhost:5001/api/health  # Changed from 5000 to 5001

# Reset everything
docker-compose down
docker-compose up --build
```