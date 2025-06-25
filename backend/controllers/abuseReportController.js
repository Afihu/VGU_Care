const abuseReportService = require('../services/abuseReportService');

/**
 * Create abuse report - Medical staff reporting suspected system abuse
 */
exports.createReport = async (req, res) => {
  try {
    const { appointmentId, description, reportType = 'system_abuse' } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Validate required fields
    if (!appointmentId || !description) {
      return res.status(400).json({ 
        error: 'Appointment ID and description are required' 
      });
    }

    // Validate report type
    const validReportTypes = ['system_abuse', 'false_urgency', 'inappropriate_behavior', 'other'];
    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({ 
        error: 'Invalid report type',
        message: `Report type must be one of: ${validReportTypes.join(', ')}`,
        provided: reportType
      });
    }

    // Get appointment details to find the student
    const { query } = require('../config/database');
    const appointmentResult = await query(
      'SELECT appointment_id, user_id FROM appointments WHERE appointment_id = $1',
      [appointmentId]
    );
    
    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = appointmentResult.rows[0];

    // Check if user can report on this appointment
    const canReport = await abuseReportService.canReportOnAppointment(appointmentId, userId, userRole);
    if (!canReport) {
      return res.status(403).json({ 
        error: 'You do not have permission to report on this appointment' 
      });
    }

    // Create abuse report
    const reportData = {
      reporterId: userId,
      reporterType: userRole,
      studentId: appointment.user_id,
      appointmentId,
      description,
      reportType
    };

    const report = await abuseReportService.createReport(reportData);

    res.status(201).json({
      success: true,
      message: 'Abuse report submitted successfully',
      report: {
        id: report.report_id,
        appointmentId,
        description,
        reportType,
        reportDate: report.report_date,
        status: report.status
      }
    });

  } catch (error) {
    console.error('Create abuse report error:', error);
    res.status(500).json({ 
      error: 'Failed to submit abuse report',
      message: error.message 
    });
  }
};

/**
 * Get abuse reports created by the current user
 */
exports.getMyReports = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    const reports = await abuseReportService.getReportsByReporter(userId, userRole);
    
    res.json({
      success: true,
      message: 'Abuse reports retrieved successfully',
      reports,
      count: reports.length
    });

  } catch (error) {
    console.error('Get abuse reports error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve abuse reports',
      message: error.message 
    });
  }
};

/**
 * Update abuse report
 */
exports.updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const updateData = req.body;

    const report = await abuseReportService.updateReport(reportId, userId, userRole, updateData);
    
    res.json({
      success: true,
      message: 'Abuse report updated successfully',
      report
    });

  } catch (error) {
    console.error('Update abuse report error:', error);
    if (error.message.includes('not found') || error.message.includes('permission')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};