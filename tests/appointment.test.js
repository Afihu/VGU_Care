/**
 * Appointment Management Test Suite
 * Tests appointment-specific functionality with shared authentication
 */

const { SimpleTest, ApiTestUtils, API_BASE_URL } = require('./testFramework');
const AuthHelper = require('./authHelper');

async function runAppointmentTests() {
  const test = new SimpleTest('Appointment Management');
  const authHelper = new AuthHelper();
  
  let testAppointmentId;

  console.log(`🌐 Using API URL: ${API_BASE_URL}`);
  
  // Setup: Authenticate all users
  await authHelper.authenticateAllUsers();

  test.describe('Appointment CRUD Operations', function() {
    
    test.it('should create appointment as student', async () => {
      const studentToken = authHelper.getToken('student');
      const appointmentData = {
        medical_staff_id: 2,
        appointment_date: '2024-12-20',
        appointment_time: '10:00:00',
        reason: 'Regular checkup',
        notes: 'Test appointment'
      };

      const response = await ApiTestUtils.testAuthenticatedRequest(
        studentToken, 
        '/api/appointments', 
        'POST', 
        appointmentData, 
        201
      );

      testAppointmentId = response.body.appointment_id;
      ApiTestUtils.validateResponseStructure(response, ['appointment_id', 'status']);
    });

    test.it('should get appointments as student', async () => {
      const studentToken = authHelper.getToken('student');
      const response = await ApiTestUtils.testAuthenticatedRequest(
        studentToken, 
        '/api/appointments', 
        'GET', 
        null, 
        200
      );

      if (!Array.isArray(response.body)) {
        throw new Error('Appointments response should be an array');
      }
    });

    test.it('should get appointments as medical staff', async () => {
      const medicalToken = authHelper.getToken('medicalStaff');
      const response = await ApiTestUtils.testAuthenticatedRequest(
        medicalToken, 
        '/api/appointments', 
        'GET', 
        null, 
        200
      );

      if (!Array.isArray(response.body)) {
        throw new Error('Appointments response should be an array');
      }
    });

    test.it('should update appointment status as medical staff', async () => {
      if (!testAppointmentId) {
        throw new Error('No test appointment available for update');
      }

      const medicalToken = authHelper.getToken('medicalStaff');
      const updateData = {
        status: 'confirmed',
        notes: 'Appointment confirmed by medical staff'
      };

      await ApiTestUtils.testAuthenticatedRequest(
        medicalToken, 
        `/api/appointments/${testAppointmentId}`, 
        'PUT', 
        updateData, 
        200
      );
    });

    test.it('should get specific appointment details', async () => {
      if (!testAppointmentId) {
        throw new Error('No test appointment available');
      }

      const studentToken = authHelper.getToken('student');
      const response = await ApiTestUtils.testAuthenticatedRequest(
        studentToken, 
        `/api/appointments/${testAppointmentId}`, 
        'GET', 
        null, 
        200
      );

      ApiTestUtils.validateResponseStructure(response, ['appointment_id', 'status', 'appointment_date']);
    });

  });

  test.describe('Appointment Access Control', function() {
    
    test.it('should reject appointment creation without authentication', async () => {
      const appointmentData = {
        medical_staff_id: 2,
        appointment_date: '2024-12-20',
        appointment_time: '10:00:00',
        reason: 'Test appointment'
      };

      await ApiTestUtils.testUnauthorizedAccess('/api/appointments', 'POST', appointmentData);
    });

    test.it('should reject appointment access without authentication', async () => {
      await ApiTestUtils.testUnauthorizedAccess('/api/appointments', 'GET');
    });

  });

  await test.run();
  await authHelper.cleanup();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAppointmentTests().catch(console.error);
}

module.exports = runAppointmentTests;
    
    console.log('✅ Authentication successful for all roles');
  } catch (error) {
    console.error('❌ Authentication setup failed:', error.message);
    process.exit(1);
  }

  // Student Appointment Tests
  test.describe('📋 Student Appointment Management', function() {
    
    test.it('should create a new appointment successfully', async function() {
      const appointmentData = {
        symptoms: 'Headache and fever',
        priorityLevel: 'medium'
      };

      const response = await request(API_BASE_URL)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(appointmentData);
      
      test.assertEqual(response.status, 201, 'Should return 201 for successful creation');
      test.assertProperty(response.body, 'id', 'Response should have id property');
      test.assertEqual(response.body.symptoms, appointmentData.symptoms, 'Symptoms should match');
      test.assertEqual(response.body.priorityLevel, appointmentData.priorityLevel, 'Priority level should match');
      test.assertEqual(response.body.status, 'pending', 'Status should be pending');
      
      testAppointmentId = response.body.id;
      console.log(`   Created appointment with ID: ${testAppointmentId}`);
    });

    test.it('should get all student appointments', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${studentToken}`);
      
      test.assertEqual(response.status, 200, 'Should return 200 for successful fetch');
      test.assertTrue(Array.isArray(response.body), 'Response should be an array');
      console.log(`   Retrieved ${response.body.length} appointments for student`);
    });

    test.it('should get specific appointment by ID', async function() {
      if (!testAppointmentId) {
        throw new Error('No test appointment ID available');
      }

      const response = await request(API_BASE_URL)
        .get(`/api/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      
      test.assertEqual(response.status, 200, 'Should return 200 for successful fetch');
      test.assertEqual(response.body.id, testAppointmentId, 'ID should match');
      test.assertProperty(response.body, 'symptoms', 'Should have symptoms property');
      test.assertProperty(response.body, 'priorityLevel', 'Should have priorityLevel property');
    });

    test.it('should update appointment successfully', async function() {
      if (!testAppointmentId) {
        throw new Error('No test appointment ID available');
      }

      const updateData = {
        symptoms: 'Updated symptoms: severe headache',
        priorityLevel: 'high'
      };

      const response = await request(API_BASE_URL)
        .put(`/api/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData);
      
      test.assertEqual(response.status, 200, 'Should return 200 for successful update');
      test.assertEqual(response.body.symptoms, updateData.symptoms, 'Symptoms should be updated');
      test.assertEqual(response.body.priorityLevel, updateData.priorityLevel, 'Priority level should be updated');
    });

    test.it('should not allow access to other student appointments', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/appointments/999')
        .set('Authorization', `Bearer ${studentToken}`);
      
      test.assertEqual(response.status, 404, 'Should return 404 for non-existent appointment');
    });

    test.it('should validate required fields for appointment creation', async function() {
      // Test missing symptoms
      const response1 = await request(API_BASE_URL)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ priorityLevel: 'medium' });
      
      test.assertEqual(response1.status, 400, 'Should return 400 for missing symptoms');

      // Test missing priority level
      const response2 = await request(API_BASE_URL)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ symptoms: 'Test symptoms' });
      
      test.assertEqual(response2.status, 400, 'Should return 400 for missing priority level');
    });
  });

  // Medical Staff Tests
  test.describe('👨‍⚕️ Medical Staff Appointment Management', function() {
    
    test.it('should get assigned appointments for medical staff', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${medicalStaffToken}`);
      
      test.assertEqual(response.status, 200, 'Should return 200 for successful fetch');
      test.assertTrue(Array.isArray(response.body), 'Response should be an array');
      console.log(`   Retrieved ${response.body.length} assigned appointments for medical staff`);
    });

    test.it('should handle medical staff appointment access properly', async function() {
      if (testAppointmentId) {
        const response = await request(API_BASE_URL)
          .get(`/api/appointments/${testAppointmentId}`)
          .set('Authorization', `Bearer ${medicalStaffToken}`);
        
        // Should either return 200 if assigned or 403 if not assigned
        test.assertIncludes([200, 403], response.status, 'Should return 200 for assigned or 403 for unassigned');
        
        if (response.status === 200) {
          console.log('   Medical staff can view assigned appointment');
        } else {
          console.log('   Medical staff correctly blocked from unassigned appointment');
        }
      }
    });

    test.it('should allow medical staff to create appointments for students', async function() {
      const appointmentData = {
        symptoms: 'Medical staff created appointment',
        priorityLevel: 'low',
        studentUserId: 3 // Assuming student1 has userId 3
      };

      const response = await request(API_BASE_URL)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${medicalStaffToken}`)
        .send(appointmentData);
      
      test.assertEqual(response.status, 201, 'Should return 201 for successful creation');
      test.assertProperty(response.body, 'id', 'Response should have id property');
      test.assertEqual(response.body.symptoms, appointmentData.symptoms, 'Symptoms should match');
    });
  });

  // Admin Tests
  test.describe('👑 Admin Appointment Management', function() {
    
    test.it('should get all appointments for admin', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/admin/appointments')
        .set('Authorization', `Bearer ${adminToken}`);
      
      test.assertEqual(response.status, 200, 'Should return 200 for successful fetch');
      test.assertTrue(Array.isArray(response.body), 'Response should be an array');
      console.log(`   Admin retrieved ${response.body.length} total appointments`);
    });

    test.it('should allow admin to view any appointment', async function() {
      if (testAppointmentId) {
        const response = await request(API_BASE_URL)
          .get(`/api/admin/appointments/${testAppointmentId}`)
          .set('Authorization', `Bearer ${adminToken}`);
        
        test.assertEqual(response.status, 200, 'Should return 200 for admin access');
        test.assertEqual(response.body.id, testAppointmentId, 'ID should match');
      }
    });

    test.it('should allow admin to update any appointment', async function() {
      if (testAppointmentId) {
        const updateData = {
          status: 'completed',
          medicalStaffId: 2
        };

        const response = await request(API_BASE_URL)
          .put(`/api/admin/appointments/${testAppointmentId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData);
        
        test.assertEqual(response.status, 200, 'Should return 200 for successful update');
        test.assertEqual(response.body.status, updateData.status, 'Status should be updated');
      }
    });

    test.it('should allow admin to create appointments', async function() {
      const appointmentData = {
        symptoms: 'Admin created appointment',
        priorityLevel: 'high',
        studentId: 3,
        medicalStaffId: 2
      };

      const response = await request(API_BASE_URL)
        .post('/api/admin/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData);
      
      test.assertEqual(response.status, 201, 'Should return 201 for successful creation');
      test.assertProperty(response.body, 'id', 'Response should have id property');
      test.assertEqual(response.body.symptoms, appointmentData.symptoms, 'Symptoms should match');
    });
  });

  // Access Control Tests
  test.describe('🔒 Access Control Tests', function() {
    
    test.it('should deny access without authentication', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/appointments');
      
      test.assertEqual(response.status, 401, 'Should return 401 for unauthenticated request');
    });

    test.it('should deny student access to admin routes', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/admin/appointments')
        .set('Authorization', `Bearer ${studentToken}`);
      
      test.assertEqual(response.status, 403, 'Should return 403 for unauthorized access');
    });

    test.it('should deny medical staff access to admin routes', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/admin/appointments')
        .set('Authorization', `Bearer ${medicalStaffToken}`);
      
      test.assertEqual(response.status, 403, 'Should return 403 for unauthorized access');
    });

    test.it('should handle invalid appointment IDs gracefully', async function() {
      const response1 = await request(API_BASE_URL)
        .get('/api/appointments/invalid')
        .set('Authorization', `Bearer ${studentToken}`);
      
      test.assertEqual(response1.status, 400, 'Should return 400 for invalid ID format');
      
      const response2 = await request(API_BASE_URL)
        .get('/api/appointments/99999')
        .set('Authorization', `Bearer ${studentToken}`);
      
      test.assertEqual(response2.status, 404, 'Should return 404 for non-existent ID');
    });
  });

  // Data Validation Tests
  test.describe('📊 Data Validation Tests', function() {
    
    test.it('should validate priority levels', async function() {
      const invalidData = {
        symptoms: 'Test symptoms',
        priorityLevel: 'invalid_priority'
      };

      const response = await request(API_BASE_URL)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(invalidData);
      
      test.assertEqual(response.status, 400, 'Should return 400 for invalid priority level');
    });

    test.it('should handle empty symptoms', async function() {
      const invalidData = {
        symptoms: '',
        priorityLevel: 'low'
      };

      const response = await request(API_BASE_URL)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(invalidData);
      
      test.assertEqual(response.status, 400, 'Should return 400 for empty symptoms');
    });

    test.it('should handle very long symptoms appropriately', async function() {
      const longSymptoms = 'a'.repeat(2000); // Very long string
      const data = {
        symptoms: longSymptoms,
        priorityLevel: 'medium'
      };

      const response = await request(API_BASE_URL)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(data);
      
      // Should either accept it or return 400 for too long
      test.assertIncludes([200, 201, 400], response.status, 'Should handle long symptoms appropriately');
    });
  });

  // Run all tests
  await test.run();
  
  console.log('\n🏁 Appointment Management Test Suite completed');
  console.log('📝 Summary:');
  console.log('   - Student appointment CRUD operations tested');
  console.log('   - Medical staff assignment-based access tested');
  console.log('   - Admin full access privileges tested');
  console.log('   - Role-based access control validated');
  console.log('   - Data validation and error handling verified');
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runAppointmentTests().catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  });
}

module.exports = runAppointmentTests;