const authService = require('./services/authService');

async function testAuth() {
  try {
    // Test login with sample user
    const result = await authService.authenticate('student1@vgu.edu.vn', 'VGU2024!');
    console.log('✅ Login successful:', result);
    
    // Test token verification
    const decoded = await authService.verifyToken(result.token);
    console.log('✅ Token valid:', decoded);
    
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
  }
}

testAuth();

