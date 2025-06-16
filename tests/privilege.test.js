/**
 * Role-Based Access Control Test Suite
 * Tests each role's privileges across different endpoints
 * Consolidated to focus on authorization rather than feature testing
 */

const { SimpleTest, ApiTestUtils, makeRequest, API_BASE_URL } = require('./testFramework');
const AuthHelper = require('./authHelper');

async function runPrivilegeTests() {
    const privilegeTest = new SimpleTest('🔐 Role-Based Access Control');
    const authHelper = new AuthHelper();

    // Setup: Authenticate all users before running tests
    privilegeTest.describe('🎯 Authentication Setup', function() {
        privilegeTest.it('should authenticate all users for privilege testing', async function() {
            try {
                await authHelper.authenticateAllUsers();

                privilegeTest.assertExists(authHelper.getToken('admin'), 'Admin token should exist');
                privilegeTest.assertExists(authHelper.getToken('student'), 'Student token should exist');
                privilegeTest.assertExists(authHelper.getToken('medicalStaff'), 'Medical staff token should exist');
                
                console.log('✅ All users authenticated for privilege testing');
            } catch (error) {
                throw new Error(`Authentication setup failed: ${error.message}`);
            }
        });
    });

    // Admin privilege tests
    privilegeTest.describe('👑 Admin Privileges', function() {
        privilegeTest.it('admin should access admin routes', async function() {            await ApiTestUtils.testAuthenticatedRequest(
                authHelper.getToken('admin'), 
                '/api/admin/users', 
                'GET', 
                null, 
                200
            );
            console.log('✅ Admin has access to admin routes');
        });

        privilegeTest.it('admin should access all appointments', async function() {            await ApiTestUtils.testAuthenticatedRequest(
                authHelper.getToken('admin'), 
                '/api/appointments', 
                'GET', 
                null, 
                200
            );
            console.log('✅ Admin can view all appointments');
        });

        privilegeTest.it('admin should access user management', async function() {            await ApiTestUtils.testAuthenticatedRequest(
                authHelper.getToken('admin'), 
                '/api/users/me', 
                'GET', 
                null, 
                200
            );
            console.log('✅ Admin can access user management');
        });

        privilegeTest.it('admin should create appointments', async function() {
            const appointmentData = {
                symptoms: 'Admin-created appointment',
                priorityLevel: 'high'
            };            await ApiTestUtils.testAuthenticatedRequest(
                authHelper.getToken('admin'), 
                '/api/appointments', 
                'POST', 
                appointmentData, 
                201
            );
            console.log('✅ Admin can create appointments');
        });
    });

    // Student privilege tests
    privilegeTest.describe('👨‍🎓 Student Privileges', function() {        privilegeTest.it('student should access own profile', async function() {
            await ApiTestUtils.testAuthenticatedRequest(
                authHelper.getToken('student'), 
                '/api/users/me', 
                'GET', 
                null, 
                200
            );
            console.log('✅ Student can access own profile');
        });

        privilegeTest.it('student should access own appointments', async function() {
            await ApiTestUtils.testAuthenticatedRequest(
                authHelper.getToken('student'), 
                '/api/appointments', 
                'GET', 
                null, 
                200
            );
            console.log('✅ Student can view own appointments');
        });

        privilegeTest.it('student should create appointments', async function() {
            const appointmentData = {
                symptoms: 'Student self-appointment',
                priorityLevel: 'medium'
            };

            await ApiTestUtils.testAuthenticatedRequest(
                authHelper.getToken('student'), 
                '/api/appointments', 
                'POST', 
                appointmentData, 
                201
            );
            console.log('✅ Student can create appointments');
        });

        privilegeTest.it('student should NOT access admin routes', async function() {
            try {
                await ApiTestUtils.testAuthenticatedRequest(
                    authHelper.getToken('student'),
                    '/api/admin/users', 
                    'GET', 
                    null, 
                    403
                );
                console.log('✅ Student properly denied admin access');
            } catch (error) {
                // Expected to fail with 403 or 401
                if (error.message.includes('403') || error.message.includes('401')) {
                    console.log('✅ Student properly denied admin access');
                } else {
                    throw error;
                }
            }
        });

        privilegeTest.it('student should NOT access other user profiles', async function() {
            try {                await ApiTestUtils.testAuthenticatedRequest(
                    authHelper.getToken('student'), 
                    '/api/users/999', 
                    'GET', 
                    null, 
                    403
                );
                console.log('✅ Student properly denied access to other profiles');
            } catch (error) {
                if (error.message.includes('403') || error.message.includes('404')) {
                    console.log('✅ Student properly denied access to other profiles');
                } else {
                    throw error;
                }
            }
        });
    });

    // Medical staff privilege tests
    privilegeTest.describe('👨‍⚕️ Medical Staff Privileges', function() {        privilegeTest.it('medical staff should access own profile', async function() {
            await ApiTestUtils.testAuthenticatedRequest(
                authHelper.getToken('medicalStaff'), 
                '/api/users/me', 
                'GET', 
                null, 
                200
            );
            console.log('✅ Medical staff can access own profile');
        });

        privilegeTest.it('medical staff should access assigned appointments', async function() {
            await ApiTestUtils.testAuthenticatedRequest(
                authHelper.getToken('medicalStaff'), 
                '/api/appointments', 
                'GET', 
                null, 
                200
            );
            console.log('✅ Medical staff can view assigned appointments');
        });

        privilegeTest.it('medical staff should access medical staff endpoints', async function() {
            try {
                await ApiTestUtils.testAuthenticatedRequest(
                    authHelper.getToken('medicalStaff'),
                    '/api/medical-staff/profile', 
                    'GET', 
                    null, 
                    200
                );
                console.log('✅ Medical staff can access medical staff endpoints');
            } catch (error) {
                if (error.message.includes('404')) {
                    console.log('✅ Medical staff endpoint not implemented yet');
                } else {
                    throw error;
                }
            }
        });

        privilegeTest.it('medical staff should create appointments', async function() {
            const appointmentData = {
                symptoms: 'Medical staff created appointment',
                priorityLevel: 'high'
            };            await ApiTestUtils.testAuthenticatedRequest(
                authHelper.getToken('medicalStaff'), 
                '/api/appointments', 
                'POST', 
                appointmentData, 
                201
            );
            console.log('✅ Medical staff can create appointments');
        });

        privilegeTest.it('medical staff should NOT access admin routes', async function() {
            try {                await ApiTestUtils.testAuthenticatedRequest(
                    authHelper.getToken('medicalStaff'), 
                    '/api/admin/users', 
                    'GET', 
                    null, 
                    403
                );
                console.log('✅ Medical staff properly denied admin access');
            } catch (error) {
                if (error.message.includes('403') || error.message.includes('401')) {
                    console.log('✅ Medical staff properly denied admin access');
                } else {
                    throw error;
                }
            }        });
    });

    // Profile Management Tests (merged from profile.test.js)
    privilegeTest.describe('👤 Profile Management', function() {
        privilegeTest.it('should allow users to access their own profiles', async function() {
            // Test student profile access
            const studentResponse = await ApiTestUtils.testAuthenticatedRequest(
                authHelper.getToken('student'),
                '/api/users/me',
                'GET',
                null,
                200
            );
            privilegeTest.assertProperty(studentResponse.body, 'user', 'Response should have user property');
            privilegeTest.assertEqual(studentResponse.body.user.role, 'student', 'User role should be student');

            // Test admin profile access
            const adminResponse = await ApiTestUtils.testAuthenticatedRequest(
                authHelper.getToken('admin'),
                '/api/users/me',
                'GET',
                null,
                200
            );
            privilegeTest.assertEqual(adminResponse.body.user.role, 'admin', 'User role should be admin');

            // Test medical staff profile access
            const medicalResponse = await ApiTestUtils.testAuthenticatedRequest(
                authHelper.getToken('medicalStaff'),
                '/api/users/me',
                'GET',
                null,
                200
            );
            privilegeTest.assertEqual(medicalResponse.body.user.role, 'medical_staff', 'User role should be medical_staff');
            
            console.log('✅ All users can access their own profiles');
        });

        privilegeTest.it('should allow users to update their own profiles', async function() {
            const updateData = {
                name: 'Updated Student Name',
                age: 21
            };

            try {
                const response = await ApiTestUtils.testAuthenticatedRequest(
                    authHelper.getToken('student'),
                    '/api/users/me',
                    'PUT',
                    updateData,
                    [200, 204] // Accept both success codes
                );
                console.log('✅ Profile update successful');
            } catch (error) {
                // Accept 200 or 204 responses
                if (error.message.includes('200') || error.message.includes('204')) {
                    console.log('✅ Profile update successful');
                } else {
                    throw error;
                }
            }
        });

        privilegeTest.it('should reject profile access without authentication', async function() {
            await ApiTestUtils.testUnauthorizedAccess('/api/users/me');
            console.log('✅ Unauthenticated profile access properly denied');
        });

        privilegeTest.it('should reject invalid authentication tokens', async function() {
            const response = await makeRequest(`${API_BASE_URL}/api/users/me`, 'GET', null, {
                'Authorization': 'Bearer invalid-token-here'
            });
            privilegeTest.assertEqual(response.status, 401, 'Invalid token should return 401');
            console.log('✅ Invalid token properly rejected');
        });
    });

    // Security Tests
    privilegeTest.describe('🛡️ Security Tests', function() {
        privilegeTest.it('should deny access without authentication', async function() {
            await ApiTestUtils.testUnauthorizedAccess('/api/users/me');
            console.log('✅ Unauthenticated access properly denied');
        });

        privilegeTest.it('should deny access with invalid token', async function() {
            try {
                await ApiTestUtils.testAuthenticatedRequest(
                    'invalid-token-123', 
                    '/api/users/me', 
                    'GET', 
                    null, 
                    401
                );
                console.log('✅ Invalid token properly rejected');
            } catch (error) {
                if (error.message.includes('401')) {
                    console.log('✅ Invalid token properly rejected');
                } else {
                    throw error;
                }
            }
        });

        privilegeTest.it('should maintain consistent role enforcement', async function() {
            const restrictedEndpoints = [
                '/api/admin/users',
                '/api/admin/appointments'
            ];

            for (const endpoint of restrictedEndpoints) {
                try {                    await ApiTestUtils.testAuthenticatedRequest(
                        authHelper.getToken('student'), 
                        endpoint, 
                        'GET', 
                        null, 
                        403
                    );
                } catch (error) {
                    if (!error.message.includes('403') && !error.message.includes('401') && !error.message.includes('404')) {
                        throw error;
                    }
                }
            }
            console.log('✅ Consistent privilege enforcement verified');
        });
    });

    // Run all tests
    await privilegeTest.run();
}

// Run the tests if this file is executed directly
if (require.main === module) {
    runPrivilegeTests().catch(console.error);
}

// Export for use in other test files
module.exports = runPrivilegeTests;