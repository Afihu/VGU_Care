/**
 * Database Test Suite
 * Tests database connections and ensures all users, appointments, etc are correctly inserted
 */

const { SimpleTest, makeRequest, API_BASE_URL } = require('./testFramework');
const AuthHelper = require('./authHelper');

// Create test suite
const databaseTest = new SimpleTest('🗄️ Database Test Suite');

databaseTest.describe('🔌 Database Connection Tests', function() {
    
  databaseTest.it('should establish database connection successfully', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/test-db`);
    
    databaseTest.assertEqual(response.status, 200, 'Database test should return 200');
    databaseTest.assertProperty(response.body, 'message', 'Database test should have message');
    console.log('✅ Database connection established');
  });

  databaseTest.it('should handle database queries within acceptable time', async function() {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/test-db`);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    databaseTest.assertEqual(response.status, 200, 'Database query should return 200');
    databaseTest.assert(responseTime < 5000, `Query should complete within 5 seconds, took ${responseTime}ms`);
    console.log(`✅ Database query completed in ${responseTime}ms`);
  });
});

// Setup authentication for database tests
const authHelper = new AuthHelper();

databaseTest.describe('👥 User Data Verification', function() {

  databaseTest.it('should authenticate test users', async function() {
    await authHelper.authenticateAllUsers();
    
    databaseTest.assertExists(authHelper.getToken('admin'), 'Admin token should exist');
    databaseTest.assertExists(authHelper.getToken('student'), 'Student token should exist');
    databaseTest.assertExists(authHelper.getToken('medicalStaff'), 'Medical staff token should exist');
    console.log('✅ All test users can authenticate');
  });

  databaseTest.it('should verify admin user data', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': `Bearer ${authHelper.getToken('admin')}`
    });
    
    databaseTest.assertEqual(response.status, 200, 'Admin profile should be accessible');
    databaseTest.assertProperty(response.body, 'user', 'Response should have user property');
    databaseTest.assertEqual(response.body.user.email, 'admin@vgu.edu.vn', 'Admin email should match');
    databaseTest.assertEqual(response.body.user.role, 'admin', 'Admin role should be correct');
    console.log('✅ Admin user data verified');
  });
  databaseTest.it('should verify student user data', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': `Bearer ${authHelper.getToken('student')}`
    });
    
    databaseTest.assertEqual(response.status, 200, 'Student profile should be accessible');
    databaseTest.assertProperty(response.body, 'user', 'Response should have user property');
    databaseTest.assertEqual(response.body.user.email, 'student1@vgu.edu.vn', 'Student email should match');
    databaseTest.assertEqual(response.body.user.role, 'student', 'Student role should be correct');
    console.log('✅ Student user data verified');
  });
  databaseTest.it('should verify medical staff user data', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': `Bearer ${authHelper.getToken('medicalStaff')}`
    });
    
    databaseTest.assertEqual(response.status, 200, 'Medical staff profile should be accessible');
    databaseTest.assertProperty(response.body, 'user', 'Response should have user property');
    databaseTest.assertEqual(response.body.user.email, 'doctor1@vgu.edu.vn', 'Medical staff email should match');
    databaseTest.assertEqual(response.body.user.role, 'medical_staff', 'Medical staff role should be correct');
    console.log('✅ Medical staff user data verified');
  });
});

databaseTest.describe('🗃️ Data Integrity Tests', function() {

  databaseTest.it('should handle concurrent database operations', async function() {
    // Test multiple simultaneous requests
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(makeRequest(`${API_BASE_URL}/api/health`));
    }
    
    const responses = await Promise.all(promises);
    
    responses.forEach((response, index) => {
      databaseTest.assertEqual(response.status, 200, `Concurrent request ${index + 1} should succeed`);
    });
    console.log('✅ Database handles concurrent operations');
  });

  databaseTest.it('should maintain data consistency', async function() {
    // Test that login returns consistent user data
    const response1 = await makeRequest(`${API_BASE_URL}/api/login`, 'POST', {
      email: 'admin@vgu.edu.vn',
      password: 'VGU2024!'
    });

    const response2 = await makeRequest(`${API_BASE_URL}/api/login`, 'POST', {
      email: 'admin@vgu.edu.vn',
      password: 'VGU2024!'
    });
    
    databaseTest.assertEqual(response1.status, 200, 'First login should succeed');
    databaseTest.assertEqual(response2.status, 200, 'Second login should succeed');
    databaseTest.assertEqual(response1.body.user.email, response2.body.user.email, 'User email should be consistent');
    databaseTest.assertEqual(response1.body.user.role, response2.body.user.role, 'User role should be consistent');
    console.log('✅ Database maintains data consistency');
  });
});

// Run the tests
databaseTest.run().catch(console.error);
