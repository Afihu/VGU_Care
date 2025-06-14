/**
 * Appointment Management Test Suite
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
        symptoms: "Headache and fever",
        priorityLevel: "medium",
        medical_staff_id: 2,
        appointment_date: '2024-12-20',
        appointment_time: '10:00:00',
        reason: 'Regular checkup'
      };

      const response = await ApiTestUtils.testAuthenticatedRequest(
        studentToken,
        '/api/appointments',
        'POST',
        appointmentData,
        201
      );

      testAppointmentId = response.body.id;
      ApiTestUtils.validateResponseStructure(response, ['id', 'status']);
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

      if (!response.body.appointments || !Array.isArray(response.body.appointments)) {
        throw new Error('Response should contain appointments array');
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

      if (!response.body.appointments || !Array.isArray(response.body.appointments)) {
        throw new Error('Response should contain appointments array');
      }
    });

    test.it('should update appointment status as medical staff', async () => {
      if (!testAppointmentId) {
        throw new Error('No test appointment available for update');
      }

      const medicalToken = authHelper.getToken('medicalStaff');
      const updateData = {
        status: 'scheduled',
        symptoms: 'Updated symptoms',
        dateScheduled: '2024-12-20T10:00:00.000Z'
      };

      await ApiTestUtils.testAuthenticatedRequest(
        medicalToken,
        `/api/appointments/${testAppointmentId}`,
        'PATCH',
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

      ApiTestUtils.validateResponseStructure(response, [
        'id',
        'status',
        'symptoms',
        'dateScheduled'
      ]);
    });
  });

  test.describe('Appointment Access Control', function() {
    test.it('should reject appointment creation without authentication', async () => {
      await ApiTestUtils.testUnauthorizedAccess('/api/appointments', 'POST');
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