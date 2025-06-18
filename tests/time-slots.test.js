/**
 * Time Slots Test Suite
 * Tests the new appointment time slot booking functionality
 */

const { SimpleTest, makeRequest, authenticate, API_BASE_URL, TEST_CREDENTIALS } = require('./testFramework');
const AuthHelper = require('./authHelper');

// Test date constants (using future dates to ensure validity)
const TEST_DATE_WEEKDAY = '2025-06-23'; // Monday
const TEST_DATE_WEEKEND = '2025-06-22'; // Sunday
// Time slots will be dynamically fetched from available slots
let TEST_TIME_SLOT = null;
let TEST_TIME_SLOT_2 = null;

async function runTimeSlotTests() {
  const test = new SimpleTest('Time Slots API Tests');
  const authHelper = new AuthHelper();
  let createdAppointmentId = null;
  
  console.log('🕐 Starting Time Slots Test Suite\n');
  console.log(`🌐 Using API URL: ${API_BASE_URL}`);
  
  try {
    // Setup: Authenticate all users
    await authHelper.authenticateAllUsers();
    console.log('✅ All users authenticated successfully\n');

    test.describe('Time Slot Management', function() {
        test.it('should get available time slots for weekday', async () => {
        const response = await makeRequest(
          `${API_BASE_URL}/api/appointments/time-slots/${TEST_DATE_WEEKDAY}`,
          'GET',
          null,
          { Authorization: `Bearer ${authHelper.tokens.student}` }
        );

        test.assertEqual(response.status, 200, 'Should return 200 status');
        test.assertExists(response.body.date, 'Response should include date');
        test.assertExists(response.body.availableTimeSlots, 'Response should include availableTimeSlots array');
        test.assertTrue(response.body.availableTimeSlots.length > 0, 'Should have available time slots for weekday');
        test.assertEqual(response.body.date, TEST_DATE_WEEKDAY, 'Date should match requested date');
        
        // Verify time slot structure
        const firstSlot = response.body.availableTimeSlots[0];
        test.assertExists(firstSlot.start_time, 'Time slot should have start_time');
        test.assertExists(firstSlot.end_time, 'Time slot should have end_time');
        test.assertExists(firstSlot.startTimeFormatted, 'Time slot should have startTimeFormatted');
        test.assertExists(firstSlot.endTimeFormatted, 'Time slot should have endTimeFormatted');
        
        // Store available time slots for later tests
        if (response.body.availableTimeSlots.length >= 2) {
          TEST_TIME_SLOT = response.body.availableTimeSlots[0].start_time;
          TEST_TIME_SLOT_2 = response.body.availableTimeSlots[1].start_time;
          console.log(`📌 Using time slots: ${TEST_TIME_SLOT} and ${TEST_TIME_SLOT_2}`);
        }
        
        console.log(`✅ Found ${response.body.availableTimeSlots.length} available time slots for ${TEST_DATE_WEEKDAY}`);
      });

      test.it('should return empty slots for weekend', async () => {
        const response = await makeRequest(
          `${API_BASE_URL}/api/appointments/time-slots/${TEST_DATE_WEEKEND}`,
          'GET',
          null,
          { Authorization: `Bearer ${authHelper.tokens.student}` }
        );

        test.assertEqual(response.status, 200, 'Should return 200 status');
        test.assertEqual(response.body.availableTimeSlots.length, 0, 'Should have no time slots for weekend');
        console.log(`✅ Correctly returned no time slots for weekend date ${TEST_DATE_WEEKEND}`);
      });      test.it('should create appointment with specific time slot', async () => {
        // Ensure we have time slots from the previous test
        if (!TEST_TIME_SLOT) {
          throw new Error('No available time slots found for testing. Cannot proceed with appointment creation test.');
        }

        const appointmentData = {
          symptoms: 'Time slot test appointment',
          priorityLevel: 'medium',
          dateScheduled: TEST_DATE_WEEKDAY,
          timeScheduled: TEST_TIME_SLOT
        };

        const response = await makeRequest(
          `${API_BASE_URL}/api/appointments`,
          'POST',
          appointmentData,
          { Authorization: `Bearer ${authHelper.tokens.student}` }
        );

        console.log('Debug - Appointment creation response:', JSON.stringify(response, null, 2));
        
        if (response.status !== 201) {
          console.error(`❌ Appointment creation failed with status ${response.status}:`, response.body);
        }

        test.assertEqual(response.status, 201, 'Should create appointment successfully');
        test.assertExists(response.body.appointment, 'Response should include appointment data');
        test.assertEqual(response.body.appointment.symptoms, appointmentData.symptoms, 'Symptoms should match');
        test.assertEqual(response.body.appointment.timeScheduled, TEST_TIME_SLOT, 'Time should match requested slot');
        
        createdAppointmentId = response.body.appointment.id;
        console.log(`✅ Created appointment with time slot ${TEST_TIME_SLOT}`);
      });test.it('should remove booked time slot from available slots', async () => {
        const response = await makeRequest(
          `${API_BASE_URL}/api/appointments/time-slots/${TEST_DATE_WEEKDAY}`,
          'GET',
          null,
          { Authorization: `Bearer ${authHelper.tokens.student}` }
        );

        test.assertEqual(response.status, 200, 'Should return 200 status');
        
        // Check that the booked time slot is not in the available slots
        const bookedSlot = response.body.availableTimeSlots.find(slot => slot.start_time === TEST_TIME_SLOT);
        test.assertEqual(bookedSlot, undefined, `Time slot ${TEST_TIME_SLOT} should not be available after booking`);
        
        console.log(`✅ Time slot ${TEST_TIME_SLOT} correctly removed from available slots`);
      });      test.it('should prevent double-booking of time slot', async () => {
        const appointmentData = {
          symptoms: 'Attempt to double-book',
          priorityLevel: 'low',
          dateScheduled: TEST_DATE_WEEKDAY,
          timeScheduled: TEST_TIME_SLOT // Same time slot as before
        };

        const response = await makeRequest(
          `${API_BASE_URL}/api/appointments`,
          'POST',
          appointmentData,
          { Authorization: `Bearer ${authHelper.tokens.student}` }
        );

        test.assertEqual(response.status, 500, 'Should prevent double-booking');
        test.assertTrue(response.body.error.includes('not available'), 'Error message should indicate time slot not available');
        
        console.log('✅ Successfully prevented double-booking of time slot');
      });      test.it('should book different available time slot', async () => {
        // Ensure we have a second time slot from the first test
        if (!TEST_TIME_SLOT_2) {
          throw new Error('No second available time slot found for testing. Cannot proceed with second appointment creation test.');
        }

        const appointmentData = {
          symptoms: 'Different time slot test',
          priorityLevel: 'high',
          dateScheduled: TEST_DATE_WEEKDAY,
          timeScheduled: TEST_TIME_SLOT_2 // Different time slot
        };

        const response = await makeRequest(
          `${API_BASE_URL}/api/appointments`,
          'POST',
          appointmentData,
          { Authorization: `Bearer ${authHelper.tokens.student}` }
        );

        console.log('Debug - Second appointment creation response:', JSON.stringify(response, null, 2));
        
        if (response.status !== 201) {
          console.error(`❌ Second appointment creation failed with status ${response.status}:`, response.body);
        }

        test.assertEqual(response.status, 201, 'Should create appointment successfully');
        test.assertEqual(response.body.appointment.timeScheduled, TEST_TIME_SLOT_2, 'Should book the requested time slot');
        
        console.log(`✅ Successfully booked different time slot ${TEST_TIME_SLOT_2}`);
      });

      test.it('should maintain backward compatibility without time slots', async () => {
        const appointmentData = {
          symptoms: 'Backward compatibility test',
          priorityLevel: 'low'
          // No dateScheduled or timeScheduled
        };

        const response = await makeRequest(
          `${API_BASE_URL}/api/appointments`,
          'POST',
          appointmentData,
          { Authorization: `Bearer ${authHelper.tokens.student}` }
        );

        test.assertEqual(response.status, 201, 'Should create appointment without time slot');
        test.assertExists(response.body.appointment, 'Should return appointment data');
        
        console.log('✅ Backward compatibility maintained - can create appointments without time slots');
      });

    });    // Run the tests
    await test.run();

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runTimeSlotTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runTimeSlotTests };
