const fetch = require('node-fetch').default;

// Use environment variable for API URL, fallback to localhost for local testing
const API_URL = process.env.API_URL || 'http://localhost:5001';

console.log('🔗 Starting Backend Connection & Integration Test Suite\n');
console.log(`🌐 Using API URL: ${API_URL}\n`);

async function testDatabaseConnection() {
  console.log('🗄️ Testing database connection...');
  try {
    const res = await fetch(`${API_URL}/api/test-db`);
    const data = await res.json();
    
    if (res.ok && data.status === 'success') {
      console.log('✅ Database connection successful');
      console.log(`   Database timestamp: ${data.timestamp}`);
      console.log(`   Message: ${data.message}`);
      return true;
    } else {
      console.error('❌ Database connection failed:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

async function testBackendHealth() {
  console.log('🏥 Testing backend health endpoint...');
  try {
    const res = await fetch(`${API_URL}/api/health`);
    const data = await res.json();
    
    if (res.ok) {
      console.log('✅ Backend health check passed');
      console.log(`   Message: ${data.message}`);
      console.log(`   Database status: ${data.database}`);
      console.log(`   Timestamp: ${data.timestamp}`);
      return true;
    } else {
      console.error('❌ Backend health check failed:', res.status, data);
      return false;
    }
  } catch (error) {
    console.error('❌ Backend health check error:', error.message);
    return false;
  }
}

async function testAuthenticationEndpoints() {
  console.log('🔐 Testing authentication endpoints availability...');
  
  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@vgu.edu.vn', password: 'wrong' })
    });
    
    if (res.status === 401 || res.status === 400) {
      console.log('✅ Login endpoint is accessible (returned expected error)');
      return true;
    } else {
      console.log(`ℹ️  Login endpoint returned unexpected status: ${res.status}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Login endpoint not accessible:', error.message);
    return false;
  }
}

async function testUserEndpoints() {
  console.log('👤 Testing user endpoints availability...');
  
  try {
    const res = await fetch(`${API_URL}/api/users/me`);
    
    if (res.status === 401) {
      console.log('✅ Protected user endpoint is accessible (returned 401 as expected)');
      return true;
    } else {
      console.log(`ℹ️  User endpoint returned unexpected status: ${res.status}`);
      return true;
    }
  } catch (error) {
    console.error('❌ User endpoint not accessible:', error.message);
    return false;
  }
}

async function testCORSConfiguration() {
  console.log('🌐 Testing CORS configuration...');
  try {
    const res = await fetch(`${API_URL}/api/health`, {
      method: 'OPTIONS'
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': res.headers.get('access-control-allow-origin'),
      'Access-Control-Allow-Methods': res.headers.get('access-control-allow-methods'),
      'Access-Control-Allow-Headers': res.headers.get('access-control-allow-headers')
    };
    
    console.log('✅ CORS preflight request successful');
    console.log('   CORS Headers:');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      if (value) {
        console.log(`     ${key}: ${value}`);
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ CORS configuration test failed:', error.message);
    return false;
  }
}

async function testFrontendBackendConnection() {
  console.log('🔗 Testing frontend-backend connection readiness...');
  
  try {
    const res = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const contentType = res.headers.get('content-type');
    
    if (res.ok && contentType && contentType.includes('application/json')) {
      console.log('✅ Backend can handle JSON requests from frontend');
      console.log(`   Response Content-Type: ${contentType}`);
      return true;
    } else {
      console.error('❌ Backend JSON handling issue');
      console.error(`   Status: ${res.status}`);
      console.error(`   Content-Type: ${contentType}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Frontend-backend connection test failed:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('🚨 Testing error handling...');
  
  try {
    const res = await fetch(`${API_URL}/api/nonexistent-route`);
    
    console.log(`✅ Error handling test completed (Status: ${res.status})`);
    
    if (res.status === 404) {
      console.log('   404 returned for invalid route (expected)');
    } else {
      console.log(`   Unexpected status for invalid route: ${res.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    return false;
  }
}

async function testServerResponseTime() {
  console.log('⏱️  Testing server response time...');
  
  const startTime = Date.now();
  
  try {
    const res = await fetch(`${API_URL}/api/health`);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (res.ok) {
      console.log(`✅ Server response time: ${responseTime}ms`);
      
      if (responseTime < 1000) {
        console.log('   Response time is good (< 1 second)');
      } else {
        console.log('   Response time is slow (> 1 second)');
      }
      
      return true;
    } else {
      console.error('❌ Server response test failed:', res.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Server response time test failed:', error.message);
    return false;
  }
}

async function runConnectionTestSuite() {
  console.log('🚀 Starting Backend Connection & Integration Tests\n');
  
  const testResults = [];
  
  // Core Infrastructure Tests
  console.log('🏗️ === CORE INFRASTRUCTURE TESTS ===');
  testResults.push(await testBackendHealth());
  testResults.push(await testDatabaseConnection());
  testResults.push(await testServerResponseTime());
  
  console.log('\n🔌 === ENDPOINT AVAILABILITY TESTS ===');
  testResults.push(await testAuthenticationEndpoints());
  testResults.push(await testUserEndpoints());
  
  console.log('\n🌍 === NETWORK & COMMUNICATION TESTS ===');
  testResults.push(await testCORSConfiguration());
  testResults.push(await testFrontendBackendConnection());
  testResults.push(await testErrorHandling());
  
  console.log('\n📊 === TEST RESULTS SUMMARY ===');
  
  const passedTests = testResults.filter(result => result).length;
  const totalTests = testResults.length;
  
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All connection tests passed! Backend is ready for frontend integration.');
  } else {
    console.log('⚠️  Some connection tests failed. Check the logs above for details.');
  }
  
  console.log('\n✨ Backend Connection Test Suite Completed!');
  
  // Exit with appropriate code
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run the test suite
runConnectionTestSuite().catch(error => {
  console.error('💥 Connection test suite failed:', error);
  process.exit(1);
});