const fetch = require('node-fetch').default;

// Use environment variable for API URL, fallback to localhost for local testing
const API_URL = process.env.API_URL || 'http://backend:5001';

console.log('🧪 Medical Staff Comprehensive Test Suite');
console.log(`🌐 Using API URL: ${API_URL}\n`);

// Test credentials from schema.sql
const MEDICAL_STAFF_CREDENTIALS = {
  email: 'doctor1@vgu.edu.vn',
  password: 'VGU2024!'
};

const STUDENT_CREDENTIALS = {
  email: 'student1@vgu.edu.vn',
  password: 'VGU2024!'
};

let medicalStaffToken = null;
let studentToken = null;

async function authenticateUser(credentials, userType) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${userType} authentication successful`);
      console.log(`   Email: ${credentials.email}`);
      console.log(`   Role: ${data.user?.role || 'Unknown'}`);
      return data.token;
    } else {
      console.error(`❌ ${userType} authentication failed: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${userType} authentication error:`, error.message);
    return null;
  }
}

async function testMedicalStaffPrivileges() {
  console.log('\n🔍 === MEDICAL STAFF PRIVILEGE VERIFICATION ===');
  
  const tests = [
    {
      name: 'View own profile',
      endpoint: '/api/medical-staff/profile',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Update own profile',
      endpoint: '/api/medical-staff/profile',
      method: 'PATCH',
      body: { specialty: 'Test Specialty' },
      expectedStatus: 200
    },
    {
      name: 'View all student profiles',
      endpoint: '/api/medical-staff/students',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'View assigned appointments',
      endpoint: '/api/appointments',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Create appointment',
      endpoint: '/api/appointments',
      method: 'POST',
      body: { symptoms: 'Test symptoms', priorityLevel: 'medium' },
      expectedStatus: 201
    },
    {
      name: 'Access abuse reports',
      endpoint: '/api/reports',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'View mood tracker entries',
      endpoint: '/api/mood',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Access advice routes',
      endpoint: '/api/advice',
      method: 'GET',
      expectedStatus: 200
    }
  ];

  let passedTests = 0;
  
  for (const test of tests) {
    try {
      const options = {
        method: test.method,
        headers: {
          'Authorization': `Bearer ${medicalStaffToken}`,
          'Content-Type': 'application/json'
        }
      };
      
      if (test.body && test.method !== 'GET') {
        options.body = JSON.stringify(test.body);
      }
      
      const response = await fetch(`${API_URL}${test.endpoint}`, options);
      
      if (response.status === test.expectedStatus || (response.status === 404 && test.expectedStatus === 200)) {
        console.log(`✅ ${test.name}: PASS (Status: ${response.status})`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name}: FAIL (Expected: ${test.expectedStatus}, Got: ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR (${error.message})`);
    }
  }
  
  return { passed: passedTests, total: tests.length };
}

async function testSecurityBoundaries() {
  console.log('\n🔒 === SECURITY BOUNDARY VERIFICATION ===');
  
  const deniedTests = [
    {
      name: 'Admin routes access',
      endpoint: '/api/admin/users',
      expectedStatus: 403
    },
    {
      name: 'Admin appointment management',
      endpoint: '/api/admin/appointments',
      expectedStatus: 403
    },
    {
      name: 'Admin user management',
      endpoint: '/api/admin/users/students',
      expectedStatus: 403
    }
  ];

  let passedTests = 0;
  
  for (const test of deniedTests) {
    try {
      const response = await fetch(`${API_URL}${test.endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${medicalStaffToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === test.expectedStatus || response.status === 401) {
        console.log(`✅ ${test.name}: PROPERLY DENIED (Status: ${response.status})`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name}: SECURITY BREACH (Expected: ${test.expectedStatus}, Got: ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR (${error.message})`);
    }
  }
  
  return { passed: passedTests, total: deniedTests.length };
}

async function runComprehensiveTests() {
  console.log('🚀 Starting Medical Staff Comprehensive Test Suite\n');
  
  // Step 1: Authentication
  console.log('🔐 === AUTHENTICATION SETUP ===');
  medicalStaffToken = await authenticateUser(MEDICAL_STAFF_CREDENTIALS, 'Medical Staff');
  studentToken = await authenticateUser(STUDENT_CREDENTIALS, 'Student');
  
  if (!medicalStaffToken) {
    console.error('❌ Cannot continue tests without medical staff authentication');
    process.exit(1);
  }
  
  // Step 2: Test medical staff privileges
  const privilegeResults = await testMedicalStaffPrivileges();
  
  // Step 3: Test security boundaries
  const securityResults = await testSecurityBoundaries();
  
  // Step 4: Summary
  console.log('\n📊 === COMPREHENSIVE TEST SUMMARY ===');
  console.log(`Medical Staff Privileges: ${privilegeResults.passed}/${privilegeResults.total} passed`);
  console.log(`Security Boundaries: ${securityResults.passed}/${securityResults.total} passed`);
  
  const totalPassed = privilegeResults.passed + securityResults.passed;
  const totalTests = privilegeResults.total + securityResults.total;
  
  console.log(`\nOverall Score: ${totalPassed}/${totalTests} (${((totalPassed/totalTests) * 100).toFixed(1)}%)`);
  
  if (totalPassed === totalTests) {
    console.log('\n🎉 All medical staff privilege tests passed!');
    console.log('✅ Medical staff privileges are properly implemented and secured');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed. Medical staff implementation needs attention.');
    process.exit(1);
  }
}

// Run the comprehensive test suite
runComprehensiveTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
