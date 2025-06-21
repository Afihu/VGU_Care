# PowerShell version of run-tests.sh with database resets
Write-Host "🧪 VGU Care - Comprehensive Test Suite with Fresh Database" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

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
Write-Host "🔄 Resetting database for appointment tests..." -ForegroundColor Magenta
docker-compose down -v
docker-compose up -d
Start-Sleep 15

Write-Host ""
Write-Host "📅 Running Appointment Management Tests..." -ForegroundColor Yellow
docker-compose --profile test run --rm test node tests/appointment.test.js

Write-Host ""
Write-Host "🕐 Running Time Slots Tests..." -ForegroundColor Yellow
docker-compose --profile test run --rm test node tests/time-slots.test.js

Write-Host ""
Write-Host "🎄 Running Blackout Dates Tests..." -ForegroundColor Yellow
docker-compose --profile test run --rm test node tests/blackout-dates.test.js

Write-Host ""
Write-Host "🏥 Running Medical Staff Tests..." -ForegroundColor Yellow
docker-compose --profile test run --rm test node tests/medical-staff.test.js

Write-Host ""
Write-Host "💬 Running Advice System Tests..." -ForegroundColor Yellow
docker-compose --profile test run --rm test node tests/advice.test.js

Write-Host ""
Write-Host "🔔 Running Notification Tests..." -ForegroundColor Yellow
docker-compose --profile test run --rm test node tests/notification.test.js

Write-Host ""
Write-Host "😊 Running Mood Entry Tests..." -ForegroundColor Yellow
docker-compose --profile test run --rm test node tests/mood.test.js

Write-Host ""
Write-Host "✨ All tests completed!" -ForegroundColor Green
