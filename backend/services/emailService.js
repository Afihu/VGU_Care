const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const BaseService = require('./baseService');
const TemplateEngine = require('../utils/templateEngine');

/**
 * EmailService - Handles all email notifications for VGU Care
 * 
 * Features:
 * - Appointment notifications (created, approved, rejected, completed)
 * - Medical staff assignment notifications
 * - Admin alerts for abuse reports
 * - Password reset emails
 * - System maintenance notifications
 */
class EmailService extends BaseService {  constructor() {
    super();
    this.transporter = this.createTransporter();
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@vgucare.edu.vn';
    this.appName = 'VGU Care';
    this.templateEngine = new TemplateEngine();
    
    // Initialize SendGrid if using that provider
    if (process.env.EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  /**
   * Create email transporter based on configuration
   */
  createTransporter() {
    const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';

    switch (emailProvider) {      case 'gmail':
        return nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
          }
        });

      case 'sendgrid':
        return nodemailer.createTransport({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });

      case 'smtp':
        return nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        });

      default:
        throw new Error(`Unsupported email provider: ${emailProvider}`);
    }
  }

  /**
   * Send email with error handling and logging
   */  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      console.log(`[EMAIL DEBUG] sendEmail called with to: ${to}, subject: ${subject}`);
      
      if (!this.isEmailEnabled()) {
        console.log(`[EMAIL DISABLED] Would send email to ${to}: ${subject}`);
        return { success: true, disabled: true };
      }

      console.log(`[EMAIL DEBUG] Email is enabled, proceeding with validation`);

      // Validate email format
      if (!this.validateEmailFormat(to)) {
        console.error(`[EMAIL ERROR] Invalid email format: ${to}`);
        return { success: false, error: 'Invalid email format' };
      }

      console.log(`[EMAIL DEBUG] Email format is valid`);

      // Optional: Check email domain (can be slow, so make it optional)
      if (process.env.EMAIL_VALIDATE_DOMAIN === 'true') {
        const domainValid = await this.validateEmailDomain(to);
        if (!domainValid) {
          console.error(`[EMAIL ERROR] Invalid or non-existent domain for: ${to}`);
          return { success: false, error: 'Invalid email domain' };
        }
      }

      // Check if email domain exists
      const isDomainValid = await this.validateEmailDomain(to);
      console.log(`[EMAIL DEBUG] Domain validation result: ${isDomainValid}`);
      
      if (!isDomainValid) {
        console.error(`[EMAIL ERROR] Invalid email domain: ${to}`);
        return { success: false, error: 'Invalid email domain' };
      }

      // Use SendGrid directly if configured
      if (process.env.EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
        console.log(`[EMAIL DEBUG] Using SendGrid API directly`);
        
        const msg = {
          to: to,
          from: `${this.appName} <${this.fromEmail}>`,
          subject: `[${this.appName}] ${subject}`,
          html: htmlContent,
          text: textContent || this.stripHtml(htmlContent)
        };

        console.log(`[EMAIL DEBUG] SendGrid message:`, {
          to: msg.to,
          from: msg.from,
          subject: msg.subject
        });

        const result = await sgMail.send(msg);
        console.log(`[EMAIL SENT] SendGrid response:`, result[0].statusCode);
        return { success: true, messageId: result[0].headers['x-message-id'] };
      } else {
        // Fallback to nodemailer
        console.log(`[EMAIL DEBUG] Using nodemailer transporter`);
        
        const mailOptions = {
          from: `${this.appName} <${this.fromEmail}>`,
          to: to,
          subject: `[${this.appName}] ${subject}`,
          html: htmlContent,
          text: textContent || this.stripHtml(htmlContent)
        };

        console.log(`[EMAIL DEBUG] Sending email with options:`, {
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject
        });

        const result = await this.transporter.sendMail(mailOptions);
        
        console.log(`[EMAIL SENT] To: ${to}, Subject: ${subject}, MessageId: ${result.messageId}`);
        return { success: true, messageId: result.messageId };
      }

    } catch (error) {
      console.error(`[EMAIL ERROR] Failed to send to ${to}:`, error.message);
      console.error(`[EMAIL ERROR] Stack trace:`, error.stack);
      // Don't throw error - email failures shouldn't break the main flow
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if email is enabled (useful for development/testing)
   */  isEmailEnabled() {
    // In production, always return true but handle failures gracefully
    if (process.env.NODE_ENV === 'production') {
      return process.env.EMAIL_ENABLED !== 'false';
    }
    
    return process.env.EMAIL_ENABLED !== 'false' && 
           (
             (process.env.EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) ||
             (process.env.EMAIL_PROVIDER === 'gmail' && process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) ||
             (process.env.EMAIL_PROVIDER === 'smtp' && process.env.SMTP_HOST)
           );
  }

  /**
   * Strip HTML tags for plain text version
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
  /**
   * Render email template with data
   * @param {string} templateName - Name of the template to use
   * @param {object} data - Data to substitute in template
   * @param {string} title - Email title/subject
   * @returns {Promise<string>} Rendered HTML content
   */
  async renderTemplate(templateName, data, title) {
    try {
      // Sanitize user data to prevent XSS
      const sanitizedData = this.templateEngine.sanitizeData(data);
      
      // Add common template data
      const templateData = {
        ...sanitizedData,
        title: title || 'VGU Care Notification',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
      };
      
      // Generate action button if URL and text provided
      if (data.actionUrl && data.actionText) {
        templateData.actionButton = this.templateEngine.generateActionButton(
          data.actionUrl, 
          data.actionText
        );
      }
      
      return await this.templateEngine.render(templateName, templateData);
    } catch (error) {
      console.error(`[EMAIL ERROR] Template rendering failed for ${templateName}:`, error.message);
      // Fallback to a simple text-based email
      return this.createFallbackEmail(title, data);
    }
  }

  /**
   * Create a simple fallback email when template rendering fails
   * @param {string} title - Email title
   * @param {object} data - Email data
   * @returns {string} Simple HTML email
   */
  createFallbackEmail(title, data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border: 1px solid #ddd;">
    <h1 style="color: #2563eb;">🏥 VGU Care</h1>
    <h2>${title}</h2>
    <p>This is an automated notification from VGU Care Healthcare Management System.</p>
    <p>Template rendering failed, but your notification is important to us.</p>
    <p>Please log into the VGU Care system for full details.</p>
    <hr>
    <p style="font-size: 12px; color: #666;">
      This email was sent from VGU Care Healthcare Management System.<br>
      This is an automated message. Please do not reply to this email.
    </p>
  </div>
</body>
</html>`;
  }

  // ==================== APPOINTMENT EMAIL NOTIFICATIONS ====================
  /**
   * Send email when new appointment is created
   */
  async sendAppointmentCreatedEmail(studentEmail, studentName, appointmentDetails) {
    const subject = 'Appointment Request Submitted';
    
    const templateData = {
      studentName,
      symptoms: appointmentDetails.symptoms,
      priorityLevel: appointmentDetails.priorityLevel,
      dateScheduled: appointmentDetails.dateScheduled || 'To be scheduled',
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
      actionText: 'View Dashboard'
    };

    const htmlContent = await this.renderTemplate('appointment-created', templateData, subject);
    
    return await this.sendEmail(studentEmail, subject, htmlContent);
  }
  /**
   * Send email when appointment is approved
   */
  async sendAppointmentApprovedEmail(studentEmail, studentName, appointmentDetails, medicalStaffName) {
    const subject = 'Appointment Approved & Scheduled';
    
    const templateData = {
      studentName,
      appointmentDate: new Date(appointmentDetails.dateScheduled).toLocaleDateString(),
      appointmentTime: appointmentDetails.timeScheduled,
      medicalStaffName,
      symptoms: appointmentDetails.symptoms,
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/appointments`,
      actionText: 'View Appointment'
    };

    const htmlContent = await this.renderTemplate('appointment-approved', templateData, subject);
    
    return await this.sendEmail(studentEmail, subject, htmlContent);
  }
  /**
   * Send email when appointment is rejected
   */
  async sendAppointmentRejectedEmail(studentEmail, studentName, appointmentDetails, medicalStaffName, reason = null) {
    const subject = 'Appointment Request Update';
    
    const templateData = {
      studentName,
      symptoms: appointmentDetails.symptoms,
      priorityLevel: appointmentDetails.priorityLevel,
      medicalStaffName,
      reason: reason || null,
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/appointments/new`,
      actionText: 'Book New Appointment'
    };

    const htmlContent = await this.renderTemplate('appointment-rejected', templateData, subject);
    
    return await this.sendEmail(studentEmail, subject, htmlContent);
  }
  /**
   * Send email to medical staff when assigned new appointment
   */
  async sendMedicalStaffAssignmentEmail(staffEmail, staffName, appointmentDetails, studentName) {
    const subject = 'New Appointment Assignment';
    
    const templateData = {
      staffName,
      studentName,
      symptoms: appointmentDetails.symptoms,
      priorityLevel: appointmentDetails.priorityLevel,
      dateScheduled: appointmentDetails.dateScheduled || 'Flexible',
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/medical-staff/appointments`,
      actionText: 'Review Appointment'
    };

    const htmlContent = await this.renderTemplate('medical-staff-assignment', templateData, subject);
    
    return await this.sendEmail(staffEmail, subject, htmlContent);
  }

  // ==================== ADMIN NOTIFICATIONS ====================
  /**
   * Send email to admin for abuse reports
   */
  async sendAbuseReportNotificationEmail(adminEmail, reportDetails, reporterName, studentName) {
    const subject = '🚨 New Abuse Report Submitted';
    
    const templateData = {
      reporterName,
      studentName,
      reportType: reportDetails.reportType,
      description: reportDetails.description,
      reportDate: new Date().toLocaleString(),
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/reports`,
      actionText: 'Review Report'
    };

    const htmlContent = await this.renderTemplate('abuse-report-notification', templateData, subject);
    
    return await this.sendEmail(adminEmail, subject, htmlContent);
  }

  // ==================== SYSTEM NOTIFICATIONS ====================
  /**
   * Send system maintenance notification
   */
  async sendMaintenanceNotificationEmail(userEmail, userName, maintenanceDetails) {
    const subject = 'Scheduled System Maintenance';
    
    const templateData = {
      userName,
      startTime: maintenanceDetails.startTime,
      endTime: maintenanceDetails.endTime,
      duration: maintenanceDetails.duration,
      affectedServices: maintenanceDetails.affectedServices
    };

    const htmlContent = await this.renderTemplate('maintenance-notification', templateData, subject);
    
    return await this.sendEmail(userEmail, subject, htmlContent);
  }
  /**
   * Send welcome email for new users
   */
  async sendWelcomeEmail(userEmail, userName, userRole) {
    const subject = 'Welcome to VGU Care';
    
    const templateData = {
      userName,
      userRole,
      isStudent: userRole === 'student',
      isMedicalStaff: userRole === 'medical_staff',
      isAdmin: userRole === 'admin',
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
      actionText: 'Login to VGU Care'
    };

    const htmlContent = await this.renderTemplate('welcome', templateData, subject);
    
    return await this.sendEmail(userEmail, subject, htmlContent);
  }

  /**
   * Validate email address format
   */
  validateEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if email domain exists (basic DNS check)
   */
  async validateEmailDomain(email) {
    try {
      const domain = email.split('@')[1];
      console.log(`[EMAIL VALIDATION] Validating domain: ${domain} for email: ${email}`);
      
      // In test environment, use stricter validation with whitelist
      if (process.env.NODE_ENV === 'test') {
        const allowedTestEmails = [
          '10422061@student.vgu.edu.vn',
          'kath.maithi@gmail.com',
          'nhimaihello@gmail.com',
          // Add more known valid emails for testing
        ];
        
        if (!allowedTestEmails.includes(email)) {
          console.log(`[EMAIL VALIDATION] Email ${email} not in test whitelist`);
          return false;
        }
      }
      
      // Skip DNS validation in production for now to avoid blocking emails
      if (process.env.NODE_ENV === 'production') {
        console.log(`[EMAIL VALIDATION] Skipping DNS validation in production for ${domain}`);
        return true;
      }
      
      const dns = require('dns').promises;
      await dns.resolveMx(domain);
      console.log(`[EMAIL VALIDATION] Domain ${domain} validated successfully`);
      return true;
    } catch (error) {
      console.log(`[EMAIL VALIDATION] Domain check failed for ${email}: ${error.message}`);
      // In production, don't fail on DNS errors - just log and continue
      if (process.env.NODE_ENV === 'production') {
        console.log(`[EMAIL VALIDATION] Allowing email despite DNS error in production`);
        return true;
      }
      return false;
    }
  }  /**
   * Send email to medical staff when patient updates symptoms
   */
  async sendSymptomUpdateNotificationEmail(staffEmail, staffName, appointmentDetails, studentName, studentEmail) {
    const subject = '⚠️ Patient Symptom Update - Urgent Review Required';
    
    const templateData = {
      staffName,
      studentName,
      studentEmail,
      appointmentId: appointmentDetails.appointmentId || appointmentDetails.id,
      status: appointmentDetails.status,
      priorityLevel: appointmentDetails.priorityLevel,
      appointmentDate: appointmentDetails.dateScheduled ? 
        new Date(appointmentDetails.dateScheduled).toLocaleDateString() : 'Not scheduled',
      appointmentTime: appointmentDetails.timeScheduled || 'Not scheduled',
      symptoms: appointmentDetails.symptoms,
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/medical-staff/appointments`,
      actionText: 'Review Appointment'
    };

    const htmlContent = await this.renderTemplate('symptom-update-notification', templateData, subject);
    
    return await this.sendEmail(staffEmail, subject, htmlContent);
  }
}

module.exports = EmailService;
