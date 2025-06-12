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
  
  try {
    // Setup: Authenticate all users
    await authHelper.authenticateAllUsers();
    console.log('✅ Authentication successful for all roles');
  } catch (error) {
    console.error('❌ Authentication setup failed:', error.message);
    process.exit(1);
  }

  test.describe('Appointment CRUD Operations', function() {
    
    test.it('should create appointment as student', async () => {
      const studentToken = authHelper.getToken('student');
      const appointmentData = {
        medical_staff_id: 2,
        appointment_date: '2024-12-20',
        appointment_time: '10:00:00',
        reason: 'Regular checkup',
        notes: 'Test appointment',
        symptoms: 'Headache and fever',
        priorityLevel: 'medium',
        appointment_id: 2,
        status: 'pending'
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

    test.describe('🏥 Medical Staff Approval/Rejection Workflow', function() {
      
      test.it('should get pending appointments for medical staff review', async function() {
        const response = await request(API_BASE_URL)
          .get('/api/appointments/pending')
          .set('Authorization', `Bearer ${medicalStaffToken}`);
        
        test.assertEqual(response.status, 200, 'Should return 200 for pending appointments');
        test.assertTrue(Array.isArray(response.body.appointments), 'Should return appointments array');
        console.log(`   Found ${response.body.count} pending appointments`);
      });

      test.it('should approve appointment with optional advice', async function() {
        // First create a pending appointment as student
        const appointmentData = {
          symptoms: 'Test symptoms for approval',
          priorityLevel: 'medium'
        };

        const createResponse = await request(API_BASE_URL)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(appointmentData);
        
        test.assertEqual(createResponse.status, 201, 'Should create appointment successfully');
        const appointmentId = createResponse.body.id;

        // Now approve it as medical staff
        const approvalData = {
          dateScheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
          advice: 'Please arrive 15 minutes early for your appointment.'
        };

        const approveResponse = await request(API_BASE_URL)
          .post(`/api/appointments/${appointmentId}/approve`)
          .set('Authorization', `Bearer ${medicalStaffToken}`)
          .send(approvalData);
        
        test.assertEqual(approveResponse.status, 200, 'Should approve appointment successfully');
        test.assertEqual(approveResponse.body.appointment.status, 'approved', 'Status should be approved');
        test.assertProperty(approveResponse.body, 'advice', 'Should include advice if provided');
        
        console.log(`   Approved appointment ${appointmentId} with advice`);
      });

      test.it('should reject appointment with optional advice', async function() {
        // Create another pending appointment
        const appointmentData = {
          symptoms: 'Test symptoms for rejection',
          priorityLevel: 'low'
        };

        const createResponse = await request(API_BASE_URL)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(appointmentData);
        
        const appointmentId = createResponse.body.id;

        // Reject it with advice
        const rejectionData = {
          reason: 'Insufficient symptoms for in-person appointment',
          advice: 'Please try self-care measures first. Contact us if symptoms worsen.'
        };

        const rejectResponse = await request(API_BASE_URL)
          .post(`/api/appointments/${appointmentId}/reject`)
          .set('Authorization', `Bearer ${medicalStaffToken}`)
          .send(rejectionData);
        
        test.assertEqual(rejectResponse.status, 200, 'Should reject appointment successfully');
        test.assertEqual(rejectResponse.body.appointment.status, 'rejected', 'Status should be rejected');
        test.assertProperty(rejectResponse.body, 'advice', 'Should include advice if provided');
        
        console.log(`   Rejected appointment ${appointmentId} with advice`);
      });

      test.it('should prevent non-medical staff from approving appointments', async function() {
        const response = await request(API_BASE_URL)
          .post('/api/appointments/1/approve')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({});
        
        test.assertEqual(response.status, 403, 'Should return 403 for unauthorized access');
      });
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