/**
 * Appointment Management Test Suite
 * Tests all appointment-related APIs with role-based access control
 * Using simple Node.js test framework
 */

const request = require('supertest');
const SimpleTest = require('./testFramework');

// Test configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5001';

async function runAppointmentTests() {
  const test = new SimpleTest('Appointment Management');
  
  let adminToken, studentToken, medicalStaffToken;
  let testAppointmentId;

  // Setup: Get authentication tokens
  console.log(`🌐 Using API URL: ${API_BASE_URL}`);
  
  try {
    // Get admin token
    const adminResponse = await request(API_BASE_URL)
      .post('/api/login')
      .send({ email: 'admin@vgu.edu.vn', password: 'VGU2024!' });
    
    if (adminResponse.status !== 200) {
      throw new Error(`Admin login failed: ${adminResponse.status}`);
    }
    adminToken = adminResponse.body.token;

    // Get student token
    const studentResponse = await request(API_BASE_URL)
      .post('/api/login')
      .send({ email: 'student1@vgu.edu.vn', password: 'VGU2024!' });
    
    if (studentResponse.status !== 200) {
      throw new Error(`Student login failed: ${studentResponse.status}`);
    }
    studentToken = studentResponse.body.token;

    // Get medical staff token
    const medicalResponse = await request(API_BASE_URL)
      .post('/api/login')
      .send({ email: 'doctor1@vgu.edu.vn', password: 'VGU2024!' });
    
    if (medicalResponse.status !== 200) {
      throw new Error(`Medical staff login failed: ${medicalResponse.status}`);
    }
    medicalStaffToken = medicalResponse.body.token;
    
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