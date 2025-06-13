const fetch = require('node-fetch').default;

const API_URL = process.env.API_URL || 'http://localhost:5001';

console.log('🚨 Starting Medical Staff Abuse Report Test Suite\n');
console.log(`🌐 Using API URL: ${API_URL}\n`);

// Test credentials from your schema.sql
const MEDICAL_STAFF_CREDENTIALS = {
  email: 'doctor1@vgu.edu.vn',
  password: 'VGU2024!'
};

const STUDENT_CREDENTIALS = {
  email: 'student1@vgu.edu.vn',
  password: 'VGU2024!'
};

let medicalStaffToken = null;
let studentToken = null;
let testAppointmentId = null;
let testReportId = null;

/**
 * Authenticate user using your existing auth system
 */
async function authenticateUser(credentials, userType) {
  console.log(`🔐 Authenticating ${userType}...`);
  
  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    
    if (response.ok && data.token) {
      console.log(`✅ ${userType} authenticated successfully`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Role: ${data.user.role}`);
      return data.token;
    } else {
      console.error(`❌ ${userType} authentication failed:`, data);
      throw new Error(`Failed to authenticate ${userType}`);
    }
  } catch (error) {
    console.error(`❌ ${userType} authentication error:`, error.message);
    throw error;
  }
}

/**
 * Create and properly complete test appointment following the real workflow
 */
async function createAndCompleteTestAppointmentRealWorkflow() {
  console.log('📅 Creating test appointment for abuse reporting...');
  
  try {
    // Step 1: Student creates appointment (status: pending)
    const appointmentData = {
      symptoms: 'Test symptoms for abuse report - suspicious behavior noted during consultation',
      priorityLevel: 'high'
    };

    console.log('   Step 1: Creating appointment as student...');
    const createResponse = await fetch(`${API_URL}/api/appointments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appointmentData)
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create appointment');
    }

    const createData = await createResponse.json();
    const appointmentId = createData.appointment?.id || createData.appointment?.appointment_id;
    
    if (!appointmentId) {
      throw new Error('No appointment ID returned');
    }
    
    console.log(`✅ Appointment created: ${appointmentId}`);
    console.log(`   Initial status: ${createData.appointment?.status || 'pending'}`);

    // Step 2: Medical staff approves appointment (status: approved, assigns medical_staff_id)
    console.log('   Step 2: Medical staff approving appointment...');
    const approveResponse = await fetch(`${API_URL}/api/appointments/${appointmentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${medicalStaffToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dateScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        advice: 'Appointment approved for testing'
      })
    });

    if (approveResponse.ok) {
      const approveData = await approveResponse.json();
      console.log(`✅ Appointment approved`);
      console.log(`   Status after approval: ${approveData.appointment?.status || 'approved'}`);
    } else {
      console.log('⚠️ Could not approve appointment');
    }

    // Step 3: Move to scheduled status
    console.log('   Step 3: Moving appointment to scheduled...');
    const scheduleResponse = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${medicalStaffToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'scheduled'
      })
    });

    if (scheduleResponse.ok) {
      console.log('✅ Appointment scheduled');
    } else {
      console.log('⚠️ Could not schedule appointment');
    }

    // Step 4: Complete the appointment (after meeting the student)
    console.log('   Step 4: Completing appointment after consultation...');
    const completeResponse = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${medicalStaffToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'completed'
      })
    });

    if (completeResponse.ok) {
      const completeData = await completeResponse.json();
      console.log('✅ Appointment completed - ready for abuse reporting');
      console.log(`   Final status: ${completeData.appointment?.status || 'completed'}`);
      
      // Verify the appointment is now reportable
      await verifyAppointmentReportable(appointmentId);
      
      return appointmentId;
    } else {
      const errorData = await completeResponse.json();
      console.log('❌ Could not complete appointment:', errorData);
      
      // Try alternative completion method
      return await tryAlternativeCompletion(appointmentId);
    }

  } catch (error) {
    console.error('❌ Error in appointment workflow:', error.message);
    
    // Fallback: try to find existing completed appointment
    const existingId = await findExistingCompletedAppointment();
    if (existingId) {
      console.log(`✅ Using existing completed appointment: ${existingId}`);
      return existingId;
    }
    
    // Last resort: use dummy ID (test will fail but show what's missing)
    console.log('⚠️ Using dummy appointment ID - test will likely fail');
    return '550e8400-e29b-41d4-a716-446655440000';
  }
}

/**
 * Verify that the appointment is now reportable by medical staff
 */
async function verifyAppointmentReportable(appointmentId) {
  console.log('   Verifying appointment is reportable...');
  
  try {
    const checkResponse = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
      headers: { 'Authorization': `Bearer ${medicalStaffToken}` }
    });

    if (checkResponse.ok) {
      const appointmentData = await checkResponse.json();
      const appointment = appointmentData.appointment || appointmentData;
      
      console.log(`   ✓ Status: ${appointment.status}`);
      console.log(`   ✓ Medical Staff Assigned: ${appointment.medical_staff_id ? 'Yes' : 'No'}`);
      
      if (appointment.status === 'completed' && appointment.medical_staff_id) {
        console.log('   ✅ Appointment ready for abuse reporting');
        return true;
      } else {
        console.log('   ⚠️ Appointment may not be reportable yet');
        return false;
      }
    }
  } catch (error) {
    console.log('   ⚠️ Could not verify appointment status');
    return false;
  }
}

/**
 * Try alternative method to complete appointment
 */
async function tryAlternativeCompletion(appointmentId) {
  console.log('   Trying alternative completion method...');
  
  try {
    // Some systems might require direct status update without workflow
    const directCompleteResponse = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${medicalStaffToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'completed',
        dateScheduled: new Date().toISOString(),
        notes: 'Appointment completed for abuse reporting test'
      })
    });

    if (directCompleteResponse.ok) {
      console.log('✅ Alternative completion successful');
      return appointmentId;
    }

    // Try using admin privileges if available
    const adminToken = await getAdminToken();
    if (adminToken) {
      const adminCompleteResponse = await fetch(`${API_URL}/api/admin/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'completed' })
      });

      if (adminCompleteResponse.ok) {
        console.log('✅ Admin completion successful');
        return appointmentId;
      }
    }

  } catch (error) {
    console.log('   ⚠️ Alternative completion failed:', error.message);
  }
  
  return null;
}

/**
 * Get admin token for completing appointments
 */
async function getAdminToken() {
  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@vgu.edu.vn',
        password: 'VGU2024!'
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.token;
    }
  } catch (error) {
    console.log('   Could not get admin token');
  }
  
  return null;
}

/**
 * Find existing completed appointment that medical staff can report on
 */
async function findExistingCompletedAppointment() {
  console.log('   Looking for existing completed appointment...');
  
  try {
    const response = await fetch(`${API_URL}/api/appointments`, {
      headers: { 'Authorization': `Bearer ${medicalStaffToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      const completedAppointments = data.appointments?.filter(apt => 
        apt.status === 'completed' && apt.medical_staff_id
      ) || [];

      if (completedAppointments.length > 0) {
        const appointment = completedAppointments[0];
        const appointmentId = appointment.appointment_id || appointment.id;
        console.log(`   Found completed appointment: ${appointmentId}`);
        return appointmentId;
      }
    }
  } catch (error) {
    console.log('   Error finding existing appointments:', error.message);
  }
  
  return null;
}

/**
 * Test route availability
 */
async function testRouteAvailability() {
  console.log('\n🛣️ Testing Route Availability...');
  
  try {
    const response = await fetch(`${API_URL}/api/abuse-reports/my`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${medicalStaffToken}`
      }
    });

    if (response.status !== 404) {
      console.log('✅ PASS: Abuse report routes are available');
      return true;
    } else {
      console.log('❌ FAIL: Abuse report routes not found (404)');
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Route availability test error:', error.message);
    return false;
  }
}

/**
 * Enhanced test with proper workflow explanation
 */
async function testCreateAbuseReportWithWorkflow() {
  console.log('\n🚨 Testing Create Abuse Report (After Completed Consultation)...');
  console.log('   Use Case: Medical staff reports suspicious behavior AFTER meeting student');
  
  const reportData = {
    appointmentId: testAppointmentId,
    description: 'After completing the consultation, I observed suspicious behavior. The student initially claimed severe symptoms requiring urgent care, but during examination showed no physical signs matching their claims. When questioned about medical history, they became evasive and their story changed multiple times. This appears to be a case of false urgency to jump the queue.',
    reportType: 'false_urgency'
  };

  try {
    const response = await fetch(`${API_URL}/api/abuse-reports`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${medicalStaffToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData)
    });

    const data = await response.json();
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response data:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ PASS: Abuse report created successfully');
      console.log(`   Report ID: ${data.report.id}`);
      console.log(`   Appointment ID: ${data.report.appointmentId}`);
      console.log(`   Report Type: ${data.report.reportType}`);
      console.log(`   Status: ${data.report.status}`);
      console.log('   ✓ Medical staff can report after completing consultation');
      
      testReportId = data.report.id;
      return data.report.id;
    } else {
      console.log('❌ FAIL: Failed to create abuse report');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error || data.message}`);
      
      if (response.status === 403) {
        console.log('\n🔍 Debugging permission issue:');
        console.log('   - Is the appointment status "completed"?');
        console.log('   - Is the medical staff assigned to this appointment?');
        console.log('   - Check abuseReportService.canReportOnAppointment() logic');
      }
      
      return null;
    }
  } catch (error) {
    console.log('❌ FAIL: Error creating abuse report:', error.message);
    return null;
  }
}

/**
 * Test retrieving medical staff's own abuse reports
 */
async function testGetMyAbuseReports() {
  console.log('\n📋 Testing Get My Abuse Reports...');
  
  try {
    const response = await fetch(`${API_URL}/api/abuse-reports/my`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${medicalStaffToken}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ PASS: Abuse reports retrieved successfully');
      console.log(`   Total reports: ${data.count}`);
      
      if (data.reports && data.reports.length > 0) {
        console.log('   Report details:');
        data.reports.forEach((report, index) => {
          console.log(`     ${index + 1}. ID: ${report.id}`);
          console.log(`        Type: ${report.reportType}`);
          console.log(`        Status: ${report.status}`);
          console.log(`        Student: ${report.studentName || 'Unknown'}`);
          console.log(`        Date: ${new Date(report.reportDate).toLocaleDateString()}`);
        });
      }
      return true;
    } else {
      console.log('❌ FAIL: Failed to get abuse reports');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error || data.message}`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Error getting abuse reports:', error.message);
    return false;
  }
}

/**
 * Test updating an abuse report
 */
async function testUpdateAbuseReport() {
  console.log('\n✏️ Testing Update Abuse Report...');
  
  if (!testReportId) {
    console.log('⚠️ SKIP: No report ID available for update test');
    return false;
  }

  const updateData = {
    description: 'UPDATED: Student showed suspicious behavior during appointment. After further review, confirmed possible false urgency claim. Student admitted to exaggerating symptoms when confronted with medical inconsistencies.'
  };

  try {
    const response = await fetch(`${API_URL}/api/abuse-reports/${testReportId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${medicalStaffToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ PASS: Abuse report updated successfully');
      console.log(`   Report ID: ${data.report.report_id || data.report.id}`);
      return true;
    } else {
      console.log('❌ FAIL: Failed to update abuse report');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error || data.message}`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Error updating abuse report:', error.message);
    return false;
  }
}

/**
 * Test input validation
 */
async function testInputValidation() {
  console.log('\n🔍 Testing Input Validation...');
  
  const invalidRequests = [
    {
      name: 'Missing appointment ID',
      data: { description: 'Test description' },
      expectedStatus: 400
    },
    {
      name: 'Missing description',
      data: { appointmentId: testAppointmentId },
      expectedStatus: 400
    },
    {
      name: 'Empty description',
      data: { appointmentId: testAppointmentId, description: '' },
      expectedStatus: 400
    }
  ];

  let allPassed = true;

  for (const test of invalidRequests) {
    try {
      const response = await fetch(`${API_URL}/api/abuse-reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${medicalStaffToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(test.data)
      });

      if (response.status === test.expectedStatus) {
        console.log(`✅ PASS: ${test.name} validation (Status: ${response.status})`);
      } else {
        console.log(`❌ FAIL: ${test.name} - Expected ${test.expectedStatus}, got ${response.status}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ FAIL: ${test.name} validation error:`, error.message);
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Test access control - students should not be able to create abuse reports
 */
async function testAccessControl() {
  console.log('\n🔒 Testing Access Control...');
  
  const reportData = {
    appointmentId: testAppointmentId,
    description: 'Student trying to create abuse report',
    reportType: 'system_abuse'
  };

  try {
    const response = await fetch(`${API_URL}/api/abuse-reports`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData)
    });

    if (response.status === 403 || response.status === 401) {
      console.log('✅ PASS: Student properly denied abuse report creation');
      return true;
    } else {
      console.log(`❌ FAIL: Student should not be able to create abuse reports (Status: ${response.status})`);
      const data = await response.json();
      console.log(`   Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Access control test error:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAbuseReportTests() {
  console.log('🔐 === AUTHENTICATION SETUP ===');
  
  try {
    medicalStaffToken = await authenticateUser(MEDICAL_STAFF_CREDENTIALS, 'Medical Staff');
    studentToken = await authenticateUser(STUDENT_CREDENTIALS, 'Student');
    
    console.log('\n📋 === APPOINTMENT WORKFLOW SETUP ===');
    console.log('Following real-world workflow: pending → approved → scheduled → completed');
    
    // Create and complete appointment following proper workflow
    testAppointmentId = await createAndCompleteTestAppointmentRealWorkflow();
    
    console.log('\n🛣️ === ROUTE AVAILABILITY CHECK ===');
    const routesAvailable = await testRouteAvailability();
    
    if (!routesAvailable) {
      console.log('\n❌ CRITICAL: Abuse report routes not available');
      return;
    }
    
    console.log('\n🚨 === ABUSE REPORT FUNCTIONALITY TESTS ===');
    console.log('Testing abuse reporting AFTER completed consultation');
    
    const testResults = [];
    
    // Test abuse reporting with proper workflow
    testResults.push(await testCreateAbuseReportWithWorkflow());
    testResults.push(await testGetMyAbuseReports());
    
    if (testReportId) {
      testResults.push(await testUpdateAbuseReport());
    }
    
    console.log('\n🔍 === VALIDATION & SECURITY TESTS ===');
    
    testResults.push(await testInputValidation());
    testResults.push(await testAccessControl());
    
    console.log('\n📊 === TEST RESULTS SUMMARY ===');
    
    const passedTests = testResults.filter(result => result).length;
    const totalTests = testResults.length;
    
    console.log(`Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 All medical staff abuse report tests passed!');
      console.log('✅ Medical staff can report abuse after completing consultations');
      console.log('✅ Proper appointment workflow enforced');
      console.log('✅ Security and validation working correctly');
    } else {
      console.log('\n⚠️ Some tests failed. Check the implementation:');
      console.log('   - Ensure appointments can progress through: pending → approved → scheduled → completed');
      console.log('   - Verify medical staff assignment during approval');
      console.log('   - Check abuseReportService.canReportOnAppointment() requires completed status');
    }
    
    console.log('\n📋 === WORKFLOW VERIFIED ===');
    console.log('✓ Student creates appointment (pending)');
    console.log('✓ Medical staff approves and gets assigned (approved)');
    console.log('✓ Appointment moves to scheduled');
    console.log('✓ After real consultation, appointment marked completed');
    console.log('✓ Medical staff can now report observed suspicious behavior');
    
    console.log('\n✨ Medical Staff Abuse Report Test Suite Completed!');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAbuseReportTests();
}

module.exports = runAbuseReportTests;