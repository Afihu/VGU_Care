# Installation Guide

## Prerequisites

### Required Installation:
1. **[Docker Desktop](https://www.docker.com/get-started)** 
   - Downloads PostgreSQL, Node.js, and everything else automatically
   - **This is the only thing you need to install!**

2. **[Git](https://git-scm.com/)** - For version control

### Optional (for development):
- **[VSCode](https://code.visualstudio.com/)** - Code editor
- **[Draw.io Integration](https://marketplace.visualstudio.com/items?itemName=hediet.vscode-drawio)** - For .drawio diagrams

## Installation Steps

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

### 3. Start Everything
```bash
# Start the application without pgAdmin
docker-compose up --build
#OR
# Start the application with pgAdmin 4 (recommended for database management)
docker-compose --profile tools up --build

# For subsequent runs, you can use:
docker-compose up
```
*First time takes 2-3 minutes to download everything*

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5433 (⚠️ Note: Port 5433, not 5432)
- **Test Database Connection**: http://localhost:5000/api/test-db
- **pgAdmin 4**: http://localhost:8080 (if using the tools profile)

### 5. Stop the Application
```bash
docker-compose down
```

## Development Setup

For active development with hot reload:
```bash
# Start only the database container
docker-compose up postgres -d

# Run frontend and backend on your machine (with auto-reload)
cd frontend && npm install && npm start
cd backend && npm install && npm run dev
```

## Database Management with pgAdmin 4

### Option 1: Use Built-in pgAdmin (Recommended)
```bash
# Start all services including pgAdmin
docker-compose --profile tools up --build

# Access pgAdmin at: http://localhost:8080
# Login credentials:
# Email: admin@vgu.edu.vn
# Password: admin123
```

### Option 2: Install pgAdmin Locally 
1. Download from [pgadmin.org](https://www.pgadmin.org/download/)
2. Install and open pgAdmin 4
3. Add server connection (see connection details below)

## Database Connection Setup

### Connect to VGU Care Database in pgAdmin:

1. **Open pgAdmin** (http://localhost:8080 if using Docker, or local installation)

2. **Add New Server:**
   - Right-click "Servers" → "Register" → "Server"
   
3. **General Tab:**
   ```
   Name: VGU Care Database
   ```

4. **Connection Tab:**
   ```
   Host: postgres (if using Docker pgAdmin) OR localhost (if using local pgAdmin)
   Port: 5432 (Docker pgAdmin) OR 5433 (local pgAdmin/VSCode)
   Maintenance database: vgu_care
   Username: vgu_user
   Password: vgu_password
   ```

5. **Click "Save"**

### Database Structure Overview:

Your database comes pre-loaded with:
- **10 sample users**: 7 students, 2 medical staff, 1 admin
- **Complete schema** with all tables:
  - `users` - Base user information
  - `students` - Student-specific data
  - `medical_staff` - Medical staff details
  - `admins` - Admin accounts
  - `appointments` - Medical appointments
  - `temporary_advice` - Quick medical advice
  - `health_documents` - Student health records
  - `mood_entries` - Mental health tracking
  - `abuse_reports` - Safety reporting system

### Common pgAdmin Tasks:

#### View Sample Data:
```sql
-- See all users
SELECT * FROM users;

-- See student information
SELECT u.name, u.email, s.major, s.intake_year 
FROM users u 
JOIN students s ON u.user_id = s.user_id;

-- Check database connection
SELECT NOW() as current_time, current_database(), current_user;
```

#### Test Backend Database Connection:
```sql
-- This query is used by the backend API
SELECT NOW() as current_time;
```

## Alternative: VSCode Database Extension (Optional)

If you prefer working within VSCode:

1. **Install Extensions:**
   - [SQLTools](https://marketplace.visualstudio.com/items?itemName=mtxr.sqltools)
   - [SQLTools PostgreSQL Driver](https://marketplace.visualstudio.com/items?itemName=mtxr.sqltools-driver-pg)

2. **Connect to Database:**
   - Press `Ctrl+Shift+P` → "SQLTools: Add New Connection"
   - Select **PostgreSQL**
   - Connection details:
   ```
   Connection Name: VGU Care DB
   Server: localhost
   Port: 5433
   Database: vgu_care
   Username: vgu_user
   Password: vgu_password
   ```

3. **Query Database:**
   - Click SQLTools icon in sidebar
   - Right-click connection → "New SQL File"
   - Write queries and press `Ctrl+E` to execute

## Quick Start Commands

```bash
# Full start with pgAdmin
docker-compose --profile tools up --build

# Start without pgAdmin (lighter)
docker-compose up --build

# Test database connection via API
curl http://localhost:5000/api/test-db

# Stop everything
docker-compose down
```

## Troubleshooting

### ⚠️ **Port 5432 Conflict (Common Issue)**
**Problem**: Local pgAdmin, VSCode SQLTools, or other database tools can't connect
**Symptoms**: "Password authentication failed" or "Connection refused" errors

**Cause**: You likely have a local PostgreSQL installation using port 5432, conflicting with Docker

**Solution**:
```bash
# Check what's using port 5432
netstat -ano | findstr :5432

# If you see multiple entries, you have a port conflict
# Our Docker database uses port 5433 to avoid this

# For external connections, always use:
# Host: localhost
# Port: 5433
# Username: vgu_user  
# Password: vgu_password
```

### pgAdmin Won't Start:
```bash
# Check if port 8080 is available
netstat -ano | findstr :8080

# If port is busy, modify docker-compose.yml:
# Change "8080:80" to "8081:80" and access via http://localhost:8081
```

### Database Connection Issues:
```bash
# Restart database container
docker-compose restart postgres

# Check container status
docker-compose ps

# View database logs
docker-compose logs postgres
```

### pgAdmin Can't Connect to Database:
- **Docker pgAdmin**: Use hostname `postgres` and port `5432`
- **Local pgAdmin/VSCode**: Use hostname `localhost` and port `5433`
- Ensure both containers are running: `docker-compose ps`

### Complete Reset (Nuclear Option):
```bash
# If everything is broken, start fresh
docker-compose down --volumes --remove-orphans
docker system prune -f
docker-compose up --build
```

## Port Reference

| **Service**    | **Internal Port** | **External Port** | **Access URL**              |
|----------------|-------------------|-------------------|----------------------------|
| **PostgreSQL** | 5432              | 5433              | `localhost:5433`           |
| **Backend API**| 5001              | 5001              | `http://localhost:5001`    |  <!-- Changed from 5000 -->
| **Frontend**   | 3000              | 3000              | `http://localhost:3000`    |
| **pgAdmin**    | 80                | 8080              | `http://localhost:8080`    |