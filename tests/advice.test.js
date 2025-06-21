/**
 * Advice Management Test Suite
 * Refactored to use standardized test framework and helpers
 */

const { SimpleTest, makeRequest, API_BASE_URL } = require('./testFramework');
const TestHelper = require('./helpers/testHelper');
const DateUtils = require('./utils/dateUtils');

async function runAdviceTests() {
  const test = new SimpleTest('💬 Advice Management Test Suite');
  const testHelper = new TestHelper();

  console.log(`🌐 Using API URL: ${API_BASE_URL}`);

  try {
    // Setup: Initialize test helpers
    await testHelper.initialize();

    test.describe('Advice CRUD Operations', function() {
      test.it('should allow medical staff to send advice', async function() {
        // Create appointment first
        const createResult = await testHelper.appointment.createAppointment('student', {
          symptoms: 'Test symptoms for advice functionality',
          priorityLevel: 'medium'
        });
        const appointmentId = createResult.body.appointment?.id || createResult.body.appointment_id;
        
        test.assertExists(appointmentId, 'Created appointment should have ID');
        
        // Send advice
        const adviceData = {
          message: 'Please drink plenty of water and rest. Avoid strenuous activities for the next 2-3 days.'
        };
        
        const response = await makeRequest(`${API_BASE_URL}/api/advice/appointments/${appointmentId}`, 'POST', adviceData, {
          'Authorization': `Bearer ${testHelper.auth.getToken('medicalStaff')}`
        });
        
        test.assert(response.status === 200 || response.status === 201, 'Advice creation should succeed');
        console.log('✅ Medical staff can send advice');
      });

      test.it('should allow retrieving advice for appointment', async function() {
        // Create appointment and advice first
        const createResult = await testHelper.appointment.createAppointment('student');
        const appointmentId = createResult.body.appointment?.id || createResult.body.appointment_id;
        
        // Send advice
        const adviceData = { message: 'Test advice message' };
        await makeRequest(`${API_BASE_URL}/api/advice/appointments/${appointmentId}`, 'POST', adviceData, {
          'Authorization': `Bearer ${testHelper.auth.getToken('medicalStaff')}`
        });
        
        // Retrieve advice
        const response = await makeRequest(`${API_BASE_URL}/api/advice/appointments/${appointmentId}`, 'GET', null, {
          'Authorization': `Bearer ${testHelper.auth.getToken('student')}`
        });
        
        test.assert(response.status === 200, 'Should retrieve advice successfully');
        console.log('✅ Can retrieve advice for appointment');
      });      test.it('should allow updating advice', async function() {
        // Create appointment and advice first
        const createResult = await testHelper.appointment.createAppointment('student', {
          symptoms: 'Test symptoms for advice update',
          priorityLevel: 'medium'
        });
        const appointmentId = createResult.body?.appointment?.id;
        
        test.assertExists(appointmentId, 'Appointment should be created for advice test');
          // Send initial advice
        const initialAdviceData = { message: 'Initial advice message' };
        const createAdviceResponse = await makeRequest(`${API_BASE_URL}/api/advice/appointments/${appointmentId}`, 'POST', initialAdviceData, {
          'Authorization': `Bearer ${testHelper.auth.getToken('medicalStaff')}`
        });
        
        if (createAdviceResponse.status === 200 || createAdviceResponse.status === 201) {
          // Update advice using appointment ID (not advice ID)
          const updateData = { message: 'Updated advice message with additional instructions' };
          const updateResponse = await makeRequest(`${API_BASE_URL}/api/advice/appointments/${appointmentId}`, 'PUT', updateData, {
            'Authorization': `Bearer ${testHelper.auth.getToken('medicalStaff')}`
          });
          
          test.assert(updateResponse.status === 200, `Advice update should succeed. Status: ${updateResponse.status}, Body: ${JSON.stringify(updateResponse.body)}`);
          console.log('✅ Medical staff can update advice');
        } else {
          test.fail(`Advice creation failed: ${createAdviceResponse.status} - ${JSON.stringify(createAdviceResponse.body)}`);
        }
      });
    });

    test.describe('Access Control for Advice', function() {      test.it('should prevent students from sending advice', async function() {
        // Create appointment first - use dynamic date
        const testDate = DateUtils.getNextWeekday(2); // Use different day
        const createResult = await testHelper.appointment.createAppointment('student', {
          dateScheduled: testDate,
          symptoms: 'Test for student advice prevention'
        });
        const appointmentId = createResult.body.appointment?.id || createResult.body.appointment_id;
        
        // Try to send advice as student (should fail)
        const adviceData = { message: 'Student trying to send advice' };
        const response = await makeRequest(`${API_BASE_URL}/api/advice/appointments/${appointmentId}`, 'POST', adviceData, {
          'Authorization': `Bearer ${testHelper.auth.getToken('student')}`
        });
        
        test.assert(response.status === 403 || response.status === 401, 
          'Students should not be able to send advice');
        console.log('✅ Students cannot send advice');
      });

      test.it('should reject unauthorized access to advice', async function() {
        const response = await makeRequest(`${API_BASE_URL}/api/advice/appointments/123`, 'GET');
        
        test.assertEqual(response.status, 401, 'Should reject unauthorized access');
        console.log('✅ Unauthorized access to advice properly rejected');
      });

      test.it('should reject invalid token for advice operations', async function() {
        const response = await makeRequest(`${API_BASE_URL}/api/advice/appointments/123`, 'GET', null, {
          'Authorization': 'Bearer invalid-token'
        });
        
        test.assertEqual(response.status, 401, 'Should reject invalid token');
        console.log('✅ Invalid token for advice properly rejected');
      });
    });

    test.describe('Advice Validation', function() {      test.it('should validate advice message content', async function() {
        // Create appointment first - use dynamic date
        const testDate = DateUtils.getNextWeekday(3); // Use yet another different day
        const createResult = await testHelper.appointment.createAppointment('student', {
          dateScheduled: testDate,
          symptoms: 'Test for advice validation'
        });
        const appointmentId = createResult.body.appointment?.id || createResult.body.appointment_id;
        
        // Try to send empty advice
        const emptyAdviceData = { message: '' };
        const response = await makeRequest(`${API_BASE_URL}/api/advice/appointments/${appointmentId}`, 'POST', emptyAdviceData, {
          'Authorization': `Bearer ${testHelper.auth.getToken('medicalStaff')}`
        });
        
        test.assert(response.status === 400 || response.status === 422, 
          'Empty advice message should be rejected');
        console.log('✅ Empty advice message properly validated');
      });      test.it('should handle non-existent appointment for advice', async function() {
        const fakeAppointmentId = '12345678-1234-5678-9abc-123456789012';
        const adviceData = { message: 'Advice for non-existent appointment' };
        
        const response = await makeRequest(`${API_BASE_URL}/api/advice/appointments/${fakeAppointmentId}`, 'POST', adviceData, {
          'Authorization': `Bearer ${testHelper.auth.getToken('medicalStaff')}`
        });
        
        test.assert(
          response.status >= 400 && (
            response.status === 404 || 
            response.status === 400 || 
            response.status === 500 ||
            (response.body && (
              response.body.error?.includes('not found') ||
              response.body.error?.includes('does not exist') ||
              response.body.message?.includes('not found') ||
              response.body.message?.includes('does not exist')
            ))
          ), 
          `Non-existent appointment should be handled properly. Status: ${response.status}, Body: ${JSON.stringify(response.body)}`
        );
        console.log('✅ Non-existent appointment properly handled');
      });});

    // Run all the tests
    await test.run();

  } catch (error) {
    console.error('\n💥 Advice tests failed:', error.message);
    throw error;
  } finally {
    await testHelper.cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAdviceTests();
}

module.exports = runAdviceTests;