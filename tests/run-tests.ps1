# PowerShell version of run-tests.sh
Write-Host "🧪 VGU Care - Comprehensive Test Suite" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "🏥 Running Infrastructure Tests..." -ForegroundColor Yellow
docker-compose --profile test run --rm test node tests/backend.test.js

Write-Host ""
Write-Host "🗄️ Running Database Tests..." -ForegroundColor Yellow
docker-compose --profile test run --rm test node tests/database.test.js

Write-Host ""
Write-Host "🔐 Running Authentication Tests..." -ForegroundColor Yellow
docker-compose --profile test run --rm test node tests/auth.test.js

Write-Host ""
Write-Host "🛡️ Running Role Privileges Tests..." -ForegroundColor Yellow
docker-compose --profile test run --rm test node tests/privilege.test.js

Write-Host ""
Write-Host "👤 Running Profile Tests..." -ForegroundColor Yellow
docker-compose --profile test run --rm test node tests/profile.test.js

Write-Host ""
Write-Host "📅 Running Appointment Management Tests..." -ForegroundColor Yellow
docker-compose --profile test run --rm test node tests/appointment.test.js

Write-Host ""
Write-Host "🏥 Running Medical Staff Tests..." -ForegroundColor Yellow
docker-compose --profile test run --rm test node tests/medical-staff.test.js

Write-Host ""
Write-Host "💬 Running Advice System Tests..." -ForegroundColor Yellow
docker-compose --profile test run --rm test node tests/advice.test.js

Write-Host "🔔 Running Notification System Tests..." -ForegroundColor Yellow
docker-compose --profile test run --rm test node tests/notification.test.js
>>>>>>> origin/backend

Write-Host ""
Write-Host "✨ All tests completed!" -ForegroundColor Green
=======
Write-Host "🔔 Running Notification System Tests..." -ForegroundColor Yellow
docker-compose --profile test run --rm test node tests/notification.test.js
>>>>>>> origin/backend

Write-Host ""
Write-Host "✨ All tests completed!" -ForegroundColor Green
