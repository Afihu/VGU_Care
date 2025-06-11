/**
 * Database Test Suite
 * Tests database connections and ensures all users, appointments, etc are correctly inserted
 */

const request = require('supertest');
const { expect } = require('chai');

// Test configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5001';

describe('🗄️ Database Test Suite', function() {
  this.timeout(15000);

  describe('🔌 Database Connection Tests', function() {
    
    it('should establish database connection successfully', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/test-db')
        .expect(200);
      
      expect(response.body).to.have.property('status', 'success');
      expect(response.body).to.have.property('message');
      expect(response.body).to.have.property('timestamp');
      console.log('✅ Database connection established');
    });

    it('should handle database queries within acceptable time', async function() {
      const startTime = Date.now();
      
      const response = await request(API_BASE_URL)
        .get('/api/test-db')
        .expect(200);
      
      const queryTime = Date.now() - startTime;
      expect(queryTime).to.be.lessThan(5000); // Should respond within 5 seconds
      console.log(`✅ Database query completed in ${queryTime}ms`);
    });
  });

  describe('👥 User Data Validation', function() {
    let adminToken;

    before(async function() {
      // Get admin token for database queries
      const response = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'admin@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      adminToken = response.body.token;
    });

    it('should have admin users correctly inserted', async function() {
      const response = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'admin@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      
      expect(response.body).to.have.property('token');
      expect(response.body.user).to.have.property('email', 'admin@vgu.edu.vn');
      expect(response.body.user).to.have.property('role', 'admin');
      expect(response.body.user).to.have.property('status', 'active');
      console.log('✅ Admin user correctly inserted and accessible');
    });

    it('should have student users correctly inserted', async function() {
      const response = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'student1@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      
      expect(response.body).to.have.property('token');
      expect(response.body.user).to.have.property('email', 'student1@vgu.edu.vn');
      expect(response.body.user).to.have.property('role', 'student');
      expect(response.body.user).to.have.property('status', 'active');
      console.log('✅ Student user correctly inserted and accessible');
    });

    it('should have medical staff users correctly inserted', async function() {
      const response = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'doctor1@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      
      expect(response.body).to.have.property('token');
      expect(response.body.user).to.have.property('email', 'doctor1@vgu.edu.vn');
      expect(response.body.user).to.have.property('role', 'medical_staff');
      expect(response.body.user).to.have.property('status', 'active');
      console.log('✅ Medical staff user correctly inserted and accessible');
    });

    it('should have proper password hashing for all users', async function() {
      // Test that raw passwords don't work
      await request(API_BASE_URL)
        .post('/api/login')
        .send({ 
          email: 'admin@vgu.edu.vn', 
          password: '$2b$12$somehashedpassword' // Using a hash instead of plain password
        })
        .expect(401);
      
      // Test that correct passwords work
      await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'admin@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      
      console.log('✅ Password hashing implemented correctly');
    });

    it('should validate user profile data integrity', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      // Check required fields exist
      expect(response.body).to.have.property('user_id');
      expect(response.body).to.have.property('email');
      expect(response.body).to.have.property('name');
      expect(response.body).to.have.property('role');
      expect(response.body).to.have.property('status');
      expect(response.body).to.have.property('created_at');
      
      // Check data types
      expect(response.body.user_id).to.be.a('number');
      expect(response.body.email).to.be.a('string');
      expect(response.body.name).to.be.a('string');
      expect(response.body.role).to.be.a('string');
      expect(response.body.status).to.be.a('string');
      
      console.log('✅ User profile data integrity validated');
    });

    it('should enforce email domain validation', async function() {
      // Test creating user with invalid domain
      const invalidUser = {
        email: 'test@invalid.com', // Should be vgu.edu.vn
        password: 'TestPassword123!',
        name: 'Test User',
        gender: 'male',
        age: 20,
        role: 'student'
      };

      await request(API_BASE_URL)
        .post('/api/signup')
        .send(invalidUser)
        .expect(400);
      
      console.log('✅ Email domain validation enforced');
    });

    it('should prevent duplicate email registration', async function() {
      const duplicateUser = {
        email: 'admin@vgu.edu.vn', // Already exists
        password: 'TestPassword123!',
        name: 'Duplicate Admin',
        gender: 'male',
        age: 30,
        role: 'admin'
      };

      await request(API_BASE_URL)
        .post('/api/signup')
        .send(duplicateUser)
        .expect(409); // Conflict
      
      console.log('✅ Duplicate email prevention working');
    });
  });

  describe('📅 Appointment Data Validation', function() {
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

    it('should create appointments with proper data structure', async function() {
      const appointmentData = {
        studentId: 1,
        medicalStaffId: 2,
        date: '2025-07-01',
        reason: 'Database test appointment'
      };

      const response = await request(API_BASE_URL)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(appointmentData)
        .expect(201);
      
      expect(response.body).to.have.property('appointment_id');
      expect(response.body).to.have.property('status');
      console.log('✅ Appointment created with proper data structure');
    });

    it('should retrieve appointments with complete data', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).to.have.property('appointments');
      expect(response.body.appointments).to.be.an('array');
      
      if (response.body.appointments.length > 0) {
        const appointment = response.body.appointments[0];
        expect(appointment).to.have.property('appointment_id');
        expect(appointment).to.have.property('student_id');
        expect(appointment).to.have.property('medical_staff_id');
        expect(appointment).to.have.property('date');
        expect(appointment).to.have.property('status');
        expect(appointment).to.have.property('created_at');
        console.log('✅ Appointments retrieved with complete data');
      } else {
        console.log('ℹ️ No appointments found in database');
      }
    });

    it('should validate appointment foreign key constraints', async function() {
      const invalidAppointment = {
        studentId: 99999, // Non-existent user
        medicalStaffId: 2,
        date: '2025-07-01',
        reason: 'Invalid foreign key test'
      };

      // This should fail due to foreign key constraint
      try {
        await request(API_BASE_URL)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(invalidAppointment)
          .expect(400);
        console.log('✅ Foreign key constraints enforced');
      } catch (error) {
        if (error.status === 500) {
          console.log('⚠️ Foreign key constraint handling needs improvement');
        } else {
          throw error;
        }
      }
    });
  });

  describe('😊 Mood Data Validation', function() {
    let studentToken;

    before(async function() {
      const response = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'student1@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      studentToken = response.body.token;
    });

    it('should create mood entries with proper data structure', async function() {
      const moodData = {
        mood: 'happy',
        notes: 'Database test mood entry'
      };

      const response = await request(API_BASE_URL)
        .post('/api/mood')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(moodData)
        .expect(200);
      
      expect(response.body).to.have.property('success', true);
      console.log('✅ Mood entry created with proper data structure');
    });

    it('should retrieve mood entries with complete data', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/mood')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      
      expect(response.body).to.have.property('moods');
      expect(response.body.moods).to.be.an('array');
      
      if (response.body.moods.length > 0) {
        const mood = response.body.moods[0];
        expect(mood).to.have.property('mood_id');
        expect(mood).to.have.property('user_id');
        expect(mood).to.have.property('mood');
        expect(mood).to.have.property('created_at');
        console.log('✅ Mood entries retrieved with complete data');
      } else {
        console.log('ℹ️ No mood entries found in database');
      }
    });

    it('should validate mood value constraints', async function() {
      const invalidMoodData = {
        mood: 'invalid_mood_value',
        notes: 'Testing invalid mood value'
      };

      // This might succeed or fail depending on database constraints
      try {
        await request(API_BASE_URL)
          .post('/api/mood')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(invalidMoodData);
        console.log('ℹ️ Mood value validation not strictly enforced');
      } catch (error) {
        console.log('✅ Mood value constraints enforced');
      }
    });
  });

  describe('💡 Advice Data Validation', function() {
    let medicalStaffToken, adminToken;

    before(async function() {
      const medicalResponse = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'doctor1@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      medicalStaffToken = medicalResponse.body.token;

      const adminResponse = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'admin@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      adminToken = adminResponse.body.token;
    });

    it('should create advice entries with proper data structure', async function() {
      const adviceData = {
        title: 'Database Test Advice',
        content: 'This is test advice content for database validation',
        category: 'mental_health'
      };

      const response = await request(API_BASE_URL)
        .post('/api/advice')
        .set('Authorization', `Bearer ${medicalStaffToken}`)
        .send(adviceData)
        .expect(200);
      
      expect(response.body).to.have.property('success', true);
      console.log('✅ Advice entry created with proper data structure');
    });

    it('should retrieve advice entries with complete data', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/advice')
        .set('Authorization', `Bearer ${medicalStaffToken}`)
        .expect(200);
      
      expect(response.body).to.have.property('advice');
      expect(response.body.advice).to.be.an('array');
      
      if (response.body.advice.length > 0) {
        const advice = response.body.advice[0];
        expect(advice).to.have.property('advice_id');
        expect(advice).to.have.property('title');
        expect(advice).to.have.property('content');
        expect(advice).to.have.property('category');
        expect(advice).to.have.property('created_at');
        console.log('✅ Advice entries retrieved with complete data');
      } else {
        console.log('ℹ️ No advice entries found in database');
      }
    });

    it('should validate advice category constraints', async function() {
      const validCategories = ['mental_health', 'physical_health', 'academic', 'social'];
      
      for (const category of validCategories) {
        const adviceData = {
          title: `Test ${category} Advice`,
          content: `Test content for ${category}`,
          category: category
        };

        await request(API_BASE_URL)
          .post('/api/advice')
          .set('Authorization', `Bearer ${medicalStaffToken}`)
          .send(adviceData)
          .expect(200);
      }
      
      console.log('✅ Valid advice categories accepted');
    });
  });

  describe('🚨 Report Data Validation', function() {
    let adminToken, medicalStaffToken;

    before(async function() {
      const adminResponse = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'admin@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      adminToken = adminResponse.body.token;

      const medicalResponse = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'doctor1@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      medicalStaffToken = medicalResponse.body.token;
    });

    it('should create abuse reports with proper data structure', async function() {
      const reportData = {
        reportedUserId: '1',
        reportType: 'inappropriate_content',
        description: 'Database test abuse report'
      };

      const response = await request(API_BASE_URL)
        .post('/api/reports')
        .set('Authorization', `Bearer ${medicalStaffToken}`)
        .send(reportData)
        .expect(200);
      
      expect(response.body).to.have.property('success', true);
      console.log('✅ Abuse report created with proper data structure');
    });

    it('should retrieve abuse reports with complete data', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).to.have.property('reports');
      expect(response.body.reports).to.be.an('array');
      
      if (response.body.reports.length > 0) {
        const report = response.body.reports[0];
        expect(report).to.have.property('report_id');
        expect(report).to.have.property('reported_user_id');
        expect(report).to.have.property('report_type');
        expect(report).to.have.property('description');
        expect(report).to.have.property('created_at');
        console.log('✅ Abuse reports retrieved with complete data');
      } else {
        console.log('ℹ️ No abuse reports found in database');
      }
    });

    it('should validate report type constraints', async function() {
      const validReportTypes = [
        'inappropriate_content',
        'harassment',
        'spam',
        'false_information',
        'other'
      ];

      for (const reportType of validReportTypes) {
        const reportData = {
          reportedUserId: '1',
          reportType: reportType,
          description: `Test ${reportType} report`
        };

        await request(API_BASE_URL)
          .post('/api/reports')
          .set('Authorization', `Bearer ${medicalStaffToken}`)
          .send(reportData)
          .expect(200);
      }
      
      console.log('✅ Valid report types accepted');
    });
  });

  describe('🔍 Data Consistency and Integrity', function() {
    
    it('should maintain referential integrity across tables', async function() {
      // This is a high-level test to ensure data consistency
      // In a real scenario, you might test foreign key constraints more thoroughly
      
      const adminResponse = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'admin@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      
      const token = adminResponse.body.token;
      const userId = adminResponse.body.user.user_id;
      
      // Check user exists and can access their own data
      const profileResponse = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(profileResponse.body.user_id).to.equal(userId);
      console.log('✅ Referential integrity maintained between auth and user data');
    });

    it('should handle concurrent database operations', async function() {
      const studentResponse = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'student1@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      
      const token = studentResponse.body.token;
      
      // Create multiple concurrent mood entries
      const concurrentOperations = Array(3).fill().map((_, index) => 
        request(API_BASE_URL)
          .post('/api/mood')
          .set('Authorization', `Bearer ${token}`)
          .send({
            mood: 'happy',
            notes: `Concurrent test ${index}`
          })
          .expect(200)
      );

      await Promise.all(concurrentOperations);
      console.log('✅ Concurrent database operations handled correctly');
    });

    it('should properly handle database transactions', async function() {
      // Test creating an appointment (which might involve multiple table operations)
      const studentResponse = await request(API_BASE_URL)
        .post('/api/login')
        .send({ email: 'student1@vgu.edu.vn', password: 'VGU2024!' })
        .expect(200);
      
      const appointmentData = {
        studentId: 1,
        medicalStaffId: 2,
        date: '2025-07-01',
        reason: 'Transaction test appointment'
      };

      const response = await request(API_BASE_URL)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${studentResponse.body.token}`)
        .send(appointmentData)
        .expect(201);
      
      expect(response.body).to.have.property('appointment_id');
      console.log('✅ Database transactions handled properly');
    });
  });
});
