/**
 * Authentication Test Suite
 * Tests login and signup API/routes
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
      timeout: 10000, // 10 second timeout
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
const authTest = new SimpleTest('🔐 Authentication Test Suite');

authTest.describe('🚪 Login Functionality', function() {
  authTest.it('should successfully login admin user', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/login`, 'POST', {
      email: 'admin@vgu.edu.vn',
      password: 'VGU2024!'
    });
    
    authTest.assertEqual(response.status, 200, 'Expected status 200 for admin login');
    authTest.assertProperty(response.body, 'message', 'Response should have message property');
    authTest.assertEqual(response.body.message, 'Login successful', 'Login message should be correct');
    authTest.assertProperty(response.body, 'token', 'Response should have token property');
    authTest.assertProperty(response.body, 'user', 'Response should have user property');
    authTest.assertEqual(response.body.user.email, 'admin@vgu.edu.vn', 'User email should match');
    authTest.assertEqual(response.body.user.role, 'admin', 'User role should be admin');
    authTest.assertEqual(response.body.user.status, 'active', 'User status should be active');
    console.log('✅ Admin login successful');
  });

  authTest.it('should successfully login student user', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/login`, 'POST', {
      email: 'student1@vgu.edu.vn',
      password: 'VGU2024!'
    });
    
    authTest.assertEqual(response.status, 200, 'Expected status 200 for student login');
    authTest.assertProperty(response.body, 'message', 'Response should have message property');
    authTest.assertEqual(response.body.message, 'Login successful', 'Login message should be correct');
    authTest.assertProperty(response.body, 'token', 'Response should have token property');
    authTest.assertProperty(response.body, 'user', 'Response should have user property');
    authTest.assertEqual(response.body.user.email, 'student1@vgu.edu.vn', 'User email should match');
    authTest.assertEqual(response.body.user.role, 'student', 'User role should be student');
    authTest.assertEqual(response.body.user.status, 'active', 'User status should be active');
    console.log('✅ Student login successful');
  });

  authTest.it('should successfully login medical staff user', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/login`, 'POST', {
      email: 'doctor1@vgu.edu.vn',
      password: 'VGU2024!'
    });
    
    authTest.assertEqual(response.status, 200, 'Expected status 200 for medical staff login');
    authTest.assertProperty(response.body, 'message', 'Response should have message property');
    authTest.assertEqual(response.body.message, 'Login successful', 'Login message should be correct');
    authTest.assertProperty(response.body, 'token', 'Response should have token property');
    authTest.assertProperty(response.body, 'user', 'Response should have user property');
    authTest.assertEqual(response.body.user.email, 'doctor1@vgu.edu.vn', 'User email should match');
    authTest.assertEqual(response.body.user.role, 'medical_staff', 'User role should be medical_staff');
    authTest.assertEqual(response.body.user.status, 'active', 'User status should be active');
    console.log('✅ Medical staff login successful');
  });

  authTest.it('should reject login with wrong password', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/login`, 'POST', {
      email: 'admin@vgu.edu.vn',
      password: 'wrongpassword'
    });
    
    authTest.assertEqual(response.status, 401, 'Expected status 401 for wrong password');
    authTest.assertProperty(response.body, 'message', 'Response should have error message');
    console.log('✅ Wrong password properly rejected');
  });

  authTest.it('should reject login with non-existent email', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/login`, 'POST', {
      email: 'nonexistent@vgu.edu.vn',
      password: 'VGU2024!'
    });
    
    authTest.assertEqual(response.status, 401, 'Expected status 401 for non-existent email');
    authTest.assertProperty(response.body, 'message', 'Response should have error message');
    console.log('✅ Non-existent email properly rejected');
  });
  authTest.it('should reject login with empty credentials', async function() {
    const response = await makeRequest(`${API_BASE_URL}/api/login`, 'POST', {
      email: '',
      password: ''
    });
    
    console.log('Empty credentials response status:', response.status);
    console.log('Empty credentials response body:', response.body);
    
    // Accept both 400 and 401 as valid responses for empty credentials
    authTest.assert(response.status === 400 || response.status === 401, 
      `Expected status 400 or 401 for empty credentials, got ${response.status}`);
    console.log('✅ Empty credentials properly rejected');
  });
});

// Run the tests
authTest.run().catch(console.error);
