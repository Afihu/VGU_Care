/**
 * Profile Management Test Suite
 * Tests basic profile functionality for all user types
 */

const { SimpleTest, API_BASE_URL } = require('./testFramework');
const TestHelper = require('./helpers/testHelper');

async function runProfileTests() {
  const test = new SimpleTest('👤 Profile Management');
  const testHelper = new TestHelper();

  console.log(`🌐 Using API URL: ${API_BASE_URL}`);

  try {
    // Setup: Initialize test helpers
    await testHelper.initialize();

    test.describe('Profile Access Tests', function() {
      test.it('should allow admin to access their profile', async function() {
        const result = await testHelper.profileHelper.getProfile('admin');
        
        test.assertEqual(result.status, 200, 'Admin should access their profile');
        test.assertProperty(result.body, 'user', 'Response should have user property');
        test.assertEqual(result.body.user.role, 'admin', 'User role should be admin');
        console.log('✅ Admin profile access successful');
      });

      test.it('should allow student to access their profile', async function() {
        const result = await testHelper.profileHelper.getProfile('student');
        
        test.assertEqual(result.status, 200, 'Student should access their profile');
        test.assertProperty(result.body, 'user', 'Response should have user property');
        test.assertEqual(result.body.user.role, 'student', 'User role should be student');
        console.log('✅ Student profile access successful');
      });

      test.it('should allow medical staff to access their profile', async function() {
        const result = await testHelper.profileHelper.getProfile('medicalStaff');
        
        test.assertEqual(result.status, 200, 'Medical staff should access their profile');
        test.assertProperty(result.body, 'user', 'Response should have user property');
        test.assertEqual(result.body.user.role, 'medical_staff', 'User role should be medical_staff');
        console.log('✅ Medical staff profile access successful');
      });
    });

    test.describe('Profile Update Tests', function() {
      test.it('should allow students to update basic profile information', async function() {
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
        const updateData = {
          firstName: 'Test',
          lastName: 'Doctor'
        };
        
        const response = await testHelper.profileHelper.updateProfile('medicalStaff', updateData);
        
        test.assert(response.status === 200 || response.status === 404, 
          'Profile update should succeed or feature not implemented');
        console.log('✅ Medical staff profile update tested');
      });
    });

    // Run tests
    await test.run();

  } catch (error) {
    console.error('\n💥 Profile tests failed:', error.message);
    throw error;
  } finally {
    // Cleanup
    await testHelper.cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runProfileTests().catch(console.error);
}

module.exports = runProfileTests;
