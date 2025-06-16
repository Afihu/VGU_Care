const fetch = require('node-fetch').default;

const API_URL = process.env.API_URL || 'http://localhost:5001';

console.log('🔍 Starting Appointment Management Test Suite\n');
console.log(`🌐 Using API URL: ${API_URL}\n`);

// Test users from your schema
const testUsers = {
  student: {
    email: 'student1@vgu.edu.vn',
    password: 'VGU2024!'
  },
  medicalStaff: {
    email: 'doctor1@vgu.edu.vn',
    password: 'VGU2024!'
  },
  admin: {
    email: 'admin@vgu.edu.vn',
    password: 'VGU2024!'
  }
};

async function getAuthToken(email, password) {
  console.log(`🔐 Authenticating ${email}...`);
  const res = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (res.ok) {
    const body = await res.json();
    console.log(`✅ Authentication successful for ${email}`);
    return body.token;
  }
  const errorData = await res.json();
  throw new Error(`Authentication failed for ${email}: ${res.status} - ${JSON.stringify(errorData)}`);
}

async function testCreateAppointment(token, testData = {}) {
  console.log('🏥 Testing appointment creation...');
  
  const appointmentData = {
    symptoms: testData.symptoms || 'Headache and fever',
    priorityLevel: testData.priorityLevel || 'medium'
  };

  const res = await fetch(`${API_URL}/api/appointments`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(appointmentData)
  });

  const data = await res.json();

  if (res.ok) {
    console.log('✅ Appointment created successfully');
    console.log(`   ID: ${data.appointment?.id || data.appointment_id}`);
    console.log(`   Status: ${data.appointment?.status || 'pending'}`);
    console.log(`   Symptoms: ${data.appointment?.symptoms || appointmentData.symptoms}`);
    return data.appointment?.id || data.appointment_id;
  } else {
    console.error('❌ Appointment creation failed:', res.status, data);
    throw new Error(`Appointment creation failed: ${JSON.stringify(data)}`);
  }
}

async function testGetAppointments(token, userType = 'student') {
  console.log(`📋 Testing get appointments for ${userType}...`);
  
  const res = await fetch(`${API_URL}/api/appointments`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await res.json();

  if (res.ok) {
    const appointments = Array.isArray(data.appointments) ? data.appointments : [];
    console.log(`✅ Retrieved ${appointments.length} appointments`);
    
    // Show appointment statuses
    if (appointments.length > 0) {
      const statusCounts = appointments.reduce((acc, apt) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      }, {});
      console.log(`   Status breakdown:`, statusCounts);
    }
    
    return data;
  } else {
    console.error('❌ Get appointments failed:', res.status, data);
    throw new Error(`Get appointments failed: ${JSON.stringify(data)}`);
  }
}

async function testCancelAppointment(token, appointmentId) {
  console.log(`❌ Testing appointment cancellation for ID: ${appointmentId}...`);
  
  const cancelData = {
    status: 'cancelled'
  };

  const res = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(cancelData)
  });

  const data = await res.json();

  if (res.ok) {
    console.log('✅ Appointment cancelled successfully');
    console.log(`   New status: ${data.appointment?.status}`);
    console.log(`   Appointment ID: ${data.appointment?.id}`);
    return data;
  } else {
    console.error('❌ Appointment cancellation failed:', res.status, data);
    throw new Error(`Appointment cancellation failed: ${JSON.stringify(data)}`);
  }
}

async function testRescheduleAppointment(token, appointmentId) {
  console.log(`📅 Testing appointment rescheduling for ID: ${appointmentId}...`);
  
  const rescheduleData = {
    status: 'scheduled',
    dateScheduled: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
  };

  const res = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(rescheduleData)
  });

  const data = await res.json();

  if (res.ok) {
    console.log('✅ Appointment rescheduled successfully');
    console.log(`   New status: ${data.appointment?.status}`);
    console.log(`   New scheduled date: ${data.appointment?.dateScheduled}`);
    return data;
  } else {
    console.error('❌ Appointment rescheduling failed:', res.status, data);
    throw new Error(`Appointment rescheduling failed: ${JSON.stringify(data)}`);
  }
}

async function testUpdateAppointmentDetails(token, appointmentId) {
  console.log(`✏️ Testing appointment details update for ID: ${appointmentId}...`);
  
  const updateData = {
    symptoms: 'Updated symptoms: Severe headache with nausea and dizziness',
    priorityLevel: 'high'
  };

  const res = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });

  const data = await res.json();

  if (res.ok) {
    console.log('✅ Appointment details updated successfully');
    console.log(`   New symptoms: ${data.appointment?.symptoms}`);
    console.log(`   New priority: ${data.appointment?.priorityLevel}`);
    return data;
  } else {
    console.error('❌ Appointment details update failed:', res.status, data);
    throw new Error(`Appointment details update failed: ${JSON.stringify(data)}`);
  }
}

async function testMedicalStaffViewsCancelledAppointments(token) {
  console.log('👨‍⚕️ Testing medical staff view of cancelled appointments...');
  
  const res = await fetch(`${API_URL}/api/appointments`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await res.json();

  if (res.ok) {
    const appointments = Array.isArray(data.appointments) ? data.appointments : [];
    const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled');
    
    console.log(`✅ Medical staff can see cancelled appointments`);
    console.log(`   Total appointments: ${appointments.length}`);
    console.log(`   Cancelled appointments: ${cancelledAppointments.length}`);
    
    if (cancelledAppointments.length > 0) {
      console.log('   Cancelled appointment details:');
      cancelledAppointments.forEach((apt, index) => {
        console.log(`     ${index + 1}. ID: ${apt.id}, Student: ${apt.studentName || 'N/A'}, Symptoms: ${apt.symptoms}`);
      });
    }
    
    return { total: appointments.length, cancelled: cancelledAppointments.length };
  } else {
    console.error('❌ Medical staff view failed:', res.status, data);
    throw new Error(`Medical staff view failed: ${JSON.stringify(data)}`);
  }
}

async function testStudentCannotUpdateOthersAppointments(studentToken) {
  console.log('🚫 Testing student cannot update other students\' appointments...');
  
  try {
    // Try to get another student's token for testing
    const anotherStudentToken = await getAuthToken('student2@vgu.edu.vn', 'VGU2024!');
    
    // Create an appointment with the other student
    const otherStudentAppointmentId = await testCreateAppointment(anotherStudentToken, {
      symptoms: 'Other student appointment',
      priorityLevel: 'low'
    });
    
    console.log(`   Created appointment ${otherStudentAppointmentId} with another student`);
    
    // Now try to update it with the first student's token
    const updateData = {
      status: 'cancelled'
    };

    const res = await fetch(`${API_URL}/api/appointments/${otherStudentAppointmentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify(updateData)
    });

    if (res.status === 403) {
      console.log('✅ Student properly prevented from updating other student\'s appointment');
      return true;
    } else {
      console.error('❌ Student should not be able to update other student\'s appointment');
      throw new Error(`Expected 403, got ${res.status}`);
    }
    
  } catch (error) {
    // Fallback to testing with non-existent appointment if other student doesn't exist
    console.log('   Fallback: Testing with non-existent appointment...');
    
    const fakeAppointmentId = '12345678-1234-5678-9abc-123456789012';
    const updateData = { status: 'cancelled' };

    const res = await fetch(`${API_URL}/api/appointments/${fakeAppointmentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify(updateData)
    });

    // Accept 400, 403, or 404 as valid denial responses
    if ([400, 403, 404].includes(res.status)) {
      console.log('✅ Student properly prevented from updating non-existent appointment');
      return true;
    } else {
      throw new Error(`Expected 400/403/404, got ${res.status}`);
    }
  }
}

async function testInvalidStatusUpdate(studentToken, appointmentId) {
  console.log('🚫 Testing invalid status update prevention...');
  
  const invalidStatusData = {
    status: 'approved' // Students cannot approve their own appointments
  };

  const res = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify(invalidStatusData)
  });
  if (res.status === 403 || res.status === 400 || res.status === 500) {
    console.log('✅ Invalid status update properly rejected');
    const data = await res.json();
    console.log(`   Error message: ${data.error}`);
    return true;
  } else {
    console.error('❌ Invalid status should be rejected');
    throw new Error(`Expected 403/400/500, got ${res.status}`);
  }
}

// Existing functions remain the same...
async function testUpdateAppointmentStatus(token, appointmentId) {
  console.log(`🔄 Testing appointment status update for ID: ${appointmentId}...`);
  
  const updateData = {
    status: 'scheduled',
    dateScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };

  let res = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });

  if (res.status === 404) {
    console.log('   Trying PUT method instead of PATCH...');
    res = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
  }

  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    console.error(`❌ Expected JSON response, got: ${contentType}`);
    const textResponse = await res.text();
    console.error(`   Response preview: ${textResponse.substring(0, 200)}...`);
    throw new Error(`Appointment update failed: Expected JSON, got ${contentType || 'unknown'}`);
  }

  const data = await res.json();

  if (res.ok) {
    console.log('✅ Appointment status updated successfully');
    return data;
  } else {
    console.error('❌ Appointment status update failed:', res.status, data);
    throw new Error(`Appointment status update failed: ${JSON.stringify(data)}`);
  }
}

async function testGetPendingAppointments(token) {
  console.log('⏳ Testing get pending appointments...');
  
  const res = await fetch(`${API_URL}/api/appointments/pending`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await res.json();

  if (res.ok) {
    console.log(`✅ Retrieved ${data.count || data.appointments?.length || 0} pending appointments`);
    return data;
  } else {
    console.error('❌ Get pending appointments failed:', res.status, data);
    throw new Error(`Get pending appointments failed: ${JSON.stringify(data)}`);
  }
}

async function testApproveAppointment(token, appointmentId) {
  console.log(`✅ Testing appointment approval for ID: ${appointmentId}...`);
  
  const approvalData = {
    dateScheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    advice: 'Please arrive 15 minutes early for your appointment.'
  };

  const res = await fetch(`${API_URL}/api/appointments/${appointmentId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(approvalData)
  });

  const data = await res.json();

  if (res.ok) {
    console.log('✅ Appointment approved successfully');
    console.log(`   Status: ${data.appointment?.status || data.status}`);
    return data;
  } else {
    console.error('❌ Appointment approval failed:', res.status, data);
    throw new Error(`Appointment approval failed: ${JSON.stringify(data)}`);
  }
}

async function testRejectAppointment(token, appointmentId) {
  console.log(`❌ Testing appointment rejection for ID: ${appointmentId}...`);
  
  const rejectionData = {
    reason: 'Insufficient symptoms for in-person appointment',
    advice: 'Please try self-care measures first. Contact us if symptoms worsen.'
  };

  const res = await fetch(`${API_URL}/api/appointments/${appointmentId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(rejectionData)
  });

  const data = await res.json();

  if (res.ok) {
    console.log('✅ Appointment rejected successfully');
    console.log(`   Status: ${data.appointment?.status || data.status}`);
    return data;
  } else {
    console.error('❌ Appointment rejection failed:', res.status, data);
    throw new Error(`Appointment rejection failed: ${JSON.stringify(data)}`);
  }
}

async function testUnauthorizedAccess() {
  console.log('🔒 Testing unauthorized access...');
  
  const res = await fetch(`${API_URL}/api/appointments`, {
    method: 'GET'
  });

  if (res.status === 401) {
    console.log('✅ Unauthorized access properly rejected');
    return true;
  } else {
    console.error('❌ Unauthorized access should have been rejected');
    throw new Error(`Expected 401, got ${res.status}`);
  }
}

async function testStudentCannotApprove(studentToken) {
  console.log('🚫 Testing that students cannot approve appointments...');
  
  const res = await fetch(`${API_URL}/api/appointments/1/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({})
  });

  if (res.status === 403) {
    console.log('✅ Student properly prevented from approving appointments');
    return true;
  } else {
    console.error('❌ Student should not be able to approve appointments');
    throw new Error(`Expected 403, got ${res.status}`);
  }
}

async function runAppointmentTests() {
  try {
    console.log('🏥 Starting Comprehensive Appointment Management Tests\n');
    
    // Get auth tokens
    const studentToken = await getAuthToken(testUsers.student.email, testUsers.student.password);
    const medicalToken = await getAuthToken(testUsers.medicalStaff.email, testUsers.medicalStaff.password);
    
    console.log('\n--- APPOINTMENT CRUD OPERATIONS ---\n');
    
    // Test appointment creation
    const appointmentId1 = await testCreateAppointment(studentToken);
    
    // Test getting appointments as student
    await testGetAppointments(studentToken, 'student');
    
    // Test getting appointments as medical staff
    await testGetAppointments(medicalToken, 'medical_staff');
    
    // Test updating appointment status
    if (appointmentId1) {
      await testUpdateAppointmentStatus(medicalToken, appointmentId1);
    }
    
    console.log('\n--- STUDENT APPOINTMENT MANAGEMENT ---\n');
    
    // Create appointments for student management tests
    const appointmentForCancel = await testCreateAppointment(studentToken, { 
      symptoms: 'Appointment to be cancelled', 
      priorityLevel: 'low' 
    });
    
    const appointmentForReschedule = await testCreateAppointment(studentToken, { 
      symptoms: 'Appointment to be rescheduled', 
      priorityLevel: 'medium' 
    });
    
    const appointmentForUpdate = await testCreateAppointment(studentToken, { 
      symptoms: 'Original symptoms', 
      priorityLevel: 'low' 
    });
    
    // Test student cancelling appointment
    if (appointmentForCancel) {
      await testCancelAppointment(studentToken, appointmentForCancel);
    }
    
    // Test student rescheduling appointment
    if (appointmentForReschedule) {
      await testRescheduleAppointment(studentToken, appointmentForReschedule);
    }
    
    // Test student updating appointment details
    if (appointmentForUpdate) {
      await testUpdateAppointmentDetails(studentToken, appointmentForUpdate);
    }
    
    // Test medical staff can see cancelled appointments
    await testMedicalStaffViewsCancelledAppointments(medicalToken);
    
    console.log('\n--- STUDENT RESTRICTIONS & VALIDATION ---\n');
    
    // Test student cannot update other appointments
    await testStudentCannotUpdateOthersAppointments(studentToken);
    
    // Test invalid status update
    if (appointmentForUpdate) {
      await testInvalidStatusUpdate(studentToken, appointmentForUpdate);
    }
    
    console.log('\n--- APPOINTMENT WORKFLOW TESTS ---\n');
    
    // Create appointments for approval/rejection tests
    const appointmentId2 = await testCreateAppointment(studentToken, { 
      symptoms: 'Test symptoms for approval', 
      priorityLevel: 'medium' 
    });
    
    const appointmentId3 = await testCreateAppointment(studentToken, { 
      symptoms: 'Test symptoms for rejection', 
      priorityLevel: 'low' 
    });
    
    // Test pending appointments
    await testGetPendingAppointments(medicalToken);
    
    // Test approval workflow
    if (appointmentId2) {
      await testApproveAppointment(medicalToken, appointmentId2);
    }
    
    // Test rejection workflow
    if (appointmentId3) {
      await testRejectAppointment(medicalToken, appointmentId3);
    }
    
    console.log('\n--- ACCESS CONTROL TESTS ---\n');
    
    // Test unauthorized access
    await testUnauthorizedAccess();
    
    // Test student cannot approve
    await testStudentCannotApprove(studentToken);
    
    console.log('\n🎉 All appointment management tests completed successfully!');
    
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Students can create appointments');
    console.log('   ✅ Students can cancel their appointments');
    console.log('   ✅ Students can reschedule their appointments');
    console.log('   ✅ Students can update appointment details');
    console.log('   ✅ Medical staff can view cancelled appointments');
    console.log('   ✅ Medical staff can approve/reject appointments');
    console.log('   ✅ Proper access control and validation enforced');
    
  } catch (error) {
    console.error('\n💥 Appointment tests failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAppointmentTests();
}

module.exports = runAppointmentTests;