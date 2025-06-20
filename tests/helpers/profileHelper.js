/**
 * Profile Testing Helper
 * Consolidates all profile-related test utilities
 */

const { makeRequest, API_BASE_URL } = require('../testFramework');

class ProfileHelper {
  constructor(testHelper) {
    this.testHelper = testHelper;
    this.authHelper = testHelper.authHelper;
  }
  /**
   * Get profile for any user type (generic method)
   */
  async getProfile(userType) {
    return await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': `Bearer ${this.authHelper.getToken(userType)}`
    });
  }

  /**
   * Test getting user profile for any user type
   */
  async testGetProfile(userType, expectedRole) {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
      'Authorization': `Bearer ${this.authHelper.getToken(userType)}`
    });

    return {
      response,
      validations: {
        status: response.status === 200,
        hasUser: response.body && response.body.user,
        hasEmail: response.body.user && response.body.user.email,
        hasRole: response.body.user && response.body.user.role,
        correctRole: response.body.user && response.body.user.role === expectedRole
      }
    };
  }

  /**
   * Test updating user profile
   */
  async testUpdateProfile(userType, updateData) {
    const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'PUT', updateData, {
      'Authorization': `Bearer ${this.authHelper.getToken(userType)}`
    });

    return response;
  }

  /**
   * Update profile for any user type (generic method)
   */
  async updateProfile(userType, updateData) {
    return await makeRequest(`${API_BASE_URL}/api/users/me`, 'PUT', updateData, {
      'Authorization': `Bearer ${this.authHelper.getToken(userType)}`
    });
  }

  /**
   * Test getting medical staff profile specifically
   */
  async testGetMedicalStaffProfile() {
    const response = await makeRequest(`${API_BASE_URL}/api/medical-staff/profile`, 'GET', null, {
      'Authorization': `Bearer ${this.authHelper.getToken('medicalStaff')}`
    });    return {
      response,
      validations: {
        status: response.status === 200,
        hasStaff: Boolean(response.body && response.body.staff),
        hasName: Boolean(response.body.staff && response.body.staff.name),
        hasEmail: Boolean(response.body.staff && response.body.staff.email),
        hasRole: Boolean(response.body.staff && response.body.staff.role),
        correctRole: Boolean(response.body.staff && response.body.staff.role === 'medical_staff')
      }
    };
  }
  /**
   * Test updating medical staff profile
   */
  async testUpdateMedicalStaffProfile(updateData) {
    const response = await makeRequest(`${API_BASE_URL}/api/medical-staff/profile`, 'PATCH', updateData, {
      'Authorization': `Bearer ${this.authHelper.getToken('medicalStaff')}`
    });

    return response;
  }

  /**
   * Test profile expansion features (dorm info, shifts, etc.)
   */
  async testProfileExpansion(userType, expansionData) {
    const endpoint = userType === 'medicalStaff' 
      ? '/api/medical-staff/profile' 
      : '/api/users/me';

    const response = await makeRequest(`${API_BASE_URL}${endpoint}`, 'PUT', expansionData, {
      'Authorization': `Bearer ${this.authHelper.getToken(userType)}`
    });

    return response;
  }

  /**
   * Validate student dorm information
   */
  validateStudentDormInfo(profileData) {
    const validDormOptions = ['dorm1', 'dorm2', 'not_in_dorm'];
    return {
      hasDormInfo: profileData.dorm_residence !== undefined,
      validDormValue: validDormOptions.includes(profileData.dorm_residence)
    };
  }

  /**
   * Validate medical staff shift information
   */
  validateMedicalStaffShifts(profileData) {
    return {
      hasShifts: profileData.shifts !== undefined,
      isArrayFormat: Array.isArray(profileData.shifts),
      hasValidShiftStructure: profileData.shifts && profileData.shifts.every(shift => 
        shift.day && shift.start_time && shift.end_time
      )
    };
  }
}

module.exports = ProfileHelper;
