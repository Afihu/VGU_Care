#!/usr/bin/env node

/**
 * VGU Care - Prepare for Free Hosting Script
 * This script prepares your project for deployment on free hosting services
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing VGU Care for free hosting...\n');

// 1. Create production package.json for root
const rootPackageJson = {
  "name": "vgu-care",
  "version": "1.0.0",
  "description": "VGU Care - University Healthcare Management Platform",
  "main": "backend/server.js",
  "scripts": {
    "start": "node backend/server.js",
    "build": "npm install",
    "dev": "nodemon backend/server.js",
    "migrate": "node deployment/migrate-database.js",
    "seed": "node deployment/seed-database.js"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  },
  "dependencies": {
    "@sendgrid/mail": "^8.1.5",
    "bcrypt": "^6.0.0",
    "bcryptjs": "^3.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "nodemailer": "^7.0.3",
    "pg": "^8.16.0",
    "sequelize": "^6.28.0",
    "@sendgrid/mail": "^8.1.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
};

// 2. Create Railway configuration
const railwayJson = {
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
};

// 3. Create Vercel configuration for frontend
const vercelJson = {
  "name": "vgu-care-frontend",
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "@react_app_api_url"
  }
};

// 4. Create production Dockerfile for backend
const dockerfileContent = `# Production Dockerfile for Railway
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY backend/ ./backend/
COPY database/ ./database/
COPY deployment/ ./deployment/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 5001

CMD ["npm", "start"]`;

// 5. Create environment template
const envTemplate = `# VGU Care - Production Environment Variables

# Database (Supabase)
DATABASE_URL=postgresql://postgres:password@host:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# JWT Secret (Generate a strong random string)
JWT_SECRET=your-super-secure-jwt-secret-here

# Server Configuration
NODE_ENV=production
PORT=5001

# Frontend URL (Vercel)
FRONTEND_URL=https://your-app.vercel.app

# Email Configuration (SendGrid - Free)
EMAIL_ENABLED=true
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
EMAIL_FROM=your-verified-email@domain.com

# Admin Configuration
ADMIN_EMAIL=admin@yourdomain.com
APP_NAME=VGU Care
SUPPORT_EMAIL=support@yourdomain.com`;

// 6. Create API configuration for frontend
const apiConfigContent = `// Frontend API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://vgu-care-backend-production.up.railway.app'
  : 'http://localhost:5001';

export default API_BASE_URL;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/login',
    SIGNUP: '/api/signup',
    LOGOUT: '/api/logout'
  },
  USERS: {
    PROFILE: '/api/users/me',
    UPDATE_PROFILE: '/api/users/profile',
    CHANGE_PASSWORD: '/api/users/change-password'
  },
  APPOINTMENTS: {
    LIST: '/api/appointments',
    CREATE: '/api/appointments',
    UPDATE: '/api/appointments',
    DELETE: '/api/appointments'
  },
  MOOD: {
    LIST: '/api/mood-entries',
    CREATE: '/api/mood-entries',
    UPDATE: '/api/mood-entries',
    DELETE: '/api/mood-entries'
  },
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    MARK_READ: '/api/notifications',
    DELETE: '/api/notifications'
  }
};`;

// 7. Create database migration script
const migrationScript = `const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateDatabase() {
  console.log('🗄️ Starting database migration...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schema);
    console.log('✅ Database schema created successfully');

    await client.end();
    console.log('✅ Database migration completed');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  migrateDatabase();
}

module.exports = migrateDatabase;`;

// 8. Create deployment script
const deployScript = `#!/bin/bash

echo "🚀 Deploying VGU Care to free hosting..."

# Check if required tools are installed
command -v railway >/dev/null 2>&1 || { echo "❌ Railway CLI not installed. Run: npm install -g @railway/cli"; exit 1; }
command -v vercel >/dev/null 2>&1 || { echo "❌ Vercel CLI not installed. Run: npm install -g vercel"; exit 1; }

# 1. Deploy backend to Railway
echo "📡 Deploying backend to Railway..."
railway up

if [ $? -eq 0 ]; then
    echo "✅ Backend deployed successfully"
else
    echo "❌ Backend deployment failed"
    exit 1
fi

# 2. Deploy frontend to Vercel
echo "🌐 Deploying frontend to Vercel..."
cd frontend
vercel --prod

if [ $? -eq 0 ]; then
    echo "✅ Frontend deployed successfully"
else
    echo "❌ Frontend deployment failed"
    exit 1
fi

cd ..

# 3. Test deployment
echo "🧪 Testing deployment..."
sleep 30

# Get Railway URL
RAILWAY_URL=$(railway domain 2>/dev/null | grep -o 'https://[^[:space:]]*')

if [ -n "$RAILWAY_URL" ]; then
    echo "Testing backend health at: $RAILWAY_URL/api/health"
    curl -f "$RAILWAY_URL/api/health" || echo "⚠️ Health check failed"
else
    echo "⚠️ Could not determine Railway URL"
fi

echo ""
echo "🎉 Deployment complete!"
echo "📋 Next steps:"
echo "1. Set environment variables in Railway dashboard"
echo "2. Set REACT_APP_API_URL in Vercel dashboard"
echo "3. Configure SendGrid service"
echo "4. Test your application"
echo ""
echo "📱 Your app should be available at:"
echo "Frontend: Check Vercel dashboard for URL"
echo "Backend: $RAILWAY_URL"`;

// Write files
try {
  // Create deployment directory
  if (!fs.existsSync('deployment')) {
    fs.mkdirSync('deployment');
  }

  // Create frontend config directory
  if (!fs.existsSync('frontend/src/config')) {
    fs.mkdirSync('frontend/src/config', { recursive: true });
  }

  // Write root package.json
  fs.writeFileSync('package.json', JSON.stringify(rootPackageJson, null, 2));
  console.log('✅ Created root package.json');

  // Write Railway config
  fs.writeFileSync('railway.json', JSON.stringify(railwayJson, null, 2));
  console.log('✅ Created railway.json');

  // Write Vercel config for frontend
  fs.writeFileSync('frontend/vercel.json', JSON.stringify(vercelJson, null, 2));
  console.log('✅ Created frontend/vercel.json');

  // Write Dockerfile
  fs.writeFileSync('Dockerfile', dockerfileContent);
  console.log('✅ Created Dockerfile');

  // Write environment template
  fs.writeFileSync('deployment/.env.production', envTemplate);
  console.log('✅ Created deployment/.env.production');

  // Write API config
  fs.writeFileSync('frontend/src/config/api.js', apiConfigContent);
  console.log('✅ Created frontend/src/config/api.js');

  // Write migration script
  fs.writeFileSync('deployment/migrate-database.js', migrationScript);
  console.log('✅ Created deployment/migrate-database.js');

  // Write deployment script
  fs.writeFileSync('deploy.sh', deployScript);
  console.log('✅ Created deploy.sh');

  // Make deployment script executable
  if (process.platform !== 'win32') {
    fs.chmodSync('deploy.sh', '755');
  }

  console.log('\n🎉 Project prepared for free hosting!');
  console.log('\n📋 Next steps:');
  console.log('1. Create accounts on Supabase, Railway, Vercel, and SendGrid');
  console.log('2. Set up your database on Supabase');
  console.log('3. Install CLI tools: npm install -g @railway/cli vercel');
  console.log('4. Run: railway login && vercel login');
  console.log('5. Execute: ./deploy.sh (or bash deploy.sh on Windows)');
  console.log('\n📚 Read Complete_Free_Hosting_Guide.md for detailed instructions');

} catch (error) {
  console.error('❌ Error preparing project:', error.message);
}