/**
 * Appointment Testing Helper
 * Consolidates all appointment-related test utilities
 */

const { makeRequest, API_BASE_URL } = require('../testFramework');

class AppointmentHelper {
  constructor(testHelper) {
    this.testHelper = testHelper;
    this.createdAppointmentIds = [];
  }  /**
   * Create a test appointment
   */
  async createAppointment(userType = 'student', appointmentData = {}) {
    const defaultData = {
      symptoms: 'Test symptoms for automated testing',
      priorityLevel: 'medium'
    };

    const data = { ...defaultData, ...appointmentData };

    const response = await makeRequest(`${API_BASE_URL}/api/appointments`, 'POST', data, {
      'Authorization': `Bearer ${this.testHelper.auth.getToken(userType)}`
    });

    if ((response.status === 200 || response.status === 201) && response.body?.appointment?.id) {
      this.createdAppointmentIds.push(response.body.appointment.id);
    }

    return response; // Return full response for testing
  }
  /**
   * Delete an appointment
   */
  async deleteAppointment(userType, appointmentId) {
    const response = await makeRequest(`${API_BASE_URL}/api/appointments/${appointmentId}`, 'DELETE', null, {
      'Authorization': `Bearer ${this.testHelper.auth.getToken(userType)}`
    });

    // Remove from tracking
    this.createdAppointmentIds = this.createdAppointmentIds.filter(id => id !== appointmentId);

    if (response.status === 200) {
      return response;
    }

    throw new Error(`Failed to delete appointment: ${response.status} - ${JSON.stringify(response.body)}`);
  }  /**
   * Get appointments for a user (returns response object for testing)
   */
  async getAppointments(userType) {
    const response = await makeRequest(`${API_BASE_URL}/api/appointments`, 'GET', null, {
      'Authorization': `Bearer ${this.testHelper.auth.getToken(userType)}`
    });

    return response; // Return full response for testing
  }

  /**
   * Test create appointment functionality
   */
  async testCreateAppointment(appointmentData = {}, userType = 'student') {
    const defaultData = {
      symptoms: 'Test symptoms for automated testing',
      priorityLevel: 'medium'
    };

    const data = { ...defaultData, ...appointmentData };    const response = await makeRequest(`${API_BASE_URL}/api/appointments`, 'POST', data, {
      'Authorization': `Bearer ${this.testHelper.auth.getToken(userType)}`
    });

    // Debug logging to see what we actually get
    console.log(`[DEBUG] Appointment creation response - Status: ${response.status}`);
    console.log(`[DEBUG] Appointment creation response - Body:`, JSON.stringify(response.body, null, 2));

    // Track created appointment for cleanup
    if ((response.status === 200 || response.status === 201) && response.body?.appointment?.id) {
      this.createdAppointmentIds.push(response.body.appointment.id);
    }    return {
      response,
      validations: {
        success: response.status === 200 || response.status === 201,
        hasAppointment: response.body && response.body.appointment,
        hasId: response.body && response.body.appointment && response.body.appointment.id,
        hasStatus: response.body && response.body.appointment && response.body.appointment.status !== undefined
      }
    };
  }  /**
   * Get specific appointment by ID
   */
  async getAppointmentById(appointmentId, userType) {
    const response = await makeRequest(`${API_BASE_URL}/api/appointments/${appointmentId}`, 'GET', null, {
      'Authorization': `Bearer ${this.testHelper.auth.getToken(userType)}`
    });

    if (response.status === 200) {
      return response.body.appointment;
    }

    throw new Error(`Failed to get appointment: ${response.status} - ${JSON.stringify(response.body)}`);
  }  /**
   * Update appointment status (medical staff only)
   */
  async updateAppointmentStatus(appointmentId, status, userType = 'medicalStaff') {
    const response = await makeRequest(`${API_BASE_URL}/api/appointments/${appointmentId}`, 'PATCH', 
      { status }, 
      { 'Authorization': `Bearer ${this.testHelper.auth.getToken(userType)}` }
    );

    return response; // Return full response for testing
  }

  /**
   * Get available time slots for a specific date
   */  /**
   * Get available time slots for a specific date
   */
  async getAvailableTimeSlots(date, userType = 'student') {
    const response = await makeRequest(`${API_BASE_URL}/api/appointments/time-slots/${date}`, 'GET', null, {
      'Authorization': `Bearer ${this.testHelper.auth.getToken(userType)}`
    });

    return response;
  }  /**
   * Create appointment with time slot
   */
  async createAppointmentWithTimeSlot(appointmentData, userType = 'student') {
    const response = await makeRequest(`${API_BASE_URL}/api/appointments`, 'POST', appointmentData, {
      'Authorization': `Bearer ${this.testHelper.auth.getToken(userType)}`
    });

    if (response.status === 200 || response.status === 201) {
      const appointmentId = response.body.appointment?.id || response.body.appointment_id;
      if (appointmentId) {
        this.createdAppointmentIds.push(appointmentId);
      }
    }

    return response;
  }

  /**
   * Test appointment creation with validation
   */  async testCreateAppointment(testData = {}, userType = 'student') {
    const response = await this.createAppointment(userType, testData);
    
    return {
      response,
      validations: {
        success: response.status === 200 || response.status === 201,
        hasAppointment: Boolean(response.body && (response.body.appointment || response.body.appointment_id)),
        hasId: Boolean(response.body && (response.body.appointment?.id || response.body.appointment_id)),
        hasStatus: Boolean(response.body && response.body.appointment?.status !== undefined)
      }
    };
  }

  /**
   * Test time slot functionality
   */  async testTimeSlotAvailability(date, userType = 'student') {
    const response = await this.getAvailableTimeSlots(date, userType);
    
    return {
      response,
      validations: {
        success: response.status === 200,
        hasDate: Boolean(response.body && response.body.date),
        hasSlots: Boolean(response.body && response.body.availableTimeSlots),
        isArray: Boolean(response.body && Array.isArray(response.body.availableTimeSlots)),
        hasValidSlotStructure: Boolean(response.body && response.body.availableTimeSlots?.every(slot => 
          slot.start_time && slot.end_time && slot.startTimeFormatted && slot.endTimeFormatted
        ))
      }
    };
  }

  /**
   * Validate appointment response structure
   */
  validateAppointmentStructure(appointmentData) {
    const required = ['id', 'symptoms', 'status', 'priority_level'];
    const validations = {};
    
    required.forEach(field => {
      validations[`has_${field}`] = appointmentData[field] !== undefined;
    });

    return validations;
  }
  /**
   * Clean up created test appointments
   */
  async cleanup() {
    const cleanupPromises = this.createdAppointmentIds.map(async (id) => {
      try {
        await this.deleteAppointment('admin', id);
      } catch (error) {
        console.warn(`Failed to cleanup appointment ${id}:`, error.message);
      }
    });

    await Promise.all(cleanupPromises);
    this.createdAppointmentIds = [];
  }
}

module.exports = AppointmentHelper;
