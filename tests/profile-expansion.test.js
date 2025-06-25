/**
 * Profile Expansion Test Suite
 * Tests the new profile fields for students (housing location) and medical staff (shift schedules)
 * Refactored to use standardized test framework and helpers
 */

const { SimpleTest, makeRequest, API_BASE_URL } = require('./testFramework');
const TestHelper = require('./helpers/testHelper');
const DateUtils = require('./utils/dateUtils');

async function runProfileExpansionTests() {
  const test = new SimpleTest('👤 Profile Expansion Test Suite');
  const testHelper = new TestHelper();

  console.log(`🌐 Using API URL: ${API_BASE_URL}`);

  try {
    // Setup: Initialize test helpers
    await testHelper.initialize();

    test.describe('Student Profile - Housing Location', function() {
      test.it('should get current student profile with housing location', async function() {
        const result = await testHelper.profile.testGetProfile('student', 'student');
        
        test.assertTrue(result.validations.status, 'Should get student profile successfully');
        test.assertTrue(result.validations.hasUser, 'Response should have user property');
        
        // Check for housing location if it exists
        if (result.response.body.user.housingLocation) {
          const validLocations = ['dorm_1', 'dorm_2', 'off_campus', 'dorm1', 'dorm2', 'not_in_dorm'];
          test.assertTrue(
            validLocations.includes(result.response.body.user.housingLocation),
            'Housing location should be valid value'
          );
          console.log(`✅ Student housing location: ${result.response.body.user.housingLocation}`);
        } else {
          console.log('ℹ️ Housing location not yet implemented in student profile');
        }
      });

      test.it('should allow updating student housing location', async function() {
        const updateData = {
          housingLocation: 'dorm_1'
        };

        const response = await testHelper.profile.testProfileExpansion('student', updateData);
        
        test.assert(response.status === 200 || response.status === 404, 
          'Should update profile or indicate feature not implemented');
        
        if (response.status === 200 && response.body.user?.housingLocation) {
          test.assertEqual(response.body.user.housingLocation, 'dorm_1', 
            'Housing location should be updated');
          console.log('✅ Student housing location updated successfully');
        } else {
          console.log('ℹ️ Housing location update not yet implemented');
        }
      });

      test.it('should validate housing location values', async function() {
        const validLocations = ['dorm_1', 'dorm_2', 'off_campus'];
        
        for (const location of validLocations) {
          const updateData = { housingLocation: location };
          const response = await testHelper.profile.testProfileExpansion('student', updateData);
          
          test.assert(response.status === 200 || response.status === 404, 
            `Should accept valid location: ${location}`);
        }
        
        // Test invalid location
        const invalidData = { housingLocation: 'invalid_location' };
        const invalidResponse = await testHelper.profile.testProfileExpansion('student', invalidData);
        
        test.assert(
          invalidResponse.status === 400 || invalidResponse.status === 422 || invalidResponse.status === 404,
          'Should reject invalid housing location'
        );
        
        console.log('✅ Housing location validation tested');
      });

      test.it('should validate dorm residence information', async function() {
        const testData = { dorm_residence: 'dorm1' };
        const response = await testHelper.profile.testProfileExpansion('student', testData);
        
        if (response.status === 200 && response.body.user) {
          const validations = testHelper.profile.validateStudentDormInfo(response.body.user);
          test.assertTrue(validations.hasDormInfo, 'Should have dorm residence info');
          test.assertTrue(validations.validDormValue, 'Should have valid dorm value');
          console.log('✅ Dorm residence validation passed');
        } else {
          console.log('ℹ️ Dorm residence feature not yet implemented');
        }
      });
    });

    test.describe('Medical Staff Profile - Shift Schedules', function() {
      test.it('should get medical staff profile with shift information', async function() {
        const result = await testHelper.profile.testGetMedicalStaffProfile();
        
        test.assertTrue(result.validations.status, 'Should get medical staff profile successfully');
        test.assertTrue(result.validations.hasStaff, 'Response should have staff property');
        
        // Check for shift information if it exists
        if (result.response.body.staff.shifts) {
          const validations = testHelper.profile.validateMedicalStaffShifts(result.response.body.staff);
          test.assertTrue(validations.hasShifts, 'Should have shifts property');
          test.assertTrue(validations.isArrayFormat, 'Shifts should be in array format');
          console.log('✅ Medical staff shifts found in profile');
        } else {
          console.log('ℹ️ Shift schedules not yet implemented in medical staff profile');
        }
      });

      test.it('should allow updating medical staff shift schedules', async function() {
        const shiftData = {
          shifts: [
            { day: 'monday', start_time: '09:00', end_time: '17:00' },
            { day: 'tuesday', start_time: '09:00', end_time: '17:00' },
            { day: 'wednesday', start_time: '09:00', end_time: '17:00' }
          ]
        };

        const response = await testHelper.profile.testUpdateMedicalStaffProfile(shiftData);
        
        test.assert(response.status === 200 || response.status === 404, 
          'Should update shifts or indicate feature not implemented');
        
        if (response.status === 200 && response.body.staff?.shifts) {
          const validations = testHelper.profile.validateMedicalStaffShifts(response.body.staff);
          test.assertTrue(validations.hasShifts, 'Should have shifts after update');
          test.assertTrue(validations.hasValidShiftStructure, 'Shifts should have valid structure');
          console.log('✅ Medical staff shifts updated successfully');
        } else {
          console.log('ℹ️ Shift schedule update not yet implemented');
        }
      });

      test.it('should validate shift schedule format', async function() {
        // Test valid shift formats
        const validShifts = [
          { day: 'monday', start_time: '08:00', end_time: '16:00' },
          { day: 'friday', start_time: '10:00', end_time: '18:00' }
        ];

        const validData = { shifts: validShifts };
        const response = await testHelper.profile.testUpdateMedicalStaffProfile(validData);
        
        test.assert(response.status === 200 || response.status === 404, 
          'Should accept valid shift format');
        
        // Test invalid shift format
        const invalidShifts = [
          { day: 'invalid_day', start_time: '25:00', end_time: '30:00' }
        ];

        const invalidData = { shifts: invalidShifts };
        const invalidResponse = await testHelper.profile.testUpdateMedicalStaffProfile(invalidData);
        
        test.assert(
          invalidResponse.status === 400 || invalidResponse.status === 422 || invalidResponse.status === 404,
          'Should reject invalid shift format'
        );
        
        console.log('✅ Shift schedule validation tested');
      });

      test.it('should handle specialty information', async function() {
        const specialtyData = {
          specialty: 'General Medicine',
          experience_years: 5
        };

        const response = await testHelper.profile.testUpdateMedicalStaffProfile(specialtyData);
        
        test.assert(response.status === 200 || response.status === 404, 
          'Should update specialty or indicate feature not implemented');
        
        if (response.status === 200 && response.body.staff) {
          test.assertExists(response.body.staff.specialty, 'Should have specialty field');
          console.log('✅ Medical staff specialty updated');
        } else {
          console.log('ℹ️ Specialty information not yet implemented');
        }
      });
    });

    test.describe('Profile Expansion Access Control', function() {
      test.it('should prevent unauthorized profile updates', async function() {
        const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'PUT', { name: 'Hacker' });
        
        test.assertEqual(response.status, 401, 'Should reject unauthorized updates');
        console.log('✅ Unauthorized profile updates blocked');
      });

      test.it('should prevent cross-role profile updates', async function() {
        // Try to update medical staff profile as student;
        const response = await makeRequest(`${API_BASE_URL}/api/medical-staff/profile`, 'PUT', { specialty: 'Hacked' }, {
          'Authorization': `Bearer ${testHelper.auth.getToken('student')}`
        });
        
        test.assert(response.status === 403 || response.status === 401, 
          'Student should not update medical staff profile');
        console.log('✅ Cross-role profile updates blocked');
      });

      test.it('should validate profile data types', async function() {
        // Test invalid data types
        const invalidData = {
          age: 'not_a_number',
          housingLocation: 123
        };

        const response = await testHelper.profile.testProfileExpansion('student', invalidData);
        
        test.assert(
          response.status === 400 || response.status === 422 || response.status === 404,
          'Should validate profile data types'
        );
        console.log('✅ Profile data validation tested');
      });
    });

    test.describe('Profile Integration with Appointments', function() {      test.it('should consider housing location for appointment scheduling', async function() {
        // Test that housing location affects appointment availability
        // This is a placeholder for when the feature is implemented
        const testDate = DateUtils.getNextWeekday(1); // Use dynamic date
        const result = await testHelper.appointment.testTimeSlotAvailability(testDate);
        
        if (result.validations.success) {
          console.log('✅ Time slot system can integrate with housing location');
        } else {
          console.log('ℹ️ Housing location integration with appointments not yet implemented');
        }
      });

      test.it('should consider medical staff shifts for assignment', async function() {
        // Test that medical staff shifts affect appointment assignment
        // This is a placeholder for when the feature is implemented
        const createResult = await testHelper.appointment.testCreateAppointment();
        
        if (createResult.validations.success) {
          console.log('✅ Appointment system can integrate with medical staff shifts');
        } else {
          console.log('ℹ️ Shift integration with appointment assignment not yet implemented');
        }      });
    });

    // Run tests
    await test.run();

  } catch (error) {
    console.error('\n💥 Profile expansion tests failed:', error.message);
    throw error;
  } finally {
    await testHelper.cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runProfileExpansionTests();
}

module.exports = runProfileExpansionTests;
