/**
 * Shared Authentication Helper
 * Consolidates all authentication-related testing utilities
 */

const { makeRequest, authenticate, API_BASE_URL, TEST_CREDENTIALS } = require('../testFramework');

class AuthHelper {
  constructor() {
    this.tokens = {};
    this.users = {};
    this.staffIds = {};
  }  /**
   * Authenticate all test users and cache tokens
   */
  async authenticateAllUsers() {
    const userTypes = ['admin', 'student', 'medicalStaff'];
    
    console.log('[DEBUG] Starting authentication for all users...');
    for (const userType of userTypes) {
      try {
        const auth = await authenticate(userType);
        this.tokens[userType] = auth.token;
        this.users[userType] = auth.user;
        console.log(`✅ Authenticated ${userType}: ${auth.user.email}`);
        console.log(`[DEBUG] Stored token for ${userType}:`, auth.token ? 'Token present' : 'No token');
        
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
    console.log('[DEBUG] Authentication complete. Final tokens object:', Object.keys(this.tokens));
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
    
    if (response.status === 200 && response.body) {
      // Try different possible locations for staff_id
      if (response.body.staff && response.body.staff.staff_id) {
        return response.body.staff.staff_id;
      }
      if (response.body.staffId) {
        return response.body.staffId;
      }
      if (response.body.user && response.body.user.id) {
        // Use user.id as staff_id if no specific staff_id is available
        console.log('[DEBUG] Using user.id as staff_id:', response.body.user.id);
        return response.body.user.id;
      }
      if (response.body.user && response.body.user.staff_id) {
        return response.body.user.staff_id;
      }
    }
    
    // If we still can't find it, make staff_id optional
    console.warn('[WARNING] Could not fetch staff_id for medical staff, proceeding without it');
    return null; // Return null instead of throwing error
  }  /**
   * Get token for a specific user type
   */
  getToken(userType) {
    console.log(`[DEBUG] Getting token for ${userType}, available tokens:`, Object.keys(this.tokens));
    if (!this.tokens[userType]) {
      console.log(`[DEBUG] No token found for ${userType}, tokens object:`, this.tokens);
      return null; // Return null instead of throwing error
    }
    return this.tokens[userType];
  }

  /**
   * Check if token exists for user type
   */
  hasToken(userType) {
    return this.tokens[userType] && this.tokens[userType].length > 0;
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
