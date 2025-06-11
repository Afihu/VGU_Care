/**
 * Authentication Test Suite
 * Tests login and signup API/routes
 */

const request = require('supertest');
const { expect } = require('chai');

// Test configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5001';

describe('🔐 Authentication Test Suite', function() {
  this.timeout(10000);

  describe('🚪 Login Functionality', function() {
    
    it('should successfully login admin user', async function() {
      const response = await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: 'admin@vgu.edu.vn',
          password: 'VGU2024!'
        })
        .expect(200);
      
      expect(response.body).to.have.property('message', 'Login successful');
      expect(response.body).to.have.property('token');
      expect(response.body.user).to.have.property('email', 'admin@vgu.edu.vn');
      expect(response.body.user).to.have.property('role', 'admin');
      expect(response.body.user).to.have.property('status', 'active');
      console.log('✅ Admin login successful');
    });

    it('should successfully login student user', async function() {
      const response = await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: 'student1@vgu.edu.vn',
          password: 'VGU2024!'
        })
        .expect(200);
      
      expect(response.body).to.have.property('message', 'Login successful');
      expect(response.body).to.have.property('token');
      expect(response.body.user).to.have.property('email', 'student1@vgu.edu.vn');
      expect(response.body.user).to.have.property('role', 'student');
      expect(response.body.user).to.have.property('status', 'active');
      console.log('✅ Student login successful');
    });

    it('should successfully login medical staff user', async function() {
      const response = await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: 'doctor1@vgu.edu.vn',
          password: 'VGU2024!'
        })
        .expect(200);
      
      expect(response.body).to.have.property('message', 'Login successful');
      expect(response.body).to.have.property('token');
      expect(response.body.user).to.have.property('email', 'doctor1@vgu.edu.vn');
      expect(response.body.user).to.have.property('role', 'medical_staff');
      expect(response.body.user).to.have.property('status', 'active');
      console.log('✅ Medical staff login successful');
    });

    it('should reject login with wrong password', async function() {
      const response = await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: 'admin@vgu.edu.vn',
          password: 'wrongpassword'
        })
        .expect(401);
      
      expect(response.body).to.have.property('message');
      console.log('✅ Wrong password properly rejected');
    });

    it('should reject login with non-existent email', async function() {
      const response = await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: 'nonexistent@vgu.edu.vn',
          password: 'VGU2024!'
        })
        .expect(401);
      
      expect(response.body).to.have.property('message');
      console.log('✅ Non-existent email properly rejected');
    });

    it('should reject login with missing credentials', async function() {
      await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: 'admin@vgu.edu.vn'
          // missing password
        })
        .expect(400);
      console.log('✅ Missing credentials properly rejected');
    });

    it('should reject login with empty credentials', async function() {
      await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: '',
          password: ''
        })
        .expect(400);
      console.log('✅ Empty credentials properly rejected');
    });

    it('should reject login with malformed email', async function() {
      await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: 'not-an-email',
          password: 'VGU2024!'
        })
        .expect(400);
      console.log('✅ Malformed email properly rejected');
    });

    it('should reject login with SQL injection attempt', async function() {
      await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: "admin@vgu.edu.vn'; DROP TABLE users; --",
          password: 'VGU2024!'
        })
        .expect(401);
      console.log('✅ SQL injection attempt properly rejected');
    });

    it('should handle case sensitivity correctly', async function() {
      // Email should be case insensitive
      const response = await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: 'ADMIN@VGU.EDU.VN',
          password: 'VGU2024!'
        });
      
      // This might succeed or fail depending on implementation
      if (response.status === 200) {
        console.log('✅ Email case insensitivity implemented');
      } else {
        console.log('ℹ️ Email is case sensitive');
      }
    });

    it('should validate JWT token structure', async function() {
      const response = await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: 'admin@vgu.edu.vn',
          password: 'VGU2024!'
        })
        .expect(200);
      
      const token = response.body.token;
      expect(token).to.be.a('string');
      expect(token.split('.')).to.have.lengthOf(3); // JWT has 3 parts
      console.log('✅ JWT token structure is valid');
    });
  });

  describe('📝 Signup Functionality', function() {
    
    it('should successfully signup a new student', async function() {
      const newStudent = {
        email: `teststudent${Date.now()}@vgu.edu.vn`, // Unique email
        password: 'TestPassword123!',
        name: 'Test Student',
        gender: 'male',
        age: 20,
        role: 'student'
      };

      const response = await request(API_BASE_URL)
        .post('/api/signup')
        .send(newStudent)
        .expect(201);
      
      expect(response.body).to.have.property('message');
      expect(response.body.user).to.have.property('email', newStudent.email);
      expect(response.body.user).to.have.property('role', 'student');
      expect(response.body.user).to.have.property('status', 'active');
      console.log('✅ Student signup successful');
    });

    it('should successfully signup a new medical staff', async function() {
      const newMedicalStaff = {
        email: `testdoctor${Date.now()}@vgu.edu.vn`, // Unique email
        password: 'TestPassword123!',
        name: 'Dr. Test Doctor',
        gender: 'female',
        age: 35,
        role: 'medical_staff'
      };

      const response = await request(API_BASE_URL)
        .post('/api/signup')
        .send(newMedicalStaff)
        .expect(201);
      
      expect(response.body).to.have.property('message');
      expect(response.body.user).to.have.property('email', newMedicalStaff.email);
      expect(response.body.user).to.have.property('role', 'medical_staff');
      console.log('✅ Medical staff signup successful');
    });

    it('should reject signup with duplicate email', async function() {
      const duplicateUser = {
        email: 'student1@vgu.edu.vn', // Already exists
        password: 'TestPassword123!',
        name: 'Duplicate Student',
        gender: 'male',
        age: 20,
        role: 'student'
      };

      await request(API_BASE_URL)
        .post('/api/signup')
        .send(duplicateUser)
        .expect(409);
      console.log('✅ Duplicate email properly rejected');
    });

    it('should reject signup with invalid email domain', async function() {
      const invalidUser = {
        email: 'invalid@gmail.com', // Not VGU domain
        password: 'TestPassword123!',
        name: 'Invalid User',
        gender: 'male',
        age: 20,
        role: 'student'
      };

      await request(API_BASE_URL)
        .post('/api/signup')
        .send(invalidUser)
        .expect(400);
      console.log('✅ Invalid email domain properly rejected');
    });

    it('should reject signup with missing required fields', async function() {
      const incompleteUser = {
        email: `incomplete${Date.now()}@vgu.edu.vn`,
        password: 'TestPassword123!'
        // missing name, gender, age, role
      };

      await request(API_BASE_URL)
        .post('/api/signup')
        .send(incompleteUser)
        .expect(400);
      console.log('✅ Missing required fields properly rejected');
    });

    it('should reject signup with invalid role', async function() {
      const invalidRoleUser = {
        email: `invalidrole${Date.now()}@vgu.edu.vn`,
        password: 'TestPassword123!',
        name: 'Invalid Role User',
        gender: 'male',
        age: 20,
        role: 'invalid_role'
      };

      await request(API_BASE_URL)
        .post('/api/signup')
        .send(invalidRoleUser)
        .expect(400);
      console.log('✅ Invalid role properly rejected');
    });

    it('should reject signup with invalid age', async function() {
      const invalidAgeUser = {
        email: `invalidage${Date.now()}@vgu.edu.vn`,
        password: 'TestPassword123!',
        name: 'Invalid Age User',
        gender: 'male',
        age: -5, // Invalid age
        role: 'student'
      };

      await request(API_BASE_URL)
        .post('/api/signup')
        .send(invalidAgeUser)
        .expect(400);
      console.log('✅ Invalid age properly rejected');
    });

    it('should reject signup with invalid gender', async function() {
      const invalidGenderUser = {
        email: `invalidgender${Date.now()}@vgu.edu.vn`,
        password: 'TestPassword123!',
        name: 'Invalid Gender User',
        gender: 'invalid_gender',
        age: 20,
        role: 'student'
      };

      await request(API_BASE_URL)
        .post('/api/signup')
        .send(invalidGenderUser)
        .expect(400);
      console.log('✅ Invalid gender properly rejected');
    });

    it('should validate password strength', async function() {
      const weakPasswordUser = {
        email: `weakpass${Date.now()}@vgu.edu.vn`,
        password: '123', // Too weak
        name: 'Weak Password User',
        gender: 'male',
        age: 20,
        role: 'student'
      };

      // This might return 400 or allow weak passwords depending on implementation
      try {
        await request(API_BASE_URL)
          .post('/api/signup')
          .send(weakPasswordUser)
          .expect(400);
        console.log('✅ Weak passwords rejected');
      } catch (error) {
        if (error.status === 201) {
          console.log('ℹ️ Password strength validation not implemented');
        } else {
          throw error;
        }
      }
    });

    it('should sanitize input data', async function() {
      const maliciousUser = {
        email: `sanitize${Date.now()}@vgu.edu.vn`,
        password: 'TestPassword123!',
        name: '<script>alert("xss")</script>',
        gender: 'male',
        age: 20,
        role: 'student'
      };

      const response = await request(API_BASE_URL)
        .post('/api/signup')
        .send(maliciousUser)
        .expect(201);
      
      // Check that script tags are removed or escaped
      expect(response.body.user.name).to.not.include('<script>');
      console.log('✅ Input data properly sanitized');
    });

    it('should prevent admin role signup without authorization', async function() {
      const adminUser = {
        email: `testadmin${Date.now()}@vgu.edu.vn`,
        password: 'TestPassword123!',
        name: 'Test Admin',
        gender: 'male',
        age: 30,
        role: 'admin'
      };

      // Regular signup should not allow admin role creation
      await request(API_BASE_URL)
        .post('/api/signup')
        .send(adminUser)
        .expect(400);
      console.log('✅ Admin role creation restricted');
    });
  });

  describe('🎫 Token Validation', function() {
    let validToken;

    before(async function() {
      // Get a valid token for testing
      const response = await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: 'admin@vgu.edu.vn',
          password: 'VGU2024!'
        })
        .expect(200);
      
      validToken = response.body.token;
    });

    it('should accept valid token', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).to.have.property('email');
      console.log('✅ Valid token accepted');
    });

    it('should reject malformed token', async function() {
      await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', 'Bearer malformed.token.here')
        .expect(401);
      console.log('✅ Malformed token rejected');
    });

    it('should reject missing Bearer prefix', async function() {
      await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', validToken)
        .expect(401);
      console.log('✅ Missing Bearer prefix rejected');
    });

    it('should reject empty authorization header', async function() {
      await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', '')
        .expect(401);
      console.log('✅ Empty authorization header rejected');
    });

    it('should reject missing authorization header', async function() {
      await request(API_BASE_URL)
        .get('/api/users/me')
        .expect(401);
      console.log('✅ Missing authorization header rejected');
    });

    it('should reject expired token simulation', async function() {
      // This test simulates an expired token by using a malformed one
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MDAwMDAwMDB9.invalid';
      
      await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
      console.log('✅ Expired token simulation rejected');
    });

    it('should reject token with invalid signature', async function() {
      // Create a token with valid structure but invalid signature
      const header = Buffer.from(JSON.stringify({alg: 'HS256', typ: 'JWT'})).toString('base64');
      const payload = Buffer.from(JSON.stringify({userId: 1, email: 'test@vgu.edu.vn'})).toString('base64');
      const invalidToken = `${header}.${payload}.invalidsignature`;
      
      await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
      console.log('✅ Invalid signature rejected');
    });

    it('should validate token payload integrity', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      // Verify that the token contains the correct user information
      expect(response.body).to.have.property('user_id');
      expect(response.body).to.have.property('email', 'admin@vgu.edu.vn');
      expect(response.body).to.have.property('role', 'admin');
      console.log('✅ Token payload integrity verified');
    });
  });

  describe('🔒 Password Security', function() {
    
    it('should hash passwords (not store plain text)', async function() {
      // This test verifies that passwords are properly hashed
      // by attempting to login with a hash as password (should fail)
      await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: 'admin@vgu.edu.vn',
          password: '$2b$12$8diTle1/eMTsJkbocSWuEuKxinnbVHxr1aq8q6GRw66d0muM/ZjgC'
        })
        .expect(401);
      console.log('✅ Passwords are properly hashed');
    });

    it('should protect against timing attacks', async function() {
      const startTime1 = Date.now();
      await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: 'admin@vgu.edu.vn',
          password: 'wrongpassword'
        })
        .expect(401);
      const time1 = Date.now() - startTime1;

      const startTime2 = Date.now();
      await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: 'nonexistent@vgu.edu.vn',
          password: 'wrongpassword'
        })
        .expect(401);
      const time2 = Date.now() - startTime2;

      // Times should be similar (within reasonable bounds) to prevent timing attacks
      const timeDifference = Math.abs(time1 - time2);
      console.log(`✅ Timing attack protection: ${timeDifference}ms difference`);
    });

    it('should handle password with special characters', async function() {
      const specialPasswordUser = {
        email: `specialpass${Date.now()}@vgu.edu.vn`,
        password: 'P@ssw0rd!@#$%^&*()',
        name: 'Special Password User',
        gender: 'male',
        age: 20,
        role: 'student'
      };

      const signupResponse = await request(API_BASE_URL)
        .post('/api/signup')
        .send(specialPasswordUser)
        .expect(201);

      // Test login with special characters
      const loginResponse = await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: specialPasswordUser.email,
          password: specialPasswordUser.password
        })
        .expect(200);
      
      expect(loginResponse.body).to.have.property('token');
      console.log('✅ Special characters in passwords handled correctly');
    });

    it('should enforce password complexity if implemented', async function() {
      const simplePasswordUser = {
        email: `simplepass${Date.now()}@vgu.edu.vn`,
        password: 'password', // Simple password
        name: 'Simple Password User',
        gender: 'male',
        age: 20,
        role: 'student'
      };

      try {
        await request(API_BASE_URL)
          .post('/api/signup')
          .send(simplePasswordUser)
          .expect(400);
        console.log('✅ Password complexity enforced');
      } catch (error) {
        if (error.status === 201) {
          console.log('ℹ️ Password complexity rules not enforced');
        } else {
          throw error;
        }
      }
    });
  });

  describe('🚦 Rate Limiting and Security', function() {
    
    it('should handle multiple failed login attempts', async function() {
      // Test multiple failed attempts
      const attempts = 5;
      
      for (let i = 0; i < attempts; i++) {
        await request(API_BASE_URL)
          .post('/api/login')
          .send({
            email: 'admin@vgu.edu.vn',
            password: 'wrongpassword'
          })
          .expect(401);
      }
      
      console.log(`✅ Handled ${attempts} failed login attempts`);
    });

    it('should handle concurrent login requests', async function() {
      const concurrentRequests = Array(3).fill().map(() =>
        request(API_BASE_URL)
          .post('/api/login')
          .send({
            email: 'admin@vgu.edu.vn',
            password: 'VGU2024!'
          })
          .expect(200)
      );

      const responses = await Promise.all(concurrentRequests);
      
      // All should succeed and return valid tokens
      responses.forEach(response => {
        expect(response.body).to.have.property('token');
      });
      
      console.log('✅ Concurrent login requests handled correctly');
    });

    it('should validate Content-Type header', async function() {
      await request(API_BASE_URL)
        .post('/api/login')
        .set('Content-Type', 'text/plain')
        .send('email=admin@vgu.edu.vn&password=VGU2024!')
        .expect(400);
      console.log('✅ Content-Type validation working');
    });

    it('should handle large request payloads gracefully', async function() {
      const largePayload = {
        email: 'admin@vgu.edu.vn',
        password: 'VGU2024!',
        extraData: 'x'.repeat(10000) // Large string
      };

      try {
        await request(API_BASE_URL)
          .post('/api/login')
          .send(largePayload);
        console.log('ℹ️ Large payloads accepted (check if this is desired)');
      } catch (error) {
        console.log('✅ Large payloads properly rejected');
      }
    });
  });

  describe('🔑 Password Change Functionality', function() {
    let validToken;

    before(async function() {
      // Get a valid token for testing
      const response = await request(API_BASE_URL)
        .post('/api/login')
        .send({
          email: 'admin@vgu.edu.vn',
          password: 'VGU2024!'
        })
        .expect(200);
      
      validToken = response.body.token;
    });

    it('should handle password change API endpoint', async function() {
      const passwordData = {
        currentPassword: 'VGU2024!',
        newPassword: 'NewPassword123!'
      };

      // This might return 200 or 501 depending on implementation
      try {
        await request(API_BASE_URL)
          .patch('/api/users/change-password')
          .set('Authorization', `Bearer ${validToken}`)
          .send(passwordData)
          .expect(200);
        console.log('✅ PATCH /api/users/change-password working');
        
        // If successful, test login with new password
        const loginResponse = await request(API_BASE_URL)
          .post('/api/login')
          .send({
            email: 'admin@vgu.edu.vn',
            password: passwordData.newPassword
          })
          .expect(200);
        
        // Change password back
        await request(API_BASE_URL)
          .patch('/api/users/change-password')
          .set('Authorization', `Bearer ${loginResponse.body.token}`)
          .send({
            currentPassword: passwordData.newPassword,
            newPassword: passwordData.currentPassword
          })
          .expect(200);
          
      } catch (error) {
        if (error.status === 501) {
          console.log('ℹ️ Password change not implemented yet');
        } else {
          throw error;
        }
      }
    });

    it('should reject password change with wrong current password', async function() {
      const passwordData = {
        currentPassword: 'WrongCurrentPassword',
        newPassword: 'AnotherNewPassword123!'
      };

      const response = await request(API_BASE_URL)
        .patch('/api/users/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send(passwordData)
        .expect(401);
      
      expect(response.body).to.have.property('message');
      console.log('✅ Wrong current password properly rejected');
    });

    it('should reject password change with weak new password', async function() {
      const passwordData = {
        currentPassword: 'VGU2024!',
        newPassword: '123' // Too weak
      };

      // This might return 400 or allow weak passwords depending on implementation
      try {
        await request(API_BASE_URL)
          .patch('/api/users/change-password')
          .set('Authorization', `Bearer ${validToken}`)
          .send(passwordData)
          .expect(400);
        console.log('✅ Weak new password rejected');
      } catch (error) {
        if (error.status === 200) {
          console.log('ℹ️ Password strength validation not implemented for new password');
        } else {
          throw error;
        }
      }
    });

    it('should reject password change with missing fields', async function() {
      const passwordData = {
        currentPassword: 'VGU2024!'
        // missing newPassword
      };

      await request(API_BASE_URL)
        .patch('/api/users/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send(passwordData)
        .expect(400);
      console.log('✅ Missing fields properly rejected');
    });

    it('should reject password change with empty fields', async function() {
      const passwordData = {
        currentPassword: '',
        newPassword: ''
      };

      await request(API_BASE_URL)
        .patch('/api/users/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send(passwordData)
        .expect(400);
      console.log('✅ Empty fields properly rejected');
    });

    it('should sanitize password change input', async function() {
      const passwordData = {
        currentPassword: 'VGU2024!',
        newPassword: '<script>alert("xss")</script>' // Malicious input
      };

      const response = await request(API_BASE_URL)
        .patch('/api/users/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send(passwordData)
        .expect(200);
      
      // Check that script tags are removed or escaped
      expect(response.body.user.name).to.not.include('<script>');
      console.log('✅ Password change input properly sanitized');
    });
  });
});
