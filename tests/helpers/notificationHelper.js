/**
 * Notification Test Helper
 * Provides utilities for testing notification functionality
 */

const { makeRequest, API_BASE_URL } = require('../testFramework');
const DateUtils = require('../utils/dateUtils');

class NotificationHelper {
  constructor(testHelper) {
    this.testHelper = testHelper;
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userType) {
    const token = this.testHelper.authHelper.getToken(userType);
    
    const response = await makeRequest(`${API_BASE_URL}/api/notifications`, 'GET', null, {
      Authorization: `Bearer ${token}`
    });
    
    return response;
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(userType, notificationId) {
    const token = this.testHelper.authHelper.getToken(userType);
    
    const response = await makeRequest(
      `${API_BASE_URL}/api/notifications/${notificationId}/read`, 
      'PUT', 
      null, 
      {
        Authorization: `Bearer ${token}`
      }
    );
    
    return response;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userType, notificationId) {
    const token = this.testHelper.authHelper.getToken(userType);
    
    const response = await makeRequest(
      `${API_BASE_URL}/api/notifications/${notificationId}`, 
      'DELETE', 
      null, 
      {
        Authorization: `Bearer ${token}`
      }
    );
    
    return response;
  }
  /**
   * Create a test appointment to trigger notifications
   */
  async createAppointmentForNotificationTest() {
    // Use dynamic date instead of hardcoded date
    const testDate = DateUtils.getNextWeekday(2); // Use day after tomorrow
    
    // Use the appointment helper to create an appointment
    const appointment = await this.testHelper.appointmentHelper.createAppointment('student', {
      dateScheduled: testDate,
      reason: 'Test appointment for notification'
    });
    
    return appointment;
  }

  /**
   * Validate notification structure
   */
  validateNotificationStructure(notification, test) {
    test.assertProperty(notification, 'id', 'Notification should have id');
    test.assertProperty(notification, 'user_id', 'Notification should have user_id');
    test.assertProperty(notification, 'message', 'Notification should have message');
    test.assertProperty(notification, 'type', 'Notification should have type');
    test.assertProperty(notification, 'is_read', 'Notification should have is_read');
    test.assertProperty(notification, 'created_at', 'Notification should have created_at');
  }

  /**
   * Wait for notification to be created (with timeout)
   */
  async waitForNotification(userType, timeoutMs = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const response = await this.getNotifications(userType);
      
      if (response.status === 200 && response.body.notifications && response.body.notifications.length > 0) {
        return response.body.notifications[0];
      }
      
      // Wait 500ms before checking again
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    throw new Error(`No notification received within ${timeoutMs}ms`);
  }

  /**
   * Clean up test notifications
   */
  async cleanupNotifications(userType, notificationIds) {
    for (const notificationId of notificationIds) {
      try {
        await this.deleteNotification(userType, notificationId);
      } catch (error) {
        console.warn(`Failed to cleanup notification ${notificationId}:`, error.message);
      }
    }
  }
}

module.exports = NotificationHelper;
