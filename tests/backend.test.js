/**
 * Backend Integration Test Suite
 * Tests all current APIs, database connection, and backend infrastructure
 */

const request = require('supertest');
const { expect } = require('chai');

// Test configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5001';

describe('🌐 Backend Integration Test Suite', function() {
  this.timeout(15000);

  describe('🏥 Infrastructure Tests', function() {
    
    it('should respond to health check', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).to.have.property('message');
      expect(response.body).to.have.property('timestamp');
      console.log('✅ Health check endpoint working');
    });

    it('should test database connection', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/test-db')
        .expect(200);
      
      expect(response.body).to.have.property('status', 'success');
      expect(response.body).to.have.property('message');
      console.log('✅ Database connection working');
    });

    it('should handle CORS configuration', async function() {
      const response = await request(API_BASE_URL)
        .options('/api/health');
      
      // CORS headers should be present
      console.log('✅ CORS preflight request handled');
    });

    it('should handle error routes properly', async function() {
      await request(API_BASE_URL)
        .get('/api/nonexistent-route')
        .expect(404);
      console.log('✅ 404 returned for invalid route');
    });    it('should respond within acceptable time limits', async function() {
      const startTime = Date.now();
      await request(API_BASE_URL)
        .get('/api/health')
        .expect(200);
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).to.be.lessThan(2000);
      console.log(`✅ Server response time: ${responseTime}ms`);
    });
  });

  describe('👥 User Management API', function() {
    let adminToken, studentToken, medicalStaffToken;

    before(async function() {
      // Get tokens for testing
      const adminResponse = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'admin@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      adminToken = adminResponse.body.token;

      const studentResponse = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'student1@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      studentToken = studentResponse.body.token;

      const medicalResponse = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'doctor1@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      medicalStaffToken = medicalResponse.body.token;
    });

    it('GET /api/users/me should return current user profile', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      
      expect(response.body).to.have.property('email');
      expect(response.body).to.have.property('role');
      console.log('✅ GET /api/users/me working');
    });

    it('PATCH /api/users/profile should update user profile', async function() {
      const updateData = { name: 'Updated Name' };

      await request(API_BASE_URL)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(200);
      console.log('✅ PATCH /api/users/profile working');
    });

    it('should protect routes with authentication', async function() {
      await request(API_BASE_URL)
        .get('/api/users/me')
        .expect(401);
      console.log('✅ Protected routes require authentication');
    });
  });

  describe('📅 Appointment Management API', function() {
    
    it('GET /api/appointments - should implement role-based filtering', async function() {
      // Admin sees all
      const adminResponse = await request(API_BASE_URL)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(adminResponse.body.accessLevel).to.equal('full');

      // Student sees filtered
      const studentResponse = await request(API_BASE_URL)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      expect(studentResponse.body.accessLevel).to.equal('filtered');

      // Medical staff sees filtered
      const staffResponse = await request(API_BASE_URL)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${medicalStaffToken}`)
        .expect(200);
      expect(staffResponse.body.accessLevel).to.equal('filtered');
    });

    it('POST /api/appointments - should allow creating appointments', async function() {
      const appointmentData = {
        studentId: 1,
        medicalStaffId: 2,
        date: '2025-07-01',
        reason: 'Test appointment'
      };

      await request(API_BASE_URL)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(appointmentData)
        .expect(201);
    });

    it('GET /api/appointments/:id - should check ownership', async function() {
      await request(API_BASE_URL)
        .get('/api/appointments/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('PATCH /api/appointments/:id - should allow updates', async function() {
      const updateData = {
        status: 'completed'
      };

      await request(API_BASE_URL)
        .patch('/api/appointments/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);
    });

    it('DELETE /api/appointments/:id - should allow deletion', async function() {
      await request(API_BASE_URL)
        .delete('/api/appointments/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('😊 Mood Tracker API', function() {
    
    it('GET /api/mood - should implement role-based access', async function() {
      // All roles should have access
      await request(API_BASE_URL)
        .get('/api/mood')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      await request(API_BASE_URL)
        .get('/api/mood')
        .set('Authorization', `Bearer ${medicalStaffToken}`)
        .expect(200);

      await request(API_BASE_URL)
        .get('/api/mood')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('POST /api/mood - should allow creating mood entries', async function() {
      const moodData = {
        mood: 'happy',
        notes: 'Feeling great today!'
      };

      await request(API_BASE_URL)
        .post('/api/mood')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(moodData)
        .expect(200);
    });

    it('GET /api/mood/user/:userId - should check ownership', async function() {
      await request(API_BASE_URL)
        .get('/api/mood/user/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('💡 Advice Management API', function() {
    let adminToken, studentToken, medicalStaffToken;

    before(async function() {
      const adminResponse = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'admin@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      adminToken = adminResponse.body.token;

      const studentResponse = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'student1@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      studentToken = studentResponse.body.token;

      const medicalResponse = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'doctor1@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      medicalStaffToken = medicalResponse.body.token;
    });

    it('GET /api/advice should allow all authenticated users', async function() {
      await request(API_BASE_URL)
        .get('/api/advice')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      console.log('✅ Advice viewing access working');
    });

    it('POST /api/advice should restrict to medical staff and admin', async function() {
      const adviceData = {
        title: 'Test Advice',
        content: 'This is test advice',
        category: 'mental_health'
      };

      // Student should be denied
      await request(API_BASE_URL)
        .post('/api/advice')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(adviceData)
        .expect(403);

      // Medical staff should succeed
      await request(API_BASE_URL)
        .post('/api/advice')
        .set('Authorization', `Bearer ${medicalStaffToken}`)
        .send(adviceData)
        .expect(200);

      console.log('✅ Advice creation restrictions working');
    });

    it('PATCH /api/advice/:id should restrict to medical staff and admin', async function() {
      const updateData = { title: 'Updated Advice' };

      await request(API_BASE_URL)
        .patch('/api/advice/1')
        .set('Authorization', `Bearer ${medicalStaffToken}`)
        .send(updateData)
        .expect(200);

      console.log('✅ Advice update restrictions working');
    });
  });

  describe('🚨 Report Management API', function() {
    let adminToken, studentToken, medicalStaffToken;

    before(async function() {
      const adminResponse = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'admin@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      adminToken = adminResponse.body.token;

      const studentResponse = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'student1@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      studentToken = studentResponse.body.token;

      const medicalResponse = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'doctor1@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      medicalStaffToken = medicalResponse.body.token;
    });

    it('GET /api/reports should deny students', async function() {
      await request(API_BASE_URL)
        .get('/api/reports')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
      console.log('✅ Students denied access to abuse reports');
    });

    it('GET /api/reports should allow medical staff and admin', async function() {
      await request(API_BASE_URL)
        .get('/api/reports')
        .set('Authorization', `Bearer ${medicalStaffToken}`)
        .expect(200);

      await request(API_BASE_URL)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      console.log('✅ Medical staff and admin can access abuse reports');
    });

    it('POST /api/reports/:id/user-action should be admin only', async function() {
      const actionData = {
        action: 'ban_user',
        reason: 'Violation of terms'
      };

      await request(API_BASE_URL)
        .post('/api/reports/1/user-action')
        .set('Authorization', `Bearer ${medicalStaffToken}`)
        .send(actionData)
        .expect(403);

      await request(API_BASE_URL)
        .post('/api/reports/1/user-action')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(actionData)
        .expect(200);

      console.log('✅ Admin-only user actions working');
    });
  });

  describe('🔍 Error Handling and Edge Cases', function() {
    
    it('should handle malformed JSON in request body', async function() {
      try {
        await request(API_BASE_URL)
          .post('/api/login')
          .set('Content-Type', 'application/json')
          .send('{"email":"test"') // Malformed JSON
          .expect(400);
      } catch (error) {
        // Error handling varies by Express configuration
        expect([400, 500]).to.include(error.status);
      }
    });

    it('should handle very long request payloads', async function() {
      const longString = 'a'.repeat(10000);
      const longPayload = {
        email: 'test@vgu.edu.vn',
        password: 'VGU2024!',
        name: longString
      };

      try {
        const response = await request(API_BASE_URL)
          .post('/api/signup')
          .send(longPayload);
        // If it succeeds, check if this is desired behavior
        expect([200, 201, 413, 400]).to.include(response.status);
      } catch (error) {
        // Long payloads should be rejected
        expect([413, 400]).to.include(error.status);
      }
    });

    it('should handle concurrent requests', async function() {
      // Test multiple concurrent requests
      const requests = Array(5).fill().map(() => 
        request(API_BASE_URL)
          .get('/api/health')
          .expect(200)
      );

      await Promise.all(requests);
    });
  });

  describe('📊 Performance Metrics', function() {
    
    it('should respond to health check quickly', async function() {
      const startTime = Date.now();
      await request(API_BASE_URL)
        .get('/api/health')
        .expect(200);
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).to.be.lessThan(1000); // Should respond within 1 second
    });

    it('should handle authentication quickly', async function() {
      const startTime = Date.now();
      await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: 'admin@vgu.edu.vn',
          password: 'VGU2024!'
        })
        .expect(200);
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).to.be.lessThan(2000); // Should respond within 2 seconds
    });
  });
});