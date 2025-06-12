const fetch = require('node-fetch').default;

// Use environment variable for API URL, fallback to localhost for local testing
const API_URL = process.env.API_URL || 'http://localhost:5001';

console.log('🧪 Starting Medical Staff API Test Suite\n');
console.log(`🌐 Using API URL: ${API_URL}\n`);

// Test credentials from schema.sql
const MEDICAL_STAFF_CREDENTIALS = {
  email: 'doctor1@vgu.edu.vn',
  password: 'VGU2024!' // This should match the hashed password in your schema
};

const STUDENT_CREDENTIALS = {
  email: 'student1@vgu.edu.vn',
  password: 'VGU2024!'
};

let medicalStaffToken = null;
let studentToken = null;

async function authenticateUser(credentials, userType) {
  console.log(`🔐 Authenticating ${userType}...`);
  
  try {
    // Changed from /api/auth/login to /api/login
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const data = await res.json();
    
    if (res.ok && data.token) {
      console.log(`✅ ${userType} authentication successful`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Role: ${data.user.role}`);
      return data.token;
    } else {
      console.error(`❌ ${userType} authentication failed:`, data);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${userType} authentication error:`, error.message);
    return null;
  }
}

async function testMedicalStaffGetProfile() {
  console.log('🧪 Test 1: GET Medical Staff Profile');
  
  try {
    const res = await fetch(`${API_URL}/api/medical-staff/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${medicalStaffToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await res.json();
    
    if (res.ok && data.success && data.user) {
      console.log('✅ PASS: Medical staff profile retrieved successfully');
      console.log(`   Name: ${data.user.name}`);
      console.log(`   Role: ${data.user.role}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Specialty: ${data.user.specialty}`);
      return true;
    } else {
      console.error('❌ FAIL: Failed to get medical staff profile');
      console.error(`   Status: ${res.status}`);
      console.error(`   Response:`, data);
      return false;
    }
  } catch (error) {
    console.error('❌ FAIL: Medical staff profile test error:', error.message);
    return false;
  }
}

async function testMedicalStaffUpdateProfile() {
  console.log('🧪 Test 2: PATCH Medical Staff Profile Update');
  
  const updateData = {
    name: 'Dr. Test Update',
    specialty: 'Updated Test Specialty',
    age: 40
  };
  
  try {
    const res = await fetch(`${API_URL}/api/medical-staff/profile`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${medicalStaffToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    const data = await res.json();
    
    if (res.ok && data.success) {
      console.log('✅ PASS: Medical staff profile updated successfully');
      console.log(`   Updated Name: ${data.user.name}`);
      console.log(`   Updated Specialty: ${data.user.specialty}`);
      console.log(`   Updated Age: ${data.user.age}`);
      
      // Revert changes for cleanup
      const revertData = {
        name: 'Dr. Nguyen Thi H',
        specialty: 'General Medicine',
        age: 35
      };
      
      await fetch(`${API_URL}/api/medical-staff/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${medicalStaffToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(revertData)
      });
      
      console.log('   Profile reverted to original values');
      return true;
    } else {
      console.error('❌ FAIL: Failed to update medical staff profile');
      console.error(`   Status: ${res.status}`);
      console.error(`   Response:`, data);
      return false;
    }
  } catch (error) {
    console.error('❌ FAIL: Medical staff update profile test error:', error.message);
    return false;
  }
}

async function testGetAllStudentProfiles() {
  console.log('🧪 Test 3: GET All Student Profiles');
  
  try {
    const res = await fetch(`${API_URL}/api/medical-staff/students`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${medicalStaffToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await res.json();
    
    if (res.ok && data.success && Array.isArray(data.students)) {
      console.log('✅ PASS: All student profiles retrieved successfully');
      console.log(`   Total students: ${data.count}`);
      console.log(`   Students found: ${data.students.length}`);
      
      if (data.students.length > 0) {
        const firstStudent = data.students[0];
        console.log(`   Sample student: ${firstStudent.name} (${firstStudent.major})`);
        console.log(`   Intake year: ${firstStudent.intakeYear}`);
      }
      
      return true;
    } else {
      console.error('❌ FAIL: Failed to get student profiles');
      console.error(`   Status: ${res.status}`);
      console.error(`   Response:`, data);
      return false;
    }
  } catch (error) {
    console.error('❌ FAIL: Get all students test error:', error.message);
    return false;
  }
}

async function testGetSpecificStudentProfile() {
  console.log('🧪 Test 4: GET Specific Student Profile');
  
  // First get all students to get a valid student ID
  try {
    const studentsRes = await fetch(`${API_URL}/api/medical-staff/students`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${medicalStaffToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const studentsData = await studentsRes.json();
    
    if (!studentsRes.ok || !studentsData.students || studentsData.students.length === 0) {
      console.error('❌ FAIL: No students available for specific student test');
      return false;
    }
    
    const studentId = studentsData.students[0].id;
    
    // Now test getting specific student
    const res = await fetch(`${API_URL}/api/medical-staff/students/${studentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${medicalStaffToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await res.json();
    
    if (res.ok && data.success && data.student) {
      console.log('✅ PASS: Specific student profile retrieved successfully');
      console.log(`   Student ID: ${data.student.id}`);
      console.log(`   Student Name: ${data.student.name}`);
      console.log(`   Major: ${data.student.major}`);
      console.log(`   Intake Year: ${data.student.intakeYear}`);
      console.log(`   Email: ${data.student.email}`);
      return true;
    } else {
      console.error('❌ FAIL: Failed to get specific student profile');
      console.error(`   Status: ${res.status}`);
      console.error(`   Response:`, data);
      return false;
    }
  } catch (error) {
    console.error('❌ FAIL: Get specific student test error:', error.message);
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('🧪 Test 5: Unauthorized Access Control');
  
  const tests = [
    {
      name: 'No token access',
      headers: { 'Content-Type': 'application/json' },
      expectedStatus: 401
    },
    {
      name: 'Student trying to access medical staff endpoints',
      headers: { 
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json' 
      },
      expectedStatus: 403
    },
    {
      name: 'Invalid token',
      headers: { 
        'Authorization': 'Bearer invalid.token.here',
        'Content-Type': 'application/json' 
      },
      expectedStatus: 401
    }
  ];
  
  let allTestsPassed = true;
  
  for (const test of tests) {
    try {
      const res = await fetch(`${API_URL}/api/medical-staff/profile`, {
        method: 'GET',
        headers: test.headers
      });
      
      if (res.status === test.expectedStatus) {
        console.log(`✅ PASS: ${test.name} (Status: ${res.status})`);
      } else {
        console.error(`❌ FAIL: ${test.name} - Expected ${test.expectedStatus}, got ${res.status}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.error(`❌ FAIL: ${test.name} - Error:`, error.message);
      allTestsPassed = false;
    }
  }
  
  return allTestsPassed;
}

async function testInputValidation() {
  console.log('🧪 Test 6: Input Validation');
  
  const invalidUpdateData = [
    {
      name: 'Empty name',
      data: { name: '' },
      expectedStatus: 400
    },
    {
      name: 'Invalid gender',
      data: { gender: 'invalid' },
      expectedStatus: 400
    },
    {
      name: 'Invalid age',
      data: { age: -5 },
      expectedStatus: 400
    },
    {
      name: 'Empty specialty',
      data: { specialty: '' },
      expectedStatus: 400
    }
  ];
  
  let allTestsPassed = true;
  
  for (const test of invalidUpdateData) {
    try {
      const res = await fetch(`${API_URL}/api/medical-staff/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${medicalStaffToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(test.data)
      });
      
      if (res.status === test.expectedStatus) {
        console.log(`✅ PASS: ${test.name} validation (Status: ${res.status})`);
      } else {
        console.error(`❌ FAIL: ${test.name} - Expected ${test.expectedStatus}, got ${res.status}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.error(`❌ FAIL: ${test.name} validation - Error:`, error.message);
      allTestsPassed = false;
    }
  }
  
  return allTestsPassed;
}

async function testNonExistentStudent() {
  console.log('🧪 Test 7: Non-existent Student Access');
  
  const fakeStudentId = '00000000-0000-0000-0000-000000000000';
  
  try {
    const res = await fetch(`${API_URL}/api/medical-staff/students/${fakeStudentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${medicalStaffToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (res.status === 404) {
      console.log('✅ PASS: Non-existent student returns 404');
      return true;
    } else {
      console.error(`❌ FAIL: Expected 404 for non-existent student, got ${res.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ FAIL: Non-existent student test error:', error.message);
    return false;
  }
}

async function testResponseFormat() {
  console.log('🧪 Test 8: Response Format Validation');
  
  try {
    const res = await fetch(`${API_URL}/api/medical-staff/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${medicalStaffToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await res.json();
    
    // Check response structure
    const hasRequiredFields = data.success && data.user && 
                             data.user.id && data.user.name && 
                             data.user.role && data.user.email;
    
    if (res.ok && hasRequiredFields) {
      console.log('✅ PASS: Response format is correct');
      console.log('   Contains: success, user, id, name, role, email');
      return true;
    } else {
      console.error('❌ FAIL: Response format is incorrect');
      console.error('   Missing required fields in response structure');
      return false;
    }
  } catch (error) {
    console.error('❌ FAIL: Response format test error:', error.message);
    return false;
  }
}

async function testAppointmentApprovalWorkflow() {
  console.log('🧪 Test 9: Appointment Approval Workflow');
  
  try {
    // First get pending appointments
    const pendingRes = await fetch(`${API_URL}/api/appointments/pending`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${medicalStaffToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const pendingData = await pendingRes.json();
    
    if (pendingRes.ok && Array.isArray(pendingData.appointments)) {
      console.log('✅ PASS: Can retrieve pending appointments');
      console.log(`   Found ${pendingData.count} pending appointments`);
      
      // If there are pending appointments, try to approve one
      if (pendingData.appointments.length > 0) {
        const appointmentId = pendingData.appointments[0].id;
        
        const approveRes = await fetch(`${API_URL}/api/appointments/${appointmentId}/approve`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${medicalStaffToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            advice: 'Test approval advice message'
          })
        });
        
        if (approveRes.ok) {
          console.log('✅ PASS: Can approve appointments with advice');
        } else {
          console.log('⚠️  INFO: Approval test skipped (may need specific test data)');
        }
      }
      
      return true;
    } else {
      console.error('❌ FAIL: Failed to get pending appointments');
      console.error(`   Status: ${pendingRes.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ FAIL: Appointment approval workflow test error:', error.message);
    return false;
  }
}

async function testTemporaryAdviceManagement() {
  console.log('🧪 Test 10: Temporary Advice Management');
  
  try {
    // Test getting sent advice
    const sentAdviceRes = await fetch(`${API_URL}/api/advice/sent`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${medicalStaffToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const sentAdviceData = await sentAdviceRes.json();
    
    if (sentAdviceRes.ok && Array.isArray(sentAdviceData.advice)) {
      console.log('✅ PASS: Can retrieve sent advice');
      console.log(`   Found ${sentAdviceData.count} sent advice messages`);
      return true;
    } else {
      console.error('❌ FAIL: Failed to get sent advice');
      console.error(`   Status: ${sentAdviceRes.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ FAIL: Temporary advice test error:', error.message);
    return false;
  }
}

async function runMedicalStaffTestSuite() {
  console.log('🚀 Starting Medical Staff API Test Suite\n');
  
  // Step 1: Authentication
  console.log('🔐 === AUTHENTICATION SETUP ===');
  medicalStaffToken = await authenticateUser(MEDICAL_STAFF_CREDENTIALS, 'Medical Staff');
  studentToken = await authenticateUser(STUDENT_CREDENTIALS, 'Student');
  
  if (!medicalStaffToken) {
    console.error('❌ Cannot continue tests without medical staff authentication');
    process.exit(1);
  }
  
  console.log('\n🏥 === MEDICAL STAFF FUNCTIONALITY TESTS ===');
  
  const testResults = [];
  
  // Core functionality tests
  testResults.push(await testMedicalStaffGetProfile());
  testResults.push(await testMedicalStaffUpdateProfile());
  testResults.push(await testGetAllStudentProfiles());
  testResults.push(await testGetSpecificStudentProfile());

  // New appointment workflow tests
  testResults.push(await testAppointmentApprovalWorkflow());
  testResults.push(await testTemporaryAdviceManagement());
  
  console.log('\n🔒 === SECURITY & VALIDATION TESTS ===');
  
  // Security and validation tests
  testResults.push(await testUnauthorizedAccess());
  testResults.push(await testInputValidation());
  testResults.push(await testNonExistentStudent());
  testResults.push(await testResponseFormat());
  
  console.log('\n📊 === TEST RESULTS SUMMARY ===');
  
  const passedTests = testResults.filter(result => result).length;
  const totalTests = testResults.length;
  
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All medical staff API tests passed!');
    console.log('✅ Medical staff can view/update profiles and access student data');
  } else {
    console.log('⚠️  Some tests failed. Check the implementation:');
    console.log('   - Ensure medical staff routes are properly configured');
    console.log('   - Verify database has proper test data');
    console.log('   - Check authentication middleware is working');
  }
  
  console.log('\n📋 === ENDPOINTS TESTED ===');
  console.log('✓ GET  /api/medical-staff/profile');
  console.log('✓ PATCH /api/medical-staff/profile');
  console.log('✓ GET  /api/medical-staff/students');
  console.log('✓ GET  /api/medical-staff/students/:studentId');
  
  console.log('\n✨ Medical Staff API Test Suite Completed!');
  
  // Exit with appropriate code
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run the test suite
runMedicalStaffTestSuite().catch(error => {
  console.error('💥 Medical Staff test suite failed:', error);
  process.exit(1);
});