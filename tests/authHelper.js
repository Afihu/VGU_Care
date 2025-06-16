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
   * Clean up test data (if needed)
   */
  async cleanup() {
    // Reset cached tokens and users
    this.tokens = {};
    this.users = {};
  }
}

module.exports = AuthHelper;
