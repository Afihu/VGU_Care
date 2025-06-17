const { query } = require("../config/database");
const BaseService = require("./baseService");
const notificationService = require("./notificationService");

class AppointmentService extends BaseService {
  async getAppointmentsByUserId(userId) {
    const result = await query(
      `
      SELECT 
        a.appointment_id as "id",
        a.user_id as "userId",
        a.status,
        a.date_requested as "dateRequested",
        a.date_scheduled as "dateScheduled",
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
        a.priority_level as "priorityLevel",
        a.symptoms
      FROM appointments a
      WHERE a.appointment_id = $1
      `,
      [appointmentId]
    );
  
    return result.rows[0] || null;
  }
  async createAppointment(userId, symptoms, priorityLevel, medicalStaffId = null) {
    const dateScheduled = '2025-06-25 10:47:49.334376'; // Set the desired date_scheduled value

    // If no medical staff is specified, automatically assign to the least busy one
    let assignedStaffId = medicalStaffId;
    if (!assignedStaffId) {
      try {
        const leastAssignedStaff = await this.getLeastAssignedMedicalStaff();
        assignedStaffId = leastAssignedStaff.staff_id;
        console.log(`[DEBUG] Auto-assigned appointment to medical staff: ${leastAssignedStaff.name} (${leastAssignedStaff.appointment_count} existing appointments)`);
      } catch (error) {
        console.log(`[DEBUG] Could not auto-assign medical staff: ${error.message}`);
        // Continue without assignment if no medical staff available
      }
    }

    let queryText, values;
    if (assignedStaffId) {
      queryText = `
        INSERT INTO appointments (user_id, symptoms, priority_level, date_scheduled, medical_staff_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING 
          appointment_id as "id",
          user_id as "userId",
          status,
          date_requested as "dateRequested",
          date_scheduled as "dateScheduled",
          priority_level as "priorityLevel",
          symptoms
      `;
      values = [userId, symptoms, priorityLevel, dateScheduled, assignedStaffId];
    } else {
      queryText = `
        INSERT INTO appointments (user_id, symptoms, priority_level, date_scheduled)
        VALUES ($1, $2, $3, $4)
        RETURNING 
          appointment_id as "id",
          user_id as "userId",
          status,
          date_requested as "dateRequested",
          date_scheduled as "dateScheduled",
          priority_level as "priorityLevel",
          symptoms
      `;
      values = [userId, symptoms, priorityLevel, dateScheduled];
    }    const result = await query(queryText, values);
    const appointment = result.rows[0];
    console.log(`[DEBUG] Appointment created:`, appointment);

    // Send notification to medical staff if assigned
    if (assignedStaffId) {
      try {
        // Get student name for notification
        const studentResult = await query('SELECT name FROM users WHERE user_id = $1', [userId]);
        const studentName = studentResult.rows[0]?.name || 'Student';
        
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
      } catch (notificationError) {
        console.log(`[DEBUG] Failed to send assignment notification: ${notificationError.message}`);
        // Continue without failing the appointment creation
      }
    }

    return appointment;
  }

    async updateAppointment(appointmentId, updateData) {
    const { symptoms, status, priorityLevel, dateScheduled } = updateData;

    console.log('[DEBUG] updateAppointment - Received updateData:', JSON.stringify(updateData, null, 2));

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
      console.log(`[DEBUG] updateAppointment - Normalized status: '${normalizedStatus}' (type: ${typeof normalizedStatus})`);

      // REMOVE THE RESTRICTIVE VALIDATION - Let the controller handle role-based validation
      const validStatuses = ['pending', 'approved', 'rejected', 'scheduled', 'completed', 'cancelled'];
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
        priority_level as "priorityLevel",
        symptoms
    `;
    console.log('[DEBUG] updateAppointment - Query:', queryText);
    console.log('[DEBUG] updateAppointment - Values:', values);

    const result = await query(queryText, values);

    if (result.rows.length === 0) {
      throw new Error("Appointment not found or update failed");
    }
    
    console.log('[DEBUG] updateAppointment - Updated appointment:', JSON.stringify(result.rows[0], null, 2));
    return result.rows[0];
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

  async createAppointmentByMedicalStaff(medicalStaffUserId, symptoms, priorityLevel, studentUserId = null) {
    // Get medical staff's staff_id from user_id
    const staffResult = await query(
      'SELECT staff_id FROM medical_staff WHERE user_id = $1',
      [medicalStaffUserId]
    );
    
    if (staffResult.rows.length === 0) {
      throw new Error('Medical staff not found');
    }
    
    const staffId = staffResult.rows[0].staff_id;
    
    // If no student specified, this would need to be handled in frontend
    // For now, medical staff can create appointments and assign them later
    const dateScheduled = '2025-06-25 10:47:49.334376'; // Default scheduled time
    
    const result = await query(
      `
      INSERT INTO appointments (user_id, symptoms, priority_level, date_scheduled, medical_staff_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        appointment_id as "id",
        user_id as "userId",
        status,
        date_requested as "dateRequested",
        date_scheduled as "dateScheduled",
        priority_level as "priorityLevel",
        symptoms
      `,
      [studentUserId || medicalStaffUserId, symptoms, priorityLevel, dateScheduled, staffId]
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
  }

    /**
   * Approve appointment - Medical staff only
   * Implements "Approve / Reject Appointment" use case
   */
  async approveAppointment(appointmentId, medicalStaffUserId, dateScheduled = null) {
    // Get medical staff's staff_id
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
      SET status = 'approved', 
          medical_staff_id = $1,
          date_scheduled = COALESCE($2, CURRENT_TIMESTAMP + INTERVAL '1 week')
      WHERE appointment_id = $3 AND status = 'pending'
      RETURNING 
        appointment_id as "id",
        user_id as "userId", 
        status,
        date_requested as "dateRequested",
        date_scheduled as "dateScheduled",
        priority_level as "priorityLevel",
        symptoms    `, [staffId, dateScheduled, appointmentId]);
    
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
  }

    /**
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
  }

    /**
   * Get pending appointments for medical staff review
   */
  async getPendingAppointments() {
    const result = await query(`
      SELECT 
        a.appointment_id as "id",
        a.user_id as "userId",
        a.status,
        a.date_requested as "dateRequested",
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
        AND a.status IN ('pending', 'approved', 'scheduled')
      WHERE u.status = 'active'
      GROUP BY ms.staff_id, ms.user_id, u.name, u.email
      ORDER BY appointment_count ASC, u.name ASC
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      throw new Error('No active medical staff available');
    }
    
    return result.rows[0];
  }

}

module.exports = new AppointmentService();