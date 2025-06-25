#!/bin/bash

echo "🚀 Deploying VGU Care with SendGrid to free hosting..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

command -v railway >/dev/null 2>&1 || { 
    echo -e "${RED}❌ Railway CLI not installed.${NC}"
    echo "Install with: npm install -g @railway/cli"
    exit 1
}

command -v vercel >/dev/null 2>&1 || { 
    echo -e "${RED}❌ Vercel CLI not installed.${NC}"
    echo "Install with: npm install -g vercel"
    exit 1
}

echo -e "${GREEN}✅ All prerequisites installed${NC}"

# Check if user is logged in
echo -e "${BLUE}🔐 Checking authentication...${NC}"

railway whoami >/dev/null 2>&1 || {
    echo -e "${YELLOW}⚠️ Not logged into Railway. Please run: railway login${NC}"
    exit 1
}

vercel whoami >/dev/null 2>&1 || {
    echo -e "${YELLOW}⚠️ Not logged into Vercel. Please run: vercel login${NC}"
    exit 1
}

echo -e "${GREEN}✅ Authentication verified${NC}"

# 1. Deploy backend to Railway
echo -e "${BLUE}📡 Deploying backend to Railway...${NC}"

# Check if railway.json exists
if [ ! -f "railway.json" ]; then
    echo -e "${YELLOW}⚠️ railway.json not found. Creating...${NC}"
    cat > railway.json << EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
EOF
fi

# Deploy to Railway
railway up

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend deployed successfully${NC}"
else
    echo -e "${RED}❌ Backend deployment failed${NC}"
    exit 1
fi

# Get Railway URL
RAILWAY_URL=$(railway domain 2>/dev/null | grep -o 'https://[^[:space:]]*' | head -1)

if [ -n "$RAILWAY_URL" ]; then
    echo -e "${GREEN}🌐 Backend URL: $RAILWAY_URL${NC}"
else
    echo -e "${YELLOW}⚠️ Could not determine Railway URL automatically${NC}"
    echo "Please check Railway dashboard for your backend URL"
fi

# 2. Deploy frontend to Vercel
echo -e "${BLUE}🌐 Deploying frontend to Vercel...${NC}"

cd frontend

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
    echo -e "${YELLOW}⚠️ vercel.json not found. Creating...${NC}"
    cat > vercel.json << EOF
{
  "name": "vgu-care-frontend",
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
  ]
}
EOF
fi

# Deploy to Vercel
vercel --prod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend deployed successfully${NC}"
else
    echo -e "${RED}❌ Frontend deployment failed${NC}"
    exit 1
fi

cd ..

# 3. Test deployment
echo -e "${BLUE}🧪 Testing deployment...${NC}"
sleep 30

if [ -n "$RAILWAY_URL" ]; then
    echo "Testing backend health at: $RAILWAY_URL/api/health"
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/api/health" 2>/dev/null)
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Backend health check passed${NC}"
    else
        echo -e "${YELLOW}⚠️ Backend health check returned status: $HTTP_STATUS${NC}"
        echo "This might be normal if the service is still starting up"
    fi
else
    echo -e "${YELLOW}⚠️ Skipping health check - Railway URL not available${NC}"
fi

# 4. Display next steps
echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Set environment variables in Railway dashboard:"
echo "   - NODE_ENV=production"
echo "   - DATABASE_URL=postgresql://postgres:password@host:5432/postgres"
echo "   - JWT_SECRET=your-super-secure-random-string"
echo "   - EMAIL_ENABLED=true"
echo "   - EMAIL_PROVIDER=sendgrid"
echo "   - SENDGRID_API_KEY=SG.your-sendgrid-api-key"
echo "   - EMAIL_FROM=your-verified-email@domain.com"
echo "   - FRONTEND_URL=https://your-vercel-url.vercel.app"
echo ""
echo "2. Set environment variables in Vercel dashboard:"
echo "   - REACT_APP_API_URL=$RAILWAY_URL"
echo ""
echo "3. Set up SendGrid:"
echo "   - Sign up at https://sendgrid.com (free tier: 100 emails/day)"
echo "   - Verify your sender email address"
echo "   - Create API key with Full Access permissions"
echo "   - Add API key to Railway environment variables"
echo ""
echo "4. Set up Supabase database:"
echo "   - Sign up at https://supabase.com"
echo "   - Create new project"
echo "   - Import your database schema"
echo "   - Add DATABASE_URL to Railway environment variables"
echo ""
echo "5. Test your application:"
echo "   - Visit your Vercel URL"
echo "   - Try logging in with demo credentials"
echo "   - Test appointment creation (should send email)"
echo ""
echo -e "${BLUE}📱 Your app URLs:${NC}"
echo "Frontend: Check Vercel dashboard for URL"
echo "Backend: $RAILWAY_URL"
echo ""
echo -e "${GREEN}🎯 Demo credentials:${NC}"
echo "Student: student1@vgu.edu.vn / password123"
echo "Medical Staff: doctor1@vgu.edu.vn / password123"
echo "Admin: admin@vgu.edu.vn / password123"
echo ""
echo -e "${YELLOW}💡 Pro tip: Monitor your SendGrid usage at https://app.sendgrid.com${NC}"
echo -e "${GREEN}🚀 Your VGU Care project is now live and free!${NC}"