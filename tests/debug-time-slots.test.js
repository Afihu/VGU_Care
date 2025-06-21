const TestHelper = require('./helpers/testHelper');
const { makeRequest, API_BASE_URL } = require('./testFramework');

async function debugTimeSlots() {
  try {
    const testHelper = new TestHelper();
    await testHelper.initialize();

    // Test what date the appointment helper is using
    const nextWeekday = new Date();
    nextWeekday.setDate(nextWeekday.getDate() + 1);
    
    // Skip weekends - find next Monday-Friday
    while (nextWeekday.getDay() === 0 || nextWeekday.getDay() === 6) {
      nextWeekday.setDate(nextWeekday.getDate() + 1);
    }
    
    const appointmentDate = nextWeekday.toISOString().split('T')[0];
    const dayOfWeek = nextWeekday.getDay();
    
    console.log('🗓️ Debug Info:');
    console.log('Current date:', new Date().toISOString());
    console.log('Appointment date:', appointmentDate);
    console.log('Day of week (JS):', dayOfWeek, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]);

    // Check time slots for this date
    console.log('\n🕐 Checking time slots for', appointmentDate);
    const slotsResponse = await makeRequest(`${API_BASE_URL}/api/appointments/time-slots/${appointmentDate}`, 'GET', null, {
      'Authorization': `Bearer ${testHelper.auth.getToken('student')}`
    });

    console.log('Time slots response:', JSON.stringify(slotsResponse.body, null, 2));

    // Try to create appointment
    console.log('\n🧪 Trying to create appointment...');
    const appointmentResponse = await makeRequest(`${API_BASE_URL}/api/appointments`, 'POST', {
      symptoms: 'Debug test symptoms',
      priorityLevel: 'medium',
      healthIssueType: 'physical',
      dateScheduled: appointmentDate,
      timeScheduled: '10:00:00'
    }, {
      'Authorization': `Bearer ${testHelper.auth.getToken('student')}`
    });

    console.log('Appointment creation response:', JSON.stringify(appointmentResponse.body, null, 2));

    // Check database directly
    console.log('\n🗄️ Let me check if 10:00:00 exists in time_slots for day', dayOfWeek);
    
  } catch (error) {
    console.error('Debug Error:', error.message);
  }
}

debugTimeSlots();
