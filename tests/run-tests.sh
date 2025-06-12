#!/bin/bash
echo "🚀 Starting VGU Care Test Suite with Docker"

# Start services
echo "📦 Starting backend services..."
docker-compose up -d backend postgres

# Wait for backend to be ready with better health checking
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
  if curl -f http://localhost:5001/api/health >/dev/null 2>&1; then  # Changed port
    echo "✅ Backend is ready!"
    break
  fi
  echo "   Attempt $i/30 - Backend not ready yet..."
  sleep 2
done

# Final health check
if ! curl -f http://localhost:5001/api/health >/dev/null 2>&1; then  # Changed port
  echo "❌ Backend not ready after 60 seconds. Check logs with: docker-compose logs backend"
  exit 1
fi

# Run tests
echo "🧪 Running tests..."
echo ""

echo ""
echo "🔗 Running Backend Connection Tests..." 
docker-compose --profile test run --rm test node tests/backend.test.js


echo ""
echo "🔗 Running Database Tests..." 
docker-compose --profile test run --rm test node tests/database.test.js

echo "🔐 Running Authentication Service Tests..."
docker-compose --profile test run --rm test node tests/auth.test.js

echo ""
echo "👤 Running Profile Tests..."
docker-compose --profile test run --rm test node tests/profile.test.js

echo ""
echo "👤 Running Role Privileges Tests..."
docker-compose --profile test run --rm test node tests/privilege.test.js

echo ""
echo "👤 Running Appointment Management Tests..."
docker-compose --profile test run --rm test node tests/appointment.test.js

echo ""
echo "✨ All tests completed!"