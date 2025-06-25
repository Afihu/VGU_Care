const { query } = require("../config/database");
const BaseService = require("./baseService");
const EmailService = require("./emailService");

/**
 * NotificationService - Handles in-app and email notification system
 * 
 * Features:
 * - Medical staff notifications for new appointment assignments
 * - Student notifications for appointment status changes
 * - Mark notifications as read/unread
 * - Get user notifications with filtering
 * - Email notifications for important events
 */
class NotificationService extends BaseService {

  /**
   * Create a new notification
   */
  async createNotification(userId, type, title, message, appointmentId = null) {
    const result = await query(`
      INSERT INTO notifications (user_id, appointment_id, type, title, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        notification_id as "id",
        user_id as "userId",
        appointment_id as "appointmentId",
        type,
        title,
        message,
        is_read as "isRead",
        created_at as "createdAt"
    `, [userId, appointmentId, type, title, message]);

    console.log(`[NOTIFICATION] Created notification for user ${userId}: ${title}`);
    return result.rows[0];
  }

  /**
   * Get notifications for a user (paginated with optional filtering)
   */
  async getUserNotifications(userId, options = {}) {
    const { 
      limit = 20, 
      offset = 0, 
      unreadOnly = false,
      type = null
    } = options;

    let whereClause = 'WHERE user_id = $1';
    const values = [userId];
    let paramCount = 2;

    if (unreadOnly) {
      whereClause += ` AND is_read = FALSE`;
    }

    if (type) {
      whereClause += ` AND type = $${paramCount}`;
      values.push(type);
      paramCount++;
    }

    const result = await query(`
      SELECT 
        notification_id as "id",
        user_id as "userId",
        appointment_id as "appointmentId",
        type,
        title,
        message,
        is_read as "isRead",
        created_at as "createdAt",
        read_at as "readAt"
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, [...values, limit, offset]);

    return result.rows;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const result = await query(`
      UPDATE notifications 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE notification_id = $1 AND user_id = $2
      RETURNING 
        notification_id as "id",
        is_read as "isRead",
        read_at as "readAt"
    `, [notificationId, userId]);

    if (result.rows.length === 0) {
      throw new Error('Notification not found or not owned by user');
    }

    return result.rows[0];
  }
  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    const result = await query(`
      UPDATE notifications 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = FALSE
    `, [userId]);

    return { updatedCount: result.rowCount };
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId) {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND is_read = FALSE
    `, [userId]);

    return parseInt(result.rows[0].count);
  }

  /**
   * Delete notification (user can delete their own notifications)
   */
  async deleteNotification(notificationId, userId) {
    const result = await query(`
      DELETE FROM notifications
      WHERE notification_id = $1 AND user_id = $2
      RETURNING notification_id
    `, [notificationId, userId]);

    if (result.rows.length === 0) {
      throw new Error('Notification not found or not owned by user');
    }

    return { message: 'Notification deleted successfully' };
  }

  // ==================== APPOINTMENT-SPECIFIC NOTIFICATIONS ====================
  /**
   * Notify medical staff when assigned to new appointment
   */
  async notifyMedicalStaffAssignment(medicalStaffUserId, appointmentId, studentName, symptoms) {
    const title = 'New Appointment Assigned';
    const message = `You have been assigned a new appointment from ${studentName}. Symptoms: ${symptoms}`;
    
    // Create in-app notification
    const notification = await this.createNotification(
      medicalStaffUserId, 
      'appointment_assigned', 
      title, 
      message, 
      appointmentId
    );    // Send email notification
    try {
      const staffDetails = await this.getMedicalStaffFromAppointment(appointmentId);
      if (staffDetails) {
        const emailService = new EmailService();
        await emailService.sendMedicalStaffAssignmentEmail(
          staffDetails.email,
          staffDetails.name,
          { symptoms, appointmentId },
          studentName
        );
      }
    } catch (error) {
      console.error('Failed to send email notification to medical staff:', error.message);
    }

    return notification;
  }

  /**
   * Notify student when appointment is approved
   */
  async notifyStudentAppointmentApproved(studentUserId, appointmentId, medicalStaffName, dateScheduled) {
    const title = 'Appointment Approved';
    const message = `Your appointment has been approved by ${medicalStaffName}. Scheduled for: ${new Date(dateScheduled).toLocaleString()}`;
    
    // Create in-app notification
    const notification = await this.createNotification(
      studentUserId, 
      'appointment_approved', 
      title, 
      message, 
      appointmentId
    );    // Send email notification
    try {
      const emailService = new EmailService();
      const studentDetails = await this.getStudentFromAppointment(appointmentId);
      if (studentDetails) {
        await emailService.sendAppointmentApprovedEmail(
          studentDetails.email,
          studentDetails.name,
          { dateScheduled, appointmentId },
          medicalStaffName
        );
      }
    } catch (error) {
      console.error('Failed to send email notification to student:', error.message);
    }

    return notification;
  }

  /**
   * Notify student when appointment is rejected
   */
  async notifyStudentAppointmentRejected(studentUserId, appointmentId, medicalStaffName, reason = null) {
    const title = 'Appointment Update';
    let message = `Your appointment has been reviewed by ${medicalStaffName}.`;
    if (reason) {
      message += ` Reason: ${reason}`;
    }
    message += ' Please contact medical staff for further assistance.';
    
    // Create in-app notification
    const notification = await this.createNotification(
      studentUserId, 
      'appointment_rejected', 
      title, 
      message, 
      appointmentId
    );

    // Send email notification to student
    try {
      const emailService = new EmailService();
      const studentDetails = await this.getStudentFromAppointment(appointmentId);
      if (studentDetails) {
        // Fetch appointment details for email template
        const appointmentDetails = await query(`
          SELECT symptoms, priority_level as "priorityLevel" FROM appointments WHERE appointment_id = $1
        `, [appointmentId]);
        await emailService.sendAppointmentRejectedEmail(
          studentDetails.email,
          studentDetails.name,
          appointmentDetails.rows[0] || {},
          medicalStaffName,
          reason
        );
      }
    } catch (error) {
      console.error('Failed to send appointment rejection email to student:', error.message);
    }

    return notification;
  }

  /**
   * Notify student when appointment status changes (scheduled, completed, etc.)
   */
  async notifyStudentAppointmentStatusChange(studentUserId, appointmentId, newStatus, medicalStaffName) {    const statusMessages = {
      'approved': `Your appointment has been approved by ${medicalStaffName}.`,
      'completed': `Your appointment with ${medicalStaffName} has been completed.`,
      'cancelled': `Your appointment has been cancelled. Please reschedule if needed.`,
      'rejected': `Your appointment request has been rejected by ${medicalStaffName}.`
    };

    const title = 'Appointment Update';
    const message = statusMessages[newStatus] || `Your appointment status has been updated to: ${newStatus}`;
    
    return await this.createNotification(
      studentUserId, 
      `appointment_${newStatus}`, 
      title, 
      message, 
      appointmentId
    );
  }

  /**
   * Get medical staff user_id from appointment
   */  async getMedicalStaffFromAppointment(appointmentId) {
    const result = await query(`
      SELECT ms.user_id, u.name, u.email
      FROM appointments a
      JOIN medical_staff ms ON a.medical_staff_id = ms.staff_id
      JOIN users u ON ms.user_id = u.user_id
      WHERE a.appointment_id = $1
    `, [appointmentId]);

    return result.rows[0] || null;
  }
  /**
   * Get student details from appointment
   */
  async getStudentFromAppointment(appointmentId) {
    const result = await query(`
      SELECT a.user_id, u.name, u.email
      FROM appointments a
      JOIN users u ON a.user_id = u.user_id
      WHERE a.appointment_id = $1
    `, [appointmentId]);

    return result.rows[0] || null;
  }
}

module.exports = new NotificationService();
