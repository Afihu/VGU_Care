#!/bin/bash

# VGU Care - One-Click Deploy Script
echo "🚀 VGU Care - Quick Deploy (FREE)"
echo "=================================="

# Check prerequisites
command -v railway >/dev/null 2>&1 || { echo "❌ Install Railway CLI: npm install -g @railway/cli"; exit 1; }
command -v vercel >/dev/null 2>&1 || { echo "❌ Install Vercel CLI: npm install -g vercel"; exit 1; }

# Create root package.json
echo "📦 Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "vgu-care",
  "main": "backend/server.js",
  "scripts": { "start": "node backend/server.js" },
  "engines": { "node": "18.x" },
  "dependencies": {
    "@sendgrid/mail": "^8.1.5",
    "bcryptjs": "^3.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "nodemailer": "^7.0.3",
    "pg": "^8.16.0"
  }
}
EOF

# Deploy backend
echo "📡 Deploying backend to Railway..."
railway new vgu-care-backend
railway up

# Get Railway URL
RAILWAY_URL=$(railway domain 2>/dev/null | grep -o 'https://[^[:space:]]*' | head -1)

# Deploy frontend
echo "🌐 Deploying frontend to Vercel..."
cd frontend

cat > vercel.json << 'EOF'
{
  "builds": [{"src": "package.json", "use": "@vercel/static-build", "config": {"distDir": "build"}}],
  "routes": [{"src": "/(.*)", "dest": "/index.html"}]
}
EOF

vercel --prod
cd ..

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================="
echo ""
echo "🔧 NEXT STEPS:"
echo "1. Set up Supabase database: https://supabase.com"
echo "2. Set up SendGrid email: https://sendgrid.com"
echo "3. Configure environment variables:"
echo ""
echo "📡 Railway Variables:"
echo "NODE_ENV=production"
echo "DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres"
echo "JWT_SECRET=your-super-secure-random-string"
echo "EMAIL_ENABLED=true"
echo "EMAIL_PROVIDER=sendgrid"
echo "SENDGRID_API_KEY=SG.your-api-key"
echo "EMAIL_FROM=your-verified-email@domain.com"
echo "FRONTEND_URL=https://your-vercel-url.vercel.app"
echo ""
echo "🌐 Vercel Variables:"
echo "REACT_APP_API_URL=$RAILWAY_URL"
echo ""
echo "🎯 Your URLs:"
echo "Backend: $RAILWAY_URL"
echo "Frontend: Check Vercel dashboard"
echo ""
echo "🚀 Ready for presentation!"