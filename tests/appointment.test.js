const fetch = require('node-fetch').default;

const API_URL = process.env.API_URL || 'http://localhost:5001';

console.log('🔍 Starting Appointment Management Test Suite\n');
console.log(`🌐 Using API URL: ${API_URL}\n`);

const testStudent = {
  email: 'teststudent@vgu.edu.vn',
  password: 'TestVGU2024!'
};

const newAppointment = {
  symptoms: 'Headache and fever',
  priorityLevel: 'medium'
};

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

async function testCreateAppointment(token) {
  const res = await fetch(`${API_URL}/api/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(newAppointment)
  });

  const data = await res.json();

  if (res.ok) {
    console.log('✅ Appointment created successfully:', data.appointment);
    return data.appointment.id;
  } else {
    console.error('❌ Appointment creation failed:', res.status, data);
    return null;
  }
}

async function testUpdateAppointment(token, appointmentId) {
  try {
    console.log('🔄 Testing appointment update...');
    console.log(`Using appointment ID: ${appointmentId}`);

    const updatePayload = {
      symptoms: 'Updated: Mild headache, slight cough, and fatigue',
      status: 'scheduled', // Example: Student rescheduling or confirming
      priorityLevel: 'medium', // Example: Student downgrading priority
      dateScheduled: '2025-07-01T10:00:00.000Z' // Example: Student proposing a new date/time
    };

    console.log('🔄 Sending update payload:', JSON.stringify(updatePayload, null, 2));

    const res = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatePayload)
    });

    const responseText = await res.text(); // Get raw response text for debugging
    let data;
    try {
      data = JSON.parse(responseText); // Try to parse as JSON
    } catch (e) {
      console.error('❌ Failed to parse JSON response:', responseText);
      throw new Error(`Failed to parse JSON response: ${e.message}`);
    }

    if (res.ok) {
      console.log('✅ Appointment updated successfully:', data.appointment);
      // Add assertions here to check if the fields were actually updated
      if (data.appointment.symptoms !== updatePayload.symptoms) {
        console.warn('⚠️ Symptoms were not updated as expected.');
      }
      if (data.appointment.status !== updatePayload.status) {
        console.warn('⚠️ Status was not updated as expected.');
      }
      if (data.appointment.priorityLevel !== updatePayload.priorityLevel) {
        console.warn('⚠️ Priority level was not updated as expected.');
      }
      // Note: Comparing date strings can be tricky due to timezones/formatting.
      // For simplicity, we'll log it. A more robust check might parse and compare Date objects.
      console.log('Updated dateScheduled:', data.appointment.dateScheduled);
      return true;
    } else {
      console.error('❌ Appointment update failed:', res.status, data);
      return false;
    }
  } catch (error) {
    console.error('❌ Appointment update error:', error.message);
    return false;
  }
}

async function runAppointmentTests() {
  const token = await getAuthToken(testStudent.email, testStudent.password);
  const appointmentId = await testCreateAppointment(token);
  console.log(`Created appointment ID: ${appointmentId}`);

  if (appointmentId) {
    const updateSuccess = await testUpdateAppointment(token, appointmentId);
    console.log(`Update success: ${updateSuccess}`);
  }
}

runAppointmentTests();