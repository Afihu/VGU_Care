/**
 * Shared Authentication Helper
 * Consolidates all authentication-related testing utilities
 */

const { makeRequest, authenticate, API_BASE_URL, TEST_CREDENTIALS } = require('./testFramework');

class AuthHelper {
  constructor() {
    this.tokens = {};
    this.users = {};
    this.staffIds = {};
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
        
        // Fetch staff_id for medical staff
        if (userType === 'medicalStaff') {
          const staffId = await this.fetchStaffId(auth.token);
          this.staffIds[userType] = staffId;
        }
      } catch (error) {
        console.error(`❌ Failed to authenticate ${userType}:`, error.message);
        throw error;
      }
    }
  }

  /**
   * Fetch staff_id for the authenticated medical staff user
   */
  async fetchStaffId(token) {
    // Assumes there is an endpoint to get the medical staff profile
    const response = await makeRequest(`${API_BASE_URL}/api/medical-staff/profile`, 'GET', null, {
      Authorization: `Bearer ${token}`
    });
    console.log('[DEBUG] medical staff profile response:', JSON.stringify(response.body, null, 2));
    if (response.status === 200 && response.body && response.body.staff && response.body.staff.staff_id) {
      return response.body.staff.staff_id;
    }
    // Fallback: try response.body.staffId
    if (response.status === 200 && response.body && response.body.staffId) {
      return response.body.staffId;
    }
    throw new Error('Could not fetch staff_id for medical staff');
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
   * Get staff_id for a specific user type (medicalStaff)
   */
  getStaffId(userType) {
    if (!this.staffIds[userType]) {
      throw new Error(`No staff_id available for user type: ${userType}`);
    }
    return this.staffIds[userType];
  }

  /**
   * Clean up test data (if needed)
   */
  async cleanup() {
    // Reset cached tokens and users
    this.tokens = {};
    this.users = {};
    this.staffIds = {};
  }
}

module.exports = AuthHelper;
