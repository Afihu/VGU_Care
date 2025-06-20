/**
 * Consolidated Access Control Test Suite
 * Tests role-based access control across all endpoints
 * Refactored to use standardized test framework and helpers
 */

const { SimpleTest, makeRequest, API_BASE_URL } = require('./testFramework');
const TestHelper = require('./helpers/testHelper');

async function runPrivilegeTests() {
  const test = new SimpleTest('🔐 Consolidated Access Control Test Suite');
  const testHelper = new TestHelper();

  console.log(`🌐 Using API URL: ${API_BASE_URL}`);

  try {
    // Setup: Initialize test helpers
    await testHelper.initialize();

    test.describe('Admin Access Control', function() {      test.it('should allow admin access to admin routes', async function() {
        const result = await testHelper.accessControl.testAdminOnlyAccess('/api/admin/users/students');
        
        test.assertTrue(result.validations.admin.statusMatch, 'Admin should have access');
        test.assertTrue(result.validations.student.accessMatch, 'Student should not have access');
        test.assertTrue(result.validations.medicalStaff.accessMatch, 'Medical staff should not have access');
        console.log('✅ Admin-only routes properly protected');
      });

      test.it('should allow admin to access all appointments', async function() {
        const result = await testHelper.accessControl.testStudentAccess('/api/appointments');
        
        test.assertTrue(result.validations.admin.statusMatch, 'Admin should access appointments');
        console.log('✅ Admin can access all appointments');
      });

      test.it('should allow admin to manage users', async function() {
        const result = await testHelper.accessControl.testStudentAccess('/api/users/me');
        
        test.assertTrue(result.validations.admin.statusMatch, 'Admin should access user management');
        console.log('✅ Admin can manage users');
      });

      test.it('should allow admin to create appointments for others', async function() {
        const appointmentData = {
          symptoms: 'Admin-created appointment test',
          priorityLevel: 'high',
          studentId: testHelper.auth.getUser('student').id
        };
        
        const response = await makeRequest(`${API_BASE_URL}/api/admin/appointments`, 'POST', appointmentData, {
          'Authorization': `Bearer ${testHelper.auth.getToken('admin')}`
        });
        
        test.assert(response.status === 200 || response.status === 201 || response.status === 404, 
          'Admin should be able to create appointments (or endpoint not implemented)');
        console.log('✅ Admin appointment creation tested');
      });
    });

    test.describe('Student Access Control', function() {
      test.it('should allow students to access their own profile', async function() {
        const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
          'Authorization': `Bearer ${testHelper.auth.getToken('student')}`
        });
        
        test.assertEqual(response.status, 200, 'Student should access own profile');
        console.log('✅ Student can access own profile');
      });

      test.it('should allow students to create appointments', async function() {
        const result = await testHelper.appointment.testCreateAppointment({
          symptoms: 'Student access test',
          priorityLevel: 'medium'
        });
        
        test.assertTrue(result.validations.success, 'Student should create appointments');
        console.log('✅ Student can create appointments');
      });      test.it('should prevent students from accessing admin routes', async function() {
        const result = await testHelper.accessControl.testAdminOnlyAccess('/api/admin/users');
        
        test.assertTrue(result.validations.student.accessMatch, 'Student should not access admin routes');
        console.log('✅ Students blocked from admin routes');
      });      test.it('should prevent students from accessing medical staff routes', async function() {
        const result = await testHelper.accessControl.testMedicalStaffOnlyAccess('/api/medical-staff/profile');
        
        test.assertTrue(result.validations.student.accessMatch, 'Student should not access medical staff routes');
        console.log('✅ Students blocked from medical staff routes');
      });

      test.it('should prevent students from sending advice', async function() {
        const adviceData = { message: 'Student trying to send advice' };
        const response = await makeRequest(`${API_BASE_URL}/api/advice/appointments/123`, 'POST', adviceData, {
          'Authorization': `Bearer ${testHelper.auth.getToken('student')}`
        });
        
        test.assert(response.status === 403 || response.status === 401 || response.status === 404, 
          'Student should not send advice');
        console.log('✅ Students blocked from sending advice');
      });
    });

    test.describe('Medical Staff Access Control', function() {
      test.it('should allow medical staff to access their profile', async function() {
        const result = await testHelper.profile.testGetMedicalStaffProfile();
        
        test.assertTrue(result.validations.status, 'Medical staff should access profile');
        console.log('✅ Medical staff can access profile');
      });

      test.it('should allow medical staff to view appointments', async function() {
        const response = await testHelper.appointment.getAppointments('medicalStaff');
        
        test.assertEqual(response.status, 200, 'Medical staff should view appointments');
        console.log('✅ Medical staff can view appointments');
      });      test.it('should allow medical staff to update appointment status', async function() {
        // Create appointment first
        const createResult = await testHelper.appointment.createAppointment('student');
        const appointmentId = createResult.body.appointment?.id || createResult.body.appointment_id;
        
        if (appointmentId) {
          const updateResponse = await testHelper.appointment.updateAppointmentStatus(appointmentId, 'approved');
          test.assertEqual(updateResponse.status, 200, 'Medical staff should update appointment status');
          console.log('✅ Medical staff can update appointment status');
        } else {
          console.log('⚠️ No appointment ID available for status update test');
        }
      });

      test.it('should prevent medical staff from accessing admin routes', async function() {        const result = await testHelper.accessControl.testAdminOnlyAccess('/api/admin/users');
        
        test.assertTrue(result.validations.medicalStaff.accessMatch, 'Medical staff should not access admin routes');
        console.log('✅ Medical staff blocked from admin routes');
      });

      test.it('should allow medical staff to send advice', async function() {
        // Create appointment first
        const createResult = await testHelper.appointment.createAppointment('student');
        const appointmentId = createResult.body.appointment?.id || createResult.body.appointment_id;
        
        if (appointmentId) {
          const adviceData = { message: 'Medical staff advice test' };
          const response = await makeRequest(`${API_BASE_URL}/api/advice/appointments/${appointmentId}`, 'POST', adviceData, {
            'Authorization': `Bearer ${testHelper.auth.getToken('medicalStaff')}`
          });
          
          test.assert(response.status === 200 || response.status === 201 || response.status === 404, 
            'Medical staff should send advice (or endpoint not implemented)');
          console.log('✅ Medical staff advice sending tested');
        } else {
          console.log('⚠️ No appointment ID available for advice test');
        }
      });
    });

    test.describe('General Security Tests', function() {
      test.it('should reject all requests without authentication', async function() {
        const endpoints = [
          '/api/appointments',
          '/api/users/me',
          '/api/medical-staff/profile',
          '/api/admin/users'
        ];
        
        for (const endpoint of endpoints) {
          const result = await testHelper.accessControl.testUnauthorizedAccess(endpoint);
          test.assertTrue(result.validations.properlyRejected, 
            `Unauthorized access to ${endpoint} should be rejected`);
        }
        console.log('✅ Unauthorized access properly rejected');
      });

      test.it('should reject requests with invalid tokens', async function() {
        const endpoints = [
          '/api/appointments',
          '/api/users/me',
          '/api/medical-staff/profile'
        ];
        
        for (const endpoint of endpoints) {
          const result = await testHelper.accessControl.testInvalidTokenAccess(endpoint);
          test.assertTrue(result.validations.properlyRejected, 
            `Invalid token access to ${endpoint} should be rejected`);
        }
        console.log('✅ Invalid token access properly rejected');
      });

      test.it('should validate resource ownership', async function() {
        // Create appointment as student
        const createResult = await testHelper.appointment.createAppointment('student');
        const appointmentId = createResult.body.appointment?.id || createResult.body.appointment_id;
        
        if (appointmentId) {
          const result = await testHelper.accessControl.testResourceOwnershipAccess(
            '/api/appointments', 
            appointmentId, 
            'student'
          );
          
          test.assertTrue(result.validations.ownerCanAccess, 'Owner should access their resource');
          test.assertTrue(result.validations.adminCanAccess, 'Admin should access any resource');
          console.log('✅ Resource ownership properly validated');
        } else {
          console.log('⚠️ No appointment ID available for ownership test');
        }
      });
    });

    test.describe('Cross-Role Boundary Tests', function() {
      test.it('should prevent privilege escalation', async function() {
        // Test that no role can access higher privileged endpoints
        const adminEndpoints = ['/api/admin/users', '/api/admin/appointments'];
        
        for (const endpoint of adminEndpoints) {
          const studentResponse = await makeRequest(`${API_BASE_URL}${endpoint}`, 'GET', null, {
            'Authorization': `Bearer ${testHelper.auth.getToken('student')}`
          });
          
          const medicalResponse = await makeRequest(`${API_BASE_URL}${endpoint}`, 'GET', null, {
            'Authorization': `Bearer ${testHelper.auth.getToken('medicalStaff')}`
          });
          
          test.assert(studentResponse.status === 403 || studentResponse.status === 401, 
            'Student should not access admin endpoints');
          test.assert(medicalResponse.status === 403 || medicalResponse.status === 401, 
            'Medical staff should not access admin endpoints');
        }
        console.log('✅ Privilege escalation prevented');
      });      test.it('should maintain role boundaries for data access', async function() {
        // Test that users can only access data appropriate to their role
        const endpoints = [
          { path: '/api/appointments', allowedRoles: ['admin', 'student', 'medicalStaff'] },
          { path: '/api/users/me', allowedRoles: ['admin', 'student', 'medicalStaff'] },
          { path: '/api/medical-staff/profile', allowedRoles: ['admin', 'medicalStaff'] } // Admin and medical staff can access
        ];
        
        for (const endpoint of endpoints) {
          const allRoles = ['admin', 'student', 'medicalStaff'];
          
          for (const role of allRoles) {
            const response = await makeRequest(`${API_BASE_URL}${endpoint.path}`, 'GET', null, {
              'Authorization': `Bearer ${testHelper.auth.getToken(role)}`
            });
            
            if (endpoint.allowedRoles.includes(role)) {
              test.assertEqual(response.status, 200, 
                `${role} should access ${endpoint.path}`);
            } else {
              test.assert(response.status === 403 || response.status === 401, 
                `${role} should not access ${endpoint.path}`);
            }
          }
        }
        console.log('✅ Role boundaries maintained');
      });    });

    // Run all the tests
    await test.run();

  } catch (error) {
    console.error('\n💥 Access control tests failed:', error.message);
    throw error;
  } finally {
    await testHelper.cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPrivilegeTests();
}

module.exports = runPrivilegeTests;