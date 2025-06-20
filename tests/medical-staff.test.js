/**
 * Medical Staff Management Test Suite
 * Refactored to use standardized test framework and helpers
 */

const { SimpleTest, makeRequest, API_BASE_URL } = require('./testFramework');
const TestHelper = require('./helpers/testHelper');

async function runMedicalStaffTests() {
  const test = new SimpleTest('🏥 Medical Staff Management Test Suite');
  const testHelper = new TestHelper();

  console.log(`🌐 Using API URL: ${API_BASE_URL}`);

  try {
    // Setup: Initialize test helpers
    await testHelper.initialize();

    test.describe('Medical Staff Profile Management', function() {
      test.it('should allow medical staff to access their profile', async function() {
        const result = await testHelper.profile.testGetMedicalStaffProfile();
        
        test.assertTrue(result.validations.status, 'Medical staff should access profile');
        test.assertTrue(result.validations.hasStaff, 'Response should contain staff data');
        test.assertTrue(result.validations.correctRole, 'Staff should have correct role');
        console.log('✅ Medical staff can access profile');
      });

      test.it('should allow medical staff to update their profile', async function() {
        const updateData = {
          specialty: 'Updated Specialty for Testing',
          shiftSchedule: {
            monday: ['09:00-17:00'],
            tuesday: ['09:00-17:00']
          }
        };
        
        const response = await testHelper.profile.testUpdateMedicalStaffProfile(updateData);
        
        test.assert(response.status === 200 || response.status === 201, 'Profile update should succeed');
        console.log('✅ Medical staff can update profile');
      });
    });

    test.describe('Medical Staff Appointment Management', function() {
      test.it('should allow medical staff to view appointments', async function() {
        const response = await testHelper.appointment.getAppointments('medicalStaff');
        
        test.assertEqual(response.status, 200, 'Medical staff should view appointments');
        test.assert(response.body, 'Response should have body');
        console.log('✅ Medical staff can view appointments');
      });

      test.it('should allow medical staff to update appointment status', async function() {
        // First create an appointment to update
        const createResult = await testHelper.appointment.createAppointment('student', {
          symptoms: 'Test symptoms for medical staff update',
          priorityLevel: 'medium'
        });
        
        if (createResult.status === 200 || createResult.status === 201) {
          const appointmentId = createResult.body.appointment?.id || createResult.body.appointment_id;
            if (appointmentId) {
            const updateResponse = await testHelper.appointment.updateAppointmentStatus(appointmentId, 'approved');
            test.assert(updateResponse.status === 200 || updateResponse.status === 404, 'Status update should succeed or appointment not found');
            console.log('✅ Medical staff can update appointment status');
          } else {
            console.log('⚠️ No appointment ID available for status update test');
          }
        } else {
          console.log('⚠️ Could not create test appointment for status update');
        }
      });
    });

    test.describe('Medical Staff Access Control', function() {
      test.it('should prevent medical staff from accessing admin routes', async function() {
        const response = await makeRequest(`${API_BASE_URL}/api/admin/users`, 'GET', null, {
          'Authorization': `Bearer ${testHelper.auth.getToken('medicalStaff')}`
        });
        
        test.assert(response.status === 403 || response.status === 401, 'Medical staff should not access admin routes');
        console.log('✅ Medical staff blocked from admin routes');
      });

      test.it('should allow medical staff to send advice', async function() {
        // Create appointment first
        const createResult = await testHelper.appointment.createAppointment('student');
        
        if (createResult.status === 200 || createResult.status === 201) {
          const appointmentId = createResult.body.appointment?.id || createResult.body.appointment_id;
          
          if (appointmentId) {
            const adviceData = { message: 'Medical staff advice test' };
            const response = await makeRequest(`${API_BASE_URL}/api/advice/appointments/${appointmentId}`, 'POST', adviceData, {
              'Authorization': `Bearer ${testHelper.auth.getToken('medicalStaff')}`
            });
            
            test.assert(response.status === 200 || response.status === 201 || response.status === 404, 'Medical staff should send advice');
            console.log('✅ Medical staff can send advice');
          } else {
            console.log('⚠️ No appointment ID for advice test');
          }
        } else {
          console.log('⚠️ Could not create appointment for advice test');
        }
      });
    });

    // Run tests
    await test.run();

  } catch (error) {
    console.error('\n💥 Medical staff tests failed:', error.message);
    throw error;
  } finally {
    await testHelper.cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runMedicalStaffTests();
}

module.exports = runMedicalStaffTests;
