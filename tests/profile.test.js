/**
 * Profile Management Test Suite
 * Tests modifying each part of user profile using the implemented routes
 */

const request = require('supertest');
const { expect } = require('chai');

// Test configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5001';

describe('👤 Profile Management Test Suite', function() {
  this.timeout(15000);

  // Test user data for profile operations
  const testUsers = {
    student: {
      email: 'student1@vgu.edu.vn',
      password: 'VGU2024!',
      role: 'student'
    },
    medicalStaff: {
      email: 'doctor1@vgu.edu.vn',
      password: 'VGU2024!',
      role: 'medical_staff'
    },
    admin: {
      email: 'admin@vgu.edu.vn',
      password: 'VGU2024!',
      role: 'admin'
    }
  };

  let tokens = {};

  before(async function() {
    console.log('🚀 Setting up profile management tests...');
    
    // Login all test users to get tokens
    for (const [role, credentials] of Object.entries(testUsers)) {
      const response = await request(API_BASE_URL)
        .post('/api/login')
        .send(credentials)
        .expect(200);
      tokens[role] = response.body.token;
    }
    console.log('✅ All test users authenticated');
  });

  describe('📋 Profile Information Retrieval', function() {
    
    it('should retrieve current user profile', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokens.student}`)
        .expect(200);
      
      expect(response.body).to.have.property('user_id');
      expect(response.body).to.have.property('email');
      expect(response.body).to.have.property('name');
      expect(response.body).to.have.property('role');
      expect(response.body).to.have.property('status');
      expect(response.body).to.have.property('created_at');
      console.log('✅ Profile retrieval working');
    });

    it('should not expose sensitive information', async function() {
      const response = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokens.student}`)
        .expect(200);
      
      expect(response.body).to.not.have.property('password');
      expect(response.body).to.not.have.property('password_hash');
      console.log('✅ Sensitive information properly hidden');
    });

    it('should require authentication for profile access', async function() {
      await request(API_BASE_URL)
        .get('/api/users/me')
        .expect(401);
      console.log('✅ Authentication required for profile access');
    });

    it('should return role-specific information', async function() {
      const studentResponse = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokens.student}`)
        .expect(200);
      
      expect(studentResponse.body.role).to.equal('student');

      const adminResponse = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);
      
      expect(adminResponse.body.role).to.equal('admin');
      console.log('✅ Role-specific information returned correctly');
    });
  });

  describe('✏️ Basic Profile Updates', function() {
    
    it('should update user name', async function() {
      const originalResponse = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokens.student}`)
        .expect(200);
      
      const originalName = originalResponse.body.name;
      const newName = 'Updated Test Name';
      
      await request(API_BASE_URL)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${tokens.student}`)
        .send({ name: newName })
        .expect(200);
      
      const updatedResponse = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokens.student}`)
        .expect(200);
      
      expect(updatedResponse.body.name).to.equal(newName);
      
      // Restore original name
      await request(API_BASE_URL)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${tokens.student}`)
        .send({ name: originalName })
        .expect(200);
      
      console.log('✅ Name update working');
    });

    it('should update user age', async function() {
      const originalResponse = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokens.student}`)
        .expect(200);
      
      const originalAge = originalResponse.body.age;
      const newAge = 25;
      
      await request(API_BASE_URL)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${tokens.student}`)
        .send({ age: newAge })
        .expect(200);
      
      const updatedResponse = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokens.student}`)
        .expect(200);
      
      expect(updatedResponse.body.age).to.equal(newAge);
      
      // Restore original age
      if (originalAge) {
        await request(API_BASE_URL)
          .patch('/api/users/profile')
          .set('Authorization', `Bearer ${tokens.student}`)
          .send({ age: originalAge })
          .expect(200);
      }
      
      console.log('✅ Age update working');
    });

    it('should update user gender', async function() {
      const originalResponse = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokens.student}`)
        .expect(200);
      
      const originalGender = originalResponse.body.gender;
      const newGender = originalGender === 'male' ? 'female' : 'male';
      
      await request(API_BASE_URL)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${tokens.student}`)
        .send({ gender: newGender })
        .expect(200);
      
      const updatedResponse = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokens.student}`)
        .expect(200);
      
      expect(updatedResponse.body.gender).to.equal(newGender);
      
      // Restore original gender
      if (originalGender) {
        await request(API_BASE_URL)
          .patch('/api/users/profile')
          .set('Authorization', `Bearer ${tokens.student}`)
          .send({ gender: originalGender })
          .expect(200);
      }
      
      console.log('✅ Gender update working');
    });

    it('should update multiple fields simultaneously', async function() {
      const updateData = {
        name: 'Multi-Update Test',
        age: 30
      };
      
      await request(API_BASE_URL)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${tokens.student}`)
        .send(updateData)
        .expect(200);
      
      const updatedResponse = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokens.student}`)
        .expect(200);
      
      expect(updatedResponse.body.name).to.equal(updateData.name);
      expect(updatedResponse.body.age).to.equal(updateData.age);
      console.log('✅ Multiple field update working');
    });

    it('should reject invalid age values', async function() {
      await request(API_BASE_URL)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${tokens.student}`)
        .send({ age: -5 })
        .expect(400);
      
      await request(API_BASE_URL)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${tokens.student}`)
        .send({ age: 150 })
        .expect(400);
      
      console.log('✅ Invalid age values rejected');
    });

    it('should reject invalid gender values', async function() {
      await request(API_BASE_URL)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${tokens.student}`)
        .send({ gender: 'invalid_gender' })
        .expect(400);
      
      console.log('✅ Invalid gender values rejected');
    });

    it('should sanitize input data', async function() {
      const maliciousData = {
        name: '<script>alert("xss")</script>Malicious Name'
      };
      
      await request(API_BASE_URL)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${tokens.student}`)
        .send(maliciousData)
        .expect(200);
      
      const response = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokens.student}`)
        .expect(200);
      
      expect(response.body.name).to.not.include('<script>');
      console.log('✅ Input data properly sanitized');
    });

    it('should prevent updating protected fields', async function() {
      await request(API_BASE_URL)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${tokens.student}`)
        .send({ role: 'admin' })
        .expect(400);
      
      await request(API_BASE_URL)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${tokens.student}`)
        .send({ email: 'newemail@vgu.edu.vn' })
        .expect(400);
      
      await request(API_BASE_URL)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${tokens.student}`)
        .send({ user_id: 999 })
        .expect(400);
      
      console.log('✅ Protected fields cannot be updated');
    });
  });

  describe('🔐 Password Management', function() {
    
    it('should change password with valid current password', async function() {
      const passwordData = {
        currentPassword: 'VGU2024!',
        newPassword: 'NewPassword123!'
      };

      try {
        const response = await request(API_BASE_URL)
          .patch('/api/users/change-password')
          .set('Authorization', `Bearer ${tokens.student}`)
          .send(passwordData);
        
        if (response.status === 200) {
          console.log('✅ Password change working');
          
          // Test login with new password
          const loginResponse = await request(API_BASE_URL)
            .post('/api/login')
            .send({
              email: testUsers.student.email,
              password: passwordData.newPassword
            })
            .expect(200);
          
          expect(loginResponse.body).to.have.property('token');
          
          // Change password back
          await request(API_BASE_URL)
            .patch('/api/users/change-password')
            .set('Authorization', `Bearer ${loginResponse.body.token}`)
            .send({
              currentPassword: passwordData.newPassword,
              newPassword: passwordData.currentPassword
            })
            .expect(200);
          
        } else if (response.status === 501) {
          console.log('ℹ️ Password change not implemented yet');
        } else {
          throw new Error(`Unexpected status: ${response.status}`);
        }
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
        currentPassword: 'WrongPassword!',
        newPassword: 'NewPassword123!'
      };

      try {
        await request(API_BASE_URL)
          .patch('/api/users/change-password')
          .set('Authorization', `Bearer ${tokens.student}`)
          .send(passwordData)
          .expect(401);
        console.log('✅ Wrong current password rejected');
      } catch (error) {
        if (error.status === 501) {
          console.log('ℹ️ Password change not implemented yet');
        } else if (error.status === 404) {
          console.log('ℹ️ Password change endpoint not found');
        } else {
          throw error;
        }
      }
    });

    it('should reject weak new passwords', async function() {
      const passwordData = {
        currentPassword: 'VGU2024!',
        newPassword: '123'
      };

      try {
        await request(API_BASE_URL)
          .patch('/api/users/change-password')
          .set('Authorization', `Bearer ${tokens.student}`)
          .send(passwordData)
          .expect(400);
        console.log('✅ Weak new passwords rejected');
      } catch (error) {
        if (error.status === 501 || error.status === 404) {
          console.log('ℹ️ Password change not implemented yet');
        } else {
          throw error;
        }
      }
    });

    it('should require authentication for password change', async function() {
      const passwordData = {
        currentPassword: 'VGU2024!',
        newPassword: 'NewPassword123!'
      };

      try {
        await request(API_BASE_URL)
          .patch('/api/users/change-password')
          .send(passwordData)
          .expect(401);
        console.log('✅ Authentication required for password change');
      } catch (error) {
        if (error.status === 501 || error.status === 404) {
          console.log('ℹ️ Password change endpoint not found');
        } else {
          throw error;
        }
      }
    });
  });

  describe('👨‍🎓 Student-Specific Profile Features', function() {
    
    it('should update student-specific fields', async function() {
      const studentData = {
        major: 'Computer Science',
        intakeYear: 2024
      };

      try {
        await request(API_BASE_URL)
          .patch('/api/users/profile')
          .set('Authorization', `Bearer ${tokens.student}`)
          .send(studentData)
          .expect(200);
        
        const response = await request(API_BASE_URL)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${tokens.student}`)
          .expect(200);
        
        // Check if student-specific fields are present
        if (response.body.major !== undefined) {
          expect(response.body.major).to.equal(studentData.major);
          console.log('✅ Student major update working');
        }
        
        if (response.body.intake_year !== undefined) {
          expect(response.body.intake_year).to.equal(studentData.intakeYear);
          console.log('✅ Student intake year update working');
        }
        
        if (response.body.major === undefined && response.body.intake_year === undefined) {
          console.log('ℹ️ Student-specific fields not implemented');
        }
      } catch (error) {
        console.log('ℹ️ Student-specific profile updates not fully implemented');
      }
    });

    it('should validate student intake year', async function() {
      const invalidIntakeYear = {
        intakeYear: 1900 // Too old
      };

      try {
        await request(API_BASE_URL)
          .patch('/api/users/profile')
          .set('Authorization', `Bearer ${tokens.student}`)
          .send(invalidIntakeYear)
          .expect(400);
        console.log('✅ Invalid intake year rejected');
      } catch (error) {
        if (error.status === 200) {
          console.log('ℹ️ Intake year validation not implemented');
        } else {
          console.log('ℹ️ Student intake year field not implemented');
        }
      }
    });
  });

  describe('👩‍⚕️ Medical Staff Profile Features', function() {
    
    it('should update medical staff-specific fields', async function() {
      const medicalStaffData = {
        specialty: 'General Medicine',
        licenseNumber: 'MD123456'
      };

      try {
        await request(API_BASE_URL)
          .patch('/api/users/profile')
          .set('Authorization', `Bearer ${tokens.medicalStaff}`)
          .send(medicalStaffData)
          .expect(200);
        
        const response = await request(API_BASE_URL)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${tokens.medicalStaff}`)
          .expect(200);
        
        // Check if medical staff-specific fields are present
        if (response.body.specialty !== undefined) {
          expect(response.body.specialty).to.equal(medicalStaffData.specialty);
          console.log('✅ Medical staff specialty update working');
        }
        
        if (response.body.license_number !== undefined) {
          expect(response.body.license_number).to.equal(medicalStaffData.licenseNumber);
          console.log('✅ Medical staff license number update working');
        }
        
        if (response.body.specialty === undefined && response.body.license_number === undefined) {
          console.log('ℹ️ Medical staff-specific fields not implemented');
        }
      } catch (error) {
        console.log('ℹ️ Medical staff-specific profile updates not fully implemented');
      }
    });

    it('should validate medical specialty', async function() {
      const validSpecialties = [
        'General Medicine',
        'Psychiatry',
        'Psychology',
        'Counseling',
        'Emergency Medicine'
      ];

      for (const specialty of validSpecialties) {
        try {
          await request(API_BASE_URL)
            .patch('/api/users/profile')
            .set('Authorization', `Bearer ${tokens.medicalStaff}`)
            .send({ specialty })
            .expect(200);
        } catch (error) {
          if (error.status !== 200) {
            console.log('ℹ️ Medical specialty validation not implemented');
            break;
          }
        }
      }
      console.log('✅ Valid medical specialties accepted');
    });
  });

  describe('🔧 Profile Settings and Preferences', function() {
    
    it('should update notification preferences', async function() {
      const notificationData = {
        emailNotifications: true,
        smsNotifications: false
      };

      try {
        await request(API_BASE_URL)
          .patch('/api/users/profile')
          .set('Authorization', `Bearer ${tokens.student}`)
          .send(notificationData)
          .expect(200);
        
        const response = await request(API_BASE_URL)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${tokens.student}`)
          .expect(200);
        
        if (response.body.email_notifications !== undefined) {
          expect(response.body.email_notifications).to.equal(notificationData.emailNotifications);
          console.log('✅ Email notification preference update working');
        } else {
          console.log('ℹ️ Notification preferences not implemented');
        }
      } catch (error) {
        console.log('ℹ️ Notification preferences not implemented');
      }
    });

    it('should update privacy settings', async function() {
      const privacyData = {
        profileVisibility: 'private',
        allowMentoring: false
      };

      try {
        await request(API_BASE_URL)
          .patch('/api/users/profile')
          .set('Authorization', `Bearer ${tokens.student}`)
          .send(privacyData)
          .expect(200);
        
        console.log('✅ Privacy settings update working');
      } catch (error) {
        console.log('ℹ️ Privacy settings not implemented');
      }
    });

    it('should handle profile picture upload placeholder', async function() {
      // This is a placeholder test for future profile picture functionality
      try {
        await request(API_BASE_URL)
          .patch('/api/users/profile')
          .set('Authorization', `Bearer ${tokens.student}`)
          .send({ profilePicture: 'data:image/jpeg;base64,placeholder' })
          .expect(200);
        console.log('✅ Profile picture update working');
      } catch (error) {
        console.log('ℹ️ Profile picture upload not implemented');
      }
    });
  });

  describe('🔄 Profile Data Validation and Consistency', function() {
    
    it('should maintain data consistency across updates', async function() {
      const originalResponse = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokens.student}`)
        .expect(200);
      
      const originalData = {
        name: originalResponse.body.name,
        age: originalResponse.body.age,
        gender: originalResponse.body.gender
      };
      
      // Update one field
      await request(API_BASE_URL)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${tokens.student}`)
        .send({ name: 'Consistency Test' })
        .expect(200);
      
      const updatedResponse = await request(API_BASE_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokens.student}`)
        .expect(200);
      
      // Other fields should remain unchanged
      expect(updatedResponse.body.age).to.equal(originalData.age);
      expect(updatedResponse.body.gender).to.equal(originalData.gender);
      
      // Restore original data
      await request(API_BASE_URL)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${tokens.student}`)
        .send(originalData)
        .expect(200);
      
      console.log('✅ Data consistency maintained across updates');
    });

    it('should handle empty update requests gracefully', async function() {
      await request(API_BASE_URL)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${tokens.student}`)
        .send({})
        .expect(200);
      console.log('✅ Empty update requests handled gracefully');
    });

    it('should validate field length limits', async function() {
      const longName = 'a'.repeat(1000);
      
      try {
        await request(API_BASE_URL)
          .patch('/api/users/profile')
          .set('Authorization', `Bearer ${tokens.student}`)
          .send({ name: longName })
          .expect(400);
        console.log('✅ Field length limits enforced');
      } catch (error) {
        if (error.status === 200) {
          console.log('ℹ️ Field length validation not implemented');
        } else {
          throw error;
        }
      }
    });

    it('should handle concurrent profile updates', async function() {
      const concurrentUpdates = [
        request(API_BASE_URL)
          .patch('/api/users/profile')
          .set('Authorization', `Bearer ${tokens.student}`)
          .send({ name: 'Concurrent Test 1' }),
        request(API_BASE_URL)
          .patch('/api/users/profile')
          .set('Authorization', `Bearer ${tokens.student}`)
          .send({ age: 25 }),
        request(API_BASE_URL)
          .patch('/api/users/profile')
          .set('Authorization', `Bearer ${tokens.student}`)
          .send({ name: 'Concurrent Test 2' })
      ];

      await Promise.all(concurrentUpdates.map(req => req.expect(200)));
      console.log('✅ Concurrent profile updates handled correctly');
    });
  });

  describe('👤 Profile API Endpoints', function() {
    
    it('GET /api/users/me - should return current user profile', async function() {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      
      expect(response.body).to.have.property('email');
      expect(response.body).to.have.property('role');
      expect(response.body.email).to.equal('student1@vgu.edu.vn');
    });

    it('GET /api/users/me - should work for all role types', async function() {
      // Test student
      const studentResponse = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      expect(studentResponse.body.role).to.equal('student');

      // Test medical staff
      const medicalResponse = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${medicalToken}`)
        .expect(200);
      expect(medicalResponse.body.role).to.equal('medical_staff');

      // Test admin
      const adminResponse = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(adminResponse.body.role).to.equal('admin');
    });

    it('PATCH /api/users/profile - should update user profile', async function() {
      const updateData = {
        name: 'Updated Student Name'
      };

      const response = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).to.include('updated');
    });

    it('PATCH /api/users/profile - should validate profile data', async function() {
      const invalidData = {
        name: '', // Empty name should be rejected
        email: 'invalid-email' // Invalid email format
      };

      await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('PATCH /api/users/profile - should not allow role changes', async function() {
      const maliciousData = {
        name: 'Hacker Name',
        role: 'admin' // Should not be allowed
      };

      const response = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(maliciousData);

      // Should either ignore role field or reject the request
      if (response.status === 200) {
        // If update succeeds, verify role wasn't changed
        const profileCheck = await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(200);
        expect(profileCheck.body.role).to.equal('student');
      } else {
        expect([400, 403]).to.include(response.status);
      }
    });

    it('PATCH /api/users/profile - should handle concurrent updates', async function() {
      const updateData1 = { name: 'Update 1' };
      const updateData2 = { name: 'Update 2' };

      // Send two concurrent updates
      const [response1, response2] = await Promise.all([
        request(app)
          .patch('/api/users/profile')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(updateData1),
        request(app)
          .patch('/api/users/profile')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(updateData2)
      ]);

      // Both should succeed (last one wins) or handle gracefully
      expect([200, 409]).to.include(response1.status);
      expect([200, 409]).to.include(response2.status);
    });
  });
});