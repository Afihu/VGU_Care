const fetch = require('node-fetch').default;

async function testLogin() {
  const res = await fetch('http://localhost:5001/api/users/login', {  // ← Changed from 5000 to 5001
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'student1@vgu.edu.vn',
      password: 'VGU2024!'
    })
  });
  const body = await res.json();
  if (!res.ok) {
    console.error('❌ /login failed:', res.status, body);
    process.exit(1);
  }
  console.log('✅ Login successful:', body);
  return body.token;
}

async function testGetProfile(token) {
  try {
    const res = await fetch('http://localhost:5001/api/users/me', {  // ← Changed from 5000 to 5001
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (res.ok) {
      console.log('✅ /me response:', data);
    } else {
      console.error('❌ /me returned', res.status, data);
    }
  } catch (error) {
    console.error('❌ /me test failed:', error.message);
  }
}

(async () => {
  const token = await testLogin();
  await testGetProfile(token);
})();