/**
 * Shared Authentication Helper
 * Consolidates all authentication-related testing utilities
 */

const { makeRequest, authenticate, API_BASE_URL, TEST_CREDENTIALS } = require('./testFramework');

class AuthHelper {
  constructor() {
    this.tokens = {};
    this.users = {};
  }

  /**
   * Authenticate all test users and cache tokens
   */
  async authenticateAllUsers() {
    const userTypes = ['admin', 'student', 'medicalStaff'];
    
    for (const userType of userTypes) {
      try {
        const auth = await authenticate(userType);
        this.tokens[userType] = auth.token;
        this.users[userType] = auth.user;
        console.log(`✅ Authenticated ${userType}: ${auth.user.email}`);
      } catch (error) {
        console.error(`❌ Failed to authenticate ${userType}:`, error.message);
        throw error;
      }
    }
  }

  /**
   * Get token for a specific user type
   */
  getToken(userType) {
    if (!this.tokens[userType]) {
      throw new Error(`No token available for user type: ${userType}`);
    }
    return this.tokens[userType];
  }

  /**
   * Get user data for a specific user type
   */
  getUser(userType) {
    if (!this.users[userType]) {
      throw new Error(`No user data available for user type: ${userType}`);
    }
    return this.users[userType];
  }

  /**
   * Test login functionality
   */
  async testLogin(credentials, shouldSucceed = true) {
    const response = await makeRequest(`${API_BASE_URL}/api/login`, 'POST', credentials);
    
    if (shouldSucceed) {
      if (response.status !== 200) {
        throw new Error(`Login should succeed but got status ${response.status}`);
      }
      if (!response.body.token) {
        throw new Error('Login response missing token');
      }
      if (!response.body.user) {
        throw new Error('Login response missing user data');
      }
    } else {
      if (response.status === 200) {
        throw new Error('Login should fail but succeeded');
      }
    }
    
    return response;
  }

  /**
   * Test signup functionality
   */
  async testSignup(userData, shouldSucceed = true) {
    const response = await makeRequest(`${API_BASE_URL}/api/signup`, 'POST', userData);
    
    if (shouldSucceed) {
      if (response.status !== 201 && response.status !== 200) {
        throw new Error(`Signup should succeed but got status ${response.status}`);
      }
    } else {
      if (response.status === 201 || response.status === 200) {
        throw new Error('Signup should fail but succeeded');
      }
    }
    
    return response;
  }

  /**
   * Test token validation
   */
  async testTokenValidation(token, shouldBeValid = true) {
    const headers = { Authorization: `Bearer ${token}` };
    const response = await makeRequest(`${API_BASE_URL}/api/profile`, 'GET', null, headers);
    
    if (shouldBeValid) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Token should be valid but got unauthorized response');
      }
    } else {
      if (response.status !== 401 && response.status !== 403) {
        throw new Error('Token should be invalid but got authorized response');
      }
    }
    
    return response;
  }

  /**
   * Clean up test data (if needed)
   */
  async cleanup() {
    // Reset cached tokens and users
    this.tokens = {};
    this.users = {};
  }
}

module.exports = AuthHelper;
