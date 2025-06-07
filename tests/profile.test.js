const fetch = require('node-fetch').default;

// Use the same test users from backend.test.js
const testUsers = {
  student: {
    email: 'teststudent@vgu.edu.vn',
    password: 'TestVGU2024!'
  },
  medicalStaff: {
    email: 'testdoctor@vgu.edu.vn',
    password: 'TestVGU2024!'
  },
  admin: {
    email: 'testadmin@vgu.edu.vn',
    password: 'TestVGU2024!'
  }
};

async function loginUser(email, password, userType) {
  try {
    console.log(`🔐 Logging in ${userType}...`);
    const res = await fetch('http://localhost:5001/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const body = await res.json();
    
    if (res.ok) {
      console.log(`✅ ${userType} login successful`);
      return body.token;
    } else {
      console.error(`❌ ${userType} login failed:`, res.status, body);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${userType} login error:`, error.message);
    return null;
  }
}

async function testUpdateProfile(token, userType, updateData) {
  try {
    console.log(`🧪 Testing ${userType} profile update...`);
    const res = await fetch('http://localhost:5001/api/users/profile', {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    
    const data = await res.json();
    
    if (res.ok) {
      console.log(`✅ ${userType} profile updated successfully:`, {
        name: data.user.name,
        gender: data.user.gender,
        age: data.user.age,
        ...(data.user.role === 'student' && {
          intakeYear: data.user.intakeYear,
          major: data.user.major
        }),
        ...(data.user.role === 'medical_staff' && {
          specialty: data.user.specialty
        })
      });
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

async function testChangePassword(token, userType, passwordData) {
  try {
    console.log(`🧪 Testing ${userType} password change...`);
    const res = await fetch('http://localhost:5001/api/users/change-password', {
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

async function testLoginWithNewPassword(email, newPassword, userType) {
  try {
    console.log(`🔐 Testing login with new password for ${userType}...`);
    const res = await fetch('http://localhost:5001/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: newPassword })
    });
    
    const body = await res.json();
    
    if (res.ok) {
      console.log(`✅ ${userType} login with new password successful`);
      return body.token;
    } else {
      console.error(`❌ ${userType} login with new password failed:`, res.status, body);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${userType} login with new password error:`, error.message);
    return null;
  }
}

async function getProfile(token, userType) {
  try {
    console.log(`📋 Getting ${userType} profile...`);
    const res = await fetch('http://localhost:5001/api/users/me', {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    
    if (res.ok) {
      console.log(`✅ ${userType} profile retrieved:`, {
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        age: data.user.age,
        gender: data.user.gender
      });
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

async function runProfileTestSuite() {
  console.log('🚀 Starting VGU Care Profile Management Test Suite\n');
  
  // Test 1: Student Profile Management
  console.log('👨‍🎓 === STUDENT PROFILE TESTS ===');
  let studentToken = await loginUser(
    testUsers.student.email, 
    testUsers.student.password, 
    'Student'
  );
  
  if (studentToken) {
    // Get initial profile
    await getProfile(studentToken, 'Student');
    
    // Test profile update
    const studentUpdateData = {
      name: 'Updated Test Student',
      age: 21,
      gender: 'female',
      roleSpecificData: {
        intakeYear: 2023,
        major: 'Software Engineering'
      }
    };
    
    const studentUpdateSuccess = await testUpdateProfile(studentToken, 'Student', studentUpdateData);
    
    if (studentUpdateSuccess) {
      // Get updated profile to verify changes
      await getProfile(studentToken, 'Student');
      
      // Test password change
      const passwordChangeSuccess = await testChangePassword(studentToken, 'Student', {
        currentPassword: testUsers.student.password,
        newPassword: 'NewTestVGU2024!'
      });
      
      if (passwordChangeSuccess) {
        // Test login with new password
        const newToken = await testLoginWithNewPassword(
          testUsers.student.email, 
          'NewTestVGU2024!', 
          'Student'
        );
        
        if (newToken) {
          // Change password back to original for future tests
          await testChangePassword(newToken, 'Student', {
            currentPassword: 'NewTestVGU2024!',
            newPassword: testUsers.student.password
          });
        }
      }
    }
  }
  
  console.log('\n👩‍⚕️ === MEDICAL STAFF PROFILE TESTS ===');
  let medicalToken = await loginUser(
    testUsers.medicalStaff.email, 
    testUsers.medicalStaff.password, 
    'Medical Staff'
  );
  
  if (medicalToken) {
    // Get initial profile
    await getProfile(medicalToken, 'Medical Staff');
    
    // Test profile update
    const medicalUpdateData = {
      name: 'Updated Dr. Test',
      age: 36,
      roleSpecificData: {
        specialty: 'Cardiology'
      }
    };
    
    const medicalUpdateSuccess = await testUpdateProfile(medicalToken, 'Medical Staff', medicalUpdateData);
    
    if (medicalUpdateSuccess) {
      // Get updated profile to verify changes
      await getProfile(medicalToken, 'Medical Staff');
      
      // Test password change
      const passwordChangeSuccess = await testChangePassword(medicalToken, 'Medical Staff', {
        currentPassword: testUsers.medicalStaff.password,
        newPassword: 'NewMedicalVGU2024!'
      });
      
      if (passwordChangeSuccess) {
        // Test login with new password
        const newToken = await testLoginWithNewPassword(
          testUsers.medicalStaff.email, 
          'NewMedicalVGU2024!', 
          'Medical Staff'
        );
        
        if (newToken) {
          // Change password back to original for future tests
          await testChangePassword(newToken, 'Medical Staff', {
            currentPassword: 'NewMedicalVGU2024!',
            newPassword: testUsers.medicalStaff.password
          });
        }
      }
    }
  }
  
  console.log('\n👨‍💼 === ADMIN PROFILE TESTS ===');
  let adminToken = await loginUser(
    testUsers.admin.email, 
    testUsers.admin.password, 
    'Admin'
  );
  
  if (adminToken) {
    // Get initial profile
    await getProfile(adminToken, 'Admin');
    
    // Test profile update (admins don't have role-specific data)
    const adminUpdateData = {
      name: 'Updated Admin User',
      age: 31,
      gender: 'male'
    };
    
    const adminUpdateSuccess = await testUpdateProfile(adminToken, 'Admin', adminUpdateData);
    
    if (adminUpdateSuccess) {
      // Get updated profile to verify changes
      await getProfile(adminToken, 'Admin');
      
      // Test password change
      const passwordChangeSuccess = await testChangePassword(adminToken, 'Admin', {
        currentPassword: testUsers.admin.password,
        newPassword: 'NewAdminVGU2024!'
      });
      
      if (passwordChangeSuccess) {
        // Test login with new password
        const newToken = await testLoginWithNewPassword(
          testUsers.admin.email, 
          'NewAdminVGU2024!', 
          'Admin'
        );
        
        if (newToken) {
          // Change password back to original for future tests
          await testChangePassword(newToken, 'Admin', {
            currentPassword: 'NewAdminVGU2024!',
            newPassword: testUsers.admin.password
          });
        }
      }
    }
  }
  
  console.log('\n🧪 === ERROR HANDLING TESTS ===');
  
  // Test with invalid token
  console.log('🔍 Testing with invalid token...');
  await testUpdateProfile('invalid_token', 'Invalid User', { name: 'Should Fail' });
  
  // Test password change with wrong current password
  if (studentToken) {
    console.log('🔍 Testing password change with wrong current password...');
    await testChangePassword(studentToken, 'Student', {
      currentPassword: 'WrongPassword123!',
      newPassword: 'NewPassword123!'
    });
  }
  
  // Test password change with weak new password
  if (studentToken) {
    console.log('🔍 Testing password change with weak new password...');
    await testChangePassword(studentToken, 'Student', {
      currentPassword: testUsers.student.password,
      newPassword: '123'
    });
  }
  
  console.log('\n✨ Profile Management Test Suite Completed!');
}

// Run the test suite
runProfileTestSuite().catch(error => {
  console.error('💥 Profile test suite failed:', error);
  process.exit(1);
});