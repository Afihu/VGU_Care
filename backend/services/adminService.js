const { query } = require('../config/database');
const BaseService = require('./baseService');
const UserQueryBuilder = require('../utils/userQueryBuilder');
const bcrypt = require('bcrypt');

/**
 * AdminService - Handles all admin-specific operations
 * This service provides admin users with elevated privileges to manage:
 * - All user profiles (students and medical staff)
 * - All appointments across the system * - All mood tracker entries
 * - All temporary advice
 * - All abuse reports
 * - User roles and permissions
 */
class AdminService extends BaseService {
  
  // ==================== USER MANAGEMENT ====================
    /**
   * Get all student profiles with their specific data
   */
  async getAllStudents() {
    const result = await query(UserQueryBuilder.buildStudentsOnlyQuery());
    return UserQueryBuilder.transformUserRows(result.rows);
  }

  /**
   * Get all medical staff profiles with their specific data
   */
  async getAllMedicalStaff() {
    const result = await query(UserQueryBuilder.buildMedicalStaffOnlyQuery());
    return UserQueryBuilder.transformUserRows(result.rows);
  }

  /**
   * Update user role - Admin exclusive privilege
   */
  async updateUserRole(userId, newRole, roleSpecificData = {}) {
    return await this.withTransaction(async (client) => {
      // Validate role
      const validRoles = ['student', 'medical_staff', 'admin'];
      if (!validRoles.includes(newRole)) {
        throw new Error('Invalid role. Must be student, medical_staff, or admin');
      }

      // Get current user data
      const userResult = await client.query(
        'SELECT role FROM users WHERE user_id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const currentRole = userResult.rows[0].role;
      
      if (currentRole === newRole) {
        throw new Error('User already has this role');
      }

      // Delete from current role-specific table
      await this._deleteRoleSpecificRecord(client, userId, currentRole);

      // Update user role
      await client.query(
        'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [newRole, userId]
      );

      // Create new role-specific record
      await this._createRoleSpecificRecord(client, userId, newRole, roleSpecificData);

      return { message: `User role updated from ${currentRole} to ${newRole}` };
    });
  }
  /**
   * Update user status (active/inactive/banned) - Admin exclusive privilege
   */
  async updateUserStatus(userId, status) {
    const validStatuses = ['active', 'inactive', 'banned'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status. Must be active, inactive, or banned');
    }

    const result = await query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING user_id, email, status',
      [status, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  /**
   * Update user name - Admin exclusive privilege
   */
  async updateUserName(userId, name) {
    if (!name || name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }

    const result = await query(
      'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING user_id, name, email',
      [name.trim(), userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  // ==================== APPOINTMENT MANAGEMENT ====================

  /**
   * Get all appointments across the system
   */  async getAllAppointments() {
    const result = await query(`
      SELECT 
        a.appointment_id, a.status, a.date_requested, a.date_scheduled, a.time_scheduled,
        a.priority_level, a.symptoms,
        u.user_id, u.name, u.email, u.role
      FROM appointments a
      JOIN users u ON a.user_id = u.user_id
      ORDER BY a.date_requested DESC
    `);

    return result.rows.map(row => ({
      id: row.appointment_id,
      userId: row.user_id,
      userName: row.name,
      userEmail: row.email,
      userRole: row.role,
      status: row.status,
      dateRequested: row.date_requested,
      dateScheduled: row.date_scheduled,
      timeScheduled: row.time_scheduled,
      priorityLevel: row.priority_level,
      symptoms: row.symptoms
    }));
  }

  /**
   * Create appointment for any student - Admin privilege
   */
  async createAppointment(userId, appointmentData) {
    const { priorityLevel, symptoms, dateScheduled } = appointmentData;
    
    // Verify user exists and is a student
    const userResult = await query(
      'SELECT role FROM users WHERE user_id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    if (userResult.rows[0].role !== 'student') {
      throw new Error('Appointments can only be created for students');
    }

    const result = await query(`
      INSERT INTO appointments (user_id, priority_level, symptoms, date_scheduled)
      VALUES ($1, $2, $3, $4)
      RETURNING appointment_id, user_id, status, date_requested, date_scheduled, priority_level, symptoms
    `, [userId, priorityLevel, symptoms, dateScheduled]);

    return result.rows[0];
  }
  /**
   * Update any appointment - Admin privilege
   */
  async updateAppointment(appointmentId, updateData) {
    const { status, dateScheduled, priorityLevel, symptoms } = updateData;
    
    const setClauses = [];
    const values = [];
    let paramCounter = 1;

    if (status !== undefined) {
      setClauses.push(`status = $${paramCounter}`);
      values.push(status);
      paramCounter++;
    }
    
    if (dateScheduled !== undefined) {
      setClauses.push(`date_scheduled = $${paramCounter}`);
      values.push(dateScheduled);
      paramCounter++;
    }
    
    if (priorityLevel !== undefined) {
      setClauses.push(`priority_level = $${paramCounter}`);
      values.push(priorityLevel);
      paramCounter++;
    }
    
    if (symptoms !== undefined) {
      setClauses.push(`symptoms = $${paramCounter}`);
      values.push(symptoms);
      paramCounter++;
    }

    // If no fields to update, throw error
    if (setClauses.length === 0) {
      throw new Error('No valid fields provided for update');
    }

    values.push(appointmentId);
    
    const result = await query(
      `UPDATE appointments SET ${setClauses.join(', ')} WHERE appointment_id = $${paramCounter} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Appointment not found');
    }

    return result.rows[0];
  }

  // ==================== MOOD TRACKER MANAGEMENT ====================

  /**
   * Get all mood entries across the system
   */
  async getAllMoodEntries() {
    const result = await query(`
      SELECT 
        me.entry_id, me.mood, me.entry_date, me.notes,
        s.student_id, u.user_id, u.name, u.email
      FROM mood_entries me
      JOIN students s ON me.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      ORDER BY me.entry_date DESC
    `);

    return result.rows.map(row => ({
      id: row.entry_id,
      studentId: row.student_id,
      userId: row.user_id,
      studentName: row.name,
      studentEmail: row.email,
      mood: row.mood,
      entryDate: row.entry_date,
      notes: row.notes
    }));
  }

  /**
   * Create mood entry for any student - Admin privilege
   */
  async createMoodEntry(userId, moodData) {
    const { mood, notes } = moodData;
    
    // Get student_id from user_id
    const studentResult = await query(
      'SELECT student_id FROM students WHERE user_id = $1',
      [userId]
    );
    
    if (studentResult.rows.length === 0) {
      throw new Error('Student not found');
    }

    const studentId = studentResult.rows[0].student_id;

    const result = await query(`
      INSERT INTO mood_entries (student_id, mood, notes)
      VALUES ($1, $2, $3)
      RETURNING entry_id, student_id, mood, entry_date, notes
    `, [studentId, mood, notes]);

    return result.rows[0];
  }

  /**
   * Update any mood entry - Admin privilege
   */
  async updateMoodEntry(entryId, moodData) {
    const { mood, notes } = moodData;
    
    let setClause = '';
    const values = [];
    let paramCounter = 1;

    if (mood !== undefined) {
      setClause += `mood = $${paramCounter}`;
      values.push(mood);
      paramCounter++;
    }
    
    if (notes !== undefined) {
      if (setClause) setClause += ', ';
      setClause += `notes = $${paramCounter}`;
      values.push(notes);
      paramCounter++;
    }

    if (!setClause) {
      throw new Error('No valid fields to update');
    }

    values.push(entryId);
    
    const result = await query(
      `UPDATE mood_entries SET ${setClause} WHERE entry_id = $${paramCounter} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Mood entry not found');
    }

    return result.rows[0];
  }
  // ==================== TEMPORARY ADVICE MANAGEMENT ====================

  /**
   * Get all temporary advice across the system
   */
  async getAllTemporaryAdvice() {
    const result = await query(`
      SELECT 
        ta.advice_id, ta.message, ta.date_sent,
        a.appointment_id, a.symptoms, a.priority_level,
        u.user_id, u.name, u.email
      FROM temporary_advice ta
      JOIN appointments a ON ta.appointment_id = a.appointment_id
      JOIN users u ON a.user_id = u.user_id
      ORDER BY ta.date_sent DESC
    `);

    return result.rows.map(row => ({
      id: row.advice_id,
      appointmentId: row.appointment_id,
      userId: row.user_id,
      userName: row.name,
      userEmail: row.email,
      message: row.message,
      dateSent: row.date_sent,
      appointmentSymptoms: row.symptoms,
      priorityLevel: row.priority_level
    }));
  }

  /**
   * Create temporary advice for any appointment - Admin privilege
   */
  async createTemporaryAdvice(appointmentId, message) {
    // Verify appointment exists
    const appointmentResult = await query(
      'SELECT appointment_id FROM appointments WHERE appointment_id = $1',
      [appointmentId]
    );
    
    if (appointmentResult.rows.length === 0) {
      throw new Error('Appointment not found');
    }

    const result = await query(`
      INSERT INTO temporary_advice (appointment_id, message)
      VALUES ($1, $2)
      RETURNING advice_id, appointment_id, message, date_sent
    `, [appointmentId, message]);

    return result.rows[0];
  }

  /**
   * Update temporary advice - Admin privilege
   */
  async updateTemporaryAdvice(adviceId, message) {
    const result = await query(
      'UPDATE temporary_advice SET message = $1 WHERE advice_id = $2 RETURNING *',
      [message, adviceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Temporary advice not found');
    }

    return result.rows[0];
  }

  /**
   * Delete temporary advice - Admin privilege
   */
  async deleteTemporaryAdvice(adviceId) {
    const result = await query(
      'DELETE FROM temporary_advice WHERE advice_id = $1 RETURNING advice_id',
      [adviceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Temporary advice not found');
    }

    return { message: 'Temporary advice deleted successfully' };
  }

  // ==================== ABUSE REPORTS MANAGEMENT ====================

  /**
   * Get all abuse reports across the system
   */
  async getAllAbuseReports() {
    const result = await query(`
      SELECT 
        ar.report_id, ar.report_date, ar.description, ar.status,
        ms.staff_id, staff_user.name as staff_name, staff_user.email as staff_email,
        ar.student_id, student_user.name as student_name, student_user.email as student_email
      FROM abuse_reports ar
      JOIN medical_staff ms ON ar.staff_id = ms.staff_id
      JOIN users staff_user ON ms.user_id = staff_user.user_id
      LEFT JOIN students s ON ar.student_id = s.student_id
      LEFT JOIN users student_user ON s.user_id = student_user.user_id
      ORDER BY ar.report_date DESC
    `);

    return result.rows.map(row => ({
      id: row.report_id,
      staffId: row.staff_id,
      staffName: row.staff_name,
      staffEmail: row.staff_email,
      studentId: row.student_id,
      studentName: row.student_name,
      studentEmail: row.student_email,
      reportDate: row.report_date,
      description: row.description,
      status: row.status
    }));
  }

  /**
   * Create abuse report for any user - Admin privilege
   */
  async createAbuseReport(reportData) {
    const { staffId, studentId, description } = reportData;
    
    // Verify staff exists
    const staffResult = await query(
      'SELECT staff_id FROM medical_staff WHERE staff_id = $1',
      [staffId]
    );
    
    if (staffResult.rows.length === 0) {
      throw new Error('Medical staff not found');
    }

    // Verify student exists if provided
    if (studentId) {
      const studentResult = await query(
        'SELECT student_id FROM students WHERE student_id = $1',
        [studentId]
      );
      
      if (studentResult.rows.length === 0) {
        throw new Error('Student not found');
      }
    }

    const result = await query(`
      INSERT INTO abuse_reports (staff_id, student_id, description)
      VALUES ($1, $2, $3)
      RETURNING report_id, staff_id, student_id, report_date, description, status
    `, [staffId, studentId, description]);

    return result.rows[0];
  }

  /**
   * Update abuse report - Admin privilege
   */
  async updateAbuseReport(reportId, reportData) {
    const { description, status } = reportData;
    
    let setClause = '';
    const values = [];
    let paramCounter = 1;

    if (description !== undefined) {
      setClause += `description = $${paramCounter}`;
      values.push(description);
      paramCounter++;
    }
    
    if (status !== undefined) {
      if (setClause) setClause += ', ';
      setClause += `status = $${paramCounter}`;
      values.push(status);
      paramCounter++;
    }

    if (!setClause) {
      throw new Error('No valid fields to update');
    }

    values.push(reportId);
    
    const result = await query(
      `UPDATE abuse_reports SET ${setClause} WHERE report_id = $${paramCounter} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Abuse report not found');
    }

    return result.rows[0];
  }

  /**
   * Delete abuse report - Admin privilege
   */
  async deleteAbuseReport(reportId) {
    const result = await query(
      'DELETE FROM abuse_reports WHERE report_id = $1 RETURNING report_id',
      [reportId]
    );

    if (result.rows.length === 0) {
      throw new Error('Abuse report not found');
    }

    return { message: 'Abuse report deleted successfully' };
  }

  // ==================== BLACKOUT DATE MANAGEMENT ====================

  /**
   * Add blackout date and cancel existing appointments
   */
  async addBlackoutDate(date, reason, type, adminUserId) {
    return await this.withTransaction(async (client) => {
      // Check if blackout date already exists
      const existingResult = await client.query(
        'SELECT * FROM blackout_dates WHERE date = $1',
        [date]
      );
      
      if (existingResult.rows.length > 0) {
        throw new Error(`Blackout date for ${date} already exists`);
      }

      // Add blackout date
      const blackoutResult = await client.query(`
        INSERT INTO blackout_dates (date, reason, type, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [date, reason, type, adminUserId]);

      // Cancel existing appointments on this date
      const cancelResult = await client.query(`
        UPDATE appointments 
        SET status = 'cancelled'
        WHERE DATE(date_scheduled) = $1 
        AND status NOT IN ('cancelled', 'completed')
        RETURNING appointment_id, user_id
      `, [date]);

      // Send notifications to affected students
      const notificationService = require('./notificationService');
      for (const apt of cancelResult.rows) {
        try {
          await notificationService.createNotification(
            apt.user_id,
            'appointment_cancelled',
            'Appointment Cancelled - Holiday',
            `Your appointment on ${date} has been cancelled due to: ${reason}. Please reschedule.`,
            apt.appointment_id
          );
        } catch (notificationError) {
          console.log(`Failed to send notification for appointment ${apt.appointment_id}: ${notificationError.message}`);
        }
      }

      return {
        blackoutDate: blackoutResult.rows[0],
        cancelledCount: cancelResult.rows.length
      };
    });
  }

  /**
   * Remove blackout date
   */
  async removeBlackoutDate(date) {
    const result = await query(`
      DELETE FROM blackout_dates WHERE date = $1
      RETURNING *
    `, [date]);

    return result.rows[0] || null;
  }

  /**
   * Get blackout dates with optional filtering
   */
  async getBlackoutDates(startDate = null, endDate = null, type = null) {
    let queryText = `
      SELECT 
        bd.*,
        u.name as created_by_name
      FROM blackout_dates bd
      LEFT JOIN users u ON bd.created_by = u.user_id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (startDate && endDate) {
      queryText += ` AND bd.date BETWEEN $${paramCount} AND $${paramCount + 1}`;
      values.push(startDate, endDate);
      paramCount += 2;
    }

    if (type) {
      queryText += ` AND bd.type = $${paramCount}`;
      values.push(type);
      paramCount++;
    }

    queryText += ' ORDER BY bd.date ASC';

    const result = await query(queryText, values);
    return result.rows;
  }

  // ==================== HELPER METHODS ====================

  /**
   * Delete role-specific record when changing user role
   */
  async _deleteRoleSpecificRecord(client, userId, role) {
    switch (role) {
      case 'student':
        await client.query('DELETE FROM students WHERE user_id = $1', [userId]);
        break;
      case 'medical_staff':
        await client.query('DELETE FROM medical_staff WHERE user_id = $1', [userId]);
        break;
      case 'admin':
        await client.query('DELETE FROM admins WHERE user_id = $1', [userId]);
        break;
    }
  }

  /**
   * Create role-specific record when changing user role
   */
  async _createRoleSpecificRecord(client, userId, role, roleSpecificData = {}) {
    switch (role) {
      case 'student':
        const { intakeYear = new Date().getFullYear(), major = 'Undeclared' } = roleSpecificData;
        await client.query(
          'INSERT INTO students (user_id, intake_year, major) VALUES ($1, $2, $3)',
          [userId, intakeYear, major]
        );
        break;
      case 'medical_staff':
        const { specialty = 'General Medicine' } = roleSpecificData;
        await client.query(
          'INSERT INTO medical_staff (user_id, specialty) VALUES ($1, $2)',
          [userId, specialty]
        );
        break;
      case 'admin':
        await client.query(
          'INSERT INTO admins (user_id) VALUES ($1)',
          [userId]
        );
        break;
    }
  }
}

module.exports = new AdminService();
