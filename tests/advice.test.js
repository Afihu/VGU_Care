/**
 * Temporary Advice Test Suite
 * Tests temporary advice functionality for medical staff
 */

const { SimpleTest } = require('./testFramework');
const AuthHelper = require('./authHelper');
const request = require('supertest');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5001';

async function runAdviceTests() {
  const test = new SimpleTest('Temporary Advice Management');
  const authHelper = new AuthHelper();
  
  let studentToken, medicalStaffToken, adminToken;
  let testAppointmentId, testAdviceId;

  console.log(`🌐 Using API URL: ${API_BASE_URL}`);
  
  // Setup: Authenticate all users
  try {
    await authHelper.authenticateAllUsers();
    studentToken = authHelper.getToken('student');
    medicalStaffToken = authHelper.getToken('medicalStaff');
    adminToken = authHelper.getToken('admin');
    console.log('✅ Authentication successful for all roles');
  } catch (error) {
    console.error('❌ Authentication setup failed:', error.message);
    process.exit(1);
  }

  // Setup: Create test appointment
  test.describe('🏥 Setup Test Data', function() {
    test.it('should create test appointment for advice testing', async function() {
      const appointmentData = {
        symptoms: 'Test symptoms for advice',
        priorityLevel: 'medium'
      };

      const response = await request(API_BASE_URL)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(appointmentData);
      
      test.assertEqual(response.status, 201, 'Should create appointment successfully');
      testAppointmentId = response.body.id;
      console.log(`   Created test appointment: ${testAppointmentId}`);
    });
  });

  // Medical Staff Advice Tests
  test.describe('👨‍⚕️ Medical Staff Advice Management', function() {
    
    test.it('should send advice for appointment', async function() {
      const adviceData = {
        message: 'Please drink plenty of water and rest. Avoid strenuous activities.'
      };

      const response = await request(API_BASE_URL)
        .post(`/api/advice/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${medicalStaffToken}`)
        .send(adviceData);
      
      test.assertEqual(response.status, 201, 'Should send advice successfully');
      test.assertProperty(response.body, 'advice', 'Should return advice object');
      test.assertEqual(response.body.advice.message, adviceData.message, 'Message should match');
      
      testAdviceId = response.body.advice.id;
      console.log(`   Sent advice: ${testAdviceId}`);
    });

    test.it('should get advice sent by medical staff', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/advice/sent')
        .set('Authorization', `Bearer ${medicalStaffToken}`);
      
      test.assertEqual(response.status, 200, 'Should get sent advice successfully');
      test.assertTrue(Array.isArray(response.body.advice), 'Should return advice array');
      console.log(`   Retrieved ${response.body.count} sent advice messages`);
    });

    test.it('should validate required message field', async function() {
      const response = await request(API_BASE_URL)
        .post(`/api/advice/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${medicalStaffToken}`)
        .send({});
      
      test.assertEqual(response.status, 400, 'Should return 400 for missing message');
    });

    test.it('should prevent non-medical staff from sending advice', async function() {
      const adviceData = {
        message: 'Student trying to send advice'
      };

      const response = await request(API_BASE_URL)
        .post(`/api/advice/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(adviceData);
      
      test.assertEqual(response.status, 403, 'Should return 403 for unauthorized access');
    });
  });

  // Student Advice Tests
  test.describe('🎓 Student Advice Access', function() {
    
    test.it('should get advice for student', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/advice/student')
        .set('Authorization', `Bearer ${studentToken}`);
      
      test.assertEqual(response.status, 200, 'Should get student advice successfully');
      test.assertTrue(Array.isArray(response.body.advice), 'Should return advice array');
      console.log(`   Student has ${response.body.count} advice messages`);
    });

    test.it('should prevent student from accessing sent advice endpoint', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/advice/sent')
        .set('Authorization', `Bearer ${studentToken}`);
      
      test.assertEqual(response.status, 403, 'Should return 403 for unauthorized access');
    });
  });

  // Error Handling Tests
  test.describe('🚫 Error Handling', function() {
    
    test.it('should handle non-existent appointment', async function() {
      const adviceData = {
        message: 'Advice for non-existent appointment'
      };

      const response = await request(API_BASE_URL)
        .post('/api/advice/appointments/99999')
        .set('Authorization', `Bearer ${medicalStaffToken}`)
        .send(adviceData);
      
      test.assertEqual(response.status, 404, 'Should return 404 for non-existent appointment');
    });

    test.it('should handle empty message', async function() {
      const adviceData = {
        message: '   '  // Only whitespace
      };

      const response = await request(API_BASE_URL)
        .post(`/api/advice/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${medicalStaffToken}`)
        .send(adviceData);
      
      test.assertEqual(response.status, 400, 'Should return 400 for empty message');
    });
  });

  // Run all tests
  await test.run();
  
  console.log('\n🏁 Temporary Advice Test Suite completed');
  console.log('📝 Summary:');
  console.log('   - Medical staff can send advice for appointments');
  console.log('   - Students can view their received advice');
  console.log('   - Proper role-based access control validated');
  console.log('   - Error handling verified');
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runAdviceTests().catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  });
}

module.exports = runAdviceTests;