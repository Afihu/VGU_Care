# VGU Care - Guide To Everything

## Table of Contents
- [What is Docker?](#what-is-docker)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Essential Commands](#essential-commands)
- [Development Workflow](#development-workflow)
- [Backend Features](#backend-features)
- [Testing with Docker](#testing-with-docker)
- [Database Management](#database-management)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
- [Nuclear Options](#nuclear-options)
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

### 3. For New Developers
If you're new to this project, here's what you need to know about the current state:

#### Recent Major Updates (2024)
- **Profile Expansion**: Added housing location for students and shift schedules for medical staff
- **Enhanced Appointment Logic**: Smart staff assignment based on availability and location
- **Comprehensive Test Suite**: Modular test helpers and improved test coverage
- **Database Schema Updates**: New columns and relationships to support expanded features
- **Improved Validation**: Better input validation and error handling throughout the backend

#### Key Files to Understand
- **Backend Services**: Check `backend/services/` for business logic
- **Database Schema**: See `database/schema.sql` for current structure
- **Test Helpers**: Explore `tests/helpers/` for testing utilities
- **API Documentation**: Read `docs/API_Documentation.md` for endpoint details

#### First Steps for New Contributors
1. **Start the application**: `docker-compose up --build`
2. **Run the test suite**: `bash tests/run-tests.sh`
3. **Explore the API**: Use the endpoints documented in `docs/API_Documentation.md`
4. **Check the database**: Connect to localhost:5433 to see the current schema
5. **Read the docs**: Review all files in the `docs/` folder

## Quick Start

### Start Everything
```bash
# Start the application WITHOUT pgAdmin (recommended for local pgAdmin users)
docker-compose up --build

# OR start WITH pgAdmin (if you want Docker-based pgAdmin)
docker-compose --profile tools up --build
```
*First time takes 2-3 minutes to download everything*

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Database**: localhost:5433 (connect your local pgAdmin here) or postgres:5432 (from containers)
- **PgAdmin**: http://localhost:8080 (only if started with --profile tools)

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

## Backend Features

### Recent Backend Updates
Our backend has undergone significant improvements to support enhanced user profiles and better appointment management:

#### Profile Expansion
- **Student Housing Location**: Students can now specify their housing location for better appointment scheduling
- **Medical Staff Shift Schedules**: Medical staff can define their working shifts for accurate availability
- **Enhanced Validation**: Comprehensive input validation for all profile fields
- **Improved Error Handling**: Better error messages and response consistency

#### Key Profile Fields
```javascript
// Student profile additions
{
  housingLocation: "string", // e.g., "Building A", "Building B", "Off-campus"
  // ... other existing fields
}

// Medical staff profile additions  
{
  shiftSchedule: "string", // e.g., "Morning (8:00-16:00)", "Evening (16:00-00:00)"
  // ... other existing fields
}
```

#### Appointment Logic Improvements
- **Required Date/Time**: Appointment date and time must be specified during creation
- **Direct Staff Assignment**: Medical staff must be assigned when creating the appointment
- **Enhanced Validation**: Comprehensive checks for appointment conflicts and availability
- **Better Error Handling**: Clear error messages for scheduling conflicts and missing required fields

#### API Endpoints
For detailed API documentation including new endpoints and updated request/response formats, see:
- [API Documentation](API_Documentation.md)
- [Backend Logs](Backend_logs.md)

#### Database Schema Updates
Recent database improvements include:
- New `housing_location` column for student profiles
- New `shift_schedule` column for medical staff profiles
- Updated sample data and migration scripts
- See [Database Documentation](Database.md) for complete schema details

## Testing with Docker

### Prerequisites
- Docker Desktop installed and running
- No local Node.js installation required

### Test Suite Overview
Our comprehensive test suite has been recently refactored for better maintainability and reliability:

#### Test Structure
```
tests/
├── *.test.js              # Main test files
├── run-tests.sh           # Test runner script
├── authHelper.js          # Authentication utilities
├── testFramework.js       # Custom test framework
└── helpers/               # Modular test helpers
    ├── testHelper.js      # Core test utilities
    ├── profileHelper.js   # Profile management tests
    ├── appointmentHelper.js # Appointment logic tests
    ├── accessControlHelper.js # Permission tests
    ├── moodHelper.js      # Mood tracking tests
    ├── notificationHelper.js # Notification tests
    └── medicalStaffHelper.js # Staff management tests
```

#### Key Test Files
- **`profile-expansion.test.js`** - Tests new profile fields (housing, shifts)
- **`appointment.test.js`** - Enhanced appointment logic and validation
- **`advice.test.js`** - Advice system functionality
- **`mood.test.js`** - Mood tracking features
- **`notification.test.js`** - Notification system
- **`medical-staff.test.js`** - Staff management and permissions
- **`privilege.test.js`** - Access control and role-based permissions
- **`time-slots.test.js`** - Time slot management
- **`backend.test.js`** - Backend integration tests
- **`database.test.js`** - Database operations and schema

#### Test Refactoring Benefits
- **Modular Helpers**: Reusable test utilities in `tests/helpers/`
- **Standardized Auth**: Consistent authentication via `authHelper.js`
- **Improved Reliability**: Better test isolation and cleanup
- **DRY Principle**: Reduced code duplication across test files
- **Better Maintainability**: Easier to update and extend tests

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

#### Individual Test Examples
```bash
# Test profile expansion features
docker-compose --profile test run --rm test node tests/profile-expansion.test.js

# Test appointment logic
docker-compose --profile test run --rm test node tests/appointment.test.js

# Test access control
docker-compose --profile test run --rm test node tests/privilege.test.js

# Test notification system
docker-compose --profile test run --rm test node tests/notification.test.js
```

#### Using the Docker Manager Script
```powershell
.\docker-manager.ps1 test
```

### Test Development Guidelines
1. **Use Test Helpers**: Leverage the modular helpers in `tests/helpers/`
2. **Follow Authentication Pattern**: Use `authHelper.js` for consistent user management
3. **Clean Up**: Ensure tests clean up after themselves
4. **Test New Features**: Add tests for any new backend functionality
5. **Update Helpers**: Extend helpers when adding new test patterns

### Test Troubleshooting
```bash
# If tests fail, check backend logs
docker-compose logs backend

# Test backend health manually
curl http://localhost:5001/api/health

# Reset everything
docker-compose down
docker-compose up --build

# Run tests with verbose output
docker-compose --profile test run --rm test node tests/<test-name>.test.js --verbose
```

## Database Management

### Schema Updates and Migrations
The database schema has been recently updated to support new profile features:

#### Recent Schema Changes
- **`housing_location`** column added to student profiles
- **`shift_schedule`** column added to medical staff profiles  
- Updated sample data with realistic housing and shift information
- Enhanced foreign key relationships and constraints

#### Running Migrations
```bash
# Apply schema updates
docker-compose exec postgres psql -U vgu_user -d vgu_care -f /docker-entrypoint-initdb.d/01-schema.sql

# Or rebuild with fresh schema
docker-compose down --volumes
docker-compose up --build
```

#### Database Connection Details
- **External Connection** (pgAdmin/VSCode): `localhost:5433`
- **Internal Connection** (from containers): `postgres:5432`
- **Username**: `vgu_user`
- **Password**: `vgu_password`
- **Database**: `vgu_care`

#### Useful Database Commands
```bash
# Connect to database from terminal
docker-compose exec postgres psql -U vgu_user -d vgu_care

# View all tables
docker-compose exec postgres psql -U vgu_user -d vgu_care -c "\dt"

# Backup database
docker-compose exec postgres pg_dump -U vgu_user vgu_care > backup.sql

# Restore database
docker-compose exec -T postgres psql -U vgu_user vgu_care < backup.sql
```

#### Profile Migration Script
If you need to update existing profile data:
```bash
# Run the profile update script
docker-compose exec backend node database/update-profile-schema.js
```

For complete database documentation, see [Database.md](Database.md)

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

## Nuclear Options
⚠️ **WARNING: This will destroy ALL data and completely reset the system!**

Use this when:
- Multiple services are corrupted
- Database is completely broken
- Container network issues persist
- Tests are failing due to environment corruption
- You want to start completely fresh

### Nuclear Cleanup Steps:

```bash
# 1. Stop ALL containers (not just VGU Care)
docker stop $(docker ps -q) 2>/dev/null || true

# 2. Remove ALL VGU Care containers
docker-compose down --remove-orphans
docker-compose rm -f -v

# 3. Remove ALL VGU Care images
docker rmi $(docker images "vgu_care*" -q) 2>/dev/null || true
docker rmi $(docker images "vgu-care*" -q) 2>/dev/null || true

# 4. Remove ALL VGU Care volumes (⚠️ THIS DELETES ALL DATA!)
docker volume rm vgu_care_db_data 2>/dev/null || true
docker volume rm vgu_care_uploads 2>/dev/null || true
docker volume rm $(docker volume ls | grep vgu_care | awk '{print $2}') 2>/dev/null || true

# 5. Remove ALL VGU Care networks
docker network rm $(docker network ls | grep vgu_care | awk '{print $1}') 2>/dev/null || true

# 6. Clean up dangling resources
docker system prune -af --volumes

# 7. Clean up build cache
docker builder prune -af

# 8. Verify cleanup
echo "=== Cleanup Verification ==="
echo "Containers:"
docker ps -a | grep vgu || echo "No VGU containers found ✓"
echo "Images:"
docker images | grep vgu || echo "No VGU images found ✓"
echo "Volumes:"
docker volume ls | grep vgu || echo "No VGU volumes found ✓"
echo "Networks:"
docker network ls | grep vgu || echo "No VGU networks found ✓"

# 9. Rebuild everything from scratch
echo "=== Rebuilding System ==="
docker-compose build --no-cache
docker-compose up -d

# 10. Wait for services and run health check
echo "=== Waiting for services ==="
sleep 30
docker-compose ps
```

### One-Line Nuclear Command:
```bash
# ⚠️ NUCLEAR OPTION - Use with extreme caution!
docker stop $(docker ps -q) 2>/dev/null; docker-compose down --remove-orphans; docker-compose rm -f -v; docker rmi $(docker images "vgu_care*" -q) 2>/dev/null; docker volume rm $(docker volume ls | grep vgu_care | awk '{print $2}') 2>/dev/null; docker system prune -af --volumes; docker-compose build --no-cache; docker-compose up -d
```

## Quick Reference

### Development Commands
| **Scenario** | **Command** |
|--------------|-------------|
| **Start project** | `docker-compose up --build` |
| **Start in background** | `docker-compose up -d` |
| **Code changes** | `docker-compose restart backend` |
| **Add dependency** | `docker-compose up --build --no-deps backend` |
| **Pull team changes** | `docker-compose down && docker-compose up --build` |
| **Something's broken** | `docker-compose down && docker-compose up --build` |
| **Check logs** | `docker-compose logs -f backend` |
| **Clean up** | `docker system prune -a` |
| **Complete reset** | `docker-compose down --volumes && docker-compose up --build` |

### Testing Commands
| **Test Type** | **Command** |
|---------------|-------------|
| **All tests** | `bash tests/run-tests.sh` |
| **Profile expansion** | `docker-compose --profile test run --rm test node tests/profile-expansion.test.js` |
| **Appointments** | `docker-compose --profile test run --rm test node tests/appointment.test.js` |
| **Access control** | `docker-compose --profile test run --rm test node tests/privilege.test.js` |
| **Notifications** | `docker-compose --profile test run --rm test node tests/notification.test.js` |
| **Medical staff** | `docker-compose --profile test run --rm test node tests/medical-staff.test.js` |
| **Mood tracking** | `docker-compose --profile test run --rm test node tests/mood.test.js` |
| **Advice system** | `docker-compose --profile test run --rm test node tests/advice.test.js` |
| **Backend integration** | `docker-compose --profile test run --rm test node tests/backend.test.js` |
| **Database operations** | `docker-compose --profile test run --rm test node tests/database.test.js` |

### Database Commands
| **Operation** | **Command** |
|---------------|-------------|
| **Connect to DB** | `docker-compose exec postgres psql -U vgu_user -d vgu_care` |
| **View tables** | `docker-compose exec postgres psql -U vgu_user -d vgu_care -c "\dt"` |
| **Backup DB** | `docker-compose exec postgres pg_dump -U vgu_user vgu_care > backup.sql` |
| **Apply migrations** | `docker-compose exec backend node database/update-profile-schema.js` |
| **Fresh schema** | `docker-compose down --volumes && docker-compose up --build` |

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

### Development Best Practices
1. **Always use Docker**: Don't install Node.js/PostgreSQL locally
2. **Check logs first**: Most issues are visible in container logs
3. **Restart before rebuilding**: `restart` is faster than `up --build`
4. **Use profiles**: `--profile tools` for pgAdmin, `--profile test` for testing
5. **Clean regularly**: Run `docker system prune` weekly
6. **Read error messages**: Docker errors are usually informative

### Backend Development
7. **Test new features**: Add tests for any new backend functionality
8. **Use test helpers**: Leverage the modular helpers in `tests/helpers/`
9. **Validate inputs**: Use the enhanced validation patterns for profile fields
10. **Handle errors gracefully**: Follow the improved error handling patterns

### Database Management
11. **Backup before migrations**: Always backup data before schema changes
12. **Use migrations**: Apply schema updates through proper migration scripts
13. **Test with fresh data**: Use `--volumes` flag to test with clean database
14. **Document schema changes**: Update Database.md for any schema modifications

### Testing Guidelines
15. **Run tests frequently**: Use the test suite to catch issues early
16. **Test profile features**: Especially housing location and shift schedule functionality
17. **Test appointment logic**: Verify staff assignment and scheduling works correctly
18. **Clean up tests**: Ensure tests don't interfere with each other

## Need Help?

1. Check the logs: `docker-compose logs <service>`
2. Try the troubleshooting section above
3. Use the nuclear option if everything else fails
4. Ask the team on Discord

## Documentation Maintenance

### Keeping Docs Updated
As the project evolves, please help keep the documentation current:

#### When Adding New Features
- Update `docs/API_Documentation.md` with new endpoints
- Add entries to `docs/Backend_logs.md` for significant changes
- Update `docs/Database.md` for schema modifications
- Add test documentation to `docs/TEST_REFACTORING_SUMMARY.md`

#### When Modifying Tests
- Update the test file lists in this guide
- Document new test helpers in the Testing section
- Update `package.json` scripts for new test files

#### When Changing Docker Configuration
- Update port numbers and service names in this guide
- Modify the Quick Reference tables as needed
- Update troubleshooting sections for new issues

#### Documentation Files to Maintain
- **This file** (`GuideToEverything.md`) - Overall project guide
- **`README.md`** - Project overview and quick start
- **`API_Documentation.md`** - API endpoints and usage
- **`Database.md`** - Database schema and management
- **`Backend_logs.md`** - Development progress and changes
- **`TEST_REFACTORING_SUMMARY.md`** - Test structure and guidelines

---

*This guide covers all Docker operations and recent updates for the VGU Care project. Keep it updated as the project evolves.*