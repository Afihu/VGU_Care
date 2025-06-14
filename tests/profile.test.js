/**
 * Profile Management Test Suite
 * Tests modifying each part of user profile using the implemented routes
 */

const { SimpleTest, makeRequest, API_BASE_URL } = require('./testFramework');
const AuthHelper = require('./authHelper');

// Create test suite
const profileTest = new SimpleTest('👤 Profile Management Test Suite');

// Setup authentication for profile tests
const authHelper = new AuthHelper();

profileTest.describe('📋 Profile Information Retrieval', function() {

  profileTest.it('should authenticate all test users', async function() {
    await authHelper.authenticateAllUsers();
    
    profileTest.assertExists(authHelper.getToken('student'), 'Student token should exist');
    profileTest.assertExists(authHelper.getToken('medicalStaff'), 'Medical staff token should exist');
    profileTest.assertExists(authHelper.getToken('admin'), 'Admin token should exist');
    console.log('✅ All test users authenticated');
  });
      profileTest.it('should retrieve current user profile', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': `Bearer ${authHelper.getToken('student')}`
    });
      profileTest.assertEqual(response.status, 200, 'Profile retrieval should return 200');
    profileTest.assertProperty(response.body, 'user', 'Response should have user property');
    profileTest.assertProperty(response.body.user, 'email', 'Profile should have email');
    profileTest.assertProperty(response.body.user, 'role', 'Profile should have role');
    profileTest.assertEqual(response.body.user.role, 'student', 'User role should be student');
    console.log('✅ Student profile retrieved successfully');
  });
  profileTest.it('should retrieve admin profile', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': `Bearer ${authHelper.getToken('admin')}`
    });
      profileTest.assertEqual(response.status, 200, 'Admin profile retrieval should return 200');
    profileTest.assertProperty(response.body, 'user', 'Response should have user property');
    profileTest.assertProperty(response.body.user, 'email', 'Profile should have email');
    profileTest.assertEqual(response.body.user.role, 'admin', 'User role should be admin');
    console.log('✅ Admin profile retrieved successfully');
  });
  profileTest.it('should retrieve medical staff profile', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': `Bearer ${authHelper.getToken('medicalStaff')}`
    });
      profileTest.assertEqual(response.status, 200, 'Medical staff profile retrieval should return 200');
    profileTest.assertProperty(response.body, 'user', 'Response should have user property');
    profileTest.assertProperty(response.body.user, 'email', 'Profile should have email');
    profileTest.assertEqual(response.body.user.role, 'medical_staff', 'User role should be medical_staff');
    console.log('✅ Medical staff profile retrieved successfully');
  });
});

profileTest.describe('✏️ Profile Update Operations', function() {

  profileTest.it('should authenticate for profile updates', async function() {
    profileTest.assertExists(authHelper.getToken('student'), 'Student token should exist');
    console.log('✅ Authentication ready for profile updates');
  });

  profileTest.it('should update user profile successfully', async function() {
    const updateData = {
      name: 'Updated Student Name',
      age: 21
    };

    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'PUT', updateData, {
      'Authorization': `Bearer ${authHelper.getToken('student')}`
    });
    
    // Accept both 200 and 204 as valid success responses
    profileTest.assert(response.status === 200 || response.status === 204, 
      `Profile update should return 200 or 204, got ${response.status}`);
    console.log('✅ Profile updated successfully');
  });

  profileTest.it('should reject profile update without authentication', async function() {
    const updateData = {
      name: 'Unauthorized Update',
      age: 25
    };

    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'PUT', updateData);
    
    profileTest.assertEqual(response.status, 401, 'Unauthenticated update should return 401');
    console.log('✅ Unauthorized profile update properly rejected');
  });
});

profileTest.describe('🔒 Profile Security Tests', function() {

  profileTest.it('should authenticate for security tests', async function() {
    profileTest.assertExists(authHelper.getToken('student'), 'Student token should exist');
    console.log('✅ Authentication ready for security tests');
  });

  profileTest.it('should reject invalid authentication token', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': 'Bearer invalid-token-here'
    });
    
    profileTest.assertEqual(response.status, 401, 'Invalid token should return 401');
    console.log('✅ Invalid token properly rejected');
  });

  profileTest.it('should reject malformed authorization header', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': 'InvalidFormat'
    });
    
    profileTest.assertEqual(response.status, 401, 'Malformed auth header should return 401');
    console.log('✅ Malformed authorization header properly rejected');
  });
});

// Run the tests
profileTest.run().catch(console.error);