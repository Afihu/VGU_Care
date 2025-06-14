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
   - Database: localhost:5433 (through pgAdmin or any PostgreSQL client)

*Please refer to the [Installation Guide](docs/Installation.md) for detailed setup instructions if you are having problems.*

## 📚 Documentation

- **[Installation Guide](docs/Installation.md)** - Detailed setup instructions
- **[Docker Guide](docs/Docker.md)** - Docker commands and troubleshooting

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

## 📄 License

This project is licensed under the Apache License - see the [LICENSE](LICENSE) file for details.