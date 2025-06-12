/**
 * Backend Integration Test Suite
 * Tests all current APIs, database connection, and backend infrastructure
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
async function authenticateUsers() {
  const users = {
    admin: { email: 'admin@vgu.edu.vn', password: 'VGU2024!' },
    student: { email: 'student1@vgu.edu.vn', password: 'VGU2024!' },
    medical: { email: 'doctor1@vgu.edu.vn', password: 'VGU2024!' }
  };

  const tokens = {};

  for (const [role, credentials] of Object.entries(users)) {
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

backendTest.describe('👥 User Management API', function() {

  let tokens;

  backendTest.it('should authenticate all user types', async function() {
    tokens = await authenticateUsers();
    backendTest.assertExists(tokens.admin, 'Admin token should exist');
    backendTest.assertExists(tokens.student, 'Student token should exist');
    backendTest.assertExists(tokens.medical, 'Medical staff token should exist');
    console.log('✅ All user types authenticated successfully');
  });  backendTest.it('should get user profile with admin token', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': `Bearer ${tokens.admin}`
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
      'Authorization': `Bearer ${tokens.student}`
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
      'Authorization': `Bearer ${tokens.medical}`
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
