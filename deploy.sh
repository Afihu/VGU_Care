#!/bin/bash

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
echo "Backend: $RAILWAY_URL"