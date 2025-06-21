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
   */  async createAppointment(userType = 'student', appointmentData = {}) {
    // Get next weekday for appointment scheduling
    const nextWeekday = new Date();
    nextWeekday.setDate(nextWeekday.getDate() + 1);
    
    // Skip weekends - find next Monday-Friday
    while (nextWeekday.getDay() === 0 || nextWeekday.getDay() === 6) {
      nextWeekday.setDate(nextWeekday.getDate() + 1);
    }    
    const appointmentDate = nextWeekday.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Get available time slots and pick one dynamically
    const timeSlotsResponse = await this.getAvailableTimeSlots(appointmentDate, userType);
    const availableSlots = timeSlotsResponse.body.availableTimeSlots || [];
    
    if (availableSlots.length === 0) {
      throw new Error('No available time slots for testing');
    }
    
    // Use a different slot each time by using random selection from available slots
    const randomIndex = Math.floor(Math.random() * availableSlots.length);
    const selectedSlot = availableSlots[randomIndex];
    
    console.log(`[DEBUG] Selected slot ${randomIndex + 1}/${availableSlots.length}: ${selectedSlot.start_time}`);

    const defaultData = {
      symptoms: 'Test symptoms for automated testing',
      priorityLevel: 'medium',
      healthIssueType: 'physical', // Default to physical health issues
      dateScheduled: appointmentDate,
      timeScheduled: selectedSlot.start_time // Use dynamically selected slot
    };

    const data = { ...defaultData, ...appointmentData };

    console.log('[DEBUG] Final appointment data being sent:', JSON.stringify(data, null, 2));

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
    // Get next weekday for appointment scheduling
    const nextWeekday = new Date();
    nextWeekday.setDate(nextWeekday.getDate() + 1);
    
    // Skip weekends - find next Monday-Friday
    while (nextWeekday.getDay() === 0 || nextWeekday.getDay() === 6) {
      nextWeekday.setDate(nextWeekday.getDate() + 1);
    }
    
    const appointmentDate = nextWeekday.toISOString().split('T')[0]; // YYYY-MM-DD format

    const defaultData = {
      symptoms: 'Test symptoms for automated testing',
      priorityLevel: 'medium',
      healthIssueType: 'physical',
      dateScheduled: appointmentDate,
      timeScheduled: '14:20:00' // Use available time slot
    };

    const data = { ...defaultData, ...appointmentData };const response = await makeRequest(`${API_BASE_URL}/api/appointments`, 'POST', data, {
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
   * Reschedule appointment (for students) - Update date and time
   */
  async rescheduleAppointment(appointmentId, dateScheduled, timeScheduled, userType = 'student') {
    const updateData = {
      dateScheduled,
      timeScheduled
    };

    const response = await makeRequest(`${API_BASE_URL}/api/appointments/${appointmentId}`, 'PATCH', 
      updateData, 
      { 'Authorization': `Bearer ${this.testHelper.auth.getToken(userType)}` }
    );

    return response;
  }

  /**
   * Update appointment details (for students) - Update symptoms, priority, etc.
   */
  async updateAppointmentDetails(appointmentId, updateData, userType = 'student') {
    const response = await makeRequest(`${API_BASE_URL}/api/appointments/${appointmentId}`, 'PATCH', 
      updateData, 
      { 'Authorization': `Bearer ${this.testHelper.auth.getToken(userType)}` }
    );

    return response;
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
