/**
 * Medical Staff Test Helper
 * Provides utilities for testing medical staff functionality
 */

const { ApiTestUtils } = require('../testFramework');

class MedicalStaffHelper {
  constructor(testHelper) {
    this.testHelper = testHelper;
  }

  /**
   * Get medical staff profile
   */
  async getProfile(userType = 'medicalStaff') {
    const token = this.testHelper.authHelper.getToken(userType);
    
    const response = await ApiTestUtils.testAuthenticatedRequest(
      token,
      '/api/medical-staff/profile',
      'GET',
      null,
      200
    );
    
    return response.body.staff;
  }

  /**
   * Update medical staff profile
   */
  async updateProfile(updateData, userType = 'medicalStaff') {
    const token = this.testHelper.authHelper.getToken(userType);
    
    const response = await ApiTestUtils.testAuthenticatedRequest(
      token,
      '/api/medical-staff/profile',
      'PUT',
      updateData,
      200
    );
    
    return response.body.staff;
  }

  /**
   * Get appointments assigned to medical staff
   */
  async getAppointments(userType = 'medicalStaff') {
    const token = this.testHelper.authHelper.getToken(userType);
    
    const response = await ApiTestUtils.testAuthenticatedRequest(
      token,
      '/api/medical-staff/appointments',
      'GET',
      null,
      200
    );
    
    return response.body.appointments;
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(appointmentId, status, userType = 'medicalStaff') {
    const token = this.testHelper.authHelper.getToken(userType);
    
    const response = await ApiTestUtils.testAuthenticatedRequest(
      token,
      `/api/medical-staff/appointments/${appointmentId}/status`,
      'PUT',
      { status },
      200
    );
    
    return response.body.appointment;
  }

  /**
   * Add notes to an appointment
   */
  async addAppointmentNotes(appointmentId, notes, userType = 'medicalStaff') {
    const token = this.testHelper.authHelper.getToken(userType);
    
    const response = await ApiTestUtils.testAuthenticatedRequest(
      token,
      `/api/medical-staff/appointments/${appointmentId}/notes`,
      'PUT',
      { notes },
      200
    );
    
    return response.body.appointment;
  }

  /**
   * Get student profiles (medical staff can view)
   */
  async getStudentProfiles(userType = 'medicalStaff') {
    const token = this.testHelper.authHelper.getToken(userType);
    
    const response = await ApiTestUtils.testAuthenticatedRequest(
      token,
      '/api/medical-staff/students',
      'GET',
      null,
      200
    );
    
    return response.body.students;
  }

  /**
   * Get specific student profile
   */
  async getStudentProfile(studentId, userType = 'medicalStaff') {
    const token = this.testHelper.authHelper.getToken(userType);
    
    const response = await ApiTestUtils.testAuthenticatedRequest(
      token,
      `/api/medical-staff/students/${studentId}`,
      'GET',
      null,
      200
    );
    
    return response.body.student;
  }

  /**
   * Validate medical staff profile structure
   */
  validateProfileStructure(profile, test) {
    test.assertProperty(profile, 'name', 'Profile should have name');
    test.assertProperty(profile, 'email', 'Profile should have email');
    test.assertProperty(profile, 'role', 'Profile should have role');
    test.assertEqual(profile.role, 'medical_staff', 'Role should be medical_staff');
  }

  /**
   * Test unauthorized access to medical staff endpoints
   */
  async testUnauthorizedAccess(userType, endpoint, method = 'GET', data = null) {
    const token = this.testHelper.authHelper.getToken(userType);
    
    const response = await ApiTestUtils.testAuthenticatedRequest(
      token,
      endpoint,
      method,
      data,
      403, // Should be forbidden
      false // Don't throw on error
    );
    
    return response;
  }

  /**
   * Create test data for medical staff tests
   */
  async createTestAppointment() {
    // Create an appointment that will be assigned to medical staff
    const appointment = await this.testHelper.appointmentHelper.createAppointment('student', {
      date: '2025-06-23',
      time: '14:00',
      reason: 'Medical staff test appointment'
    });
    
    return appointment;
  }
}

module.exports = MedicalStaffHelper;
