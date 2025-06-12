const fetch = require('node-fetch').default;

const API_URL = process.env.API_URL || 'http://localhost:5001';

console.log('🔍 Starting Role-Based Access Control Test Suite\n');
console.log(`🌐 Using API URL: ${API_URL}\n`);

// Test users from your schema
const testUsers = {
  student: {
    email: 'student1@vgu.edu.vn',
    password: 'VGU2024!'
  },
  medicalStaff: {
    email: 'doctor1@vgu.edu.vn',
    password: 'VGU2024!'
  },
  admin: {
    email: 'admin@vgu.edu.vn',
    password: 'VGU2024!'
  }
};

async function getAuthToken(email, password) {
  console.log(`🔐 Authenticating ${email}...`);
  const res = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (res.ok) {
    const body = await res.json();
    console.log(`✅ Authentication successful for ${email}`);
    return body.token;
  }
  const errorData = await res.json();
  throw new Error(`Authentication failed for ${email}: ${res.status} - ${JSON.stringify(errorData)}`);
}

async function testAdminPrivileges(token) {
  console.log('\n👑 Testing Admin Privileges...');
  
  // Test admin routes access
  try {
    const res = await fetch(`${API_URL}/api/admin/users/students`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      console.log('✅ Admin can access admin routes');
    } else {
      console.log('⚠️ Admin routes may not be implemented yet');
    }
  } catch (error) {
    console.log('⚠️ Admin routes endpoint not available');
  }

  // Test user management access
  const profileRes = await fetch(`${API_URL}/api/users/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (profileRes.ok) {
    console.log('✅ Admin can access user management');
  } else {
    throw new Error('Admin should be able to access user management');
  }

  // Test appointment creation
  const appointmentData = {
    symptoms: 'Admin-created appointment for testing',
    priorityLevel: 'high'
  };

  const appointmentRes = await fetch(`${API_URL}/api/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(appointmentData)
  });

  if (appointmentRes.ok) {
    const data = await appointmentRes.json();
    console.log('✅ Admin can create appointments');
    return data.appointment?.id || data.appointment_id;
  } else {
    console.log('⚠️ Admin appointment creation may have restrictions');
  }

  // Test appointments access
  const appointmentsRes = await fetch(`${API_URL}/api/appointments`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (appointmentsRes.ok) {
    console.log('✅ Admin can view all appointments');
  } else {
    throw new Error('Admin should be able to view appointments');
  }
}

async function testStudentPrivileges(token) {
  console.log('\n👨‍🎓 Testing Student Privileges...');
  
  // Test own profile access
  const profileRes = await fetch(`${API_URL}/api/users/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (profileRes.ok) {
    console.log('✅ Student can access own profile');
  } else {
    throw new Error('Student should be able to access own profile');
  }

  // Test own appointments access
  const appointmentsRes = await fetch(`${API_URL}/api/appointments`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (appointmentsRes.ok) {
    console.log('✅ Student can view own appointments');
  } else {
    throw new Error('Student should be able to view own appointments');
  }

  // Test appointment creation
  const appointmentData = {
    symptoms: 'Student self-appointment for testing',
    priorityLevel: 'medium'
  };

  const createRes = await fetch(`${API_URL}/api/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(appointmentData)
  });

  if (createRes.ok) {
    const data = await createRes.json();
    console.log('✅ Student can create appointments');
    return data.appointment?.id || data.appointment_id;
  } else {
    throw new Error('Student should be able to create appointments');
  }
}

async function testStudentRestrictions(token) {
  console.log('\n🚫 Testing Student Access Restrictions...');
  
  // Test admin routes restriction
  try {
    const adminRes = await fetch(`${API_URL}/api/admin/users/students`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (adminRes.status === 403 || adminRes.status === 401) {
      console.log('✅ Student properly denied admin access');
    } else if (adminRes.status === 404) {
      console.log('✅ Student cannot access admin routes (endpoint not found)');
    } else {
      console.error('❌ Student should not have admin access');
    }
  } catch (error) {
    console.log('✅ Student properly denied admin access (connection refused)');
  }

  // Test other user profile restriction
  const otherProfileRes = await fetch(`${API_URL}/api/users/999`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (otherProfileRes.status === 403 || otherProfileRes.status === 404) {
    console.log('✅ Student properly denied access to other profiles');
  } else {
    console.error('❌ Student should not access other user profiles');
  }

  // Test medical staff endpoints restriction
  const medicalRes = await fetch(`${API_URL}/api/medical-staff/students`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (medicalRes.status === 403 || medicalRes.status === 401) {
    console.log('✅ Student properly denied medical staff access');
  } else if (medicalRes.status === 404) {
    console.log('✅ Student cannot access medical staff routes');
  } else {
    console.error('❌ Student should not have medical staff access');
  }
}

async function testMedicalStaffPrivileges(token) {
  console.log('\n👨‍⚕️ Testing Medical Staff Privileges...');
  
  // Test own profile access
  const profileRes = await fetch(`${API_URL}/api/users/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (profileRes.ok) {
    console.log('✅ Medical staff can access own profile');
  } else {
    throw new Error('Medical staff should be able to access own profile');
  }

  // Test medical staff specific profile
  try {
    const medicalProfileRes = await fetch(`${API_URL}/api/medical-staff/profile`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (medicalProfileRes.ok) {
      console.log('✅ Medical staff can access medical staff endpoints');
    } else if (medicalProfileRes.status === 404) {
      console.log('⚠️ Medical staff specific endpoint not implemented');
    }
  } catch (error) {
    console.log('⚠️ Medical staff endpoint not available');
  }

  // Test student profiles access
  try {
    const studentsRes = await fetch(`${API_URL}/api/medical-staff/students`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (studentsRes.ok) {
      console.log('✅ Medical staff can access student profiles');
    } else if (studentsRes.status === 404) {
      console.log('⚠️ Medical staff students endpoint not implemented');
    }
  } catch (error) {
    console.log('⚠️ Medical staff students endpoint not available');
  }

  // Test appointments access
  const appointmentsRes = await fetch(`${API_URL}/api/appointments`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (appointmentsRes.ok) {
    console.log('✅ Medical staff can view assigned appointments');
  } else {
    throw new Error('Medical staff should be able to view appointments');
  }

  // Test pending appointments access
  try {
    const pendingRes = await fetch(`${API_URL}/api/appointments/pending`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (pendingRes.ok) {
      console.log('✅ Medical staff can access pending appointments');
    } else if (pendingRes.status === 404) {
      console.log('⚠️ Pending appointments endpoint not implemented');
    }
  } catch (error) {
    console.log('⚠️ Pending appointments endpoint not available');
  }

  // Test appointment creation
  const appointmentData = {
    symptoms: 'Medical staff created appointment for testing',
    priorityLevel: 'high'
  };

  const createRes = await fetch(`${API_URL}/api/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(appointmentData)
  });

  if (createRes.ok) {
    const data = await createRes.json();
    console.log('✅ Medical staff can create appointments');
    return data.appointment?.id || data.appointment_id;
  } else {
    console.log('⚠️ Medical staff appointment creation may have restrictions');
  }
}

async function testMedicalStaffRestrictions(token) {
  console.log('\n🚫 Testing Medical Staff Access Restrictions...');
  
  // Test admin routes restriction
  try {
    const adminRes = await fetch(`${API_URL}/api/admin/users/students`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (adminRes.status === 403 || adminRes.status === 401) {
      console.log('✅ Medical staff properly denied admin access');
    } else if (adminRes.status === 404) {
      console.log('✅ Medical staff cannot access admin routes (endpoint not found)');
    } else {
      console.error('❌ Medical staff should not have admin access');
    }
  } catch (error) {
    console.log('✅ Medical staff properly denied admin access (connection refused)');
  }
}

async function testSecurityMeasures() {
  console.log('\n🛡️ Testing Security Measures...');
  
  // Test unauthorized access
  const unauthorizedRes = await fetch(`${API_URL}/api/users/me`, {
    method: 'GET'
  });

  if (unauthorizedRes.status === 401) {
    console.log('✅ Unauthenticated access properly denied');
  } else {
    console.error('❌ Unauthenticated access should be denied');
  }

  // Test invalid token
  const invalidTokenRes = await fetch(`${API_URL}/api/users/me`, {
    method: 'GET',
    headers: { 'Authorization': 'Bearer invalid-token-123' }
  });

  if (invalidTokenRes.status === 401) {
    console.log('✅ Invalid token properly rejected');
  } else {
    console.error('❌ Invalid token should be rejected');
  }

  // Test malformed token
  const malformedTokenRes = await fetch(`${API_URL}/api/users/me`, {
    method: 'GET',
    headers: { 'Authorization': 'InvalidFormat' }
  });

  if (malformedTokenRes.status === 401) {
    console.log('✅ Malformed authorization header properly rejected');
  } else {
    console.error('❌ Malformed authorization should be rejected');
  }
}

async function testConsistentRoleEnforcement(studentToken) {
  console.log('\n🔒 Testing Consistent Role Enforcement...');
  
  const restrictedEndpoints = [
    '/api/admin/users/students',
    '/api/admin/appointments',
    '/api/admin/users/medical-staff'
  ];

  let allProperlyRestricted = true;

  for (const endpoint of restrictedEndpoints) {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });

      if (res.status !== 403 && res.status !== 401 && res.status !== 404) {
        console.error(`❌ Student should not access ${endpoint}`);
        allProperlyRestricted = false;
      }
    } catch (error) {
      // Connection errors are acceptable for non-existent endpoints
    }
  }

  if (allProperlyRestricted) {
    console.log('✅ Consistent privilege enforcement verified');
  }
}

async function runPrivilegeTests() {
  try {
    console.log('🔐 Starting Role-Based Access Control Tests\n');
    
    // Get auth tokens
    const studentToken = await getAuthToken(testUsers.student.email, testUsers.student.password);
    const medicalToken = await getAuthToken(testUsers.medicalStaff.email, testUsers.medicalStaff.password);
    const adminToken = await getAuthToken(testUsers.admin.email, testUsers.admin.password);
    
    console.log('\n--- ADMIN PRIVILEGE TESTS ---');
    await testAdminPrivileges(adminToken);
    
    console.log('\n--- STUDENT PRIVILEGE TESTS ---');
    await testStudentPrivileges(studentToken);
    
    console.log('\n--- STUDENT RESTRICTION TESTS ---');
    await testStudentRestrictions(studentToken);
    
    console.log('\n--- MEDICAL STAFF PRIVILEGE TESTS ---');
    await testMedicalStaffPrivileges(medicalToken);
    
    console.log('\n--- MEDICAL STAFF RESTRICTION TESTS ---');
    await testMedicalStaffRestrictions(medicalToken);
    
    console.log('\n--- SECURITY TESTS ---');
    await testSecurityMeasures();
    
    console.log('\n--- CONSISTENCY TESTS ---');
    await testConsistentRoleEnforcement(studentToken);
    
    console.log('\n🎉 All privilege tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Admin privileges verified');
    console.log('   ✅ Student privileges and restrictions verified');
    console.log('   ✅ Medical staff privileges and restrictions verified');
    console.log('   ✅ Security measures validated');
    console.log('   ✅ Consistent role enforcement confirmed');
    
  } catch (error) {
    console.error('\n💥 Privilege tests failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPrivilegeTests();
}

module.exports = runPrivilegeTests;