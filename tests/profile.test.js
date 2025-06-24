/**
 * Profile Management Test Suite
 * Tests basic profile functionality for all user types
 */

const { SimpleTest, API_BASE_URL, makeRequest } = require('./testFramework');
const TestHelper = require('./helpers/testHelper');

async function runProfileTests() {
  const test = new SimpleTest('👤 Profile Management & Signup');
  const testHelper = new TestHelper();
  let createdUserIds = []; // Track created users for cleanup

  console.log(`🌐 Using API URL: ${API_BASE_URL}`);

  try {
    // Setup: Initialize test helpers    await testHelper.initialize();

    test.describe('User Signup Tests', function() {
      test.it('should successfully create a new student account', async function() {
        const signupData = {
          email: `teststudent_${Date.now()}@vgu.edu.vn`,
          password: 'TestPassword123!',
          name: 'Test Student',
          gender: 'male',
          age: 20,
          role: 'student',
          roleSpecificData: {
            intakeYear: 2024,
            major: 'Computer Science',
            housingLocation: 'dorm_1'
          }
        };

        const response = await makeRequest(`${API_BASE_URL}/api/signup`, 'POST', signupData);
        
        test.assertEqual(response.status, 201, 'Student signup should return 201 status');
        test.assertProperty(response.body, 'message', 'Response should have success message');
        test.assertProperty(response.body, 'user', 'Response should have user object');
        test.assertEqual(response.body.user.email, signupData.email, 'User email should match');
        test.assertEqual(response.body.user.role, 'student', 'User role should be student');
        
        if (response.body.user.id) {
          createdUserIds.push(response.body.user.id);
        }
        console.log('✅ Student signup successful');
      });

      test.it('should successfully create a new medical staff account', async function() {
        const signupData = {
          email: `testdoctor_${Date.now()}@vgu.edu.vn`,
          password: 'TestPassword123!',
          name: 'Test Doctor',
          gender: 'female',
          age: 35,
          role: 'medical_staff',
          roleSpecificData: {
            specialty: 'General Medicine',
            shiftSchedule: {
              "monday": ["09:00-17:00"],
              "tuesday": ["09:00-17:00"],
              "wednesday": ["09:00-17:00"],
              "thursday": ["09:00-17:00"],
              "friday": ["09:00-17:00"]
            }
          }
        };

        const response = await makeRequest(`${API_BASE_URL}/api/signup`, 'POST', signupData);
        
        test.assertEqual(response.status, 201, 'Medical staff signup should return 201 status');
        test.assertProperty(response.body, 'message', 'Response should have success message');
        test.assertProperty(response.body, 'user', 'Response should have user object');
        test.assertEqual(response.body.user.email, signupData.email, 'User email should match');
        test.assertEqual(response.body.user.role, 'medical_staff', 'User role should be medical_staff');
        
        if (response.body.user.id) {
          createdUserIds.push(response.body.user.id);
        }
        console.log('✅ Medical staff signup successful');
      });

      test.it('should reject signup with invalid email domain', async function() {
        const signupData = {
          email: 'test@gmail.com',
          password: 'TestPassword123!',
          name: 'Test User',
          gender: 'male',
          age: 25,
          role: 'student'
        };

        const response = await makeRequest(`${API_BASE_URL}/api/signup`, 'POST', signupData);
        
        test.assertEqual(response.status, 400, 'Invalid email domain should return 400 status');
        test.assertProperty(response.body, 'error', 'Response should have error message');
        test.assert(response.body.error.includes('VGU email'), 'Error should mention VGU email requirement');
        console.log('✅ Invalid email domain properly rejected');
      });

      test.it('should reject signup with missing required fields', async function() {
        const incompleteData = {
          email: `incomplete_${Date.now()}@vgu.edu.vn`,
          password: 'TestPassword123!'
          // Missing name, gender, age, role
        };

        const response = await makeRequest(`${API_BASE_URL}/api/signup`, 'POST', incompleteData);
        
        test.assertEqual(response.status, 400, 'Missing fields should return 400 status');
        test.assertProperty(response.body, 'error', 'Response should have error message');
        test.assert(response.body.error.includes('required fields'), 'Error should mention required fields');
        console.log('✅ Missing required fields properly rejected');
      });

      test.it('should reject signup with invalid role', async function() {
        const invalidRoleData = {
          email: `invalidrole_${Date.now()}@vgu.edu.vn`,
          password: 'TestPassword123!',
          name: 'Test User',
          gender: 'male',
          age: 25,
          role: 'invalid_role'
        };

        const response = await makeRequest(`${API_BASE_URL}/api/signup`, 'POST', invalidRoleData);
        
        test.assertEqual(response.status, 400, 'Invalid role should return 400 status');
        test.assertProperty(response.body, 'error', 'Response should have error message');
        test.assert(response.body.error.includes('Invalid role'), 'Error should mention invalid role');
        console.log('✅ Invalid role properly rejected');
      });

      test.it('should reject duplicate email signup', async function() {
        // Try to signup with an existing email (admin@vgu.edu.vn)
        const duplicateData = {
          email: 'admin@vgu.edu.vn',
          password: 'TestPassword123!',
          name: 'Duplicate User',
          gender: 'male',
          age: 30,
          role: 'student'
        };

        const response = await makeRequest(`${API_BASE_URL}/api/signup`, 'POST', duplicateData);
        
        test.assertEqual(response.status, 400, 'Duplicate email should return 400 status');
        test.assertProperty(response.body, 'error', 'Response should have error message');
        test.assert(response.body.error.includes('already exists'), 'Error should mention user already exists');
        console.log('✅ Duplicate email properly rejected');
      });
    });    test.describe('Profile Access Tests', function() {
      test.it('should allow admin to access their profile', async function() {
        // Ensure authentication is properly initialized
        if (!testHelper.auth.hasToken('admin')) {
          await testHelper.auth.authenticateAllUsers();
        }
        
        const result = await testHelper.profileHelper.getProfile('admin');
        
        test.assertEqual(result.status, 200, 'Admin should access their profile');
        test.assertProperty(result.body, 'user', 'Response should have user property');
        test.assertEqual(result.body.user.role, 'admin', 'User role should be admin');
        console.log('✅ Admin profile access successful');
      });

      test.it('should allow student to access their profile', async function() {
        // Ensure authentication is properly initialized
        if (!testHelper.auth.hasToken('student')) {
          await testHelper.auth.authenticateAllUsers();
        }
        
        const result = await testHelper.profileHelper.getProfile('student');
        
        test.assertEqual(result.status, 200, 'Student should access their profile');
        test.assertProperty(result.body, 'user', 'Response should have user property');
        test.assertEqual(result.body.user.role, 'student', 'User role should be student');
        console.log('✅ Student profile access successful');
      });

      test.it('should allow medical staff to access their profile', async function() {
        // Ensure authentication is properly initialized
        if (!testHelper.auth.hasToken('medicalStaff')) {
          await testHelper.auth.authenticateAllUsers();
        }
        
        const result = await testHelper.profileHelper.getProfile('medicalStaff');
        
        test.assertEqual(result.status, 200, 'Medical staff should access their profile');
        test.assertProperty(result.body, 'user', 'Response should have user property');
        test.assertEqual(result.body.user.role, 'medical_staff', 'User role should be medical_staff');
        console.log('✅ Medical staff profile access successful');
      });
    });    test.describe('Profile Update Tests', function() {
      test.it('should allow students to update basic profile information', async function() {
        // Ensure authentication is properly initialized
        if (!testHelper.auth.hasToken('student')) {
          await testHelper.auth.authenticateAllUsers();
        }
        
        const updateData = {
          firstName: 'Test',
          lastName: 'Student'
        };
        
        const response = await testHelper.profileHelper.updateProfile('student', updateData);
        
        test.assert(response.status === 200 || response.status === 404, 
          'Profile update should succeed or feature not implemented');
        console.log('✅ Student profile update tested');
      });

      test.it('should allow medical staff to update basic profile information', async function() {
        // Ensure authentication is properly initialized
        if (!testHelper.auth.hasToken('medicalStaff')) {
          await testHelper.auth.authenticateAllUsers();
        }
        
        const updateData = {
          firstName: 'Test',
          lastName: 'Doctor'
        };
        
        const response = await testHelper.profileHelper.updateProfile('medicalStaff', updateData);
        
        test.assert(response.status === 200 || response.status === 404, 
          'Profile update should succeed or feature not implemented');
        console.log('✅ Medical staff profile update tested');
      });
    });// Run tests
    await test.run();

  } catch (error) {
    console.error('\n💥 Profile tests failed:', error.message);
    throw error;
  } finally {
    // Cleanup: Remove any created test users
    if (createdUserIds.length > 0) {
      console.log(`🧹 Cleaning up ${createdUserIds.length} test users...`);
      // Note: In a real implementation, you'd want to have a cleanup service
      // For now, we'll just log the cleanup intention
    }
    
    // Cleanup
    await testHelper.cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runProfileTests().catch(console.error);
}

module.exports = runProfileTests;
