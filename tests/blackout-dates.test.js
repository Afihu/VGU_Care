const TestHelper = require('./helpers/testHelper');
const { makeRequest, API_BASE_URL } = require('./testFramework');

async function testBlackoutDates() {
  try {
    const testHelper = new TestHelper();
    await testHelper.initialize();

    console.log('🔍 Checking current blackout dates...');
    const response = await makeRequest(`${API_BASE_URL}/api/admin/blackout-dates`, 'GET', null, {
      'Authorization': `Bearer ${testHelper.auth.getToken('admin')}`
    });

    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(response.body, null, 2));

    // Test adding a holiday
    console.log('\n🎄 Adding Christmas as blackout date...');
    const addResponse = await makeRequest(`${API_BASE_URL}/api/admin/blackout-dates`, 'POST', {
      date: '2025-12-25',
      reason: 'Christmas Day',
      type: 'holiday'
    }, {
      'Authorization': `Bearer ${testHelper.auth.getToken('admin')}`
    });

    console.log('Add Response Status:', addResponse.status);
    console.log('Add Response Body:', JSON.stringify(addResponse.body, null, 2));

    // Check list again
    console.log('\n📋 Checking blackout dates list after adding...');
    const listResponse = await makeRequest(`${API_BASE_URL}/api/admin/blackout-dates`, 'GET', null, {
      'Authorization': `Bearer ${testHelper.auth.getToken('admin')}`
    });

    console.log('List Response:', JSON.stringify(listResponse.body, null, 2));

    // Test time slots for Christmas (should be empty)
    console.log('\n🕐 Checking time slots for Christmas (should be empty)...');
    const slotsResponse = await makeRequest(`${API_BASE_URL}/api/appointments/time-slots/2025-12-25`, 'GET', null, {
      'Authorization': `Bearer ${testHelper.auth.getToken('student')}`
    });

    console.log('Christmas Time Slots:', JSON.stringify(slotsResponse.body, null, 2));

  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

testBlackoutDates();
