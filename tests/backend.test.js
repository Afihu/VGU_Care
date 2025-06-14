/**
 * Backend Integration Test Suite
 * Tests all current APIs, database connection, and backend infrastructure
 */

const { SimpleTest, makeRequest, API_BASE_URL } = require('./testFramework');
const AuthHelper = require('./authHelper');

// Create test suite
const backendTest = new SimpleTest('🌐 Backend Integration Test Suite');

backendTest.describe('🏥 Infrastructure Tests', function() {
    
  backendTest.it('should respond to health check', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/health`);
    
    backendTest.assertEqual(response.status, 200, 'Health check should return 200');
    backendTest.assertProperty(response.body, 'message', 'Health check should have message');
    backendTest.assertProperty(response.body, 'timestamp', 'Health check should have timestamp');
    console.log('✅ Health check endpoint working');
  });

  backendTest.it('should test database connection', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/test-db`);
    
    backendTest.assertEqual(response.status, 200, 'Database test should return 200');
    backendTest.assertProperty(response.body, 'message', 'Database test should have message');
    console.log('✅ Database connection working');
  });
});

// Get authentication tokens for tests
const authHelper = new AuthHelper();

backendTest.describe('👥 User Management API', function() {

  backendTest.it('should authenticate all user types', async function() {
    await authHelper.authenticateAllUsers();
    
    backendTest.assertExists(authHelper.getToken('admin'), 'Admin token should exist');
    backendTest.assertExists(authHelper.getToken('student'), 'Student token should exist');
    backendTest.assertExists(authHelper.getToken('medicalStaff'), 'Medical staff token should exist');
    console.log('✅ All user types authenticated successfully');
  });  backendTest.it('should get user profile with admin token', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': `Bearer ${authHelper.getToken('admin')}`
    });
    
    backendTest.assertEqual(response.status, 200, 'Profile request should return 200');
    backendTest.assertProperty(response.body, 'user', 'Response should have user property');
    backendTest.assertProperty(response.body.user, 'email', 'User should have email');
    backendTest.assertProperty(response.body.user, 'role', 'User should have role');
    backendTest.assertEqual(response.body.user.role, 'admin', 'User role should be admin');
    console.log('✅ Admin profile retrieval working');
  });
  backendTest.it('should get user profile with student token', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': `Bearer ${authHelper.getToken('student')}`
    });
    
    backendTest.assertEqual(response.status, 200, 'Student profile request should return 200');
    backendTest.assertProperty(response.body, 'user', 'Response should have user property');
    backendTest.assertProperty(response.body.user, 'email', 'User should have email');
    backendTest.assertProperty(response.body.user, 'role', 'User should have role');
    backendTest.assertEqual(response.body.user.role, 'student', 'User role should be student');
    console.log('✅ Student profile retrieval working');
  });
  backendTest.it('should get user profile with medical staff token', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': `Bearer ${authHelper.getToken('medicalStaff')}`
    });
    
    backendTest.assertEqual(response.status, 200, 'Medical staff profile request should return 200');
    backendTest.assertProperty(response.body, 'user', 'Response should have user property');
    backendTest.assertProperty(response.body.user, 'email', 'User should have email');
    backendTest.assertProperty(response.body.user, 'role', 'User should have role');
    backendTest.assertEqual(response.body.user.role, 'medical_staff', 'User role should be medical_staff');
    console.log('✅ Medical staff profile retrieval working');
  });
});

backendTest.describe('🔒 Security Tests', function() {

  backendTest.it('should reject requests without authentication', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`);
    
    backendTest.assertEqual(response.status, 401, 'Unauthenticated request should return 401');
    console.log('✅ Authentication protection working');
  });

  backendTest.it('should reject requests with invalid token', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': 'Bearer invalid-token'
    });
    
    backendTest.assertEqual(response.status, 401, 'Invalid token should return 401');
    console.log('✅ Token validation working');
  });
});

// Run the tests
backendTest.run().catch(console.error);
