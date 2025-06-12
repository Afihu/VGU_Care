const { query } = require("../config/database");
const BaseService = require("./baseService");

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

  async createAppointment(userId, symptoms, priorityLevel) {
    const dateScheduled = '2025-06-25 10:47:49.334376'; // Set the desired date_scheduled value

    const result = await query(
      `
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
      `,
      [userId, symptoms, priorityLevel, dateScheduled]
    );

    console.log(`[DEBUG] Appointment created:`, result.rows[0]);
    return result.rows[0];
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

      // Allow student to set status to 'scheduled' (e.g., when rescheduling) or 'cancelled'
      if (normalizedStatus !== "cancelled" && normalizedStatus !== "scheduled") {
        console.log(`[DEBUG] Invalid status update attempt. Status must be 'scheduled' or 'cancelled'. Received: '${normalizedStatus}'`);
        throw new Error("Invalid status update. Allowed statuses are 'scheduled' or 'cancelled'.");
      }
      updates.push(`status = $${paramCount}`);
      values.push(normalizedStatus);
      paramCount++;
    }

    if (priorityLevel !== undefined) {
      // Assuming priorityLevel is one of 'low', 'medium', 'high' as per schema
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
      // Add validation for dateScheduled if necessary (e.g., format, future date)
      updates.push(`date_scheduled = $${paramCount}`);
      values.push(dateScheduled); // Ensure this is a valid timestamp string or Date object
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
      // This might indicate the appointment_id was not found,
      // or if optimistic locking is used, that the row was changed.
      throw new Error("Appointment not found or update failed");
    }    console.log('[DEBUG] updateAppointment - Updated appointment:', JSON.stringify(result.rows[0], null, 2));
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
}

module.exports = new AppointmentService();