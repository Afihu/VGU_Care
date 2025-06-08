const authService = require('../backend/services/authService');

console.log('🔐 Starting Basic Authentication Test Suite\n');

async function testAuth() {
  console.log('📋 Testing Authentication Service with detailed error logging\n');
  
  const testCredentials = {
    email: 'student1@vgu.edu.vn',
    password: 'VGU2024!'
  };
  
  try {
    console.log('🔍 Pre-flight checks:');
    console.log(`   Testing with email: ${testCredentials.email}`);
    console.log(`   Password length: ${testCredentials.password.length} characters`);
    console.log(`   Password starts with: ${testCredentials.password.substring(0, 3)}...`);
    console.log('');
    
    // Check if authService is properly loaded
    console.log('� Module loading check:');
    console.log(`   authService loaded: ${!!authService}`);
    console.log(`   authenticate function: ${typeof authService.authenticate}`);
    console.log(`   verifyToken function: ${typeof authService.verifyToken}`);
    console.log('');
    
    // Test database connection first
    console.log('🗄️ Testing database connection...');
    try {
      const { query } = require('../backend/config/database');
      const dbTest = await query('SELECT NOW() as current_time');
      console.log(`✅ Database connected successfully at: ${dbTest.rows[0].current_time}`);
    } catch (dbError) {
      console.error(`❌ Database connection failed: ${dbError.message}`);
      console.error(`   Error code: ${dbError.code}`);
      console.error(`   Error details: ${dbError.detail || 'No additional details'}`);
      return;
    }
    console.log('');
    
    // Check if user exists in database
    console.log('� Checking if test user exists in database...');
    try {
      const { query } = require('../backend/config/database');
      const userCheck = await query('SELECT user_id, email, role, status FROM users WHERE email = $1', [testCredentials.email]);
      
      if (userCheck.rows.length === 0) {
        console.error(`❌ User ${testCredentials.email} not found in database`);
        console.log('   Available users:');
        const allUsers = await query('SELECT email, role FROM users LIMIT 5');
        allUsers.rows.forEach(user => {
          console.log(`     - ${user.email} (${user.role})`);
        });
        return;
      } else {
        const user = userCheck.rows[0];
        console.log(`✅ User found in database:`);
        console.log(`   ID: ${user.user_id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
      }
    } catch (userCheckError) {
      console.error(`❌ Error checking user existence: ${userCheckError.message}`);
      return;
    }
    console.log('');
    
    // Test login with detailed error handling
    console.log('🔑 Attempting authentication...');
    let authResult;
    try {
      authResult = await authService.authenticate(testCredentials.email, testCredentials.password);
      console.log('✅ Authentication successful!');
      console.log(`   Response type: ${typeof authResult}`);
      console.log(`   Response keys: ${Object.keys(authResult || {}).join(', ')}`);
    } catch (authError) {
      console.error('❌ Authentication failed with detailed error:');
      console.error(`   Error message: ${authError.message}`);
      console.error(`   Error name: ${authError.name}`);
      console.error(`   Error code: ${authError.code || 'No code'}`);
      console.error(`   Stack trace: ${authError.stack}`);
      
      // Check if it's a database-related error
      if (authError.message.includes('connect') || authError.message.includes('ECONNREFUSED')) {
        console.error('   🔍 This appears to be a database connection error');
      } else if (authError.message.includes('Invalid credentials')) {
        console.error('   🔍 This appears to be an authentication/password error');
      } else if (authError.message.includes('Cannot read property') || authError.message.includes('Cannot read properties')) {
        console.error('   🔍 This appears to be a null/undefined object access error');
      }
      
      return;
    }
    console.log('');
    
    // Validate authentication response structure
    console.log('� Validating authentication response structure...');
    if (!authResult) {
      console.error('❌ Authentication result is null or undefined');
      return;
    }
    
    if (!authResult.token) {
      console.error('❌ Authentication result missing token');
      console.log(`   Actual result: ${JSON.stringify(authResult, null, 2)}`);
      return;
    }
    
    if (!authResult.user) {
      console.error('❌ Authentication result missing user object');
      console.log(`   Actual result: ${JSON.stringify(authResult, null, 2)}`);
      return;
    }
    
    console.log('✅ Authentication response structure is valid');
    console.log(`   Token length: ${authResult.token.length} characters`);
    console.log(`   Token starts with: ${authResult.token.substring(0, 20)}...`);
    console.log(`   User object keys: ${Object.keys(authResult.user).join(', ')}`);
    console.log(`   User email: ${authResult.user.email}`);
    console.log(`   User role: ${authResult.user.role}`);
    console.log('');
    
    // Test token verification with detailed error handling
    console.log('🛡️ Testing token verification...');
    try {
      const decoded = await authService.verifyToken(authResult.token);
      console.log('✅ Token verification successful!');
      console.log(`   Decoded token keys: ${Object.keys(decoded).join(', ')}`);
      console.log(`   User ID: ${decoded.userId}`);
      console.log(`   Email: ${decoded.email}`);
      console.log(`   Role: ${decoded.role}`);
      console.log(`   Issued at: ${new Date(decoded.iat * 1000).toLocaleString()}`);
      console.log(`   Expires at: ${new Date(decoded.exp * 1000).toLocaleString()}`);
      
    } catch (tokenError) {
      console.error('❌ Token verification failed:');
      console.error(`   Error message: ${tokenError.message}`);
      console.error(`   Error name: ${tokenError.name}`);
      console.error(`   Stack trace: ${tokenError.stack}`);
      return;
    }
    console.log('');
    
    console.log('🎉 All authentication tests passed successfully!');
    
  } catch (unexpectedError) {
    console.error('💥 Unexpected error occurred:');
    console.error(`   Error message: ${unexpectedError.message}`);
    console.error(`   Error name: ${unexpectedError.name}`);
    console.error(`   Error code: ${unexpectedError.code || 'No code'}`);
    console.error(`   Stack trace: ${unexpectedError.stack}`);
    
    // Additional environment debugging
    console.log('\n🔧 Environment debugging:');
    console.log(`   Node.js version: ${process.version}`);
    console.log(`   Current working directory: ${process.cwd()}`);
    console.log(`   Environment variables:`);
    console.log(`     NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
    console.log(`     DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
    console.log(`     JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
  }
}

// Enhanced module loading check
console.log('🚀 Module and environment initialization:');
try {
  console.log(`   Current directory: ${process.cwd()}`);
  console.log(`   Node.js version: ${process.version}`);
  
  // Check if required files exist
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    '../backend/services/authService.js',
    '../backend/config/database.js'
  ];
  
  requiredFiles.forEach(file => {
    const fullPath = path.resolve(__dirname, file);
    const exists = fs.existsSync(fullPath);
    console.log(`   ${file}: ${exists ? '✅ Found' : '❌ Missing'}`);
  });
  
} catch (initError) {
  console.error(`❌ Initialization error: ${initError.message}`);
}

console.log('\n');

// Run the test
testAuth().catch(error => {
  console.error('💥 Test execution failed:', error);
});