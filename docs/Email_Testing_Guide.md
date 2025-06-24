# VGU Care Email Testing Guide

## Quick Setup

### 1. Get SendGrid API Key
**Ask for the API key in Discord** - I'll provide the production SendGrid API key for testing.

### 2. Configure Environment Variables
Add these to your `.env` file in the project root:

```env
# Email Configuration
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-api-key-from-discord
EMAIL_FROM=kath.maithi@gmail.com
ADMIN_EMAIL=admin@vgucare.edu.vn
```

### 3. Update Test Email Addresses
Edit `tests/email.test.js` and change these lines to your email addresses:

```javascript
const TEST_MEDICAL_STAFF_EMAIL = 'your-staff-email@gmail.com';
const TEST_STUDENT_EMAIL = 'your-student-email@gmail.com';
```

## Running Tests

### Simple Email Test
```bash
node tests/email.test.js
```

### What the Test Does
1. **Creates** a student and medical staff user
2. **Books** an appointment with automatic staff assignment
3. **Updates** symptoms → **Sends automatic email to medical staff**
4. **Approves** appointment → **Sends email to student**
5. **Verifies** everything in database
6. **Cleans up** test data

## Expected Results

✅ **2 emails sent:**
- **Medical Staff:** Symptom update notification
- **Student:** Appointment approval notification

✅ **Console output:** Detailed test progress with ✅/❌ status

✅ **Database:** All data properly stored and cleaned up

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `SendGrid API key error` | Ask for API key in Discord |
| `Database connection failed` | Check if PostgreSQL is running |
| `No time slots available` | Run `npm run setup-time-slots` |
| `Email not received` | Check spam folder, verify email addresses |

## Test Files Overview

- `tests/email.test.js` - Main comprehensive test
- `backend/services/emailService.js` - Email service with templates
- `backend/templates/email/` - HTML email templates
- `backend/services/appointmentService.js` - Auto-notification logic

## Quick Verification

After running the test, check:
1. Both email addresses received emails
2. Console shows all ✅ green checkmarks
3. No error messages in output

**Need the API key?** → **Ask in Discord** 💬
