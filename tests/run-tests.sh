#!/bin/bash
# filepath: tests/run-tests.sh

echo "🧪 VGU Care - Comprehensive Test Suite"
echo "======================================"

echo ""
echo "🏥 Running Infrastructure Tests..."
docker-compose --profile test run --rm test node tests/backend.test.js

echo ""
echo "🗄️ Running Database Tests..." 
docker-compose --profile test run --rm test node tests/database.test.js

echo ""
echo "🔐 Running Authentication Tests..."
docker-compose --profile test run --rm test node tests/auth.test.js

echo ""
echo "�️ Running Role Privileges Tests..."
docker-compose --profile test run --rm test node tests/privilege.test.js

echo ""
echo "� Running Profile Management Tests..."
docker-compose --profile test run --rm test node tests/profile.test.js

echo ""
echo "📅 Running Appointment Management Tests..."
docker-compose --profile test run --rm test node tests/appointment.test.js

echo ""
echo "🏥 Running Medical Staff Tests..."
docker-compose --profile test run --rm test node tests/medical-staff.test.js

echo ""
echo "✨ All tests completed!"