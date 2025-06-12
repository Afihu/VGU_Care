/**
 * Profile Management Test Suite
 * Tests modifying each part of user profile using the implemented routes
 */

const SimpleTest = require('./testFramework');
const https = require('https');
const http = require('http');

// Test configuration
const API_BASE_URL = process.env.API_URL || 'http://backend:5001';

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : {}
          };
          resolve(response);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Create test suite
const profileTest = new SimpleTest('👤 Profile Management Test Suite');

// Test user data for profile operations
const testUsers = {
  student: {
    email: 'student1@vgu.edu.vn',
    password: 'VGU2024!',
    role: 'student'
  },
  medicalStaff: {
    email: 'doctor1@vgu.edu.vn',
    password: 'VGU2024!',
    role: 'medical_staff'
  },
  admin: {
    email: 'admin@vgu.edu.vn',
    password: 'VGU2024!',
    role: 'admin'
  }
};

// Get authentication tokens for profile tests
async function authenticateUsers() {
  const tokens = {};

  console.log('🚀 Setting up profile management tests...');
  
  // Login all test users to get tokens
  for (const [role, credentials] of Object.entries(testUsers)) {
    try {
      const response = await makeRequest(`${API_BASE_URL}/api/login`, 'POST', credentials);
      if (response.status === 200 && response.body.token) {
        tokens[role] = response.body.token;
        console.log(`✅ ${role} authentication successful`);
      } else {
        console.log(`❌ ${role} authentication failed`);
      }
    } catch (error) {
      console.log(`❌ ${role} authentication error:`, error.message);
    }
  }
  
  return tokens;
}

profileTest.describe('📋 Profile Information Retrieval', function() {

  let tokens;

  profileTest.it('should authenticate all test users', async function() {
    tokens = await authenticateUsers();
    profileTest.assertExists(tokens.student, 'Student token should exist');
    profileTest.assertExists(tokens.medicalStaff, 'Medical staff token should exist');
    profileTest.assertExists(tokens.admin, 'Admin token should exist');
    console.log('✅ All test users authenticated');
  });
    
  profileTest.it('should retrieve current user profile', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': `Bearer ${tokens.student}`
    });
    
    profileTest.assertEqual(response.status, 200, 'Profile retrieval should return 200');
    profileTest.assertProperty(response.body, 'email', 'Profile should have email');
    profileTest.assertProperty(response.body, 'role', 'Profile should have role');
    profileTest.assertEqual(response.body.role, 'student', 'User role should be student');
    console.log('✅ Student profile retrieved successfully');
  });

  profileTest.it('should retrieve admin profile', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': `Bearer ${tokens.admin}`
    });
    
    profileTest.assertEqual(response.status, 200, 'Admin profile retrieval should return 200');
    profileTest.assertProperty(response.body, 'email', 'Profile should have email');
    profileTest.assertEqual(response.body.role, 'admin', 'User role should be admin');
    console.log('✅ Admin profile retrieved successfully');
  });

  profileTest.it('should retrieve medical staff profile', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': `Bearer ${tokens.medicalStaff}`
    });
    
    profileTest.assertEqual(response.status, 200, 'Medical staff profile retrieval should return 200');
    profileTest.assertProperty(response.body, 'email', 'Profile should have email');
    profileTest.assertEqual(response.body.role, 'medical_staff', 'User role should be medical_staff');
    console.log('✅ Medical staff profile retrieved successfully');
  });
});

profileTest.describe('✏️ Profile Update Operations', function() {

  let tokens;

  profileTest.it('should authenticate for profile updates', async function() {
    tokens = await authenticateUsers();
    profileTest.assertExists(tokens.student, 'Student token should exist');
    console.log('✅ Authentication ready for profile updates');
  });

  profileTest.it('should update user profile successfully', async function() {
    const updateData = {
      name: 'Updated Student Name',
      age: 21
    };

    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'PUT', updateData, {
      'Authorization': `Bearer ${tokens.student}`
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

  let tokens;

  profileTest.it('should authenticate for security tests', async function() {
    tokens = await authenticateUsers();
    profileTest.assertExists(tokens.student, 'Student token should exist');
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