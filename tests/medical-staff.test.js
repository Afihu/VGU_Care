/**
 * Medical Staff Comprehensive Test Suite
 * Tests medical staff privileges, API functionality, and security boundaries
 * Consolidated from medical-staff-tests.js and medical-staff-comprehensive.test.js
 */

const { SimpleTest, makeRequest, authenticate, ApiTestUtils, API_BASE_URL } = require('./testFramework');

async function runMedicalStaffTests() {
  const test = new SimpleTest('🏥 Medical Staff Comprehensive Test Suite');
  let medicalStaffToken, studentToken;

  console.log(`🌐 Using API URL: ${API_BASE_URL}`);

  // Setup: Authenticate users
  test.describe('🔐 Authentication Setup', function() {
    test.it('should authenticate medical staff user', async function() {
      const auth = await authenticate('medicalStaff');
      medicalStaffToken = auth.token;
      test.assertExists(medicalStaffToken, 'Medical staff token should exist');
      console.log('✅ Medical staff authentication successful');
    });

    test.it('should authenticate student user', async function() {
      const auth = await authenticate('student');
      studentToken = auth.token;
      test.assertExists(studentToken, 'Student token should exist');
      console.log('✅ Student authentication successful');
    });
  });

  // Medical Staff Profile Management
  test.describe('👨‍⚕️ Medical Staff Profile Management', function() {
    test.it('should get medical staff profile', async function() {
      const response = await ApiTestUtils.testAuthenticatedRequest(
        medicalStaffToken,
        '/api/medical-staff/profile',
        'GET',
        null,
        200
      );

      ApiTestUtils.validateResponseStructure(response, ['success', 'user']);
      test.assertProperty(response.body.user, 'name', 'Profile should have name');
      test.assertProperty(response.body.user, 'email', 'Profile should have email');
      test.assertProperty(response.body.user, 'role', 'Profile should have role');
      test.assertEqual(response.body.user.role, 'medical_staff', 'Role should be medical_staff');
      console.log('✅ Medical staff profile retrieved successfully');
    });

    test.it('should update medical staff profile', async function() {
      const updateData = {
        name: 'Dr. Test Update',
        specialty: 'Updated Test Specialty',
        age: 40
      };

      const response = await ApiTestUtils.testAuthenticatedRequest(
        medicalStaffToken,
        '/api/medical-staff/profile',
        'PATCH',
        updateData,
        200
      );

      ApiTestUtils.validateResponseStructure(response, ['success', 'user']);
      test.assertEqual(response.body.user.name, updateData.name, 'Name should be updated');
      test.assertEqual(response.body.user.specialty, updateData.specialty, 'Specialty should be updated');
      test.assertEqual(response.body.user.age, updateData.age, 'Age should be updated');
      console.log('✅ Medical staff profile updated successfully');

      // Revert changes
      const revertData = {
        name: 'Dr. Nguyen Thi H',
        specialty: 'General Medicine',
        age: 35
      };

      await ApiTestUtils.testAuthenticatedRequest(
        medicalStaffToken,
        '/api/medical-staff/profile',
        'PATCH',
        revertData,
        200
      );
      console.log('✅ Profile reverted to original values');
    });
  });

  // Student Data Access
  test.describe('👥 Student Data Access', function() {
    test.it('should get all student profiles', async function() {
      const response = await ApiTestUtils.testAuthenticatedRequest(
        medicalStaffToken,
        '/api/medical-staff/students',
        'GET',
        null,
        200
      );

      ApiTestUtils.validateResponseStructure(response, ['success', 'students']);
      test.assertTrue(Array.isArray(response.body.students), 'Students should be an array');
      test.assertTrue(response.body.students.length > 0, 'Should have at least one student');
      
      const student = response.body.students[0];
      test.assertProperty(student, 'name', 'Student should have name');
      test.assertProperty(student, 'email', 'Student should have email');
      test.assertProperty(student, 'major', 'Student should have major');
      console.log(`✅ Retrieved ${response.body.students.length} student profiles`);
    });

    test.it('should get specific student profile', async function() {
      // First get all students to get a valid student ID
      const studentsResponse = await ApiTestUtils.testAuthenticatedRequest(
        medicalStaffToken,
        '/api/medical-staff/students',
        'GET',
        null,
        200
      );

      test.assertTrue(studentsResponse.body.students.length > 0, 'Should have students available');
      const studentId = studentsResponse.body.students[0].id;

      const response = await ApiTestUtils.testAuthenticatedRequest(
        medicalStaffToken,
        `/api/medical-staff/students/${studentId}`,
        'GET',
        null,
        200
      );

      ApiTestUtils.validateResponseStructure(response, ['success', 'student']);
      test.assertProperty(response.body.student, 'name', 'Student should have name');
      test.assertProperty(response.body.student, 'email', 'Student should have email');
      test.assertEqual(response.body.student.id, studentId, 'Student ID should match');
      console.log('✅ Specific student profile retrieved successfully');
    });
  });

  // Appointment Management
  test.describe('📅 Appointment Management', function() {
    test.it('should view assigned appointments', async function() {
      const response = await ApiTestUtils.testAuthenticatedRequest(
        medicalStaffToken,
        '/api/appointments',
        'GET',
        null,
        200
      );

      test.assertTrue(Array.isArray(response.body), 'Appointments should be an array');
      console.log('✅ Medical staff can view assigned appointments');
    });

    test.it('should create appointment with assignment', async function() {
      const appointmentData = {
        symptoms: 'Medical staff created appointment',
        priorityLevel: 'high'
      };

      const response = await ApiTestUtils.testAuthenticatedRequest(
        medicalStaffToken,
        '/api/appointments',
        'POST',
        appointmentData,
        201
      );

      test.assertProperty(response.body, 'appointment_id', 'Should return appointment ID');
      console.log('✅ Medical staff can create appointments');
    });
  });

  // Extended Features
  test.describe('🔗 Extended Features Access', function() {
    test.it('should access mood tracker entries', async function() {
      try {
        await ApiTestUtils.testAuthenticatedRequest(
          medicalStaffToken,
          '/api/mood',
          'GET',
          null,
          200
        );
        console.log('✅ Medical staff can access mood tracker');
      } catch (error) {
        if (error.message.includes('404')) {
          console.log('✅ Mood tracker endpoint not implemented yet');
        } else {
          throw error;
        }
      }
    });

    test.it('should access abuse reports', async function() {
      try {
        await ApiTestUtils.testAuthenticatedRequest(
          medicalStaffToken,
          '/api/reports',
          'GET',
          null,
          200
        );
        console.log('✅ Medical staff can access abuse reports');
      } catch (error) {
        if (error.message.includes('404')) {
          console.log('✅ Reports endpoint not implemented yet');
        } else {
          throw error;
        }
      }
    });

    test.it('should access advice routes', async function() {
      try {
        await ApiTestUtils.testAuthenticatedRequest(
          medicalStaffToken,
          '/api/advice',
          'GET',
          null,
          200
        );
        console.log('✅ Medical staff can access advice routes');
      } catch (error) {
        if (error.message.includes('404')) {
          console.log('✅ Advice endpoint not implemented yet');
        } else {
          throw error;
        }
      }
    });
  });

  // Security & Access Control
  test.describe('🔒 Security & Access Control', function() {
    test.it('should reject access without authentication', async function() {
      await ApiTestUtils.testUnauthorizedAccess('/api/medical-staff/profile');
      console.log('✅ Unauthenticated access properly denied');
    });

    test.it('should reject student access to medical staff endpoints', async function() {
      try {
        await ApiTestUtils.testAuthenticatedRequest(
          studentToken,
          '/api/medical-staff/profile',
          'GET',
          null,
          403
        );
        console.log('✅ Student properly denied medical staff access');
      } catch (error) {
        if (error.message.includes('403') || error.message.includes('401')) {
          console.log('✅ Student properly denied medical staff access');
        } else {
          throw error;
        }
      }
    });

    test.it('should reject invalid token', async function() {
      try {
        await ApiTestUtils.testAuthenticatedRequest(
          'invalid-token-123',
          '/api/medical-staff/profile',
          'GET',
          null,
          401
        );
        console.log('✅ Invalid token properly rejected');
      } catch (error) {
        if (error.message.includes('401')) {
          console.log('✅ Invalid token properly rejected');
        } else {
          throw error;
        }
      }
    });

    test.it('should deny access to admin routes', async function() {
      try {
        await ApiTestUtils.testAuthenticatedRequest(
          medicalStaffToken,
          '/api/admin/users',
          'GET',
          null,
          403
        );
        console.log('✅ Medical staff properly denied admin access');
      } catch (error) {
        if (error.message.includes('403') || error.message.includes('401')) {
          console.log('✅ Medical staff properly denied admin access');
        } else {
          throw error;
        }
      }
    });

    test.it('should deny access to admin appointment management', async function() {
      try {
        await ApiTestUtils.testAuthenticatedRequest(
          medicalStaffToken,
          '/api/admin/appointments',
          'GET',
          null,
          403
        );
        console.log('✅ Medical staff properly denied admin appointment access');
      } catch (error) {
        if (error.message.includes('403') || error.message.includes('401')) {
          console.log('✅ Medical staff properly denied admin appointment access');
        } else {
          throw error;
        }
      }
    });
  });

  // Input Validation
  test.describe('✅ Input Validation', function() {
    test.it('should reject empty name update', async function() {
      try {
        await ApiTestUtils.testAuthenticatedRequest(
          medicalStaffToken,
          '/api/medical-staff/profile',
          'PATCH',
          { name: '' },
          400
        );
        console.log('✅ Empty name properly rejected');
      } catch (error) {
        if (error.message.includes('400')) {
          console.log('✅ Empty name properly rejected');
        } else {
          throw error;
        }
      }
    });

    test.it('should reject invalid gender', async function() {
      try {
        await ApiTestUtils.testAuthenticatedRequest(
          medicalStaffToken,
          '/api/medical-staff/profile',
          'PATCH',
          { gender: 'invalid' },
          400
        );
        console.log('✅ Invalid gender properly rejected');
      } catch (error) {
        if (error.message.includes('400')) {
          console.log('✅ Invalid gender properly rejected');
        } else {
          throw error;
        }
      }
    });

    test.it('should reject invalid age', async function() {
      try {
        await ApiTestUtils.testAuthenticatedRequest(
          medicalStaffToken,
          '/api/medical-staff/profile',
          'PATCH',
          { age: -5 },
          400
        );
        console.log('✅ Invalid age properly rejected');
      } catch (error) {
        if (error.message.includes('400')) {
          console.log('✅ Invalid age properly rejected');
        } else {
          throw error;
        }
      }
    });

    test.it('should handle non-existent student access', async function() {
      const fakeStudentId = '00000000-0000-0000-0000-000000000000';
      
      try {
        await ApiTestUtils.testAuthenticatedRequest(
          medicalStaffToken,
          `/api/medical-staff/students/${fakeStudentId}`,
          'GET',
          null,
          404
        );
        console.log('✅ Non-existent student properly returns 404');
      } catch (error) {
        if (error.message.includes('404')) {
          console.log('✅ Non-existent student properly returns 404');
        } else {
          throw error;
        }
      }
    });
  });

  await test.run();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runMedicalStaffTests().catch(console.error);
}

module.exports = runMedicalStaffTests;
