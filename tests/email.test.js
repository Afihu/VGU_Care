// Email Notification Test Suite
// Run with: node tests/email.test.js

require('dotenv').config(); // Load .env from project root
const { SimpleTest } = require('./testFramework');
const EmailService = require('../backend/services/emailService');

async function runEmailTests() {
  const test = new SimpleTest('📧 Email Notification Test Suite');

  try {
    test.describe('SendGrid Email Configuration', function() {
      test.it('should have valid email configuration', async function() {
        console.log('🧪 Testing SendGrid Email Configuration...');
        console.log(`📧 Provider: ${process.env.EMAIL_PROVIDER}`);
        console.log(`🔑 API Key: ${process.env.SENDGRID_API_KEY ? 'Set' : 'Missing'}`);
        console.log(`📤 From: ${process.env.EMAIL_FROM}`);
        console.log(`📧 Admin: ${process.env.ADMIN_EMAIL}`);
        
        test.assert(process.env.EMAIL_PROVIDER === 'sendgrid', 'Email provider should be SendGrid');
        test.assert(process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your-sendgrid-api-key-here', 'SendGrid API key should be set');
        test.assert(process.env.EMAIL_FROM, 'EMAIL_FROM should be configured');
        console.log('✅ Email configuration is valid');
      });

      test.it('should send test email successfully', async function() {
        const emailService = new EmailService();
        
        const testEmail = {
          to: process.env.EMAIL_FROM, // Send to same email as sender
          subject: '🏥 VGU Care - Email Test',
          html: `
            <h2>🎉 Email Configuration Successful!</h2>
            <p>Your VGU Care email system is working correctly with SendGrid.</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Provider:</strong> SendGrid</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              This is a test email from VGU Care development environment.
            </p>
          `
        };

        console.log('📤 Sending test email...');
        const result = await emailService.sendEmail(
          testEmail.to,
          testEmail.subject,
          testEmail.html
        );
        
        test.assert(result && result.success !== false, 'Email should be sent successfully');
        console.log('✅ Test email sent successfully!');
        console.log('📬 Check your inbox (and spam folder)');
      });
    });

    await test.run();

  } catch (error) {
    console.error('\n💥 Email tests failed:', error.message);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runEmailTests();
}

module.exports = runEmailTests;
