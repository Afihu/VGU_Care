const fetch = require('node-fetch').default;

// Use environment variable for API URL, fallback to localhost for local testing
const API_URL = process.env.API_URL || 'http://localhost:5001';

console.log('👤 Starting Profile Management Test Suite\n');
console.log(`🌐 Using API URL: ${API_URL}\n`);

// Test user data for profile operations
const testUsers = {
  student: {
    email: 'teststudent@vgu.edu.vn',
    password: 'TestVGU2024!',
    name: 'Test Student',
    gender: 'male',
    age: 20,
    role: 'student',
    roleSpecificData: {
      intakeYear: 2024,
      major: 'Computer Science'
    }
  },
  medicalStaff: {
    email: 'testdoctor@vgu.edu.vn',
    password: 'TestVGU2024!',
    name: 'Dr. Test Doctor',
    gender: 'female',
    age: 35,
    role: 'medical_staff',
    roleSpecificData: {
      specialty: 'General Medicine'
    }
  },
  admin: {
    email: 'testadmin@vgu.edu.vn',
    password: 'TestVGU2024!',
    name: 'Test Admin',
    gender: 'other',
    age: 30,
    role: 'admin'
  }
};

// Helper function to get auth token
async function getAuthToken(email, password) {
  const res = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (res.ok) {
    const body = await res.json();
    return body.token;
  }
  throw new Error(`Authentication failed: ${res.status}`);
}

async function testUserCreation(userData, userType) {
  try {
    console.log(`📝 Testing ${userType} user creation...`);
    const res = await fetch(`${API_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const body = await res.json();
    
    if (res.ok) {
      console.log(`✅ ${userType} user created successfully:`, {
        id: body.user.user_id,
        email: body.user.email,
        role: body.user.role
      });
      return true;
    } else if (res.status === 400 && body.error?.includes('already exists')) {
      console.log(`ℹ️  ${userType} user already exists, continuing with tests`);
      return true;
    } else {
      console.error(`❌ ${userType} user creation failed:`, res.status, body);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${userType} user creation error:`, error.message);
    return false;
  }
}

async function testProfileRetrieval(token, userType) {
  try {
    console.log(`📋 Testing ${userType} profile retrieval...`);
    const res = await fetch(`${API_URL}/api/users/me`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    
    if (res.ok) {
      const profile = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        age: data.user.age,
        gender: data.user.gender
      };
      
      // Add role-specific data
      if (data.user.role === 'student') {
        profile.intakeYear = data.user.intakeYear;
        profile.major = data.user.major;
      } else if (data.user.role === 'medical_staff') {
        profile.specialty = data.user.specialty;
      }
      
      console.log(`✅ ${userType} profile retrieved:`, profile);
      return data.user;
    } else {
      console.error(`❌ ${userType} profile retrieval failed:`, res.status, data);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${userType} profile retrieval error:`, error.message);
    return null;
  }
}

async function testProfileUpdate(token, userType, updateData) {
  try {
    console.log(`📝 Testing ${userType} profile update...`);
    const res = await fetch(`${API_URL}/api/users/profile`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    
    const data = await res.json();
    
    if (res.ok) {
      const updatedProfile = {
        name: data.user.name,
        gender: data.user.gender,
        age: data.user.age
      };
      
      // Add role-specific data
      if (data.user.role === 'student') {
        updatedProfile.intakeYear = data.user.intakeYear;
        updatedProfile.major = data.user.major;
      } else if (data.user.role === 'medical_staff') {
        updatedProfile.specialty = data.user.specialty;
      }
      
      console.log(`✅ ${userType} profile updated successfully:`, updatedProfile);
      return true;
    } else {
      console.error(`❌ ${userType} profile update failed:`, res.status, data);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${userType} profile update error:`, error.message);
    return false;
  }
}

async function testPasswordChange(token, userType, passwordData) {
  try {
    console.log(`🔐 Testing ${userType} password change...`);
    const res = await fetch(`${API_URL}/api/users/change-password`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(passwordData)
    });
    
    const data = await res.json();
    
    if (res.ok) {
      console.log(`✅ ${userType} password changed successfully`);
      return true;
    } else {
      console.error(`❌ ${userType} password change failed:`, res.status, data);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${userType} password change error:`, error.message);
    return false;
  }
}

async function testPasswordChangeValidation(token, userType) {
  console.log(`🧪 Testing ${userType} password change validation...`);
  
  // Test wrong current password
  console.log('   Testing wrong current password...');
  await testPasswordChange(token, userType, {
    currentPassword: 'WrongPassword123!',
    newPassword: 'NewValidPassword123!'
  });
  
  // Test weak new password
  console.log('   Testing weak new password...');
  await testPasswordChange(token, userType, {
    currentPassword: 'TestVGU2024!',
    newPassword: '123'
  });
  
  // Test empty passwords
  console.log('   Testing empty passwords...');
  await testPasswordChange(token, userType, {
    currentPassword: '',
    newPassword: 'NewValidPassword123!'
  });
}

async function runProfileTestSuite() {
  console.log('🚀 Starting Profile Management Test Suite\n');
  
  // Test 1: User Creation
  console.log('� === USER CREATION TESTS ===');
  const studentCreated = await testUserCreation(testUsers.student, 'Student');
  const medicalCreated = await testUserCreation(testUsers.medicalStaff, 'Medical Staff');
  const adminCreated = await testUserCreation(testUsers.admin, 'Admin');
  
  if (!studentCreated || !medicalCreated || !adminCreated) {
    console.error('❌ User creation failed. Aborting profile tests.');
    process.exit(1);
  }
  
  console.log('\n📋 === PROFILE RETRIEVAL TESTS ===');
  
  // Get auth tokens for profile operations
  let studentToken, medicalToken, adminToken;
  
  try {
    studentToken = await getAuthToken(testUsers.student.email, testUsers.student.password);
    medicalToken = await getAuthToken(testUsers.medicalStaff.email, testUsers.medicalStaff.password);
    adminToken = await getAuthToken(testUsers.admin.email, testUsers.admin.password);
  } catch (error) {
    console.error('❌ Failed to get authentication tokens:', error.message);
    process.exit(1);
  }
  
  // Test profile retrieval
  await testProfileRetrieval(studentToken, 'Student');
  await testProfileRetrieval(medicalToken, 'Medical Staff');
  await testProfileRetrieval(adminToken, 'Admin');
  
  console.log('\n📝 === PROFILE UPDATE TESTS ===');
  
  // Test Student Profile Update
  const studentUpdateData = {
    name: 'Updated Test Student',
    age: 21,
    gender: 'female',
    roleSpecificData: {
      intakeYear: 2023,
      major: 'Software Engineering'
    }
  };
  
  const studentUpdateSuccess = await testProfileUpdate(studentToken, 'Student', studentUpdateData);
  if (studentUpdateSuccess) {
    await testProfileRetrieval(studentToken, 'Student (After Update)');
  }
  
  // Test Medical Staff Profile Update
  const medicalUpdateData = {
    name: 'Updated Dr. Test',
    age: 36,
    roleSpecificData: {
      specialty: 'Cardiology'
    }
  };
  
  const medicalUpdateSuccess = await testProfileUpdate(medicalToken, 'Medical Staff', medicalUpdateData);
  if (medicalUpdateSuccess) {
    await testProfileRetrieval(medicalToken, 'Medical Staff (After Update)');
  }
  
  // Test Admin Profile Update (no role-specific data)
  const adminUpdateData = {
    name: 'Updated Admin User',
    age: 31,
    gender: 'male'
  };
  
  const adminUpdateSuccess = await testProfileUpdate(adminToken, 'Admin', adminUpdateData);
  if (adminUpdateSuccess) {
    await testProfileRetrieval(adminToken, 'Admin (After Update)');
  }
  
  console.log('\n🔐 === PASSWORD CHANGE TESTS ===');
  
  // Test valid password change for student
  const passwordChangeSuccess = await testPasswordChange(studentToken, 'Student', {
    currentPassword: testUsers.student.password,
    newPassword: 'NewTestVGU2024!'
  });
  
  if (passwordChangeSuccess) {
    // Verify login with new password
    try {
      const newToken = await getAuthToken(testUsers.student.email, 'NewTestVGU2024!');
      console.log('✅ Login with new password successful');
      
      // Change password back
      await testPasswordChange(newToken, 'Student', {
        currentPassword: 'NewTestVGU2024!',
        newPassword: testUsers.student.password
      });
    } catch (error) {
      console.error('❌ Login with new password failed:', error.message);
    }
  }
  
  console.log('\n🚨 === PASSWORD CHANGE VALIDATION TESTS ===');
  await testPasswordChangeValidation(studentToken, 'Student');
  
  console.log('\n🔒 === AUTHORIZATION TESTS ===');
  
  // Test with invalid token
  console.log('Testing with invalid token...');
  await testProfileUpdate('invalid_token', 'Invalid User', { name: 'Should Fail' });
  await testPasswordChange('invalid_token', 'Invalid User', {
    currentPassword: 'test',
    newPassword: 'test123'
  });
  
  console.log('\n✨ Profile Management Test Suite Completed!');
}

// Run the test suite
runProfileTestSuite().catch(error => {
  console.error('💥 Profile test suite failed:', error);
  process.exit(1);
});