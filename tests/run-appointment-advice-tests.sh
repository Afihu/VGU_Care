#!/bin/bash
# filepath: tests/run-appointment-advice-tests.sh

echo "🧪 Running Appointment and Advice Test Suite"
echo "=============================================="

# Set API URL for tests
export API_URL="http://localhost:5001"

echo "🔄 Starting backend server check..."
curl -s $API_URL/health > /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Backend server not running at $API_URL"
    echo "Please start the backend server first"
    exit 1
fi

echo "✅ Backend server is running"
echo ""

# Run appointment tests with new features
echo "📋 Running Appointment Tests (with approval/rejection)..."
node appointment.test.js
APPOINTMENT_RESULT=$?

echo ""
echo "💬 Running Temporary Advice Tests..."
node advice.test.js
ADVICE_RESULT=$?

echo ""
echo "👨‍⚕️ Running Medical Staff Tests (updated)..."
node medical-staff-tests.js
MEDICAL_RESULT=$?

echo ""
echo "🔐 Running Privilege Tests (with advice)..."
node privilege.test.js
PRIVILEGE_RESULT=$?

echo ""
echo "📊 Test Results Summary"
echo "======================"

TOTAL_PASSED=0
TOTAL_TESTS=4

if [ $APPOINTMENT_RESULT -eq 0 ]; then
    echo "✅ Appointment Tests: PASSED"
    TOTAL_PASSED=$((TOTAL_PASSED + 1))
else
    echo "❌ Appointment Tests: FAILED"
fi

if [ $ADVICE_RESULT -eq 0 ]; then
    echo "✅ Advice Tests: PASSED"
    TOTAL_PASSED=$((TOTAL_PASSED + 1))
else
    echo "❌ Advice Tests: FAILED"
fi

if [ $MEDICAL_RESULT -eq 0 ]; then
    echo "✅ Medical Staff Tests: PASSED"
    TOTAL_PASSED=$((TOTAL_PASSED + 1))
else
    echo "❌ Medical Staff Tests: FAILED"
fi

if [ $PRIVILEGE_RESULT -eq 0 ]; then
    echo "✅ Privilege Tests: PASSED"
    TOTAL_PASSED=$((TOTAL_PASSED + 1))
else
    echo "❌ Privilege Tests: FAILED"
fi

echo ""
echo "Overall: $TOTAL_PASSED/$TOTAL_TESTS tests passed"

if [ $TOTAL_PASSED -eq $TOTAL_TESTS ]; then
    echo "🎉 All appointment and advice tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed. Check the output above."
    exit 1
fi