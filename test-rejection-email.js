// Load environment variables
require('dotenv').config({ path: './backend/.env' });

const { query } = require('./backend/config/database');
const appointmentService = require('./backend/services/appointmentService');

async function testRejectionEmail() {
  console.log('🧪 Testing Appointment Rejection Email with Real Addresses');
  console.log('=' .repeat(60));

  try {
    // Create test users with the email addresses from the test
    const { v4: uuidv4 } = require('uuid');
    const studentId = uuidv4();
    const staffUserId = uuidv4();
    const staffId = uuidv4();

    console.log('👥 Creating test users...');
    
    // Create test student with the email that should receive rejection emails
    await query(`
      INSERT INTO users (user_id, name, email, role, password_hash, status, gender, age)
      VALUES ($1, 'Test Student', '10422061@student.vgu.edu.vn', 'student', 'dummy_hash', 'active', 'male', 20)
    `, [studentId]);
    
    await query(`
      INSERT INTO students (user_id, intake_year, major, housing_location)
      VALUES ($1, 2023, 'Computer Science', 'dorm_1')
    `, [studentId]);

    // Create test medical staff with the email that should send notifications
    await query(`
      INSERT INTO users (user_id, name, email, role, password_hash, status, gender, age)
      VALUES ($1, 'Dr. Test Rejection', 'nhimaihello@gmail.com', 'medical_staff', 'dummy_hash', 'active', 'female', 35)
    `, [staffUserId]);
    
    await query(`
      INSERT INTO medical_staff (staff_id, user_id, specialty, specialty_group)
      VALUES ($1, $2, 'General Medicine', 'physical')
    `, [staffId, staffUserId]);

    console.log('✅ Test users created');
    console.log(`👩‍🎓 Student: Test Student (10422061@student.vgu.edu.vn)`);
    console.log(`👩‍⚕️ Medical Staff: Dr. Test Rejection (nhimaihello@gmail.com)`);

    // Create appointment
    console.log('\n📋 Creating appointment...');
    const appointment = await appointmentService.createAppointment(
      studentId,
      'Test rejection symptoms - severe headache requiring urgent attention',
      'high',
      'physical',
      staffId,
      '2025-06-30', // Monday
      '11:00:00'
    );

    console.log(`✅ Appointment created: ${appointment.id}`);

    // Reject the appointment
    console.log('\n❌ Rejecting appointment...');
    const rejectedAppointment = await appointmentService.rejectAppointment(
      appointment.id,
      staffUserId,
      'After review, we need additional medical documentation before proceeding. Please contact our office to schedule a preliminary consultation.'
    );

    console.log(`✅ Appointment rejected: ${rejectedAppointment.status}`);

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await query('DELETE FROM appointments WHERE appointment_id = $1', [appointment.id]);
    await query('DELETE FROM students WHERE user_id = $1', [studentId]);
    await query('DELETE FROM medical_staff WHERE user_id = $1', [staffUserId]);
    await query('DELETE FROM users WHERE user_id IN ($1, $2)', [studentId, staffUserId]);

    console.log('✅ Cleanup completed');

    console.log('\n🎉 TEST COMPLETED!');
    console.log('📧 Check the email inbox for:');
    console.log('   - 10422061@student.vgu.edu.vn (rejection notification)');
    console.log('   - nhimaihello@gmail.com (assignment notification)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testRejectionEmail().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});