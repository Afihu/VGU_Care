/**
 * Backend Integration Test Suite
 * Tests all current APIs, database connection, and backend infrastructure
 */

const { SimpleTest, makeRequest, API_BASE_URL } = require('./testFramework');
const TestHelper = require('./helpers/testHelper');

async function runBackendTests() {
  const test = new SimpleTest('🌐 Backend Integration Test Suite');
  const testHelper = new TestHelper();

  try {

  test.describe('🏥 Infrastructure Tests', function() {
    test.it('should respond to health check', async function() {
      const response = await makeRequest(`${API_BASE_URL}/api/health`);
      
      test.assertEqual(response.status, 200, 'Health check should return 200');
      test.assertProperty(response.body, 'message', 'Health check should have message');
      test.assertProperty(response.body, 'timestamp', 'Health check should have timestamp');
      console.log('✅ Health check endpoint working');
    });

    test.it('should test database connection', async function() {
      const response = await makeRequest(`${API_BASE_URL}/api/test-db`);
      
      test.assertEqual(response.status, 200, 'Database test should return 200');
      test.assertProperty(response.body, 'message', 'Database test should have message');
      console.log('✅ Database connection working');
    });
  });

  test.describe('👥 User Management API', function() {
    test.it('should authenticate all user types', async function() {
      await testHelper.initialize();
      
      test.assertExists(testHelper.authHelper.getToken('admin'), 'Admin token should exist');
      test.assertExists(testHelper.authHelper.getToken('student'), 'Student token should exist');
      test.assertExists(testHelper.authHelper.getToken('medicalStaff'), 'Medical staff token should exist');
      console.log('✅ All user types authenticated successfully');
    });

    test.it('should get user profile with admin token', async function() {
      const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
        'Authorization': `Bearer ${testHelper.authHelper.getToken('admin')}`
      });
      
      test.assertEqual(response.status, 200, 'Profile request should return 200');
      test.assertProperty(response.body, 'user', 'Response should have user property');
      test.assertEqual(response.body.user.role, 'admin', 'User should be admin');
      console.log('✅ Admin profile access working');
    });

    test.it('should get user profile with student token', async function() {
      const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
        'Authorization': `Bearer ${testHelper.authHelper.getToken('student')}`
      });
      
      test.assertEqual(response.status, 200, 'Profile request should return 200');
      test.assertProperty(response.body, 'user', 'Response should have user property');
      test.assertEqual(response.body.user.role, 'student', 'User should be student');
      console.log('✅ Student profile access working');
    });

    test.it('should get user profile with medical staff token', async function() {
      const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
        'Authorization': `Bearer ${testHelper.authHelper.getToken('medicalStaff')}`
      });
      
      test.assertEqual(response.status, 200, 'Profile request should return 200');
      test.assertProperty(response.body, 'user', 'Response should have user property');
      test.assertEqual(response.body.user.role, 'medical_staff', 'User should be medical staff');
      console.log('✅ Medical staff profile access working');
    });
  });

  test.describe('🔧 API Endpoint Coverage', function() {    test.it('should test appointment endpoints', async function() {
      // Test appointment creation
      const response = await testHelper.appointmentHelper.createAppointment('student', {
        symptoms: 'Backend integration test symptoms',
        priorityLevel: 'medium'
      });
      
      const appointment = response.body?.appointment;
      test.assertExists(appointment?.id, 'Appointment should be created');
      console.log('✅ Appointment API working');

      // Cleanup
      if (appointment?.id) {
        await testHelper.appointmentHelper.deleteAppointment('student', appointment.id);
      }
    });

    test.it('should test mood entry endpoints', async function() {
      const moodEntry = await testHelper.moodHelper.createMoodEntry('student', {
        mood: 'happy',
        notes: 'Backend test mood'
      });
      
      test.assertExists(moodEntry.id, 'Mood entry should be created');
      console.log('✅ Mood entry API working');

      // Cleanup
      await testHelper.moodHelper.deleteMoodEntry('student', moodEntry.id);
    });

    test.it('should test medical staff endpoints', async function() {
      const profile = await testHelper.medicalStaffHelper.getProfile();
      
      test.assertProperty(profile, 'name', 'Medical staff profile should exist');
      console.log('✅ Medical staff API working');
    });
  });

  test.describe('🚀 Performance Tests', function() {
    test.it('should handle concurrent requests', async function() {
      const requests = [];
      
      // Create multiple concurrent health check requests
      for (let i = 0; i < 10; i++) {
        requests.push(makeRequest(`${API_BASE_URL}/api/health`));
      }
      
      const responses = await Promise.all(requests);
      
      test.assert(responses.every(r => r.status === 200), 'All concurrent requests should succeed');
      console.log('✅ Backend handles concurrent requests correctly');
    });

    test.it('should respond within acceptable time limits', async function() {
      const startTime = Date.now();
      
      await makeRequest(`${API_BASE_URL}/api/health`);
        const responseTime = Date.now() - startTime;
      test.assert(responseTime < 2000, `Response time should be under 2s, got ${responseTime}ms`);
      console.log(`✅ Response time acceptable: ${responseTime}ms`);
    });
  });

    // Run tests
    await test.run();

  } catch (error) {
    console.error('\n💥 Backend tests failed:', error.message);
    throw error;
  } finally {
    // Cleanup
    await testHelper.cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runBackendTests();
}

module.exports = runBackendTests;
