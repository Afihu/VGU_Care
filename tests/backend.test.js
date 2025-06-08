const fetch = require('node-fetch').default;

// Test user data
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

async function createTestUser(userData, userType) {
  try {
    const res = await fetch('http://localhost:5001/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const body = await res.json();
    
    if (res.ok) {
      console.log(`✅ ${userType} test user created successfully`);
      return true;
    } else if (res.status === 400 && body.error?.includes('already exists')) {
      console.log(`ℹ️  ${userType} test user already exists, skipping creation`);
      return true;
    } else {
      console.error(`❌ ${userType} test user creation failed:`, res.status, body);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${userType} test user creation error:`, error.message);
    return false;
  }
}

async function testLogin(email, password, userType) {
  try {
    console.log(`🧪 Testing ${userType} login...`);
    const res = await fetch('http://localhost:5001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const body = await res.json();
    
    if (res.ok) {
      console.log(`✅ ${userType} login successful:`, {
        user: body.user,
        tokenLength: body.token ? body.token.length : 0
      });
      return body.token;
    } else {
      console.error(`❌ ${userType} login failed:`, res.status, body);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${userType} login test failed:`, error.message);
    return null;
  }
}

async function testGetProfile(token, userType) {
  try {
    console.log(`🧪 Testing ${userType} profile retrieval...`);
    const res = await fetch('http://localhost:5001/api/users/me', {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    
    if (res.ok) {
      console.log(`✅ ${userType} profile retrieved:`, {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
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
      console.error(`❌ ${userType} profile retrieval failed:`, res.status, data);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${userType} profile test failed:`, error.message);
    return false;
  }
}

async function runTestSuite() {
  console.log('🚀 Starting VGU Care Backend Test Suite\n');
  
  // Step 1: Create test users (if they don't exist)
  console.log('📝 Setting up test users...');
  const studentCreated = await createTestUser(testUsers.student, 'Student');
  const medicalStaffCreated = await createTestUser(testUsers.medicalStaff, 'Medical Staff');
  const adminCreated = await createTestUser(testUsers.admin, 'Admin');
  
  if (!studentCreated || !medicalStaffCreated || !adminCreated) {
    console.error('❌ Failed to set up test users. Aborting tests.');
    process.exit(1);
  }
  
  console.log('\n🔐 Testing authentication and profile retrieval...');
  
  // Step 2: Test student login and profile
  const studentToken = await testLogin(
    testUsers.student.email, 
    testUsers.student.password, 
    'Student'
  );
  
  if (studentToken) {
    await testGetProfile(studentToken, 'Student');
  }
  
  console.log(''); // Empty line for readability
  
  // Step 3: Test medical staff login and profile
  const medicalStaffToken = await testLogin(
    testUsers.medicalStaff.email, 
    testUsers.medicalStaff.password, 
    'Medical Staff'
  );
  
  if (medicalStaffToken) {
    await testGetProfile(medicalStaffToken, 'Medical Staff');
  }
  
  console.log(''); // Empty line for readability
  
  // Step 4: Test admin login and profile
  const adminToken = await testLogin(
    testUsers.admin.email, 
    testUsers.admin.password, 
    'Admin'
  );
  
  if (adminToken) {
    await testGetProfile(adminToken, 'Admin');
  }
  
  console.log('\n✨ Test suite completed!');
}

// Optional: Add a cleanup function to remove test users
async function cleanupTestUsers() {
  console.log('🧹 Cleaning up test users...');
  // Note: You'll need to implement a DELETE endpoint or manually clean the database
  console.log('ℹ️  Manual cleanup required - remove test users from database if needed');
}

// Run the test suite
runTestSuite().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});

// Uncomment the line below if you want to cleanup test users after running tests
// cleanupTestUsers();