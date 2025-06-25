const { query } = require('../config/database');

class AbuseReportService {
  /**
   * Create abuse report - Can be used by medical staff or admins
   */
  async createReport(reportData) {
    const { reporterId, reporterType, studentId, appointmentId, description, reportType = 'system_abuse' } = reportData;
    
    // Verify appointment exists if provided
    if (appointmentId) {
      const appointmentResult = await query(
        'SELECT appointment_id, user_id FROM appointments WHERE appointment_id = $1',
        [appointmentId]
      );
      
      if (appointmentResult.rows.length === 0) {
        throw new Error('Appointment not found');
      }
    }

    // Verify student exists
    const studentResult = await query(
      'SELECT student_id FROM students WHERE user_id = $1',
      [studentId]
    );
    
    if (studentResult.rows.length === 0) {
      throw new Error('Student not found');
    }

    const studentDbId = studentResult.rows[0].student_id;

    // Get staff_id based on reporter type
    let staffId = null;
    if (reporterType === 'medical_staff') {
      const staffResult = await query(
        'SELECT staff_id FROM medical_staff WHERE user_id = $1',
        [reporterId]
      );
      if (staffResult.rows.length === 0) {
        throw new Error('Medical staff not found');
      }
      staffId = staffResult.rows[0].staff_id;
    }

    const result = await query(`
      INSERT INTO abuse_reports (staff_id, student_id, description, report_type, appointment_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING report_id, staff_id, student_id, report_date, description, status, report_type, appointment_id
    `, [staffId, studentDbId, description, reportType, appointmentId]);

    return result.rows[0];
  }

  /**
   * Get abuse reports by reporter
   */
  async getReportsByReporter(reporterId, reporterType) {
    let staffId = null;
    
    if (reporterType === 'medical_staff') {
      const staffResult = await query(
        'SELECT staff_id FROM medical_staff WHERE user_id = $1',
        [reporterId]
      );
      
      if (staffResult.rows.length === 0) {
        throw new Error('Medical staff not found');
      }
      staffId = staffResult.rows[0].staff_id;
    }

    const result = await query(`
      SELECT 
        ar.report_id as "id",
        ar.report_date as "reportDate",
        ar.description,
        ar.status,
        ar.report_type as "reportType",
        ar.appointment_id as "appointmentId",
        s.student_id as "studentId",
        u.name as "studentName",
        u.email as "studentEmail",
        a.symptoms as "appointmentSymptoms",
        a.priority_level as "appointmentPriority"
      FROM abuse_reports ar
      JOIN students s ON ar.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN appointments a ON ar.appointment_id = a.appointment_id
      WHERE ar.staff_id = $1
      ORDER BY ar.report_date DESC
    `, [staffId]);

    return result.rows;
  }

  /**
   * Update abuse report
   */
  async updateReport(reportId, reporterId, reporterType, updateData) {
    let staffId = null;
    
    if (reporterType === 'medical_staff') {
      const staffResult = await query(
        'SELECT staff_id FROM medical_staff WHERE user_id = $1',
        [reporterId]
      );
      
      if (staffResult.rows.length === 0) {
        throw new Error('Medical staff not found');
      }
      staffId = staffResult.rows[0].staff_id;
    }

    const { description } = updateData;
    
    const result = await query(`
      UPDATE abuse_reports 
      SET description = COALESCE($1, description)
      WHERE report_id = $2 AND staff_id = $3
      RETURNING report_id, description, report_date, status
    `, [description, reportId, staffId]);

    if (result.rows.length === 0) {
      throw new Error('Abuse report not found or you do not have permission to update it');
    }

    return result.rows[0];
  }
  /**
   * Check if user can report on appointment
   */
    async canReportOnAppointment(appointmentId, userId, userType) {
    if (userType === 'medical_staff') {
        // Check if medical staff is assigned to the appointment
        const result = await query(`
        SELECT a.appointment_id, a.status 
        FROM appointments a
        WHERE a.appointment_id = $1 
            AND a.medical_staff_id = (
            SELECT staff_id FROM medical_staff WHERE user_id = $2
            )
        `, [appointmentId, userId]);
        
        return result.rows.length > 0;
    }
    return false;
    }
  }

module.exports = new AbuseReportService();