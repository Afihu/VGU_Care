const adminService = require('../services/adminService');
const ErrorHandler = require('../utils/errorHandler');

/**
 * AdminController - Handles all admin-specific endpoints
 * All methods in this controller require admin privileges
 */

// ==================== USER MANAGEMENT ====================

/**
 * Get all student profiles
 * Admin privilege: View all student profiles
 */
exports.getAllStudents = async (req, res) => {
  try {
    const students = await adminService.getAllStudents();
    ErrorHandler.handleSuccess(res, { 
      count: students.length,
      students 
    }, 'Students retrieved successfully');
  } catch (err) {
    ErrorHandler.handleControllerError(err, res, 'Get all students');
  }
};

/**
 * Get all medical staff profiles
 * Admin privilege: View all medical staff profiles
 */
exports.getAllMedicalStaff = async (req, res) => {
  try {
    const medicalStaff = await adminService.getAllMedicalStaff();
    ErrorHandler.handleSuccess(res, { 
      count: medicalStaff.length,
      medicalStaff 
    }, 'Medical staff retrieved successfully');
  } catch (err) {
    ErrorHandler.handleControllerError(err, res, 'Get all medical staff');
  }
};

/**
 * Update user role
 * Admin privilege: Manage user roles and permissions
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, roleSpecificData } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const result = await adminService.updateUserRole(userId, role, roleSpecificData);
    res.json({ 
      message: 'User role updated successfully',
      result 
    });
  } catch (err) {
    console.error('Update user role error:', err);
    if (err.message.includes('not found') || err.message.includes('Invalid role')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

/**
 * Update user status (active/inactive/banned)
 * Admin privilege: Manage user permissions
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const result = await adminService.updateUserStatus(userId, status);
    res.json({ 
      message: 'User status updated successfully',
      user: result 
    });
  } catch (err) {
    console.error('Update user status error:', err);
    if (err.message.includes('not found') || err.message.includes('Invalid status')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

// ==================== APPOINTMENT MANAGEMENT ====================

/**
 * Get all appointments
 * Admin privilege: View all appointments for all students
 */
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await adminService.getAllAppointments();
    res.json({ 
      message: 'Appointments retrieved successfully',
      count: appointments.length,
      appointments 
    });
  } catch (err) {
    console.error('Get all appointments error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Create appointment for any student
 * Admin privilege: Create appointments for all students
 */
exports.createAppointment = async (req, res) => {
  try {
    const { userId } = req.params;
    const appointmentData = req.body;

    if (!appointmentData.priorityLevel || !appointmentData.symptoms) {
      return res.status(400).json({ 
        error: 'Priority level and symptoms are required' 
      });
    }

    const appointment = await adminService.createAppointment(userId, appointmentData);
    res.status(201).json({ 
      message: 'Appointment created successfully',
      appointment 
    });
  } catch (err) {
    console.error('Create appointment error:', err);
    if (err.message.includes('not found') || err.message.includes('can only be created')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

/**
 * Update any appointment
 * Admin privilege: Update appointments for all students
 */
exports.updateAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const updateData = req.body;

    const appointment = await adminService.updateAppointment(appointmentId, updateData);
    res.json({ 
      message: 'Appointment updated successfully',
      appointment 
    });
  } catch (err) {
    console.error('Update appointment error:', err);
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

// ==================== MOOD TRACKER MANAGEMENT ====================

/**
 * Get all mood entries
 * Admin privilege: View mood tracker entries for all students
 */
exports.getAllMoodEntries = async (req, res) => {
  try {
    const moodEntries = await adminService.getAllMoodEntries();
    res.json({ 
      message: 'Mood entries retrieved successfully',
      count: moodEntries.length,
      moodEntries 
    });
  } catch (err) {
    console.error('Get all mood entries error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Create mood entry for any student
 * Admin privilege: Create mood tracker entries for all students
 */
exports.createMoodEntry = async (req, res) => {
  try {
    const { userId } = req.params;
    const moodData = req.body;

    if (!moodData.mood) {
      return res.status(400).json({ error: 'Mood is required' });
    }

    const moodEntry = await adminService.createMoodEntry(userId, moodData);
    res.status(201).json({ 
      message: 'Mood entry created successfully',
      moodEntry 
    });
  } catch (err) {
    console.error('Create mood entry error:', err);
    if (err.message.includes('not found')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

/**
 * Update any mood entry
 * Admin privilege: Update mood tracker entries for all students
 */
exports.updateMoodEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const moodData = req.body;

    const moodEntry = await adminService.updateMoodEntry(entryId, moodData);
    res.json({ 
      message: 'Mood entry updated successfully',
      moodEntry 
    });
  } catch (err) {
    console.error('Update mood entry error:', err);
    if (err.message.includes('not found') || err.message.includes('No valid fields')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

// ==================== TEMPORARY ADVICE MANAGEMENT ====================

/**
 * Get all temporary advice
 * Admin privilege: View temporary advice for all students
 */
exports.getAllTemporaryAdvice = async (req, res) => {
  try {
    const advice = await adminService.getAllTemporaryAdvice();
    res.json({ 
      message: 'Temporary advice retrieved successfully',
      count: advice.length,
      advice 
    });
  } catch (err) {
    console.error('Get all temporary advice error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Create temporary advice for any appointment
 * Admin privilege: Create temporary advice for all students
 */
exports.createTemporaryAdvice = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const advice = await adminService.createTemporaryAdvice(appointmentId, message);
    res.status(201).json({ 
      message: 'Temporary advice created successfully',
      advice 
    });
  } catch (err) {
    console.error('Create temporary advice error:', err);
    if (err.message.includes('not found')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

/**
 * Update any temporary advice
 * Admin privilege: Update temporary advice for all students
 */
exports.updateTemporaryAdvice = async (req, res) => {
  try {
    const { adviceId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const advice = await adminService.updateTemporaryAdvice(adviceId, message);
    res.json({ 
      message: 'Temporary advice updated successfully',
      advice 
    });
  } catch (err) {
    console.error('Update temporary advice error:', err);
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

/**
 * Delete any temporary advice
 * Admin privilege: Delete temporary advice for all students
 */
exports.deleteTemporaryAdvice = async (req, res) => {
  try {
    const { adviceId } = req.params;

    const result = await adminService.deleteTemporaryAdvice(adviceId);
    res.json(result);
  } catch (err) {
    console.error('Delete temporary advice error:', err);
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

// ==================== ABUSE REPORTS MANAGEMENT ====================

/**
 * Get all abuse reports
 * Admin privilege: View abuse reports for all users
 */
exports.getAllAbuseReports = async (req, res) => {
  try {
    const reports = await adminService.getAllAbuseReports();
    res.json({ 
      message: 'Abuse reports retrieved successfully',
      count: reports.length,
      reports 
    });
  } catch (err) {
    console.error('Get all abuse reports error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Create abuse report
 * Admin privilege: Create abuse reports for all users
 */
exports.createAbuseReport = async (req, res) => {
  try {
    const reportData = req.body;

    if (!reportData.staffId || !reportData.description) {
      return res.status(400).json({ 
        error: 'Staff ID and description are required' 
      });
    }

    const report = await adminService.createAbuseReport(reportData);
    res.status(201).json({ 
      message: 'Abuse report created successfully',
      report 
    });
  } catch (err) {
    console.error('Create abuse report error:', err);
    if (err.message.includes('not found')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

/**
 * Update abuse report
 * Admin privilege: Update abuse reports for all users
 */
exports.updateAbuseReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const reportData = req.body;

    const report = await adminService.updateAbuseReport(reportId, reportData);
    res.json({ 
      message: 'Abuse report updated successfully',
      report 
    });
  } catch (err) {
    console.error('Update abuse report error:', err);
    if (err.message.includes('not found') || err.message.includes('No valid fields')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

/**
 * Delete abuse report
 * Admin privilege: Delete abuse reports for all users
 */
exports.deleteAbuseReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const result = await adminService.deleteAbuseReport(reportId);
    res.json(result);
  } catch (err) {
    console.error('Delete abuse report error:', err);
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};
