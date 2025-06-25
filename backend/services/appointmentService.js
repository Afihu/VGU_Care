const { query } = require("../config/database");
const BaseService = require("./baseService");
const notificationService = require("./notificationService");
const emailService = require("./emailService");

class AppointmentService extends BaseService {  async getAppointmentsByUserId(userId) {
    const result = await query(
      `
      SELECT 
        a.appointment_id as "id",
        a.user_id as "userId",
        a.status,
        a.date_requested as "dateRequested",
        a.date_scheduled as "dateScheduled",
        a.time_scheduled as "timeScheduled",
        a.priority_level as "priorityLevel",
        a.symptoms,
        EXISTS(SELECT 1 FROM temporary_advice ta WHERE ta.appointment_id = a.appointment_id) as "hasAdvice"
      FROM appointments a
      WHERE a.user_id = $1
      ORDER BY a.date_requested DESC
      `,
      [userId]
    );

    return result.rows;
  }
  async getAppointmentById(appointmentId) {
    const result = await query(
      `
      SELECT 
        a.appointment_id as "id",
        a.user_id as "userId", -- Ensure userId is correctly mapped
        a.status,
        a.date_requested as "dateRequested",
        a.date_scheduled as "dateScheduled",
        a.time_scheduled as "timeScheduled",
        a.priority_level as "priorityLevel",
        a.symptoms
      FROM appointments a
      WHERE a.appointment_id = $1
      `,
      [appointmentId]
    );
  
    return result.rows[0] || null;
  }  async createAppointment(userId, symptoms, priorityLevel, healthIssueType, medicalStaffId = null, dateScheduled, timeScheduled) {
    // Validate required parameters
    if (!dateScheduled || !timeScheduled) {
      throw new Error('Date and time are required for appointment scheduling');
    }

    // Validate health issue type
    const validHealthIssueTypes = ['physical', 'mental'];
    if (!validHealthIssueTypes.includes(healthIssueType)) {
      throw new Error('Health issue type must be either "physical" or "mental"');
    }    // Validate the time slot and check for blackout dates
    // If the exact time slot is not available, find the nearest available one
    let finalTimeScheduled = timeScheduled;
    const isExactSlotAvailable = await this.isTimeSlotAvailable(dateScheduled, timeScheduled);
    
    if (!isExactSlotAvailable) {
      console.log(`[DEBUG] Requested time slot ${timeScheduled} not available, finding nearest available slot...`);
      try {
        finalTimeScheduled = await this.findNearestAvailableTimeSlot(dateScheduled, timeScheduled);
        console.log(`[DEBUG] Adjusted time from ${timeScheduled} to ${finalTimeScheduled}`);
      } catch (error) {
        throw new Error(`No available time slots found near ${timeScheduled} on ${dateScheduled}: ${error.message}`);
      }
    }// If medical staff is specified, use it; otherwise auto-assign based on specialty and availability
    let assignedStaffId = medicalStaffId;
    if (!assignedStaffId) {
      try {
        const leastAssignedStaff = await this.getLeastAssignedMedicalStaffBySpecialty(healthIssueType, dateScheduled, timeScheduled);
        assignedStaffId = leastAssignedStaff.staff_id;
        console.log(`[DEBUG] Auto-assigned appointment to ${healthIssueType} specialist: ${leastAssignedStaff.name} (${leastAssignedStaff.appointment_count} existing appointments)`);
      } catch (error) {
        console.log(`[DEBUG] Could not auto-assign medical staff: ${error.message}`);
        // Continue without assignment if no medical staff available
      }
    } else {
      console.log(`[DEBUG] Using user-specified medical staff: ${assignedStaffId}`);
    }

    let queryText, values;
    if (assignedStaffId) {      queryText = `
        INSERT INTO appointments (user_id, symptoms, priority_level, health_issue_type, date_scheduled, time_scheduled, medical_staff_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING 
          appointment_id as "id",
          user_id as "userId",
          status,
          date_requested as "dateRequested",
          date_scheduled as "dateScheduled",
          time_scheduled as "timeScheduled",
          priority_level as "priorityLevel",
          symptoms,
          health_issue_type as "healthIssueType"
      `;
      values = [userId, symptoms, priorityLevel, healthIssueType, dateScheduled, finalTimeScheduled, assignedStaffId];
    } else {
      queryText = `
        INSERT INTO appointments (user_id, symptoms, priority_level, health_issue_type, date_scheduled, time_scheduled)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING 
          appointment_id as "id",
          user_id as "userId",
          status,
          date_requested as "dateRequested",
          date_scheduled as "dateScheduled",
          time_scheduled as "timeScheduled",
          priority_level as "priorityLevel",
          symptoms,
          health_issue_type as "healthIssueType"
      `;
      values = [userId, symptoms, priorityLevel, healthIssueType, dateScheduled, timeScheduled];    }const result = await query(queryText, values);
    const appointment = result.rows[0];
    console.log(`[DEBUG] Appointment created:`, appointment);

    // Send notification to medical staff if assigned
    if (assignedStaffId) {
      try {
        // Get student name for notification
        const studentResult = await query('SELECT name, email FROM users WHERE user_id = $1', [userId]);
        const studentDetails = studentResult.rows[0];
        const studentName = studentDetails?.name || 'Student';
        
        // Get medical staff user_id for notification
        const staffResult = await query('SELECT user_id FROM medical_staff WHERE staff_id = $1', [assignedStaffId]);
        if (staffResult.rows.length > 0) {
          const medicalStaffUserId = staffResult.rows[0].user_id;
          await notificationService.notifyMedicalStaffAssignment(
            medicalStaffUserId, 
            appointment.id, 
            studentName, 
            symptoms
          );
        }

        // Send confirmation email to student
        if (studentDetails?.email) {
          await emailService.sendAppointmentCreatedEmail(
            studentDetails.email,
            studentName,
            {
              symptoms,
              priorityLevel,
              dateScheduled,
              timeScheduled
            }
          );
        }
      } catch (notificationError) {
        console.log(`[DEBUG] Failed to send notifications: ${notificationError.message}`);
        // Continue without failing the appointment creation
      }
    }

    return appointment;
  }    async updateAppointment(appointmentId, updateData) {
    const { symptoms, status, priorityLevel, dateScheduled, timeScheduled } = updateData;

    console.log('[DEBUG] updateAppointment - Received updateData:', JSON.stringify(updateData, null, 2));    // If updating time, validate time slot availability and find nearest if needed
    let finalTimeScheduled = timeScheduled;
    if (dateScheduled && timeScheduled) {
      const isAvailable = await this.isTimeSlotAvailable(dateScheduled, timeScheduled);
      if (!isAvailable) {
        console.log(`[DEBUG] updateAppointment - Requested time slot ${timeScheduled} not available, finding nearest available slot...`);
        try {
          finalTimeScheduled = await this.findNearestAvailableTimeSlot(dateScheduled, timeScheduled);
          console.log(`[DEBUG] updateAppointment - Adjusted time from ${timeScheduled} to ${finalTimeScheduled}`);
        } catch (error) {
          throw new Error(`No available time slots found near ${timeScheduled} on ${dateScheduled}: ${error.message}`);
        }
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (symptoms !== undefined) {
      updates.push(`symptoms = $${paramCount}`);
      values.push(symptoms);
      paramCount++;
    }

    if (status !== undefined) {
      console.log(`[DEBUG] updateAppointment - Received status for update: '${status}' (type: ${typeof status})`);
      const normalizedStatus = typeof status === 'string' ? status.trim().toLowerCase() : status;
      console.log(`[DEBUG] updateAppointment - Normalized status: '${normalizedStatus}' (type: ${typeof normalizedStatus})`);      // REMOVE THE RESTRICTIVE VALIDATION - Let the controller handle role-based validation
      const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
      if (!validStatuses.includes(normalizedStatus)) {
        console.log(`[DEBUG] Invalid status update attempt. Status must be one of: ${validStatuses.join(', ')}. Received: '${normalizedStatus}'`);
        throw new Error(`Invalid status update. Allowed statuses are: ${validStatuses.join(', ')}.`);
      }
      
      updates.push(`status = $${paramCount}`);
      values.push(normalizedStatus);
      paramCount++;
    }

    if (priorityLevel !== undefined) {
      const validPriorityLevels = ['low', 'medium', 'high'];
      const normalizedPriorityLevel = typeof priorityLevel === 'string' ? priorityLevel.trim().toLowerCase() : priorityLevel;
      if (!validPriorityLevels.includes(normalizedPriorityLevel)) {
        console.log(`[DEBUG] Invalid priorityLevel update attempt. Received: '${priorityLevel}'`);
        throw new Error("Invalid priorityLevel. Allowed values are 'low', 'medium', 'high'.");
      }
      updates.push(`priority_level = $${paramCount}`);
      values.push(normalizedPriorityLevel);
      paramCount++;
    }

    if (dateScheduled !== undefined) {
      updates.push(`date_scheduled = $${paramCount}`);
      values.push(dateScheduled);
      paramCount++;
    }    if (timeScheduled !== undefined) {
      updates.push(`time_scheduled = $${paramCount}`);
      values.push(finalTimeScheduled); // Use the adjusted time slot
      paramCount++;
    }

    if (updates.length === 0) {
      throw new Error("No valid fields to update");
    }

    values.push(appointmentId);

    const queryText = `
      UPDATE appointments
      SET ${updates.join(", ")}
      WHERE appointment_id = $${paramCount}
      RETURNING 
        appointment_id as "id",
        user_id as "userId",
        status,
        date_requested as "dateRequested",
        date_scheduled as "dateScheduled",
        time_scheduled as "timeScheduled",
        priority_level as "priorityLevel",
        symptoms
    `;
    console.log('[DEBUG] updateAppointment - Query:', queryText);
    console.log('[DEBUG] updateAppointment - Values:', values);    const result = await query(queryText, values);

    if (result.rows.length === 0) {
      throw new Error("Appointment not found or update failed");
    }
    
    const updatedAppointment = result.rows[0];
    console.log('[DEBUG] updateAppointment - Updated appointment:', JSON.stringify(updatedAppointment, null, 2));

    // AUTOMATIC SYMPTOM UPDATE NOTIFICATION
    // If symptoms were updated, automatically notify the assigned medical staff
    if (symptoms !== undefined) {
      try {
        console.log('[AUTO-NOTIFICATION] Symptoms updated - sending notification to medical staff...');
        
        // Get complete appointment details with student and medical staff information
        const appointmentDetailsResult = await query(`
          SELECT 
            a.appointment_id,
            a.symptoms,
            a.priority_level,
            a.date_scheduled,
            a.time_scheduled,
            a.status,
            u.name as student_name,
            u.email as student_email,
            ms_user.name as medical_staff_name,
            ms_user.email as medical_staff_email
          FROM appointments a
          JOIN users u ON a.user_id = u.user_id
          LEFT JOIN medical_staff ms ON a.medical_staff_id = ms.staff_id
          LEFT JOIN users ms_user ON ms.user_id = ms_user.user_id
          WHERE a.appointment_id = $1
        `, [appointmentId]);

        if (appointmentDetailsResult.rows.length > 0) {
          const appointmentDetails = appointmentDetailsResult.rows[0];
          
          // Only send notification if medical staff is assigned
          if (appointmentDetails.medical_staff_email) {
            console.log(`[AUTO-NOTIFICATION] Sending symptom update notification to ${appointmentDetails.medical_staff_name} (${appointmentDetails.medical_staff_email})`);
            
            // Create EmailService instance for sending notification
            const EmailService = require('./emailService');
            const emailSender = new EmailService();
            
            // Send symptom update notification email to medical staff
            const symptomUpdateResult = await emailSender.sendSymptomUpdateNotificationEmail(
              appointmentDetails.medical_staff_email,
              appointmentDetails.medical_staff_name,
              {
                appointmentId: appointmentDetails.appointment_id,
                symptoms: appointmentDetails.symptoms,
                priorityLevel: appointmentDetails.priority_level,
                dateScheduled: appointmentDetails.date_scheduled,
                timeScheduled: appointmentDetails.time_scheduled,
                status: appointmentDetails.status
              },
              appointmentDetails.student_name,
              appointmentDetails.student_email
            );
            
            if (symptomUpdateResult.success) {
              console.log('[AUTO-NOTIFICATION] Symptom update notification sent successfully');
            } else {
              console.log('[AUTO-NOTIFICATION] Failed to send symptom update notification:', symptomUpdateResult.error);
            }
          } else {
            console.log('[AUTO-NOTIFICATION] No medical staff assigned - skipping symptom update notification');
          }
        }
      } catch (error) {
        // Don't let email failures break the appointment update
        console.error('[AUTO-NOTIFICATION] Error sending symptom update notification:', error.message);
      }
    }
    
    return updatedAppointment;
  }
  async getAppointmentsByMedicalStaff(medicalStaffUserId) {
    // Get medical staff's staff_id from user_id
    const staffResult = await query(
      'SELECT staff_id FROM medical_staff WHERE user_id = $1',
      [medicalStaffUserId]
    );
    
    if (staffResult.rows.length === 0) {
      throw new Error('Medical staff not found');
    }
    
    const staffId = staffResult.rows[0].staff_id;
    
    const result = await query(
      `
      SELECT 
        a.appointment_id as "id",
        a.user_id as "userId",
        a.status,
        a.date_requested as "dateRequested",
        a.date_scheduled as "dateScheduled",
        a.time_scheduled as "timeScheduled",
        a.priority_level as "priorityLevel",
        a.symptoms,
        u.name as "studentName",
        u.email as "studentEmail",
        EXISTS(SELECT 1 FROM temporary_advice ta WHERE ta.appointment_id = a.appointment_id) as "hasAdvice"
      FROM appointments a
      JOIN users u ON a.user_id = u.user_id
      WHERE a.medical_staff_id = $1
      ORDER BY a.date_requested DESC
      `,
      [staffId]
    );

    return result.rows;
  }
  async createAppointmentByMedicalStaff(medicalStaffUserId, symptoms, priorityLevel, healthIssueType, studentUserId = null, dateScheduled = null, timeScheduled = null) {
    // Get medical staff's staff_id from user_id
    const staffResult = await query(
      'SELECT staff_id FROM medical_staff WHERE user_id = $1',
      [medicalStaffUserId]
    );
    
    if (staffResult.rows.length === 0) {
      throw new Error('Medical staff not found');
    }
    
    const staffId = staffResult.rows[0].staff_id;
      // If date and time are provided, validate the time slot
    if (dateScheduled && timeScheduled) {
      const isAvailable = await this.isTimeSlotAvailable(dateScheduled, timeScheduled);
      if (!isAvailable) {
        throw new Error('Selected time slot is not available');
      }
    } else {
      // Use default scheduling if no specific time provided - set to tomorrow at 10:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      dateScheduled = tomorrow.toISOString().split('T')[0] + ' 10:00:00';
      timeScheduled = '10:00:00';
    }
      const result = await query(
      `
      INSERT INTO appointments (user_id, symptoms, priority_level, health_issue_type, date_scheduled, time_scheduled, medical_staff_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        appointment_id as "id",
        user_id as "userId",
        status,
        date_requested as "dateRequested",
        date_scheduled as "dateScheduled",
        time_scheduled as "timeScheduled",
        priority_level as "priorityLevel",
        symptoms,
        health_issue_type as "healthIssueType"
      `,
      [studentUserId || medicalStaffUserId, symptoms, priorityLevel, healthIssueType, dateScheduled, timeScheduled, staffId]
    );

    console.log(`[DEBUG] Medical staff appointment created:`, result.rows[0]);
    return result.rows[0];
  }

  async isMedicalStaffAssigned(appointmentId, medicalStaffUserId) {
    // Get medical staff's staff_id from user_id
    const staffResult = await query(
      'SELECT staff_id FROM medical_staff WHERE user_id = $1',
      [medicalStaffUserId]
    );
    
    if (staffResult.rows.length === 0) {
      return false;
    }
    
    const staffId = staffResult.rows[0].staff_id;
    
    const result = await query(
      'SELECT appointment_id FROM appointments WHERE appointment_id = $1 AND medical_staff_id = $2',
      [appointmentId, staffId]
    );
    
    return result.rows.length > 0;
  }  /**
   * Approve appointment - Medical staff only
   * Implements "Approve / Reject Appointment" use case
   */
  async approveAppointment(appointmentId, medicalStaffUserId, dateScheduled = null, timeScheduled = null) {
    // Get medical staff's staff_id
    const staffResult = await query(
      'SELECT staff_id FROM medical_staff WHERE user_id = $1',
      [medicalStaffUserId]
    );
    
    if (staffResult.rows.length === 0) {
      throw new Error('Medical staff not found');
    }
      const staffId = staffResult.rows[0].staff_id;
    
    // If date and time are provided, validate the time slot
    if (dateScheduled && timeScheduled) {
      const isAvailable = await this.isTimeSlotAvailable(dateScheduled, timeScheduled, appointmentId);
      if (!isAvailable) {
        throw new Error('Selected time slot is not available');
      }
    }
    
    const result = await query(`
      UPDATE appointments 
      SET status = 'approved', 
          medical_staff_id = $1,
          date_scheduled = COALESCE($2, CURRENT_TIMESTAMP + INTERVAL '1 week'),
          time_scheduled = $3
      WHERE appointment_id = $4 AND status = 'pending'
      RETURNING 
        appointment_id as "id",
        user_id as "userId", 
        status,
        date_requested as "dateRequested",
        date_scheduled as "dateScheduled",
        time_scheduled as "timeScheduled",
        priority_level as "priorityLevel",
        symptoms    `, [staffId, dateScheduled, timeScheduled, appointmentId]);
    
    if (result.rows.length === 0) {
      throw new Error('Appointment not found or already processed');
    }
    
    const appointment = result.rows[0];

    // Send notification to student about approval
    try {
      // Get medical staff name for notification
      const staffNameResult = await query('SELECT name FROM users u JOIN medical_staff ms ON u.user_id = ms.user_id WHERE ms.user_id = $1', [medicalStaffUserId]);
      const medicalStaffName = staffNameResult.rows[0]?.name || 'Medical Staff';
      
      await notificationService.notifyStudentAppointmentApproved(
        appointment.userId, 
        appointment.id, 
        medicalStaffName, 
        appointment.dateScheduled
      );
    } catch (notificationError) {
      console.log(`[DEBUG] Failed to send approval notification: ${notificationError.message}`);
      // Continue without failing the approval
    }
    
    return appointment;
  }    /**
   * Reject appointment - Medical staff only
   */
  async rejectAppointment(appointmentId, medicalStaffUserId, reason = null) {
    const staffResult = await query(
      'SELECT staff_id FROM medical_staff WHERE user_id = $1',
      [medicalStaffUserId]
    );
    
    if (staffResult.rows.length === 0) {
      throw new Error('Medical staff not found');
    }
    
    const staffId = staffResult.rows[0].staff_id;
    
    const result = await query(`
      UPDATE appointments 
      SET status = 'rejected', 
          medical_staff_id = $1
      WHERE appointment_id = $2 AND status = 'pending'
      RETURNING 
        appointment_id as "id",
        user_id as "userId",
        status,
        date_requested as "dateRequested",
        date_scheduled as "dateScheduled",
        time_scheduled as "timeScheduled", 
        priority_level as "priorityLevel",
        symptoms    `, [staffId, appointmentId]);
    
    if (result.rows.length === 0) {
      throw new Error('Appointment not found or already processed');
    }
    
    const appointment = result.rows[0];

    // Send notification to student about rejection
    try {
      // Get medical staff name for notification
      const staffNameResult = await query('SELECT name FROM users u JOIN medical_staff ms ON u.user_id = ms.user_id WHERE ms.user_id = $1', [medicalStaffUserId]);
      const medicalStaffName = staffNameResult.rows[0]?.name || 'Medical Staff';
      
      await notificationService.notifyStudentAppointmentRejected(
        appointment.userId, 
        appointment.id, 
        medicalStaffName, 
        reason
      );
    } catch (notificationError) {
      console.log(`[DEBUG] Failed to send rejection notification: ${notificationError.message}`);
      // Continue without failing the rejection
    }
    
    return appointment;
  }    /**
   * Get pending appointments for medical staff review
   */
  async getPendingAppointments() {
    const result = await query(`
      SELECT 
        a.appointment_id as "id",
        a.user_id as "userId",
        a.status,
        a.date_requested as "dateRequested",
        a.date_scheduled as "dateScheduled",
        a.time_scheduled as "timeScheduled",
        a.priority_level as "priorityLevel", 
        a.symptoms,
        u.name as "studentName",
        u.email as "studentEmail"
      FROM appointments a
      JOIN users u ON a.user_id = u.user_id
      WHERE a.status = 'pending'
      ORDER BY a.priority_level DESC, a.date_requested ASC
    `);
    
    return result.rows;
  }

    /**
   * Find the medical staff member with the least number of assigned appointments
   * If there's a tie, returns the first one in the list
   */
  async getLeastAssignedMedicalStaff() {
    const result = await query(`
      SELECT 
        ms.staff_id,
        ms.user_id,
        u.name,
        u.email,
        COUNT(a.appointment_id) as appointment_count
      FROM medical_staff ms
      JOIN users u ON ms.user_id = u.user_id
      LEFT JOIN appointments a ON ms.staff_id = a.medical_staff_id 
        AND a.status IN ('pending', 'approved')
      WHERE u.status = 'active'
      GROUP BY ms.staff_id, ms.user_id, u.name, u.email
      ORDER BY appointment_count ASC, u.name ASC
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      throw new Error('No active medical staff available');
    }
    
    return result.rows[0];
  }  /**
   * Get the least assigned medical staff member by specialty group for auto-assignment
   */
  async getLeastAssignedMedicalStaffBySpecialty(healthIssueType, preferredDate = null, preferredTime = null) {
    let queryText;
    let values = [healthIssueType];

    if (preferredDate && preferredTime) {
      // Get available staff based on specialty group and shift schedule
      const inputDate = new Date(preferredDate);
      const dayOfWeek = inputDate.getDay();
      
      queryText = `
        SELECT 
          ms.staff_id,
          u.user_id,
          u.name,
          ms.specialty,
          ms.specialty_group,
          ms.shift_schedule,
          COUNT(a.appointment_id) as appointment_count
        FROM medical_staff ms
        INNER JOIN users u ON ms.user_id = u.user_id
        LEFT JOIN appointments a ON ms.staff_id = a.medical_staff_id 
          AND a.status NOT IN ('cancelled', 'rejected', 'completed')
        WHERE u.status = 'active'
          AND ms.specialty_group = $1
        GROUP BY ms.staff_id, u.user_id, u.name, ms.specialty, ms.specialty_group, ms.shift_schedule
        ORDER BY appointment_count ASC, u.name ASC
        LIMIT 1
      `;
    } else {
      // General assignment by specialty group without time consideration
      queryText = `
        SELECT 
          ms.staff_id,
          u.user_id,
          u.name,
          ms.specialty,
          ms.specialty_group,
          ms.shift_schedule,
          COUNT(a.appointment_id) as appointment_count
        FROM medical_staff ms
        INNER JOIN users u ON ms.user_id = u.user_id
        LEFT JOIN appointments a ON ms.staff_id = a.medical_staff_id 
          AND a.status NOT IN ('cancelled', 'rejected', 'completed')
        WHERE u.status = 'active'
          AND ms.specialty_group = $1
        GROUP BY ms.staff_id, u.user_id, u.name, ms.specialty, ms.specialty_group, ms.shift_schedule
        ORDER BY appointment_count ASC, u.name ASC
        LIMIT 1
      `;
    }

    console.log(`[DEBUG] Looking for ${healthIssueType} specialists...`);
    const result = await query(queryText, values);
    
    if (result.rows.length === 0) {
      throw new Error(`No available medical staff found for ${healthIssueType} health issues`);
    }
      return result.rows[0];
  }

  /**
   * Check if a medical staff member is available at a specific date/time
   */
  isStaffAvailableAtTime(shiftSchedule, date, time) {
    if (!shiftSchedule || typeof shiftSchedule !== 'object') {
      return false;
    }

    const inputDate = new Date(date);
    const dayOfWeek = inputDate.getDay();
    const dayName = this.getDayName(dayOfWeek);

    const dayShifts = shiftSchedule[dayName];
    if (!dayShifts || !Array.isArray(dayShifts)) {
      return false;
    }

    // Check if the requested time falls within any of the staff's shifts
    for (const shift of dayShifts) {
      if (this.isTimeInShift(time, shift)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Helper method to convert day number to day name
   */
  getDayName(dayOfWeek) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayOfWeek];
  }

  /**
   * Helper method to check if a time slot is within a shift
   */
  isTimeInShift(timeSlot, shift) {
    const [shiftStart, shiftEnd] = shift.split('-');
    return timeSlot >= shiftStart && timeSlot <= shiftEnd;
  }
  /**
   * Get available time slots for a specific date
   * Returns time slots that are not already booked for the given date (excludes blackout dates)
   */  async getAvailableTimeSlots(date) {
    const inputDate = new Date(date);
    const dayOfWeek = inputDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    // No slots available on weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return [];
    }

    // Check for blackout dates (holidays)
    const blackoutCheck = await query(`
      SELECT reason, type FROM blackout_dates WHERE date = $1
    `, [date]);
    
    if (blackoutCheck.rows.length > 0) {
      return []; // No slots available on blackout dates
    }

    // Convert JavaScript day (0-6) to our database format (1-5 for Mon-Fri)
    // JavaScript: Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6    // Database: Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5
    const dbDayOfWeek = dayOfWeek; // Monday=1 in JS maps to Monday=1 in DB
    
    const result = await query(`
      SELECT 
        ts.start_time, 
        ts.end_time,
        TO_CHAR(ts.start_time, 'HH24:MI') as "startTimeFormatted",
        TO_CHAR(ts.end_time, 'HH24:MI') as "endTimeFormatted"
      FROM time_slots ts
      WHERE ts.day_of_week = $1
      AND NOT EXISTS (
        SELECT 1 FROM appointments a 
        WHERE DATE(a.date_scheduled) = $2 
        AND a.time_scheduled = ts.start_time
        AND a.status NOT IN ('cancelled', 'rejected')
      )
      ORDER BY ts.start_time
    `, [dbDayOfWeek, date]);

    // Format the response to match test expectations
    return result.rows.map(slot => ({
      time: slot.startTimeFormatted,
      start_time: slot.start_time,
      end_time: slot.end_time,
      startTime: slot.startTimeFormatted,
      endTime: slot.endTimeFormatted,
      available: true
    }));
  }  /**
   * Check if a specific time slot is available for booking (includes blackout date check)
   */
  async isTimeSlotAvailable(date, timeScheduled, excludeAppointmentId = null) {
    console.log(`[DEBUG] Checking time slot availability for date: ${date}, time: ${timeScheduled}, excluding appointment: ${excludeAppointmentId}`);
    
    // Check for blackout dates first
    const blackoutCheck = await query(`
      SELECT 1 FROM blackout_dates WHERE date = $1
    `, [date]);
    
    if (blackoutCheck.rows.length > 0) {
      console.log(`[DEBUG] Date ${date} is blacklisted`);
      return false; // Date is blocked
    }

    const inputDate = new Date(date);
    const dayOfWeek = inputDate.getDay();
    console.log(`[DEBUG] Date ${date} is day of week: ${dayOfWeek} (0=Sun, 1=Mon, ..., 6=Sat)`);
    
    // Convert JavaScript day (0=Sunday) to database day (1=Monday)
    // JavaScript: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    // Database: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
    let dbDayOfWeek;
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log(`[DEBUG] Weekend day (${dayOfWeek}) - no appointments available`);
      return false; // No appointments on weekends
    } else {
      dbDayOfWeek = dayOfWeek; // Monday=1, Tuesday=2, ..., Friday=5
    }
    
    console.log(`[DEBUG] Converted to database day of week: ${dbDayOfWeek}`);
    
    // Check if the time slot exists for this day of week
    const slotExistsResult = await query(`
      SELECT start_time, end_time FROM time_slots 
      WHERE day_of_week = $1 AND start_time = $2
    `, [dbDayOfWeek, timeScheduled]);

    console.log(`[DEBUG] Time slot query result:`, slotExistsResult.rows);

    if (slotExistsResult.rows.length === 0) {
      console.log(`[DEBUG] Time slot ${timeScheduled} doesn't exist for day ${dbDayOfWeek}`);
      
      // Let's also check what time slots ARE available for this day
      const availableSlotsResult = await query(`
        SELECT start_time FROM time_slots 
        WHERE day_of_week = $1 
        ORDER BY start_time
      `, [dbDayOfWeek]);
      
      console.log(`[DEBUG] Available time slots for day ${dbDayOfWeek}:`, availableSlotsResult.rows.map(row => row.start_time));
      
      return false; // Time slot doesn't exist for this day
    }    // Check if the time slot is available (not booked by other appointments)
    let conflictQuery = `
      SELECT 1 FROM appointments 
      WHERE DATE(date_scheduled) = $1 
      AND time_scheduled = $2
      AND status NOT IN ('cancelled', 'rejected')
    `;
    let queryParams = [date, timeScheduled];
    
    // Exclude the current appointment if specified
    if (excludeAppointmentId) {
      conflictQuery += ` AND appointment_id != $3`;
      queryParams.push(excludeAppointmentId);
    }

    const result = await query(conflictQuery, queryParams);

    const isAvailable = result.rows.length === 0;
    console.log(`[DEBUG] Time slot availability check: ${isAvailable ? 'AVAILABLE' : 'BOOKED'}`);
    
    return isAvailable; // Available if no conflicting appointments
  }

  /**
   * Validate if medical staff exists and is active
   * Returns staff details including specialty information
   */
  async validateMedicalStaffExists(medicalStaffId) {
    const result = await query(`
      SELECT 
        ms.staff_id,
        ms.specialty,
        ms.specialty_group,
        u.user_id,
        u.name,
        u.status
      FROM medical_staff ms
      INNER JOIN users u ON ms.user_id = u.user_id
      WHERE ms.staff_id = $1
    `, [medicalStaffId]);
    
    if (result.rows.length === 0) {
      return { exists: false };
    }
    
    const staff = result.rows[0];
    
    return {
      exists: true,
      isActive: staff.status === 'active',
      staffId: staff.staff_id,
      userId: staff.user_id,
      name: staff.name,
      specialty: staff.specialty,
      specialtyGroup: staff.specialty_group
    };
  }

  /**
   * Get available medical staff for appointment booking
   * Returns active medical staff with basic information
   */
  async getAvailableMedicalStaffForBooking() {
    const result = await query(`
      SELECT 
        ms.staff_id as "staffId",
        ms.specialty,
        ms.specialty_group as "specialtyGroup",
        u.user_id as "userId",
        u.name,
        u.email,
        COUNT(a.appointment_id) as "appointmentCount"
      FROM medical_staff ms
      INNER JOIN users u ON ms.user_id = u.user_id
      LEFT JOIN appointments a ON ms.staff_id = a.medical_staff_id 
        AND a.status IN ('pending', 'approved')
      WHERE u.status = 'active'
      GROUP BY ms.staff_id, ms.specialty, ms.specialty_group, u.user_id, u.name, u.email
      ORDER BY ms.specialty_group, u.name ASC
    `);
    
    return result.rows;
  }

  /**
   * Find the nearest available time slot for a given date and time
   * Rounds backward to the nearest 20-minute interval, then forward if occupied
   */
  async findNearestAvailableTimeSlot(date, requestedTime) {
    // Parse the requested time
    const [hours, minutes] = requestedTime.split(':').map(Number);
    
    // Round backward to nearest 20-minute interval
    const roundedMinutes = Math.floor(minutes / 20) * 20;
    const roundedTime = `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}:00`;
    
    console.log(`[DEBUG] Requested time: ${requestedTime}, Rounded to: ${roundedTime}`);
    
    // Get the day of week for the date
    const inputDate = new Date(date);
    const dayOfWeek = inputDate.getDay();
    
    // Get all available time slots for this day
    const availableSlotsResult = await query(`
      SELECT start_time, end_time 
      FROM time_slots 
      WHERE day_of_week = $1 
      AND start_time >= $2
      ORDER BY start_time
    `, [dayOfWeek, roundedTime]);
    
    if (availableSlotsResult.rows.length === 0) {
      throw new Error(`No time slots available after ${roundedTime} on this day`);
    }
    
    // Check each slot starting from the rounded time
    for (const slot of availableSlotsResult.rows) {
      const isAvailable = await this.isTimeSlotAvailable(date, slot.start_time);
      if (isAvailable) {
        console.log(`[DEBUG] Found available slot: ${slot.start_time}`);
        return slot.start_time;
      }
      console.log(`[DEBUG] Slot ${slot.start_time} is occupied, trying next...`);
    }
    
    // If no slots available after the rounded time, check earlier slots
    const earlierSlotsResult = await query(`
      SELECT start_time, end_time 
      FROM time_slots 
      WHERE day_of_week = $1 
      AND start_time < $2
      ORDER BY start_time DESC
    `, [dayOfWeek, roundedTime]);
    
    for (const slot of earlierSlotsResult.rows) {
      const isAvailable = await this.isTimeSlotAvailable(date, slot.start_time);
      if (isAvailable) {
        console.log(`[DEBUG] Found available earlier slot: ${slot.start_time}`);
        return slot.start_time;
      }
    }
    
    throw new Error('No available time slots found for this date');
  }

  /**
   * Delete appointment - with role-based authorization
   * Students can delete their own appointments
   * Medical staff can delete pending appointments or appointments assigned to them
   * Admins can delete any appointment
   */
  async deleteAppointment(appointmentId, userId, userRole) {
    console.log(`[DEBUG] deleteAppointment called with appointmentId: ${appointmentId}, userId: ${userId}, userRole: ${userRole}`);
    
    // First, get the appointment to check permissions
    const appointmentResult = await query(`
      SELECT 
        appointment_id,
        user_id,
        medical_staff_id,
        status,
        date_scheduled,
        time_scheduled,
        symptoms
      FROM appointments 
      WHERE appointment_id = $1
    `, [appointmentId]);
    
    if (appointmentResult.rows.length === 0) {
      throw new Error('Appointment not found');
    }
    
    const appointment = appointmentResult.rows[0];
    
    // Role-based authorization
    let canDelete = false;
    
    if (userRole === 'admin') {
      canDelete = true; // Admins can delete any appointment
    } else if (userRole === 'student') {
      // Students can only delete their own appointments
      canDelete = appointment.user_id === userId;
    } else if (userRole === 'medical_staff') {
      // Medical staff can delete:
      // 1. Pending appointments (not yet assigned)
      // 2. Appointments assigned to them
      if (appointment.status === 'pending') {
        canDelete = true;
      } else {
        // Check if this medical staff is assigned to the appointment
        const staffResult = await query(
          'SELECT staff_id FROM medical_staff WHERE user_id = $1',
          [userId]
        );
        
        if (staffResult.rows.length > 0) {
          const staffId = staffResult.rows[0].staff_id;
          canDelete = appointment.medical_staff_id === staffId;
        }
      }
    }
    
    if (!canDelete) {
      throw new Error('You do not have permission to delete this appointment');
    }
    
    // Check if appointment can be deleted based on status
    if (appointment.status === 'completed') {
      throw new Error('Cannot delete completed appointments');
    }
    
    // Perform the deletion
    const deleteResult = await query(`
      DELETE FROM appointments 
      WHERE appointment_id = $1
      RETURNING 
        appointment_id as "id",
        user_id as "userId",
        status,
        date_scheduled as "dateScheduled",
        time_scheduled as "timeScheduled"
    `, [appointmentId]);
    
    if (deleteResult.rows.length === 0) {
      throw new Error('Failed to delete appointment');
    }
    
    const deletedAppointment = deleteResult.rows[0];
    
    // Send notification to the student (if not deleted by the student themselves)
    if (userRole !== 'student') {
      try {
        const notificationService = require('./notificationService');
        await notificationService.notifyStudentAppointmentCancelled(
          appointment.user_id,
          appointment.appointment_id,
          `Your appointment scheduled for ${appointment.date_scheduled} at ${appointment.time_scheduled} has been cancelled.`
        );
      } catch (notificationError) {
        console.log(`[DEBUG] Failed to send cancellation notification: ${notificationError.message}`);
        // Continue without failing the deletion
      }
    }
    
    console.log(`[DEBUG] Successfully deleted appointment: ${appointmentId}`);
    return deletedAppointment;
  }

}

module.exports = new AppointmentService();