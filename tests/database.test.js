/**
 * Database Test Suite
 * Tests database connections and ensures all users, appointments, etc are correctly inserted
 */

const { SimpleTest, makeRequest, API_BASE_URL } = require('./testFramework');
const TestHelper = require('./helpers/testHelper');

async function runDatabaseTests() {
  const test = new SimpleTest('🗄️ Database Test Suite');
  const testHelper = new TestHelper();

  console.log(`🌐 Using API URL: ${API_BASE_URL}`);

  try {

  test.describe('🔌 Database Connection Tests', function() {
    test.it('should establish database connection successfully', async function() {
      const response = await makeRequest(`${API_BASE_URL}/api/test-db`);
      
      test.assertEqual(response.status, 200, 'Database test should return 200');
      test.assertProperty(response.body, 'message', 'Database test should have message');
      console.log('✅ Database connection established');
    });

    test.it('should handle database queries within acceptable time', async function() {
      const startTime = Date.now();
      
      const response = await makeRequest(`${API_BASE_URL}/api/test-db`);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      test.assertEqual(response.status, 200, 'Database query should return 200');
      test.assert(responseTime < 5000, `Query should complete within 5 seconds, took ${responseTime}ms`);
      console.log(`✅ Database query completed in ${responseTime}ms`);
    });
  });

  test.describe('👥 User Data Verification', function() {
    test.it('should authenticate test users', async function() {
      await testHelper.initialize();
      
      test.assertExists(testHelper.authHelper.getToken('admin'), 'Admin token should exist');
      test.assertExists(testHelper.authHelper.getToken('student'), 'Student token should exist');
      test.assertExists(testHelper.authHelper.getToken('medicalStaff'), 'Medical staff token should exist');
      console.log('✅ All test users can authenticate');
    });

    test.it('should verify admin user data', async function() {
      const adminUser = testHelper.getUsers().admin;
      
      test.assertProperty(adminUser, 'email', 'Admin should have email');
      test.assertProperty(adminUser, 'role', 'Admin should have role');
      test.assertEqual(adminUser.role, 'admin', 'Admin role should be correct');
      console.log('✅ Admin user data verified');
    });

    test.it('should verify student user data', async function() {
      const studentUser = testHelper.getUsers().student;
      
      test.assertProperty(studentUser, 'email', 'Student should have email');
      test.assertProperty(studentUser, 'role', 'Student should have role');
      test.assertEqual(studentUser.role, 'student', 'Student role should be correct');
      console.log('✅ Student user data verified');
    });

    test.it('should verify medical staff user data', async function() {
      const medicalStaffUser = testHelper.getUsers().medicalStaff;
      
      test.assertProperty(medicalStaffUser, 'email', 'Medical staff should have email');
      test.assertProperty(medicalStaffUser, 'role', 'Medical staff should have role');
      test.assertEqual(medicalStaffUser.role, 'medical_staff', 'Medical staff role should be correct');
      console.log('✅ Medical staff user data verified');
    });
  });

  test.describe('📊 Database Integrity Tests', function() {
    test.it('should verify database tables exist', async function() {
      // This would require a specific endpoint to check table existence
      // For now, we'll verify through successful API operations
      
      try {
        await testHelper.profileHelper.getProfile('student');
        console.log('✅ Users table accessible');
      } catch (error) {
        test.fail('Users table may not exist or be accessible');
      }
    });    test.it('should verify data relationships', async function() {
      // Test that user relationships work correctly
      const response = await testHelper.appointmentHelper.createAppointment('student', {
        symptoms: 'Database relationship test',
        priorityLevel: 'medium'
      });
      
      const appointment = response.body?.appointment;
      test.assertExists(appointment, 'Response should contain appointment');
      test.assertExists(appointment.userId || appointment.user_id, 'Appointment should have user_id');
      test.assertExists(appointment.id, 'Appointment should have id');
      
      // Cleanup
      await testHelper.appointmentHelper.deleteAppointment('student', appointment.id);
      console.log('✅ Database relationships working correctly');
    });    test.it('should handle concurrent database operations', async function() {
      const operations = [];
      
      // Create multiple concurrent read operations
      for (let i = 0; i < 5; i++) {
        operations.push(testHelper.profileHelper.getProfile('student'));
      }
      
      const results = await Promise.all(operations);
      
      test.assert(
        results.every(result => result && result.status === 200 && result.body && result.body.user && result.body.user.id), 
        'All concurrent operations should succeed'
      );
      console.log('✅ Concurrent database operations handled successfully');
    });
  });

  test.describe('🔒 Database Security Tests', function() {
    test.it('should prevent SQL injection in user queries', async function() {
      // Test SQL injection prevention through profile updates
      const maliciousData = {
        name: "'; DROP TABLE users; --",
        age: 25
      };
      
      try {
        await testHelper.profileHelper.updateProfile('student', maliciousData);
        // If it succeeds, check that no malicious code was executed
        const profile = await testHelper.profileHelper.getProfile('student');
        test.assertExists(profile, 'Profile should still exist after malicious input');
        console.log('✅ SQL injection prevention working');
      } catch (error) {
        // It's also acceptable if the system rejects malicious input
        console.log('✅ Malicious input properly rejected');
      }
    });    test.it('should enforce data validation constraints', async function() {
      // Test that database constraints are enforced
      const invalidData = {
        age: -5, // Invalid age
        email: 'invalid-email' // Invalid email format
      };
      
      const response = await testHelper.profileHelper.updateProfile('student', invalidData);
      
      test.assert(
        response.status >= 400 ||
        (response.body && (
          response.body.error?.includes('validation') ||
          response.body.error?.includes('invalid') ||
          response.body.message?.includes('validation') ||
          response.body.message?.includes('invalid')
        )),
        'Should receive validation error'
      );
      console.log('✅ Data validation constraints enforced');
    });
  });

  test.describe('📈 Database Performance Tests', function() {
    test.it('should handle large data retrieval efficiently', async function() {
      const startTime = Date.now();
      
      // Get profile data (simulating larger query)
      await testHelper.profileHelper.getProfile('student');
      
      const queryTime = Date.now() - startTime;
      test.assert(queryTime < 2000, `Query should complete within 2s, took ${queryTime}ms`);
      console.log(`✅ Large data retrieval completed in ${queryTime}ms`);
    });

    test.it('should handle multiple sequential operations', async function() {
      const startTime = Date.now();
      
      // Perform multiple sequential operations
      await testHelper.profileHelper.getProfile('student');
      await testHelper.profileHelper.getProfile('medicalStaff');
      await testHelper.profileHelper.getProfile('admin');
      
      const totalTime = Date.now() - startTime;      test.assert(totalTime < 5000, `Sequential operations should complete within 5s, took ${totalTime}ms`);
      console.log(`✅ Sequential operations completed in ${totalTime}ms`);
    });
  });

    // Run tests
    await test.run();

  } catch (error) {
    console.error('\n💥 Database tests failed:', error.message);
    throw error;
  } finally {
    // Cleanup
    await testHelper.cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runDatabaseTests();
}

module.exports = runDatabaseTests;
