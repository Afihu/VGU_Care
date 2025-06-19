/**
 * Simple Node.js Test Framework
 * Provides basic testing utilities for Node.js without external dependencies
 * Enhanced with shared authentication and API utilities
 */

const https = require('https');
const http = require('http');

// Test configuration
const API_BASE_URL = process.env.API_URL || 'http://backend:5001';

// Test user credentials
const TEST_CREDENTIALS = {
  admin: { email: 'admin@vgu.edu.vn', password: 'VGU2024!' },
  student: { email: 'student1@vgu.edu.vn', password: 'VGU2024!' },
  medicalStaff: { email: 'doctor1@vgu.edu.vn', password: 'VGU2024!' }
};

/**
 * Shared HTTP request utility
 */
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
            body: body,
            raw: true
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Shared authentication utility
 */
async function authenticate(userType) {
  if (!TEST_CREDENTIALS[userType]) {
    throw new Error(`Unknown user type: ${userType}`);
  }

  const credentials = TEST_CREDENTIALS[userType];
  const response = await makeRequest(`${API_BASE_URL}/api/login`, 'POST', credentials);
  
  if (response.status !== 200 || !response.body.token) {
    throw new Error(`Authentication failed for ${userType}: ${response.status} ${JSON.stringify(response.body)}`);
  }

  return {
    token: response.body.token,
    user: response.body.user
  };
}

/**
 * Shared API testing utilities
 */
const ApiTestUtils = {
  /**
   * Test API endpoint with authentication
   */
  async testAuthenticatedRequest(token, endpoint, method = 'GET', data = null, expectedStatus = 200) {
    const headers = { Authorization: `Bearer ${token}` };
    const response = await makeRequest(`${API_BASE_URL}${endpoint}`, method, data, headers);
    
    // Handle expected status as array or single value
    const validStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    
    if (!validStatuses.includes(response.status)) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}: ${JSON.stringify(response.body)}`);
    }
    
    return response;
  },

  /**
   * Test unauthorized access
   */
  async testUnauthorizedAccess(endpoint, method = 'GET', data = null) {
    const response = await makeRequest(`${API_BASE_URL}${endpoint}`, method, data);
    
    if (response.status !== 401 && response.status !== 403) {
      throw new Error(`Expected unauthorized status (401/403), got ${response.status}`);
    }
    
    return response;
  },

  /**
   * Validate response structure
   */
  validateResponseStructure(response, requiredFields) {
    const missing = requiredFields.filter(field => !response.body.hasOwnProperty(field));
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    return true;
  }
};

class SimpleTest {
  constructor(suiteName) {
    this.suiteName = suiteName;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
  }

  describe(name, callback) {
    console.log(`\n🧪 ${name}`);
    callback.call(this);
  }

  it(description, testFunction) {
    this.tests.push({ description, testFunction });
  }

  async run() {
    console.log(`\n🏁 Running ${this.suiteName}`);
    console.log('=' .repeat(50));

    for (const test of this.tests) {
      try {
        console.log(`\n⏳ ${test.description}`);
        await test.testFunction();
        this.passed++;
        console.log(`✅ PASSED: ${test.description}`);
      } catch (error) {
        this.failed++;
        this.errors.push({ description: test.description, error });
        console.log(`❌ FAILED: ${test.description}`);
        console.log(`   Error: ${error.message}`);
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '=' .repeat(50));
    console.log(`📊 Test Summary for ${this.suiteName}`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Total: ${this.tests.length}`);
    
    if (this.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.errors.forEach(({ description, error }) => {
        console.log(`   - ${description}: ${error.message}`);
      });
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed!');
    }
  }

  fail(message = 'Test failed') {
    throw new Error(message);
  }

  // Assertion helpers
  assert(condition, message = 'Assertion failed') {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, but got ${actual}`);
    }
  }

  assertNotEqual(actual, expected, message) {
    if (actual === expected) {
      throw new Error(message || `Expected values to be different, but both were ${actual}`);
    }
  }

  assertTrue(value, message) {
    this.assertEqual(value, true, message || `Expected true, but got ${value}`);
  }

  assertFalse(value, message) {
    this.assertEqual(value, false, message || `Expected false, but got ${value}`);
  }

  assertExists(value, message) {
    if (value === null || value === undefined) {
      throw new Error(message || `Expected value to exist, but got ${value}`);
    }
  }

  assertType(value, expectedType, message) {
    const actualType = typeof value;
    if (actualType !== expectedType) {
      throw new Error(message || `Expected type ${expectedType}, but got ${actualType}`);
    }
  }

  assertProperty(object, property, message) {
    if (!object.hasOwnProperty(property)) {
      throw new Error(message || `Expected object to have property '${property}'`);
    }
  }

  assertArrayLength(array, expectedLength, message) {
    if (!Array.isArray(array)) {
      throw new Error(message || `Expected an array, but got ${typeof array}`);
    }
    if (array.length !== expectedLength) {
      throw new Error(message || `Expected array length ${expectedLength}, but got ${array.length}`);
    }
  }
  assertIncludes(array, value, message) {
    if (!Array.isArray(array)) {
      throw new Error(message || `Expected an array, but got ${typeof array}`);
    }
    if (!array.includes(value)) {
      throw new Error(message || `Expected array to include ${value}`);
    }
  }
}

// Export the test framework and utilities
module.exports = {
  SimpleTest,
  makeRequest,
  authenticate,
  ApiTestUtils,
  API_BASE_URL,
  TEST_CREDENTIALS
};
