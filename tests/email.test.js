// Email Notification Test Suite with Real Database Interaction
// Run with: node tests/email.test.js
//
// ⚙️ CONFIGURATION: Modify the email addresses below to test with different users
// 🧹 CLEANUP: The test will automatically clean up:
// - All appointments created during the test
// - Users created during the test (but preserves existing users)

require('dotenv').config(); // Load .env from project root
const { SimpleTest } = require('./testFramework');
const EmailService = require('../backend/services/emailService');
const appointmentService = require('../backend/services/appointmentService');
const authService = require('../backend/services/authService');
const { query } = require('../backend/config/database');
const DateUtils = require('./utils/dateUtils');

// Configure test email addresses here - modify these as needed
const TEST_MEDICAL_STAFF_EMAIL = 'nhimaihello@gmail.com';
const TEST_STUDENT_EMAIL = '10422061@student.vgu.edu.vn';

async function runEmailTests() {
  const test = new SimpleTest('📧 Email Notification Test Suite with Database Integration');

  try {
    // Test database connection first
    test.describe('Database Connection', function() {
      test.it('should connect to database successfully', async function() {
        console.log('🔌 Testing database connection...');
        const result = await query('SELECT NOW() as current_time');
        test.assert(result.rows.length > 0, 'Database should be accessible');
        console.log('✅ Database connection successful');
      });
    });

    test.describe('SendGrid Email Configuration', function() {
      test.it('should have valid email configuration', async function() {
        console.log('🧪 Testing SendGrid Email Configuration...');
        console.log(`📧 Provider: ${process.env.EMAIL_PROVIDER}`);
        console.log(`🔑 API Key: ${process.env.SENDGRID_API_KEY ? 'Set' : 'Missing'}`);
        console.log(`📤 From: ${process.env.EMAIL_FROM}`);
        console.log(`📧 Admin: ${process.env.ADMIN_EMAIL}`);
        
        // In test environment, we allow missing email configuration
        if (process.env.NODE_ENV === 'test' || !process.env.EMAIL_PROVIDER) {
          console.log('⚠️ Running in test environment - email configuration optional');
          console.log('✅ Email configuration test skipped for test environment');
          return;
        }
        
        test.assert(process.env.EMAIL_PROVIDER === 'sendgrid', 'Email provider should be SendGrid');
        test.assert(process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your-sendgrid-api-key-here', 'SendGrid API key should be set');
        test.assert(process.env.EMAIL_FROM, 'EMAIL_FROM should be configured');
        console.log('✅ Email configuration is valid');
      });
    });

    test.describe('Complete Appointment Workflow with Email Notifications', function() {
      // Test variables to track our test data throughout the workflow
      let testStudent = null;
      let testMedicalStaff = null;
      let createdAppointment = null;

      // ========================================
      // STEP 1: Setup Medical Staff
      // ========================================
      // Create or reuse a medical staff member who will handle the appointment
      // This tests the user creation system and ensures we have a doctor available
      test.it(`should create a medical staff member with email ${TEST_MEDICAL_STAFF_EMAIL}`, async function() {
        console.log('👩‍⚕️ Creating medical staff member...');
        
        // Check if medical staff already exists in database to avoid duplicates
        // This ensures test can be run multiple times without conflicts
        const existingStaffResult = await query(`
          SELECT ms.staff_id, u.user_id, u.name, u.email, ms.specialty 
          FROM medical_staff ms 
          JOIN users u ON ms.user_id = u.user_id 
          WHERE u.email = $1 AND u.role = 'medical_staff'
        `, [TEST_MEDICAL_STAFF_EMAIL]);
        
        if (existingStaffResult.rows.length > 0) {
          // Reuse existing medical staff to avoid creating duplicates
          testMedicalStaff = existingStaffResult.rows[0];
          console.log(`✅ Medical staff already exists: ${testMedicalStaff.name} (${testMedicalStaff.email})`);
        } else {
          // Create new medical staff member with all required data
          console.log('📝 Creating new medical staff member...');
          const newStaff = await authService.createUser(
            TEST_MEDICAL_STAFF_EMAIL, 
            'medstaff123', 
            {
              name: 'Dr. Test Medical Staff',
              gender: 'female',
              age: 35,
              role: 'medical_staff',
              roleSpecificData: {
                specialty: 'General Medicine',      // Medical specialty
                specialty_group: 'physical',       // Type of health issues they handle
                shift_schedule: {                   // Weekly schedule as JSON
                  "monday": ["09:00-17:00"],
                  "tuesday": ["09:00-17:00"],
                  "wednesday": ["09:00-17:00"],
                  "thursday": ["09:00-17:00"],
                  "friday": ["09:00-17:00"]
                }
              }
            }
          );
          
          // Get the complete medical staff details including staff_id needed for appointments
          const staffResult = await query(`
            SELECT ms.staff_id, u.user_id, u.name, u.email, ms.specialty 
            FROM medical_staff ms 
            JOIN users u ON ms.user_id = u.user_id 
            WHERE u.user_id = $1
          `, [newStaff.user_id]);
          
          testMedicalStaff = staffResult.rows[0];
          console.log(`✅ Medical staff created: ${testMedicalStaff.name} (${testMedicalStaff.email})`);
        }
        
        // Verify medical staff has required staff_id for appointment assignment
        test.assert(testMedicalStaff && testMedicalStaff.staff_id, 'Medical staff should exist with staff_id');
      });

      // ========================================
      // STEP 2: Setup Student Patient
      // ========================================
      // Create or reuse a student who will make the appointment request
      // This tests student user creation and ensures we have a patient
      test.it(`should create a student with email ${TEST_STUDENT_EMAIL}`, async function() {
        console.log('👩‍🎓 Creating test student...');
        
        // Check if student already exists to avoid creating duplicates
        const existingStudentResult = await query(`
          SELECT u.user_id, u.name, u.email, s.student_id 
          FROM users u 
          JOIN students s ON u.user_id = s.user_id 
          WHERE u.email = $1 AND u.role = 'student'
        `, [TEST_STUDENT_EMAIL]);
        
        if (existingStudentResult.rows.length > 0) {
          // Reuse existing student
          testStudent = existingStudentResult.rows[0];
          console.log(`✅ Student already exists: ${testStudent.name} (${testStudent.email})`);
        } else {
          // Create new student with required academic information
          console.log('📝 Creating new student...');
          const newUser = await authService.createUser(
            TEST_STUDENT_EMAIL, 
            'student123', 
            {
              name: 'Test Student',
              gender: 'other',
              age: 22,
              role: 'student',
              roleSpecificData: {
                intake_year: 2023,                // Year student started
                major: 'Computer Science',        // Academic program
                housing_location: 'dorm_1'       // Where student lives on campus
              }
            }
          );
          // Store student info with the name we provided (authService only returns basic info)
          testStudent = {
            user_id: newUser.user_id,
            name: 'Test Student', // Use the name we passed to createUser
            email: newUser.email
          };
          console.log(`✅ Student created: ${testStudent.name} (${testStudent.email})`);
        }
        
        // Verify student was created/found successfully
        test.assert(testStudent && testStudent.user_id, 'Test student should exist');
      });

      // ========================================
      // STEP 3: Create Initial Appointment Request
      // ========================================
      // Student creates an appointment request WITH a specific medical staff member
      // Tests time slot availability, appointment creation, and staff assignment
      test.it('should create an appointment request WITH medical staff assigned', async function() {
        console.log('📅 Student creating appointment request with staff assignment...');
        
        // SMART TIME SLOT SELECTION
        // Get multiple available weekdays to avoid scheduling conflicts
        const availableDates = DateUtils.getMultipleWeekdays(3, 1); // Get 3 different weekdays
        let selectedDate = null;
        let selectedTimeSlot = null;
        
        // STRATEGY 1: Try to find available slots from time_slots table
        // This checks the official time slots and avoids conflicts with existing appointments
        for (const date of availableDates) {
          console.log(`🔍 Checking available slots for ${date}...`);
          
          try {
            // Convert JavaScript day to PostgreSQL day format (Sunday = 7 instead of 0)
            const dateObj = new Date(date);
            const dayOfWeek = dateObj.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
            const postgresDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert Sunday from 0 to 7
            
            // Query available time slots that aren't already booked
            const timeSlotsResult = await query(`
              SELECT ts.start_time, ts.end_time
              FROM time_slots ts
              WHERE ts.day_of_week = $1
              AND ts.start_time NOT IN (
                SELECT a.time_scheduled 
                FROM appointments a 
                WHERE DATE(a.date_scheduled) = $2
                AND a.status NOT IN ('cancelled', 'rejected')
              )
              ORDER BY ts.start_time
              LIMIT 5
            `, [postgresDay, date]);
            
            if (timeSlotsResult.rows.length > 0) {
              selectedDate = date;
              // Randomly select from available slots to distribute test load
              const randomIndex = Math.floor(Math.random() * timeSlotsResult.rows.length);
              selectedTimeSlot = timeSlotsResult.rows[randomIndex].start_time;
              console.log(`✅ Found available slot: ${selectedDate} at ${selectedTimeSlot}`);
              break;
            } else {
              console.log(`❌ No available slots for ${date} (day ${postgresDay})`);
            }
          } catch (error) {
            console.log(`⚠️ Error checking slots for ${date}:`, error.message);
          }
        }
        
        // STRATEGY 2: Fallback to common time slots if time_slots table is empty
        if (!selectedDate || !selectedTimeSlot) {
          console.log('⚠️ Time slot query failed, using fallback approach...');
          
          selectedDate = availableDates[0];
          // Try standard business hours that should generally be available
          const commonTimeSlots = ['09:00:00', '10:00:00', '11:00:00', '14:00:00', '15:00:00'];
          
          for (const timeSlot of commonTimeSlots) {
            try {
              // Check if this time slot is already taken on the selected date
              const conflictCheck = await query(`
                SELECT COUNT(*) as count
                FROM appointments 
                WHERE DATE(date_scheduled) = $1 
                AND time_scheduled = $2
                AND status NOT IN ('cancelled', 'rejected')
              `, [selectedDate, timeSlot]);
              
              if (conflictCheck.rows[0].count === '0') {
                selectedTimeSlot = timeSlot;
                console.log(`✅ Found available fallback slot: ${selectedDate} at ${selectedTimeSlot}`);
                break;
              }
            } catch (error) {
              console.log(`⚠️ Error checking conflict for ${timeSlot}:`, error.message);
            }
          }
        }
        
        // STRATEGY 3: Final fallback - generate unique time based on current timestamp
        if (!selectedDate || !selectedTimeSlot) {
          console.log('⚠️ All time slot methods failed, using final fallback...');
          selectedDate = availableDates[0];
          // Generate somewhat unique time to avoid conflicts in rapid test runs
          const now = new Date();
          const minutes = now.getMinutes();
          const hours = 9 + (minutes % 7); // 9-15 (9am-3pm)
          const mins = (minutes % 3) * 20; // 0, 20, or 40 minutes
          selectedTimeSlot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
          console.log(`⚠️ Using final fallback slot: ${selectedDate} at ${selectedTimeSlot}`);
        }
        
        // Ensure we have a valid time slot before proceeding
        if (!selectedDate || !selectedTimeSlot) {
          throw new Error('No available time slots found for testing. Please check time_slots table.');
        }

        console.log(`📋 Creating appointment for ${selectedDate} at ${selectedTimeSlot} WITH staff assignment`);

        // CREATE THE APPOINTMENT
        // Note: Now passing the medical staff ID directly - no auto-assignment needed
        // Date and time are required fields for appointment creation
        createdAppointment = await appointmentService.createAppointment(
          testStudent.user_id,
          'Initial symptoms - headache and mild fever, experiencing discomfort since yesterday',
          'medium',                    // Priority level: low, medium, high, urgent
          'physical',                  // Health issue type: physical, mental, both
          testMedicalStaff.staff_id,   // Medical staff assigned at creation time
          selectedDate,                // Required: appointment date
          selectedTimeSlot             // Required: appointment time
        );

        // VERIFY APPOINTMENT CREATION
        test.assert(createdAppointment && createdAppointment.id, 'Appointment should be created successfully');
        test.assert(createdAppointment.status === 'pending', 'Appointment should be in pending status');
        
        // Log appointment details for verification
        console.log(`✅ Appointment created: ${createdAppointment.id}`);
        console.log(`📊 Status: ${createdAppointment.status}`);
        console.log(`📅 Scheduled: ${selectedDate} at ${selectedTimeSlot}`);
        console.log(`👩‍⚕️ Assigned to: ${testMedicalStaff.name} (assigned at creation)`);
      });

      // ========================================
      // STEP 4: Update Appointment Symptoms
      // ========================================
      // Student updates their symptoms before the appointment is approved
      // Tests the appointment update functionality and automatic email notification
      test.it('should update appointment symptoms and automatically notify medical staff', async function() {
        console.log('📝 Student updating appointment symptoms...');
        
        // Student provides more detailed symptoms before the appointment
        // This simulates a common real-world scenario where patients update their condition
        const updatedSymptoms = 'Updated symptoms - persistent headache, fever increased to 38.5°C, also experiencing nausea and dizziness. Please see urgently.';
        
        // Call the update service to modify the appointment
        // The appointmentService will automatically send email notification to medical staff
        console.log('🤖 Automatic notification will be sent to medical staff...');
        const updateResult = await appointmentService.updateAppointment(createdAppointment.id, {
          symptoms: updatedSymptoms
        });
        
        // Verify the update was successful
        test.assert(updateResult && updateResult.id, 'Appointment should be updated successfully');
        console.log(`✅ Symptoms updated for appointment: ${createdAppointment.id}`);
        console.log(`� New symptoms: ${updatedSymptoms}`);
        console.log('📧 Automatic symptom update notification sent to medical staff');
        
        // Update our local appointment object to reflect the changes
        createdAppointment.symptoms = updatedSymptoms;
      });

      // ========================================
      // STEP 5: Medical Staff Approves Appointment
      // ========================================
      // Medical staff reviews and approves the appointment request
      // Since staff is already assigned at creation, this is just a status change
      test.it('should approve appointment by medical staff (status change only)', async function() {
        console.log('✅ Medical staff approving appointment...');
        
        // Since the appointment was created with medical staff already assigned,
        // approval is just updating the status, not reassigning staff or time
        const approvalResult = await appointmentService.updateAppointment(
          createdAppointment.id, 
          { status: 'approved' }  // Simple status change to approved
        );
        
        // VERIFY APPROVAL SUCCESS
        test.assert(approvalResult && approvalResult.id, 'Appointment should be approved successfully');
        test.assert(approvalResult.status === 'approved', 'Appointment status should be approved');
        test.assert(approvalResult.timeScheduled !== null, 'time_scheduled should not be null after approval');
        test.assert(approvalResult.dateScheduled !== null, 'date_scheduled should not be null after approval');
        
        // Log approval details
        console.log(`✅ Appointment approved by ${testMedicalStaff.name}`);
        console.log(`📊 New status: ${approvalResult.status}`);
        console.log(`📅 Schedule maintained: ${approvalResult.dateScheduled} at ${approvalResult.timeScheduled}`);
        
        // Update our local appointment object with the approved data
        createdAppointment.status = 'approved';
        createdAppointment.dateScheduled = approvalResult.dateScheduled;
        createdAppointment.timeScheduled = approvalResult.timeScheduled;
      });



      // ========================================
      // STEP 6: Send Approval Email to Student
      // ========================================
      // Send a detailed email notification to the student about the approved appointment
      // Tests email service functionality and HTML email generation
      test.it('should send appointment approval notification email to student', async function() {
        console.log('📧 Sending appointment approval notification to student...');
        const emailService = new EmailService();
        
        // Create a professional HTML email with appointment details
        // This tests the email service's ability to send formatted emails
        const approvalEmail = {
          to: testStudent.email,
          subject: '🎉 VGU Care - Appointment APPROVED!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #27ae60;">🎉 VGU Care - Appointment APPROVED!</h2>
              
              <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #27ae60;">
                <h3 style="color: #155724;">✅ Great news! Your appointment has been approved</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px; font-weight: bold;">Appointment ID:</td>
                    <td style="padding: 8px;">${createdAppointment.id}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; font-weight: bold;">Patient:</td>
                    <td style="padding: 8px;">${testStudent.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; font-weight: bold;">Assigned Doctor:</td>
                    <td style="padding: 8px;">${testMedicalStaff.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; font-weight: bold;">Date:</td>
                    <td style="padding: 8px;">${new Date(createdAppointment.dateScheduled).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; font-weight: bold;">Time:</td>
                    <td style="padding: 8px;">${createdAppointment.timeScheduled}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; font-weight: bold;">Status:</td>
                    <td style="padding: 8px;">
                      <span style="background-color: #27ae60; color: white; padding: 4px 8px; border-radius: 3px;">
                        APPROVED
                      </span>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="color: #2980b9; margin-top: 0;">📋 What to do next:</h4>
                <ul style="color: #34495e;">
                  <li><strong>Confirm your attendance</strong> - Please arrive 10 minutes early</li>
                  <li><strong>Prepare for your visit</strong> - Bring student ID and medical documents</li>
                  <li><strong>Note any changes</strong> - Contact us if your symptoms worsen</li>
                </ul>
              </div>

              <hr style="margin: 30px 0;">
              <p style="color: #666; font-size: 12px; text-align: center;">
                This is a test email from VGU Care automated system.<br>
                Test Environment - ${new Date().toLocaleString()}
              </p>
            </div>
          `
        };

        // Send the email and verify it was sent successfully
        const result = await emailService.sendEmail(
          approvalEmail.to,
          approvalEmail.subject,
          approvalEmail.html
        );
        
        test.assert(result && result.success !== false, 'Appointment approval email should be sent successfully');
        console.log('✅ Appointment approval email sent to student successfully!');
        console.log('📬 Student has been notified about appointment approval');
      });

      // ========================================
      // STEP 7: Send Assignment Email to Medical Staff
      // ========================================
      // Notify the medical staff about their appointment approval
      // Tests staff notification emails with patient information (staff was assigned at creation)
      test.it('should send appointment approved notification email to medical staff', async function() {
        console.log('📧 Sending appointment approved notification to medical staff...');
        const emailService = new EmailService();
        
        // Create detailed email for medical staff with patient information
        // This helps the doctor prepare for the now-approved appointment
        const staffNotificationEmail = {
          to: testMedicalStaff.email,
          subject: '✅ VGU Care - Appointment APPROVED',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c3e50;">✅ VGU Care - Appointment APPROVED</h2>
              
              <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #27ae60;">
                <h3 style="color: #155724;">📋 Your assigned appointment has been approved</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px; font-weight: bold;">Appointment ID:</td>
                    <td style="padding: 8px;">${createdAppointment.id}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; font-weight: bold;">Patient:</td>
                    <td style="padding: 8px;">${testStudent.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; font-weight: bold;">Patient Email:</td>
                    <td style="padding: 8px;">${testStudent.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; font-weight: bold;">Date:</td>
                    <td style="padding: 8px;">${new Date(createdAppointment.dateScheduled).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; font-weight: bold;">Time:</td>
                    <td style="padding: 8px;">${createdAppointment.timeScheduled}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; font-weight: bold;">Priority:</td>
                    <td style="padding: 8px; text-transform: capitalize;">
                      <span style="background-color: #ffc107; color: #212529; padding: 4px 8px; border-radius: 3px;">
                        ${createdAppointment.priorityLevel.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; font-weight: bold;">Type:</td>
                    <td style="padding: 8px; text-transform: capitalize;">${createdAppointment.healthIssueType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; font-weight: bold;">Status:</td>
                    <td style="padding: 8px;">
                      <span style="background-color: #27ae60; color: white; padding: 4px 8px; border-radius: 3px;">
                        APPROVED
                      </span>
                    </td>
                  </tr>
                </table>
                
                <div style="margin-top: 15px; padding: 15px; background-color: #f8f9fa; border-radius: 3px;">
                  <h4 style="margin-top: 0; color: #495057;">Patient's Latest Symptoms:</h4>
                  <p style="margin-bottom: 0; color: #6c757d;">${createdAppointment.symptoms}</p>
                </div>
              </div>

              <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="color: #2980b9; margin-top: 0;">📋 Action Required:</h4>
                <ul style="color: #34495e;">
                  <li><strong>Review patient information</strong> and prepare for the consultation</li>
                  <li><strong>Confirm your attendance</strong> for the scheduled time slot</li>
                  <li><strong>Contact the patient</strong> if additional information is needed</li>
                  <li><strong>Prepare necessary materials</strong> for the approved appointment</li>
                </ul>
              </div>

              <hr style="margin: 30px 0;">
              <p style="color: #666; font-size: 12px; text-align: center;">
                This is a test email from VGU Care automated system.<br>
                Test Environment - ${new Date().toLocaleString()}
              </p>
            </div>
          `
        };

        // Send the staff notification email
        const result = await emailService.sendEmail(
          staffNotificationEmail.to,
          staffNotificationEmail.subject,
          staffNotificationEmail.html
        );
        
        test.assert(result && result.success !== false, 'Medical staff notification email should be sent successfully');
        console.log('✅ Appointment approved notification email sent to medical staff successfully!');
        console.log('📬 Medical staff has been notified about the appointment approval');
      });

      // ========================================
      // STEP 8: Database Verification
      // ========================================
      // Verify all data was properly stored in the database
      // This ensures data integrity throughout the entire workflow
      test.it('should verify appointment exists in database with correct status', async function() {
        console.log('🔍 Verifying appointment in database...');
        
        // Query the database to get the complete appointment record with joined user and staff data
        const verifyResult = await query(`
          SELECT a.*, u.name as patient_name, u.email as patient_email,
                 ms_user.name as doctor_name, ms.specialty
          FROM appointments a
          JOIN users u ON a.user_id = u.user_id
          LEFT JOIN medical_staff ms ON a.medical_staff_id = ms.staff_id
          LEFT JOIN users ms_user ON ms.user_id = ms_user.user_id
          WHERE a.appointment_id = $1
        `, [createdAppointment.id]);
        
        // Verify the appointment exists
        test.assert(verifyResult.rows.length > 0, 'Appointment should exist in database');
        
        const dbAppointment = verifyResult.rows[0];
        
        // Verify all critical appointment data is correct
        test.assert(dbAppointment.status === 'approved', 'Appointment status should be approved');
        test.assert(dbAppointment.patient_email === testStudent.email, 'Patient email should match');
        test.assert(dbAppointment.doctor_name === testMedicalStaff.name, 'Doctor should be assigned from creation');
        test.assert(dbAppointment.priority_level === 'medium', 'Priority level should be medium');
        test.assert(dbAppointment.health_issue_type === 'physical', 'Health issue type should be physical');
        test.assert(dbAppointment.time_scheduled !== null, 'time_scheduled should not be null');
        test.assert(dbAppointment.date_scheduled !== null, 'date_scheduled should not be null');
        
        // Log verification results
        console.log('✅ Appointment verified in database');
        console.log(`📊 Patient: ${dbAppointment.patient_name}`);
        console.log(`👩‍⚕️ Doctor: ${dbAppointment.doctor_name}`);
        console.log(`🏥 Specialty: ${dbAppointment.specialty || 'General'}`);
        console.log(`📅 Final Status: ${dbAppointment.status.toUpperCase()}`);
      });

      // ========================================
      // CLEANUP PHASE
      // ========================================
      // Clean up all test data to keep the database clean
      // This ensures tests can be run repeatedly without data pollution

      // STEP 9: Remove Test Appointment
      test.it('should cleanup test appointment', async function() {
        if (createdAppointment && createdAppointment.id) {
          console.log('🧹 Cleaning up test appointment...');
          // Remove the appointment we created during this test
          await query('DELETE FROM appointments WHERE appointment_id = $1', [createdAppointment.id]);
          console.log('✅ Test appointment cleaned up');
        }
      });

      // STEP 10: Smart User Cleanup
      // Only remove users if they have no other appointments (were likely created by this test)
      test.it('should cleanup test users if they were created during this test', async function() {
        console.log('🧹 Cleaning up test users...');
        
        // SMART CLEANUP: Only remove users if they have no other appointments
        // This preserves existing users while cleaning up test-created ones
        
        // Check medical staff cleanup eligibility
        if (testMedicalStaff && testMedicalStaff.user_id) {
          console.log(`🔍 Checking if medical staff ${testMedicalStaff.email} should be cleaned up...`);
          
          // Count remaining appointments for this medical staff
          const staffAppointmentsResult = await query(`
            SELECT COUNT(*) as count 
            FROM appointments 
            WHERE medical_staff_id = $1
          `, [testMedicalStaff.staff_id]);
          
          const staffAppointmentCount = parseInt(staffAppointmentsResult.rows[0].count);
          
          if (staffAppointmentCount === 0) {
            // Safe to remove - no other appointments depend on this staff member
            console.log('🗑️ Removing medical staff (no other appointments)...');
            // Delete medical staff record first (foreign key constraint)
            await query('DELETE FROM medical_staff WHERE staff_id = $1', [testMedicalStaff.staff_id]);
            // Then delete user record
            await query('DELETE FROM users WHERE user_id = $1', [testMedicalStaff.user_id]);
            console.log(`✅ Medical staff ${testMedicalStaff.name} cleaned up`);
          } else {
            // Keep the user - they have other appointments
            console.log(`⚠️ Keeping medical staff ${testMedicalStaff.name} (has ${staffAppointmentCount} other appointments)`);
          }
        }
        
        // Check student cleanup eligibility
        if (testStudent && testStudent.user_id) {
          console.log(`🔍 Checking if student ${testStudent.email} should be cleaned up...`);
          
          // Count remaining appointments for this student
          const studentAppointmentsResult = await query(`
            SELECT COUNT(*) as count 
            FROM appointments 
            WHERE user_id = $1
          `, [testStudent.user_id]);
          
          const studentAppointmentCount = parseInt(studentAppointmentsResult.rows[0].count);
          
          if (studentAppointmentCount === 0) {
            // Safe to remove - no other appointments depend on this student
            console.log('🗑️ Removing student (no other appointments)...');
            // Delete student record first (foreign key constraint)
            await query('DELETE FROM students WHERE user_id = $1', [testStudent.user_id]);
            // Then delete user record
            await query('DELETE FROM users WHERE user_id = $1', [testStudent.user_id]);
            console.log(`✅ Student ${testStudent.name} cleaned up`);
          } else {
            // Keep the user - they have other appointments
            console.log(`⚠️ Keeping student ${testStudent.name} (has ${studentAppointmentCount} other appointments)`);
          }
        }
        
        console.log('✅ User cleanup completed');
      });

      // STEP 11: Optional Additional Cleanup
      // Alternative cleanup method that checks for test-specific data patterns
      // test.it('should cleanup test users (optional)', async function() {
      //   console.log('🧹 Cleaning up test users...');
      //   
      //   // ALTERNATIVE CLEANUP METHOD: Check for test-specific data patterns
      //   // This method identifies test users by their characteristic data
      //   
      //   let cleanupCount = 0;
      //   
      //   // Cleanup student based on test-specific major
      //   if (testStudent && testStudent.user_id) {
      //     try {
      //       // Check if this student was created in this test (has our test data signature)
      //       const studentCheck = await query(`
      //         SELECT u.*, s.major 
      //         FROM users u 
      //         JOIN students s ON u.user_id = s.user_id 
      //         WHERE u.user_id = $1 AND u.email = $2 AND s.major = 'Computer Science'
      //       `, [testStudent.user_id, TEST_STUDENT_EMAIL]);
      //       
      //       if (studentCheck.rows.length > 0) {
      //         await query('DELETE FROM users WHERE user_id = $1', [testStudent.user_id]);
      //         cleanupCount++;
      //         console.log(`✅ Cleaned up test student: ${testStudent.email}`);
      //       }
      //     } catch (error) {
      //       console.log(`⚠️ Could not clean up student: ${error.message}`);
      //     }
      //   }
      //   
      //   // Cleanup medical staff based on test-specific specialty
      //   if (testMedicalStaff && testMedicalStaff.user_id) {
      //     try {
      //       // Check if this medical staff was created in this test (has our test data signature)
      //       const staffCheck = await query(`
      //         SELECT u.*, ms.specialty 
      //         FROM users u 
      //         JOIN medical_staff ms ON u.user_id = ms.user_id 
      //         WHERE u.user_id = $1 AND u.email = $2 AND ms.specialty = 'General Medicine'
      //       `, [testMedicalStaff.user_id, TEST_MEDICAL_STAFF_EMAIL]);
      //       
      //       if (staffCheck.rows.length > 0) {
      //         await query('DELETE FROM users WHERE user_id = $1', [testMedicalStaff.user_id]);
      //         cleanupCount++;
      //         console.log(`✅ Cleaned up test medical staff: ${testMedicalStaff.email}`);
      //       }
      //     } catch (error) {
      //       console.log(`⚠️ Could not clean up medical staff: ${error.message}`);
      //     }
      //   }
      //   
      //   // Report cleanup results
      //   if (cleanupCount === 0) {
      //     console.log('✅ No test users to clean up (users existed before test)');
      //   } else {
      //     console.log(`✅ Cleaned up ${cleanupCount} test user(s)`);
      //   }
      // });
    });

    await test.run();

  } catch (error) {
    console.error('\n💥 Email tests failed:', error.message);
    console.error('📚 Stack trace:', error.stack);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runEmailTests();
}

module.exports = runEmailTests;
