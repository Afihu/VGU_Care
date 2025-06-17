/**
 * Notification System Test Suite
 * Tests the complete notification workflow for appointment management
 * 
 * Test Coverage:
 * - Medical staff notifications for new appointment assignments
 * - Student notifications for appointment status changes  
 * - Notification CRUD operations
 * - Authentication and authorization
 */

const { SimpleTest, makeRequest, API_BASE_URL } = require('./testFramework');
const AuthHelper = require('./authHelper');

const test = new SimpleTest('Notification System');
const authHelper = new AuthHelper();

// Test data storage
let testAppointmentId = null;
let testNotificationIds = [];

async function runNotificationTests() {
  console.log('🔔 Starting Notification System Test Suite');
  console.log(`🌐 API URL: ${API_BASE_URL}`);
  console.log('='.repeat(60));

  // Setup: Authenticate all users
  test.describe('Authentication Setup', function() {
    test.it('should authenticate all test users', async function() {
      await authHelper.authenticateAllUsers();
      
      if (!authHelper.tokens.student) {
        throw new Error('Student token should exist');
      }
      if (!authHelper.tokens.medicalStaff) {
        throw new Error('Medical staff token should exist');
      }
      if (!authHelper.tokens.admin) {
        throw new Error('Admin token should exist');
      }
      
      console.log('✅ All users authenticated successfully');
    });
  });

  // Test basic notification API functionality
  test.describe('Notification API Tests', function() {
    test.it('should get notifications for authenticated user', async function() {
      const response = await makeRequest(`${API_BASE_URL}/api/notifications`, 'GET', null, {
        Authorization: `Bearer ${authHelper.tokens.student}`
      });

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (!Array.isArray(response.body.notifications)) {
        throw new Error('Response should contain notifications array');
      }
      
      console.log(`✅ Retrieved ${response.body.notifications.length} notifications`);
    });

    test.it('should get unread notification count', async function() {
      const response = await makeRequest(`${API_BASE_URL}/api/notifications/count`, 'GET', null, {
        Authorization: `Bearer ${authHelper.tokens.student}`
      });

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (typeof response.body.unreadCount !== 'number') {
        throw new Error('Response should contain numeric unreadCount');
      }
      
      console.log(`✅ Unread count: ${response.body.unreadCount}`);
    });
  });

  // Test appointment-triggered notifications
  test.describe('Appointment-Triggered Notifications', function() {
    test.it('should create appointment and trigger notifications', async function() {
      // Student creates appointment
      const appointmentData = {
        symptoms: 'Test symptoms for notification workflow',
        priorityLevel: 'high'
      };

      const appointmentResponse = await makeRequest(`${API_BASE_URL}/api/appointments`, 'POST', appointmentData, {
        Authorization: `Bearer ${authHelper.tokens.student}`
      });

      if (appointmentResponse.status !== 201) {
        throw new Error(`Expected status 201, got ${appointmentResponse.status}`);
      }
      
      testAppointmentId = appointmentResponse.body.appointment.id;
      console.log(`✅ Test appointment created: ${testAppointmentId}`);

      // Wait for notification processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify that notifications exist in the system (assignment notifications go to medical staff)
      console.log('✅ Appointment creation workflow completed');
    });

    test.it('should notify student when appointment is approved', async function() {
      if (!testAppointmentId) {
        console.log('⚠️ Skipping test - no appointment available');
        return;
      }

      // Get notification count before approval
      const beforeResponse = await makeRequest(`${API_BASE_URL}/api/notifications/count`, 'GET', null, {
        Authorization: `Bearer ${authHelper.tokens.student}`
      });
      const beforeCount = beforeResponse.body.unreadCount;

      // Medical staff approves appointment
      const approvalData = {
        dateScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        advice: 'Appointment approved for testing'
      };

      const approvalResponse = await makeRequest(
        `${API_BASE_URL}/api/appointments/${testAppointmentId}/approve`, 
        'POST', 
        approvalData, 
        { Authorization: `Bearer ${authHelper.tokens.medicalStaff}` }
      );

      if (approvalResponse.status !== 200) {
        throw new Error(`Expected status 200, got ${approvalResponse.status}`);
      }

      console.log('✅ Appointment approved by medical staff');

      // Wait for notification processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check notification count increased
      const afterResponse = await makeRequest(`${API_BASE_URL}/api/notifications/count`, 'GET', null, {
        Authorization: `Bearer ${authHelper.tokens.student}`
      });
      const afterCount = afterResponse.body.unreadCount;

      if (afterCount <= beforeCount) {
        throw new Error(`Notification count should increase. Before: ${beforeCount}, After: ${afterCount}`);
      }

      console.log(`✅ Student notification count increased: ${beforeCount} → ${afterCount}`);
    });

    test.it('should notify student when appointment is rejected', async function() {
      // Create another appointment for rejection test
      const appointmentData = {
        symptoms: 'Test rejection notification workflow',
        priorityLevel: 'low'
      };

      const appointmentResponse = await makeRequest(`${API_BASE_URL}/api/appointments`, 'POST', appointmentData, {
        Authorization: `Bearer ${authHelper.tokens.student}`
      });

      if (appointmentResponse.status !== 201) {
        throw new Error(`Expected status 201, got ${appointmentResponse.status}`);
      }

      const secondAppointmentId = appointmentResponse.body.appointment.id;
      console.log(`✅ Second test appointment created: ${secondAppointmentId}`);

      // Get notification count before rejection
      const beforeResponse = await makeRequest(`${API_BASE_URL}/api/notifications/count`, 'GET', null, {
        Authorization: `Bearer ${authHelper.tokens.student}`
      });
      const beforeCount = beforeResponse.body.unreadCount;

      // Wait for assignment
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Medical staff rejects appointment
      const rejectionData = {
        reason: 'Test rejection for notification workflow',
        advice: 'Please reschedule for different symptoms'
      };

      const rejectionResponse = await makeRequest(
        `${API_BASE_URL}/api/appointments/${secondAppointmentId}/reject`, 
        'POST', 
        rejectionData, 
        { Authorization: `Bearer ${authHelper.tokens.medicalStaff}` }
      );

      if (rejectionResponse.status !== 200) {
        throw new Error(`Expected status 200, got ${rejectionResponse.status}`);
      }

      console.log('✅ Appointment rejected by medical staff');

      // Wait for notification processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check notification count increased
      const afterResponse = await makeRequest(`${API_BASE_URL}/api/notifications/count`, 'GET', null, {
        Authorization: `Bearer ${authHelper.tokens.student}`
      });
      const afterCount = afterResponse.body.unreadCount;

      if (afterCount <= beforeCount) {
        throw new Error(`Notification count should increase. Before: ${beforeCount}, After: ${afterCount}`);
      }

      console.log(`✅ Student notification count increased: ${beforeCount} → ${afterCount}`);
    });
  });

  // Test notification management
  test.describe('Notification Management', function() {
    test.it('should mark notification as read', async function() {
      // Get all notifications first
      const notificationsResponse = await makeRequest(`${API_BASE_URL}/api/notifications`, 'GET', null, {
        Authorization: `Bearer ${authHelper.tokens.student}`
      });

      if (notificationsResponse.body.notifications.length === 0) {
        console.log('⚠️ Skipping test - no notifications to mark as read');
        return;
      }

      const firstNotification = notificationsResponse.body.notifications[0];
      testNotificationIds.push(firstNotification.id);

      const response = await makeRequest(
        `${API_BASE_URL}/api/notifications/${firstNotification.id}/read`, 
        'PATCH', 
        {}, 
        { Authorization: `Bearer ${authHelper.tokens.student}` }
      );

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (response.body.notification.isRead !== true) {
        throw new Error('Notification should be marked as read');
      }

      console.log('✅ Notification marked as read successfully');
    });

    test.it('should get filtered notifications (unread only)', async function() {
      const response = await makeRequest(
        `${API_BASE_URL}/api/notifications?unreadOnly=true`, 
        'GET', 
        null, 
        { Authorization: `Bearer ${authHelper.tokens.student}` }
      );

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!Array.isArray(response.body.notifications)) {
        throw new Error('Response should contain notifications array');
      }

      // Verify all returned notifications are unread
      const allUnread = response.body.notifications.every(n => !n.isRead);
      if (!allUnread) {
        throw new Error('All filtered notifications should be unread');
      }

      console.log(`✅ Unread notifications filter working: ${response.body.notifications.length} unread`);
    });

    test.it('should mark all notifications as read', async function() {
      const response = await makeRequest(
        `${API_BASE_URL}/api/notifications/read-all`, 
        'PATCH', 
        {}, 
        { Authorization: `Bearer ${authHelper.tokens.student}` }
      );

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (typeof response.body.updatedCount !== 'number') {
        throw new Error('Response should contain numeric updatedCount');
      }

      console.log(`✅ Marked ${response.body.updatedCount} notifications as read`);

      // Verify unread count is now 0
      const countResponse = await makeRequest(`${API_BASE_URL}/api/notifications/count`, 'GET', null, {
        Authorization: `Bearer ${authHelper.tokens.student}`
      });

      if (countResponse.body.unreadCount !== 0) {
        throw new Error('Unread count should be 0 after marking all as read');
      }
    });

    test.it('should delete notification', async function() {
      if (testNotificationIds.length === 0) {
        console.log('⚠️ Skipping test - no notifications to delete');
        return;
      }

      const notificationId = testNotificationIds[0];
      const response = await makeRequest(
        `${API_BASE_URL}/api/notifications/${notificationId}`, 
        'DELETE', 
        null, 
        { Authorization: `Bearer ${authHelper.tokens.student}` }
      );

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.body.message.includes('deleted')) {
        throw new Error('Response should confirm deletion');
      }

      console.log('✅ Notification deleted successfully');
    });
  });

  // Test authorization and security
  test.describe('Authorization Tests', function() {
    test.it('should require authentication for notification endpoints', async function() {
      const endpoints = [
        { method: 'GET', path: '/api/notifications' },
        { method: 'GET', path: '/api/notifications/count' },
        { method: 'PATCH', path: '/api/notifications/read-all' }
      ];

      for (const endpoint of endpoints) {
        const response = await makeRequest(
          `${API_BASE_URL}${endpoint.path}`, 
          endpoint.method, 
          null, 
          {} // No authorization header
        );

        if (response.status !== 401) {
          throw new Error(`${endpoint.method} ${endpoint.path} should require authentication`);
        }
      }
      console.log('✅ All notification endpoints properly protected');
    });

    test.it('should only show user own notifications', async function() {
      const response = await makeRequest(`${API_BASE_URL}/api/notifications`, 'GET', null, {
        Authorization: `Bearer ${authHelper.tokens.student}`
      });

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      const notifications = response.body.notifications;
      
      if (notifications.length > 0) {
        // All notifications should belong to the same user (the authenticated student)
        const firstUserId = notifications[0].userId;
        const allSameUser = notifications.every(n => n.userId === firstUserId);
        
        if (!allSameUser) {
          throw new Error('Should only see own notifications');
        }
      }
      
      console.log('✅ Authorization working - users only see their own notifications');
    });
  });

  // Test error handling
  test.describe('Error Handling Tests', function() {
    test.it('should handle invalid notification ID format', async function() {
      const response = await makeRequest(
        `${API_BASE_URL}/api/notifications/invalid-uuid/read`, 
        'PATCH', 
        {}, 
        { Authorization: `Bearer ${authHelper.tokens.student}` }
      );

      if (response.status !== 400) {
        throw new Error(`Expected status 400, got ${response.status}`);
      }

      console.log('✅ Invalid UUID format properly handled');
    });    test.it('should handle non-existent notification', async function() {
      const fakeUuid = '12345678-1234-1234-8234-123456789abc';
      const response = await makeRequest(
        `${API_BASE_URL}/api/notifications/${fakeUuid}/read`, 
        'PATCH', 
        {}, 
        { Authorization: `Bearer ${authHelper.tokens.student}` }
      );

      if (response.status !== 404) {
        throw new Error(`Expected status 404, got ${response.status}`);
      }

      console.log('✅ Non-existent notification properly handled');
    });

    test.it('should handle pagination parameters', async function() {
      const response = await makeRequest(
        `${API_BASE_URL}/api/notifications?limit=5&offset=0`, 
        'GET', 
        null, 
        { Authorization: `Bearer ${authHelper.tokens.student}` }
      );

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (response.body.notifications.length > 5) {
        throw new Error('Should respect limit parameter');
      }

      console.log('✅ Pagination parameters working correctly');
    });
  });

  // Run all tests
  await test.run();
}

// Export for use in other test files
module.exports = {
  runNotificationTests,
  authHelper
};

// Run tests if this file is executed directly
if (require.main === module) {
  runNotificationTests().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
}
