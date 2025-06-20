const { query } = require('../config/database');
const BaseService = require('./baseService');

/**
 * Simple Advice Service - Just messages sent to students
 */
class AdviceService extends BaseService {

  /**
   * Send temporary advice to student for appointment
   * Implements "Send Temporary Advice" use case
   */
  async sendAdviceForAppointment(appointmentId, message, medicalStaffUserId) {
    // Get medical staff's staff_id
    const staffResult = await query(
      'SELECT staff_id FROM medical_staff WHERE user_id = $1',
      [medicalStaffUserId]
    );
    
    if (staffResult.rows.length === 0) {
      throw new Error('Medical staff not found');
    }
    
    const staffId = staffResult.rows[0].staff_id;
    
    // Verify appointment exists
    const appointmentResult = await query(
      'SELECT appointment_id, user_id FROM appointments WHERE appointment_id = $1',
      [appointmentId]
    );
    
    if (appointmentResult.rows.length === 0) {
      throw new Error('Appointment not found');
    }
    
    const result = await query(`
      INSERT INTO temporary_advice (appointment_id, message, created_by_staff_id)
      VALUES ($1, $2, $3)
      RETURNING 
        advice_id as "id",
        appointment_id as "appointmentId",
        message,
        date_sent as "dateSent"
    `, [appointmentId, message, staffId]);
    
    return result.rows[0];
  }

  /**
   * Get advice for student's appointments
   */
  async getAdviceForStudent(studentUserId) {
    const result = await query(`
      SELECT 
        ta.advice_id as "id",
        ta.message,
        ta.date_sent as "dateSent",
        a.appointment_id as "appointmentId",
        a.symptoms,
        ms.staff_id,
        u.name as "staffName"
      FROM temporary_advice ta
      JOIN appointments a ON ta.appointment_id = a.appointment_id  
      LEFT JOIN medical_staff ms ON ta.created_by_staff_id = ms.staff_id
      LEFT JOIN users u ON ms.user_id = u.user_id
      WHERE a.user_id = $1
      ORDER BY ta.date_sent DESC
    `, [studentUserId]);
    
    return result.rows;
  }

  /**
   * Get advice sent by medical staff
   */
  async getAdviceBySentByStaff(medicalStaffUserId) {
    const staffResult = await query(
      'SELECT staff_id FROM medical_staff WHERE user_id = $1',
      [medicalStaffUserId]
    );
    
    if (staffResult.rows.length === 0) {
      throw new Error('Medical staff not found');
    }
    
    const staffId = staffResult.rows[0].staff_id;
    
    const result = await query(`
      SELECT 
        ta.advice_id as "id",
        ta.message,
        ta.date_sent as "dateSent", 
        a.appointment_id as "appointmentId",
        a.symptoms,
        u.name as "studentName"
      FROM temporary_advice ta
      JOIN appointments a ON ta.appointment_id = a.appointment_id
      JOIN users u ON a.user_id = u.user_id
      WHERE ta.created_by_staff_id = $1
      ORDER BY ta.date_sent DESC
    `, [staffId]);
    
    return result.rows;
  }
  
  /**
   * Get advice for specific appointment
   */
  async getAdviceByAppointmentId(appointmentId, userId, userRole) {
    let whereClause = '';
    let params = [appointmentId];
    
    if (userRole === 'student') {
      // Students can only see advice for their own appointments
      whereClause = 'AND a.user_id = $2';
      params.push(userId);
    } else if (userRole === 'medical_staff') {
      // Medical staff can see advice they sent
      const staffResult = await query(
        'SELECT staff_id FROM medical_staff WHERE user_id = $1',
        [userId]
      );
      
      if (staffResult.rows.length === 0) {
        throw new Error('Medical staff not found');
      }
      
      whereClause = 'AND ta.created_by_staff_id = $2';
      params.push(staffResult.rows[0].staff_id);
    }
    
    const result = await query(`
      SELECT 
        ta.advice_id as "id",
        ta.message,
        ta.date_sent as "dateSent",
        a.appointment_id as "appointmentId",
        a.symptoms,
        u.name as "staffName"
      FROM temporary_advice ta
      JOIN appointments a ON ta.appointment_id = a.appointment_id
      LEFT JOIN medical_staff ms ON ta.created_by_staff_id = ms.staff_id
      LEFT JOIN users u ON ms.user_id = u.user_id
      WHERE ta.appointment_id = $1 ${whereClause}
      ORDER BY ta.date_sent DESC
    `, params);
    
    if (result.rows.length === 0) {
      throw new Error('Advice not found for this appointment');
    }
    
    return result.rows;
  }

  /**
   * Update advice for appointment
   */
  async updateAdviceForAppointment(appointmentId, newMessage, medicalStaffUserId) {
    // Get medical staff's staff_id
    const staffResult = await query(
      'SELECT staff_id FROM medical_staff WHERE user_id = $1',
      [medicalStaffUserId]
    );
    
    if (staffResult.rows.length === 0) {
      throw new Error('Medical staff not found');
    }
    
    const staffId = staffResult.rows[0].staff_id;
    
    // Update advice for this appointment created by this staff member
    const result = await query(`
      UPDATE temporary_advice 
      SET message = $1, date_sent = CURRENT_TIMESTAMP
      WHERE appointment_id = $2 AND created_by_staff_id = $3
      RETURNING 
        advice_id as "id",
        appointment_id as "appointmentId",
        message,
        date_sent as "dateSent"
    `, [newMessage, appointmentId, staffId]);
    
    if (result.rows.length === 0) {
      throw new Error('Advice not found or access denied');
    }
    
    return result.rows[0];
  }
}

module.exports = new AdviceService();