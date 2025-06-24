const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const BaseService = require('./baseService');

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
      if (!this.isEmailEnabled()) {
        console.log(`[EMAIL DISABLED] Would send email to ${to}: ${subject}`);
        return { success: true, disabled: true };
      }

      // Validate email format
      if (!this.validateEmailFormat(to)) {
        console.error(`[EMAIL ERROR] Invalid email format: ${to}`);
        return { success: false, error: 'Invalid email format' };
      }

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
      if (!isDomainValid) {
        console.error(`[EMAIL ERROR] Invalid email domain: ${to}`);
        return { success: false, error: 'Invalid email domain' };
      }

      const mailOptions = {
        from: `${this.appName} <${this.fromEmail}>`,
        to: to,
        subject: `[${this.appName}] ${subject}`,
        html: htmlContent,
        text: textContent || this.stripHtml(htmlContent)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`[EMAIL SENT] To: ${to}, Subject: ${subject}, MessageId: ${result.messageId}`);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error(`[EMAIL ERROR] Failed to send to ${to}:`, error.message);
      // Don't throw error - email failures shouldn't break the main flow
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if email is enabled (useful for development/testing)
   */  isEmailEnabled() {
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
   * Generate email template wrapper
   */
  createEmailTemplate(title, content, actionButton = null) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #2563eb; color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { margin: 20px 0; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
    .alert { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 15px; border-radius: 5px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 VGU Care</h1>
      <p>Healthcare Management System</p>
    </div>
    <div class="content">
      <h2>${title}</h2>
      ${content}
      ${actionButton || ''}
    </div>
    <div class="footer">
      <p>This email was sent from VGU Care Healthcare Management System.</p>
      <p>If you have any questions, please contact the medical staff or system administrator.</p>
      <p><strong>Note:</strong> This is an automated message. Please do not reply to this email.</p>
    </div>
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
    const content = `
      <p>Dear ${studentName},</p>
      <p>Your appointment request has been successfully submitted and is now pending review by our medical staff.</p>
      
      <div class="success">
        <h3>📅 Appointment Details:</h3>
        <ul>
          <li><strong>Symptoms:</strong> ${appointmentDetails.symptoms}</li>
          <li><strong>Priority:</strong> ${appointmentDetails.priorityLevel}</li>
          <li><strong>Requested Date:</strong> ${appointmentDetails.dateScheduled || 'To be scheduled'}</li>
          <li><strong>Status:</strong> Pending Review</li>
        </ul>
      </div>

      <p>Our medical staff will review your request and get back to you soon. You will receive another email once your appointment is approved and scheduled.</p>
      <p>You can also check your appointment status by logging into the VGU Care portal.</p>
    `;

    const actionButton = `<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">View Dashboard</a>`;
    
    return await this.sendEmail(
      studentEmail, 
      subject, 
      this.createEmailTemplate(subject, content, actionButton)
    );
  }

  /**
   * Send email when appointment is approved
   */
  async sendAppointmentApprovedEmail(studentEmail, studentName, appointmentDetails, medicalStaffName) {
    const subject = 'Appointment Approved & Scheduled';
    const appointmentDate = new Date(appointmentDetails.dateScheduled).toLocaleDateString();
    const appointmentTime = appointmentDetails.timeScheduled;

    const content = `
      <p>Dear ${studentName},</p>
      <p>Great news! Your appointment has been approved and scheduled.</p>
      
      <div class="success">
        <h3>✅ Confirmed Appointment Details:</h3>
        <ul>
          <li><strong>Date:</strong> ${appointmentDate}</li>
          <li><strong>Time:</strong> ${appointmentTime}</li>
          <li><strong>Medical Staff:</strong> ${medicalStaffName}</li>
          <li><strong>Symptoms:</strong> ${appointmentDetails.symptoms}</li>
        </ul>
      </div>

      <div class="alert">
        <h3>📋 Important Reminders:</h3>
        <ul>
          <li>Please arrive 10 minutes early for your appointment</li>
          <li>Bring your student ID and any relevant medical documents</li>
          <li>If you need to reschedule, please do so at least 24 hours in advance</li>
          <li>Contact us immediately if you experience urgent symptoms</li>
        </ul>
      </div>

      <p>We look forward to seeing you at your scheduled appointment.</p>
    `;

    const actionButton = `<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/appointments" class="button">View Appointment</a>`;
    
    return await this.sendEmail(
      studentEmail, 
      subject, 
      this.createEmailTemplate(subject, content, actionButton)
    );
  }

  /**
   * Send email when appointment is rejected
   */
  async sendAppointmentRejectedEmail(studentEmail, studentName, appointmentDetails, medicalStaffName, reason = null) {
    const subject = 'Appointment Request Update';
    
    const content = `
      <p>Dear ${studentName},</p>
      <p>We have reviewed your appointment request. Unfortunately, we need to make some adjustments to better serve your needs.</p>
      
      <div class="alert">
        <h3>📝 Appointment Status Update:</h3>
        <ul>
          <li><strong>Original Request:</strong> ${appointmentDetails.symptoms}</li>
          <li><strong>Priority:</strong> ${appointmentDetails.priorityLevel}</li>
          <li><strong>Reviewed by:</strong> ${medicalStaffName}</li>
          ${reason ? `<li><strong>Notes:</strong> ${reason}</li>` : ''}
        </ul>
      </div>

      <p>Please don't worry - this doesn't mean your health concerns aren't important. Our medical staff may suggest:</p>
      <ul>
        <li>Rescheduling for a more appropriate time slot</li>
        <li>Recommending alternative care options</li>
        <li>Requesting additional information about your symptoms</li>
      </ul>

      <p>We encourage you to contact our medical staff directly or submit a new appointment request with additional details.</p>
    `;

    const actionButton = `<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/appointments/new" class="button">Book New Appointment</a>`;
    
    return await this.sendEmail(
      studentEmail, 
      subject, 
      this.createEmailTemplate(subject, content, actionButton)
    );
  }

  /**
   * Send email to medical staff when assigned new appointment
   */
  async sendMedicalStaffAssignmentEmail(staffEmail, staffName, appointmentDetails, studentName) {
    const subject = 'New Appointment Assignment';
    
    const content = `
      <p>Dear ${staffName},</p>
      <p>You have been assigned a new appointment that requires your attention.</p>
      
      <div class="success">
        <h3>👤 Patient Information:</h3>
        <ul>
          <li><strong>Student:</strong> ${studentName}</li>
          <li><strong>Symptoms:</strong> ${appointmentDetails.symptoms}</li>
          <li><strong>Priority Level:</strong> ${appointmentDetails.priorityLevel}</li>
          <li><strong>Requested Date:</strong> ${appointmentDetails.dateScheduled || 'Flexible'}</li>
        </ul>
      </div>

      <p>Please review this appointment request and take appropriate action:</p>
      <ul>
        <li>Approve and schedule the appointment</li>
        <li>Request additional information if needed</li>
        <li>Provide recommendations for alternative care</li>
      </ul>

      <p>Log into the VGU Care system to manage this appointment.</p>
    `;

    const actionButton = `<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/medical-staff/appointments" class="button">Review Appointment</a>`;
    
    return await this.sendEmail(
      staffEmail, 
      subject, 
      this.createEmailTemplate(subject, content, actionButton)
    );
  }

  // ==================== ADMIN NOTIFICATIONS ====================

  /**
   * Send email to admin for abuse reports
   */
  async sendAbuseReportNotificationEmail(adminEmail, reportDetails, reporterName, studentName) {
    const subject = '🚨 New Abuse Report Submitted';
    
    const content = `
      <p>A new abuse report has been submitted that requires immediate attention.</p>
      
      <div class="alert">
        <h3>⚠️ Report Details:</h3>
        <ul>
          <li><strong>Reported by:</strong> ${reporterName}</li>
          <li><strong>Student involved:</strong> ${studentName}</li>
          <li><strong>Report Type:</strong> ${reportDetails.reportType}</li>
          <li><strong>Description:</strong> ${reportDetails.description}</li>
          <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
        </ul>
      </div>

      <p>This report requires immediate review and appropriate action. Please log into the admin panel to investigate and respond to this report.</p>
    `;

    const actionButton = `<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/reports" class="button">Review Report</a>`;
    
    return await this.sendEmail(
      adminEmail, 
      subject, 
      this.createEmailTemplate(subject, content, actionButton)
    );
  }

  // ==================== SYSTEM NOTIFICATIONS ====================

  /**
   * Send system maintenance notification
   */
  async sendMaintenanceNotificationEmail(userEmail, userName, maintenanceDetails) {
    const subject = 'Scheduled System Maintenance';
    
    const content = `
      <p>Dear ${userName},</p>
      <p>We would like to inform you about upcoming scheduled maintenance for the VGU Care system.</p>
      
      <div class="alert">
        <h3>🔧 Maintenance Schedule:</h3>
        <ul>
          <li><strong>Start Time:</strong> ${maintenanceDetails.startTime}</li>
          <li><strong>End Time:</strong> ${maintenanceDetails.endTime}</li>
          <li><strong>Duration:</strong> ${maintenanceDetails.duration}</li>
          <li><strong>Affected Services:</strong> ${maintenanceDetails.affectedServices}</li>
        </ul>
      </div>

      <p>During this time, the VGU Care system will be temporarily unavailable. We apologize for any inconvenience and appreciate your understanding.</p>
      <p>For urgent medical needs during this period, please contact the medical staff directly.</p>
    `;
    
    return await this.sendEmail(
      userEmail, 
      subject, 
      this.createEmailTemplate(subject, content)
    );
  }

  /**
   * Send welcome email for new users
   */
  async sendWelcomeEmail(userEmail, userName, userRole) {
    const subject = 'Welcome to VGU Care';
    
    const roleSpecificContent = {
      student: `
        <p>As a student, you can:</p>
        <ul>
          <li>Book medical appointments online</li>
          <li>Track your mood and wellness</li>
          <li>Receive medical advice from qualified staff</li>
          <li>View your appointment history</li>
        </ul>
      `,
      medical_staff: `
        <p>As medical staff, you can:</p>
        <ul>
          <li>Review and approve student appointments</li>
          <li>Provide temporary medical advice</li>
          <li>Monitor student wellness and mood tracking</li>
          <li>Manage your schedule and availability</li>
        </ul>
      `,
      admin: `
        <p>As an administrator, you have full access to:</p>
        <ul>
          <li>User management and system oversight</li>
          <li>Appointment and schedule management</li>
          <li>System reporting and analytics</li>
          <li>Abuse report investigation</li>
        </ul>
      `
    };

    const content = `
      <p>Dear ${userName},</p>
      <p>Welcome to VGU Care - the comprehensive healthcare management system for VGU students and staff!</p>
      
      <div class="success">
        <h3>🎉 Your Account is Ready</h3>
        <p>Your account has been successfully created with <strong>${userRole}</strong> privileges.</p>
      </div>

      ${roleSpecificContent[userRole] || ''}

      <p>To get started, log into your account using the credentials you created during registration.</p>
      <p>If you have any questions or need assistance, don't hesitate to contact our support team.</p>
    `;

    const actionButton = `<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to VGU Care</a>`;
    
    return await this.sendEmail(
      userEmail, 
      subject, 
      this.createEmailTemplate(subject, content, actionButton)
    );
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
      
      const dns = require('dns').promises;
      await dns.resolveMx(domain);
      return true;
    } catch (error) {
      console.log(`[EMAIL VALIDATION] Domain check failed for ${email}: ${error.message}`);
      return false;
    }
  }

  /**
   * Send email to medical staff when patient updates symptoms
   */
  async sendSymptomUpdateNotificationEmail(staffEmail, staffName, appointmentDetails, studentName, studentEmail) {
    const subject = '⚠️ Patient Symptom Update - Urgent Review Required';
    
    const content = `
      <p>Dear ${staffName},</p>
      <p><strong>Important:</strong> One of your assigned patients has updated their symptoms and may require immediate attention.</p>
      
      <div class="alert">
        <h3>📋 Patient Information:</h3>
        <ul>
          <li><strong>Patient:</strong> ${studentName}</li>
          <li><strong>Patient Email:</strong> ${studentEmail}</li>
          <li><strong>Appointment ID:</strong> ${appointmentDetails.appointmentId}</li>
          <li><strong>Current Status:</strong> ${appointmentDetails.status}</li>
          <li><strong>Priority Level:</strong> ${appointmentDetails.priorityLevel}</li>
        </ul>
      </div>

      <div class="alert">
        <h3>📅 Appointment Schedule:</h3>
        <ul>
          <li><strong>Date:</strong> ${appointmentDetails.dateScheduled ? new Date(appointmentDetails.dateScheduled).toLocaleDateString() : 'Not scheduled'}</li>
          <li><strong>Time:</strong> ${appointmentDetails.timeScheduled || 'Not scheduled'}</li>
        </ul>
      </div>

      <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #721c24;">🔴 Updated Symptoms:</h3>
        <p style="font-weight: bold; background-color: #ffffff; padding: 15px; border-radius: 3px; margin: 10px 0; color: #721c24;">
          ${appointmentDetails.symptoms}
        </p>
      </div>

      <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0c5460;">📋 Recommended Actions:</h3>
        <ul style="color: #0c5460;">
          <li><strong>Review symptom changes immediately</strong> - Compare with initial symptoms</li>
          <li><strong>Assess urgency level</strong> - Consider if priority should be increased</li>
          <li><strong>Contact patient if needed</strong> - For clarification or immediate advice</li>
          <li><strong>Update appointment scheduling</strong> - If urgent care is required</li>
          <li><strong>Provide medical guidance</strong> - Through the VGU Care system</li>
        </ul>
      </div>

      <p>This is an automated notification sent when patients update their symptoms. Please review this case promptly and take appropriate medical action.</p>
      <p>Log into the VGU Care system to view the complete appointment details and respond to the patient.</p>
    `;

    const actionButton = `<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/medical-staff/appointments" class="button">Review Appointment</a>`;
    
    return await this.sendEmail(
      staffEmail, 
      subject, 
      this.createEmailTemplate(subject, content, actionButton)
    );
  }
}

module.exports = EmailService;
