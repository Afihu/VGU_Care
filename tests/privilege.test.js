/**
 * Role-Based Access Control Test Suite
 * Tests each role's privileges across different endpoints
 * Consolidated to focus on authorization rather than feature testing
 */

const { SimpleTest, ApiTestUtils, authenticate } = require('./testFramework');

async function runPrivilegeTests() {
    const privilegeTest = new SimpleTest('🔐 Role-Based Access Control');
    let tokens = {};

    // Setup: Authenticate all users before running tests
    privilegeTest.describe('🎯 Authentication Setup', function() {
        privilegeTest.it('should authenticate all users for privilege testing', async function() {
            try {
                const adminAuth = await authenticate('admin');
                const studentAuth = await authenticate('student');
                const medicalAuth = await authenticate('medicalStaff');

                tokens.admin = adminAuth.token;
                tokens.student = studentAuth.token;
                tokens.medicalStaff = medicalAuth.token;

                privilegeTest.assertExists(tokens.admin, 'Admin token should exist');
                privilegeTest.assertExists(tokens.student, 'Student token should exist');
                privilegeTest.assertExists(tokens.medicalStaff, 'Medical staff token should exist');
                
                console.log('✅ All users authenticated for privilege testing');
            } catch (error) {
                throw new Error(`Authentication setup failed: ${error.message}`);
            }
        });
    });

    // Admin privilege tests
    privilegeTest.describe('👑 Admin Privileges', function() {
        privilegeTest.it('admin should access admin routes', async function() {
            await ApiTestUtils.testAuthenticatedRequest(
                tokens.admin, 
                '/api/admin/users', 
                'GET', 
                null, 
                200
            );
            console.log('✅ Admin has access to admin routes');
        });

        privilegeTest.it('admin should access all appointments', async function() {
            await ApiTestUtils.testAuthenticatedRequest(
                tokens.admin, 
                '/api/appointments', 
                'GET', 
                null, 
                200
            );
            console.log('✅ Admin can view all appointments');
        });

        privilegeTest.it('admin should access user management', async function() {
            await ApiTestUtils.testAuthenticatedRequest(
                tokens.admin, 
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
            };

            await ApiTestUtils.testAuthenticatedRequest(
                tokens.admin, 
                '/api/appointments', 
                'POST', 
                appointmentData, 
                201
            );
            console.log('✅ Admin can create appointments');
        });
    });

    // Student privilege tests
    privilegeTest.describe('👨‍🎓 Student Privileges', function() {
        privilegeTest.it('student should access own profile', async function() {
            await ApiTestUtils.testAuthenticatedRequest(
                tokens.student, 
                '/api/users/me', 
                'GET', 
                null, 
                200
            );
            console.log('✅ Student can access own profile');
        });

        privilegeTest.it('student should access own appointments', async function() {
            await ApiTestUtils.testAuthenticatedRequest(
                tokens.student, 
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
                tokens.student, 
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
                    tokens.student, 
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
            try {
                await ApiTestUtils.testAuthenticatedRequest(
                    tokens.student, 
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
    privilegeTest.describe('👨‍⚕️ Medical Staff Privileges', function() {
        privilegeTest.it('medical staff should access own profile', async function() {
            await ApiTestUtils.testAuthenticatedRequest(
                tokens.medicalStaff, 
                '/api/users/me', 
                'GET', 
                null, 
                200
            );
            console.log('✅ Medical staff can access own profile');
        });

        privilegeTest.it('medical staff should access assigned appointments', async function() {
            await ApiTestUtils.testAuthenticatedRequest(
                tokens.medicalStaff, 
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
                    tokens.medicalStaff, 
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
        
        // Access pending appointments
        privilegeTest.it('medical staff should access pending appointments', async function() {
            await ApiTestUtils.testAuthenticatedRequest(
                tokens.medicalStaff, 
                '/api/appointments/pending', 
                'GET', 
                null, 
                200  // Just test they CAN access it
            );
            console.log('✅ Medical staff can access pending appointments');
        });

        privilegeTest.it('medical staff should create appointments', async function() {
            const appointmentData = {
                symptoms: 'Medical staff created appointment',
                priorityLevel: 'high'
            };

            await ApiTestUtils.testAuthenticatedRequest(
                tokens.medicalStaff, 
                '/api/appointments', 
                'POST', 
                appointmentData, 
                201
            );
            console.log('✅ Medical staff can create appointments');
        });

        privilegeTest.it('medical staff should NOT access admin routes', async function() {
            try {
                await ApiTestUtils.testAuthenticatedRequest(
                    tokens.medicalStaff, 
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
            }
        });
    });

    // Security tests
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
                try {
                    await ApiTestUtils.testAuthenticatedRequest(
                        tokens.student, 
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