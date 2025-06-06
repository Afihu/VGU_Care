# **VGU CARE**

This project is a Web App created for the module of Programming Exercise.

The team consists of:
<!-- BLANK -->

The app aims to provide a platform for medical personnels and students to communicate, manage appointments and, in general, improve the study environment.

## 🚀 Quick Start

1. **Install [Docker Desktop](https://www.docker.com/get-started)**
2. **Clone this repository**
3. **Start the application:**
   ```bash
   docker-compose up --build
   ```
4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:5432

## 📋 Current Implementation Status

### ✅ **Completed:**
- Docker development environment setup
- Database schema with sample data
- Basic project structure
- Basic authentication service (stub implementation)

### 🚧 **In Progress:**
- User authentication system
- API route structure

### 📋 **Planned Features:**
- Appointment Management
- Communication Platform
- Profile Management
- Dashboard

## 🏗️ Architecture

We use Docker for development and plan to migrate to a 3-tier production architecture:
- **Frontend**: Static React build deployed to GitHub Pages
- **Backend**: Node.js API deployed to AWS ECS/Heroku 
- **Database**: PostgreSQL on AWS RDS

## 🛠️ Technologies

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL 17
- **Authentication**: JWT
- **Containerization**: Docker & Docker Compose

## 📁 Project Structure

```
VGU_Care/
├── frontend/                 # React frontend application
├── backend/                 # Node.js backend API
├── database/               # Database scripts and migrations
├── docs/                   # Project documentation
├── tests/                  # Test files
└── README.md
```

## 📚 Documentation

- **[Installation Guide](docs/Installation.md)** - Detailed setup instructions
- **[Docker Guide](docs/Docker.md)** - Docker commands and troubleshooting
- **[API Documentation](docs/API_Documentation.md)** - Backend API reference
- **[Backend README](docs/Backend_README.md)** - Backend development guide

## 📄 License

This project is licensed under the Apache License - see the [LICENSE](LICENSE) file for details.