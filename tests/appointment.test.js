/**
 * Appointment Management Test Suite
 * Refactored to use standardized test framework and helpers
 */

const { SimpleTest, makeRequest, API_BASE_URL } = require('./testFramework');
const TestHelper = require('./helpers/testHelper');
const DateUtils = require('./utils/dateUtils');

async function runAppointmentTests() {
  const test = new SimpleTest('🏥 Appointment Management Test Suite');
  const testHelper = new TestHelper();

  console.log(`🌐 Using API URL: ${API_BASE_URL}`);

  try {
    // Setup: Initialize test helpers
    await testHelper.initialize();

    test.describe('Appointment CRUD Operations', function() {      test.it('should create appointment as student', async function() {        console.log('[DEBUG] Starting appointment creation test...');        
        // Get next weekday
        const nextWeekday = new Date();
        nextWeekday.setDate(nextWeekday.getDate() + 1);
        while (nextWeekday.getDay() === 0 || nextWeekday.getDay() === 6) {
          nextWeekday.setDate(nextWeekday.getDate() + 1);
        }
        const appointmentDate = nextWeekday.toISOString().split('T')[0];
        
        // Get available time slots for this date
        const timeSlotsResponse = await testHelper.appointment.getAvailableTimeSlots(appointmentDate);
        console.log('[DEBUG] Available slots count:', timeSlotsResponse.body.availableTimeSlots?.length || 0);
        
        // Use the first available time slot
        const firstAvailableSlot = timeSlotsResponse.body.availableTimeSlots?.[0];
        if (!firstAvailableSlot) {
          throw new Error('No available time slots found for testing');
        }
        
        console.log('[DEBUG] Using time slot:', firstAvailableSlot.start_time);
        
        const result = await testHelper.appointment.testCreateAppointment({
          symptoms: 'Test headache and fever',
          priorityLevel: 'medium',
          healthIssueType: 'physical',
          dateScheduled: appointmentDate,
          timeScheduled: firstAvailableSlot.start_time
        });
        
        console.log('[DEBUG] Test result:', JSON.stringify(result, null, 2));

        test.assertTrue(result.validations.success, 'Appointment creation should succeed');
        test.assertTrue(result.validations.hasAppointment, 'Response should contain appointment');
        test.assertTrue(result.validations.hasId, 'Appointment should have ID');
        test.assertTrue(result.validations.hasStatus, 'Appointment should have status');
        console.log('✅ Student can create appointment');
      });

      test.it('should get appointments as student', async function() {
        const response = await testHelper.appointment.getAppointments('student');
        
        test.assertEqual(response.status, 200, 'Should return 200 status');
        test.assertTrue(Array.isArray(response.body.appointments), 'Should return appointments array');
        console.log('✅ Student can retrieve appointments');
      });

      test.it('should get appointments as medical staff', async function() {
        const response = await testHelper.appointment.getAppointments('medicalStaff');
        
        test.assertEqual(response.status, 200, 'Should return 200 status');
        test.assertTrue(Array.isArray(response.body.appointments), 'Should return appointments array');
        console.log('✅ Medical staff can retrieve appointments');
      });      test.it('should update appointment status as medical staff', async function() {
        // Create appointment first
        const createResult = await testHelper.appointment.createAppointment('student');
        const appointmentId = createResult.body.appointment?.id || createResult.body.appointment_id;
        
        test.assertExists(appointmentId, 'Created appointment should have ID');
        
        // Update status
        const updateResponse = await testHelper.appointment.updateAppointmentStatus(appointmentId, 'approved');
        
        test.assertEqual(updateResponse.status, 200, 'Status update should succeed');
        test.assertEqual(updateResponse.body.appointment.status, 'approved', 'Status should be updated');
        console.log('✅ Medical staff can update appointment status');
      });
    });

    test.describe('Student Appointment Management', function() {      test.it('should allow student to cancel their appointment', async function() {
        // Create appointment
        const createResult = await testHelper.appointment.createAppointment('student', {
          symptoms: 'Appointment to be cancelled',
          priorityLevel: 'low',
          healthIssueType: 'mental'
        });
        const appointmentId = createResult.body.appointment?.id || createResult.body.appointment_id;
        
        // Cancel appointment
        const cancelResponse = await testHelper.appointment.updateAppointmentStatus(appointmentId, 'cancelled', 'student');
        
        test.assertEqual(cancelResponse.status, 200, 'Cancellation should succeed');
        test.assertEqual(cancelResponse.body.appointment.status, 'cancelled', 'Status should be cancelled');
        console.log('✅ Student can cancel their appointment');
      });      test.it('should allow student to update appointment details', async function() {
        // Create appointment
        const createResult = await testHelper.appointment.createAppointment('student', {
          symptoms: 'Original symptoms',
          priorityLevel: 'low',
          healthIssueType: 'physical'
        });
        const appointmentId = createResult.body.appointment?.id || createResult.body.appointment_id;
        
        // Update appointment
        const updateData = {
          symptoms: 'Updated symptoms: Severe headache with nausea',
          priorityLevel: 'high'
        };
        
        const updateResponse = await makeRequest(`${API_BASE_URL}/api/appointments/${appointmentId}`, 'PATCH', updateData, {
          'Authorization': `Bearer ${testHelper.auth.getToken('student')}`
        });
        
        test.assertEqual(updateResponse.status, 200, 'Update should succeed');
        test.assertEqual(updateResponse.body.appointment.symptoms, updateData.symptoms, 'Symptoms should be updated');
        console.log('✅ Student can update appointment details');
      });

      test.it('should allow student to reschedule appointment', async function() {
        // Create appointment
        const createResult = await testHelper.appointment.createAppointment('student', {
          symptoms: 'Test for rescheduling',
          priorityLevel: 'medium',
          healthIssueType: 'physical'
        });
        const appointmentId = createResult.body.appointment?.id || createResult.body.appointment_id;
          // Get available time slots for a different date
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 2); // Two days ahead to avoid conflicts
        while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
          nextDay.setDate(nextDay.getDate() + 1);
        }
        const rescheduleDate = nextDay.toISOString().split('T')[0];
        
        const slotsResponse = await testHelper.appointment.getAvailableTimeSlots(rescheduleDate);
        if (slotsResponse.body.availableTimeSlots && slotsResponse.body.availableTimeSlots.length > 0) {
          const newTimeSlot = slotsResponse.body.availableTimeSlots[0];
          
          // Reschedule appointment
          const rescheduleResponse = await testHelper.appointment.rescheduleAppointment(
            appointmentId, 
            rescheduleDate, 
            newTimeSlot.start_time
          );
          
          test.assertEqual(rescheduleResponse.status, 200, 'Reschedule should succeed');
          test.assertEqual(rescheduleResponse.body.appointment.dateScheduled.split('T')[0], rescheduleDate, 'Date should be updated');
          test.assertEqual(rescheduleResponse.body.appointment.timeScheduled, newTimeSlot.start_time, 'Time should be updated');
          console.log('✅ Student can reschedule appointment');        } else {
          console.log('⚠️ Skipping reschedule test - no available slots for reschedule date');
        }
      });
    });

    test.describe('Access Control', function() {
      test.it('should reject unauthorized access', async function() {
        const response = await makeRequest(`${API_BASE_URL}/api/appointments`, 'GET');
        
        test.assertEqual(response.status, 401, 'Should reject unauthorized access');
        console.log('✅ Unauthorized access properly rejected');
      });

      test.it('should reject invalid token', async function() {
        const response = await makeRequest(`${API_BASE_URL}/api/appointments`, 'GET', null, {
          'Authorization': 'Bearer invalid-token'
        });
        
        test.assertEqual(response.status, 401, 'Should reject invalid token');
        console.log('✅ Invalid token properly rejected');
      });      test.it('should prevent students from approving appointments', async function() {
        // Create appointment first
        const createResult = await testHelper.appointment.createAppointment('student');
        const appointmentId = createResult.body.appointment?.id || createResult.body.appointment_id;
        
        // Try to approve as student (should fail)
        const approveResponse = await makeRequest(`${API_BASE_URL}/api/appointments/${appointmentId}/approve`, 'POST', {}, {
          'Authorization': `Bearer ${testHelper.auth.getToken('student')}`
        });
        
        test.assert(approveResponse.status === 403 || approveResponse.status === 401, 
          'Student should not be able to approve appointments');
        console.log('✅ Students cannot approve appointments');
      });
    });

    test.describe('Time Slot Management', function() {      test.it('should get available time slots', async function() {
        const testDate = DateUtils.getNextWeekday(1); // Use dynamic date
        const result = await testHelper.appointment.testTimeSlotAvailability(testDate);
        
        test.assertTrue(result.validations.success, 'Should get time slots successfully');
        test.assertTrue(result.validations.hasDate, 'Response should include date');
        test.assertTrue(result.validations.hasSlots, 'Response should include time slots');
        test.assertTrue(result.validations.isArray, 'Time slots should be an array');
        console.log('✅ Time slots retrieval working');
      });

      test.it('should create appointment with time slot', async function() {
        const testDate = DateUtils.getNextWeekday(1); // Use dynamic date
        const timeSlotsResult = await testHelper.appointment.getAvailableTimeSlots(testDate);
        
        test.assertEqual(timeSlotsResult.status, 200, 'Should get time slots');
          if (timeSlotsResult.body.availableTimeSlots && timeSlotsResult.body.availableTimeSlots.length > 0) {
          const firstSlot = timeSlotsResult.body.availableTimeSlots[0];
          const appointmentData = {
            symptoms: 'Test appointment with time slot',
            priorityLevel: 'medium',
            healthIssueType: 'physical',
            dateScheduled: testDate,
            timeScheduled: firstSlot.start_time
          };
          
          const createResult = await testHelper.appointment.createAppointmentWithTimeSlot(appointmentData);
          
          test.assert(createResult.status === 200 || createResult.status === 201, 
            'Appointment with time slot should be created');
          console.log('✅ Appointment with time slot created');
        } else {
          console.log('⚠️ No available time slots for testing');
        }
      });    });

    // Run all the tests
    await test.run();

  } catch (error) {
    console.error('\n💥 Appointment tests failed:', error.message);
    throw error;
  } finally {
    await testHelper.cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAppointmentTests();
}

module.exports = runAppointmentTests;