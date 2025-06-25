const appointmentService = require('../services/appointmentService');
const adminService = require('../services/adminService');
const adviceService = require('../services/adviceService');


/**
 * Appointment Controller with Role-Based Access Control
 * Integrates real AppointmentService with role-based middleware
 */

// Get appointments with role-based filtering
exports.getAppointments = async (req, res) => {
  try {
    const userRole = req.appointmentAccess.role;
    const userId = req.appointmentAccess.userId;
    let appointments = [];
    
    if (userRole === 'student') {
      // Students see only their own appointments
      appointments = await appointmentService.getAppointmentsByUserId(userId);
    } else if (userRole === 'admin') {
      // Admins see all appointments
      appointments = await adminService.getAllAppointments();    } else if (userRole === 'medical_staff') {
      // Medical staff see appointments assigned to them + all pending appointments
      const assignedAppointments = await appointmentService.getAppointmentsByMedicalStaff(userId);
      const pendingAppointments = await appointmentService.getPendingAppointments();
      
      // Combine and deduplicate (in case a pending appointment is also assigned to this staff)
      const appointmentMap = new Map();
      
      // Add assigned appointments
      assignedAppointments.forEach(apt => appointmentMap.set(apt.id, apt));
      
      // Add pending appointments (will overwrite if duplicate, but that's fine)
      pendingAppointments.forEach(apt => appointmentMap.set(apt.id, apt));
      
      appointments = Array.from(appointmentMap.values());
    }
    
    res.json({ 
      appointments,
      userRole: userRole,
      accessLevel: userRole === 'admin' ? 'full' : 'filtered'
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create appointment with role-based validation
exports.createAppointment = async (req, res) => {
  try {    const { symptoms, priorityLevel, healthIssueType, medical_staff_id, dateScheduled, timeScheduled } = req.body;
    const userRole = req.appointmentAccess.role;
    const userId = req.appointmentAccess.userId;
    
    // Ensure medical_staff_id is null if not provided
    const medicalStaffId = medical_staff_id || null;
    
    // Validate required fields
    if (!symptoms || !priorityLevel || !healthIssueType || !dateScheduled || !timeScheduled) {
      return res.status(400).json({ 
        error: 'Symptoms, priority level, health issue type, date, and time are required' 
      });
    }    // Validate health issue type
    const validHealthIssueTypes = ['physical', 'mental'];
    if (!validHealthIssueTypes.includes(healthIssueType)) {
      return res.status(400).json({ 
        error: 'Health issue type must be either "physical" or "mental"' 
      });
    }

    // Validate priority level
    const validPriorityLevels = ['low', 'medium', 'high'];
    const normalizedPriorityLevel = typeof priorityLevel === 'string' ? priorityLevel.trim().toLowerCase() : priorityLevel;
    if (!validPriorityLevels.includes(normalizedPriorityLevel)) {
      return res.status(400).json({ 
        error: 'Priority level must be "low", "medium", or "high"' 
      });
    }

    // Validate date format (basic check)
    const appointmentDate = new Date(dateScheduled);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format. Use YYYY-MM-DD' 
      });
    }    // Validate time format (accepts both HH:MM and HH:MM:SS)
    const timeRegexWithSeconds = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    const timeRegexWithoutSeconds = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    let formattedTimeScheduled = timeScheduled;
    
    if (timeRegexWithoutSeconds.test(timeScheduled) && !timeRegexWithSeconds.test(timeScheduled)) {
      // Add seconds if not provided (HH:MM -> HH:MM:00)
      formattedTimeScheduled = timeScheduled + ':00';
    } else if (!timeRegexWithSeconds.test(timeScheduled)) {
      return res.status(400).json({ 
        error: 'Invalid time format. Use HH:MM or HH:MM:SS (e.g., 14:20 or 14:20:00)' 
      });
    }

    // Check if appointment date is in the future
    const now = new Date();
    if (appointmentDate <= now) {
      return res.status(400).json({ 
        error: 'Appointment date must be in the future' 
      });
    }
    
    let appointment;
      if (userRole === 'student') {
      // Students create appointments for themselves      // If medical_staff_id is provided, validate it exists and is active
      if (medicalStaffId) {
        const staffValidation = await appointmentService.validateMedicalStaffExists(medicalStaffId);
        if (!staffValidation.exists) {
          return res.status(400).json({ 
            error: 'Selected medical staff not found or inactive' 
          });
        }
        
        // Check if the selected staff's specialty matches the health issue type
        if (staffValidation.specialtyGroup !== healthIssueType) {
          return res.status(400).json({ 
            error: `Selected medical staff specializes in ${staffValidation.specialtyGroup} health issues, but you requested ${healthIssueType} care. Please select an appropriate specialist or let the system auto-assign.` 
          });
        }
        
        console.log(`[DEBUG] Student selected medical staff: ${staffValidation.name} (${staffValidation.specialty})`);
      }
        appointment = await appointmentService.createAppointment(userId, symptoms, normalizedPriorityLevel, healthIssueType, medicalStaffId, dateScheduled, formattedTimeScheduled);
    } else if (userRole === 'admin') {
      // Admin can create appointments for students via different route (/api/admin/appointments/users/:userId)
      return res.status(400).json({ 
        error: 'Admins should use /api/admin/appointments/users/:userId endpoint' 
      });    } else if (userRole === 'medical_staff') {
      // Medical staff can create appointments using the same universal method
      appointment = await appointmentService.createAppointment(userId, symptoms, normalizedPriorityLevel, healthIssueType, medicalStaffId, dateScheduled, formattedTimeScheduled);
    }res.status(201).json({ 
      message: 'Appointment created successfully',
      appointment,
      assignedSpecialtyGroup: healthIssueType, // Show which specialty group was requested
      assignmentMethod: medicalStaffId ? 'manual_selection' : 'auto_assigned',
      timeAdjustment: appointment.timeScheduled !== formattedTimeScheduled ? {
        requested: formattedTimeScheduled,
        assigned: appointment.timeScheduled,
        reason: 'Requested time slot not available, assigned nearest available slot'
      } : null
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get specific appointment with ownership/assignment check
exports.getAppointmentById = async (req, res) => {
  try {
    const appointmentId = req.params.appointmentId;
    const userRole = req.appointmentAccess.role;
    const userId = req.appointmentAccess.userId;
    
    let appointment;
    
    if (userRole === 'admin') {
      // Admin can access any appointment - fetch from admin service
      const allAppointments = await adminService.getAllAppointments();
      appointment = allAppointments.find(apt => apt.id === appointmentId);
    } else {
      // Students and medical staff - get specific appointment and check ownership
      appointment = await appointmentService.getAppointmentById(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      // Check access permissions
      if (userRole === 'student' && appointment.userId !== userId) {
        return res.status(403).json({ 
          error: 'You do not have access to this appointment' 
        });
      }
        if (userRole === 'medical_staff') {
        // Medical staff can access appointments where they are assigned
        const isAssigned = await appointmentService.isMedicalStaffAssigned(appointmentId, userId);
        if (!isAssigned) {
          return res.status(403).json({ 
            error: 'You can only access appointments where you are assigned' 
          });
        }
      }
    }
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({ appointment });
  } catch (error) {
    console.error('Get appointment by ID error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update appointment with role-based permissions
exports.updateAppointment = async (req, res) => {  try {
    const appointmentId = req.params.appointmentId;
    const updates = req.body;
    const userRole = req.appointmentAccess.role;
    const userId = req.appointmentAccess.userId;
    
    console.log('[DEBUG] updateAppointment - appointmentId:', appointmentId);
    console.log('[DEBUG] updateAppointment - request body:', updates);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(appointmentId)) {
      return res.status(400).json({ 
        error: 'Invalid appointment ID format',
        appointmentId: appointmentId 
      });
    }

    // Get the appointment first to check permissions
    const appointment = await appointmentService.getAppointmentById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Permission checks based on role
    let canUpdate = false;
    let updatedAppointment;
    if (userRole === 'admin') {
      canUpdate = true;
    } else if (userRole === 'student') {
      // Students can only update their own appointments
      canUpdate = appointment.userId === userId;    } else if (userRole === 'medical_staff') {
      // Medical staff can update appointments assigned to them OR pending appointments
      const isAssigned = await appointmentService.isMedicalStaffAssigned(appointmentId, userId);
      const isPending = appointment.status === 'pending';
      canUpdate = isAssigned || isPending;
    }

    if (!canUpdate) {
      return res.status(403).json({ 
        error: 'You do not have permission to update this appointment' 
      });
    }    // ROLE-BASED UPDATE VALIDATION
    if (userRole === 'student') {
      // Students can:
      // 1. Cancel their appointments (status = 'cancelled')
      // 2. Reschedule (change dateScheduled, timeScheduled)
      // 3. Update symptoms and priority
      
      if (updates.status) {
        const newStatus = updates.status.toLowerCase();
        if (!['cancelled'].includes(newStatus)) {
          return res.status(403).json({
            error: 'Students can only cancel appointments',
            allowedStatuses: ['cancelled']
          });
        }
      }
      
      // Students can update: dateScheduled, timeScheduled, symptoms, priorityLevel
      const allowedStudentFields = ['dateScheduled', 'timeScheduled', 'symptoms', 'priorityLevel', 'status'];
      const requestedFields = Object.keys(updates);
      const unauthorizedFields = requestedFields.filter(field => !allowedStudentFields.includes(field));
      
      if (unauthorizedFields.length > 0) {
        return res.status(403).json({
          error: 'Students cannot update these fields',
          unauthorizedFields,
          allowedFields: allowedStudentFields
        });      }
      
    } else if (userRole === 'medical_staff') {
      // Medical staff can approve, reject, or complete appointments
      if (updates.status) {
        const newStatus = updates.status.toLowerCase();
        if (!['approved', 'rejected', 'completed'].includes(newStatus)) {
          return res.status(403).json({
            error: 'Medical staff can approve, reject, or complete appointments',
            allowedStatuses: ['approved', 'rejected', 'completed']
          });
        }
      }
      // Admin can set any status (no additional restrictions)
    }

    // Validate general updates
    if (updates.status && !['pending', 'approved', 'rejected', 'completed', 'cancelled'].includes(updates.status)) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        validStatuses: ['pending', 'approved', 'rejected', 'completed', 'cancelled']
      });
    }    // Update the appointment
    const result = await appointmentService.updateAppointment(appointmentId, updates);
    
    // Check if time was adjusted
    let timeAdjustment = null;
    if (updates.timeScheduled && result.timeScheduled !== updates.timeScheduled) {
      timeAdjustment = {
        requested: updates.timeScheduled,
        assigned: result.timeScheduled,
        reason: 'Requested time slot not available, assigned nearest available slot'
      };
    }
    
    res.json({ 
      success: true,
      message: 'Appointment updated successfully',
      appointment: result,
      timeAdjustment: timeAdjustment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update appointment',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete appointment with role-based permissions
exports.deleteAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.appointmentId;
    const userRole = req.appointmentAccess.role;
    const userId = req.appointmentAccess.userId;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(appointmentId)) {
      return res.status(400).json({ 
        error: 'Invalid appointment ID format' 
      });
    }
    
    const deletedAppointment = await appointmentService.deleteAppointment(
      appointmentId, 
      userId, 
      userRole
    );
    
    res.json({ 
      message: 'Appointment deleted successfully',
      appointment: deletedAppointment,
      deletedBy: userRole 
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    
    if (error.message === 'Appointment not found') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message === 'You do not have permission to delete this appointment' ||
        error.message === 'Cannot delete completed appointments') {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get pending appointments for medical staff review
 */
exports.getPendingAppointments = async (req, res) => {
  try {
    const userRole = req.user.role;
    
    if (userRole !== 'medical_staff') {
      return res.status(403).json({ 
        error: 'Only medical staff can view pending appointments' 
      });
    }
    
    const appointments = await appointmentService.getPendingAppointments();
    
    res.json({ 
      appointments,
      count: appointments.length,
      message: 'Pending appointments retrieved successfully'
    });
  } catch (error) {
    console.error('Get pending appointments error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Approve appointment - Medical staff only
 * Implements "Approve / Reject Appointment" use case
 */
exports.approveAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { dateScheduled, timeScheduled, advice } = req.body; // Optional advice message
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'medical_staff') {
      return res.status(403).json({ 
        error: 'Only medical staff can approve appointments' 
      });
    }
    
    // Validate input parameters if provided
    if (dateScheduled) {
      const appointmentDate = new Date(dateScheduled);
      if (isNaN(appointmentDate.getTime())) {
        return res.status(400).json({ 
          error: 'Invalid date format. Use YYYY-MM-DD' 
        });
      }
      
      // Check if appointment date is in the future
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Set to start of today for comparison
      appointmentDate.setHours(0, 0, 0, 0);
      if (appointmentDate < now) {
        return res.status(400).json({ 
          error: 'Appointment date must be today or in the future' 
        });
      }
    }
    
    let formattedTimeScheduled = timeScheduled;
    if (timeScheduled) {
      // Validate time format (accepts both HH:MM and HH:MM:SS)
      const timeRegexWithSeconds = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      const timeRegexWithoutSeconds = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (!timeRegexWithSeconds.test(timeScheduled) && !timeRegexWithoutSeconds.test(timeScheduled)) {
        return res.status(400).json({ 
          error: 'Invalid time format. Use HH:MM or HH:MM:SS (e.g., 14:20 or 14:20:00)' 
        });
      }
      
      // Ensure we have the correct time format for the service
      if (timeRegexWithoutSeconds.test(timeScheduled) && !timeRegexWithSeconds.test(timeScheduled)) {
        formattedTimeScheduled = timeScheduled + ':00';
      }
    }
    
    // Approve the appointment
    const appointment = await appointmentService.approveAppointment(
      appointmentId, 
      userId, 
      dateScheduled,
      formattedTimeScheduled
    );
    
    let sentAdvice = null;
    
    // Send temporary advice if provided
    if (advice && advice.trim()) {
      sentAdvice = await adviceService.sendAdviceForAppointment(
        appointmentId,
        advice.trim(),
        userId
      );
    }
    
    res.json({ 
      message: 'Appointment approved successfully',
      appointment,
      advice: sentAdvice
    });
  } catch (error) {
    console.error('Approve appointment error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Reject appointment - Medical staff only
 */
exports.rejectAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason, advice } = req.body; // Optional rejection reason and advice
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'medical_staff') {
      return res.status(403).json({ 
        error: 'Only medical staff can reject appointments' 
      });
    }
    
    // Reject the appointment
    const appointment = await appointmentService.rejectAppointment(
      appointmentId,
      userId,
      reason
    );
    
    let sentAdvice = null;
    
    // Send temporary advice if provided (e.g., alternative care suggestions)
    if (advice && advice.trim()) {
      sentAdvice = await adviceService.sendAdviceForAppointment(
        appointmentId,
        advice.trim(),
        userId
      );
    }
    
    res.json({ 
      message: 'Appointment rejected successfully',
      appointment,
      advice: sentAdvice
    });
  } catch (error) {
    console.error('Reject appointment error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get available time slots for a specific date
 */
exports.getAvailableTimeSlots = async (req, res) => {
  try {
    const { date } = req.params;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const timeSlots = await appointmentService.getAvailableTimeSlots(date);
      res.json({ 
      date,
      timeSlots: timeSlots,  // Changed from availableTimeSlots to timeSlots
      availableTimeSlots: timeSlots,  // Keep both for backward compatibility
      message: `Found ${timeSlots.length} available time slots for ${date}`
    });
  } catch (error) {
    console.error('Get available time slots error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get available medical staff for appointment booking
 * Returns active medical staff grouped by specialty
 */
exports.getAvailableMedicalStaff = async (req, res) => {
  try {
    const medicalStaff = await appointmentService.getAvailableMedicalStaffForBooking();
    
    res.json({ 
      medicalStaff,
      count: medicalStaff.length,
      message: 'Available medical staff retrieved successfully'
    });
  } catch (error) {
    console.error('Get available medical staff error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get appointments for a specific user (student) - Medical staff only
 * Route: GET /api/appointments/:userId
 * Access: Medical staff only
 */
exports.getAppointmentsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const userRole = req.appointmentAccess.role;
    
    // Only medical staff can access this endpoint
    if (userRole !== 'medical_staff') {
      return res.status(403).json({ 
        error: 'Access denied. Only medical staff can retrieve appointments for specific students.' 
      });
    }
    
    // Validate userId parameter
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }
    
    // Get appointments for the specified student
    const appointments = await appointmentService.getAppointmentsByUserId(userId);
    
    res.json({ 
      appointments,
      studentId: userId,
      totalCount: appointments.length,
      message: 'Student appointments retrieved successfully'
    });
  } catch (error) {
    console.error('Get appointments by user ID error:', error);
    res.status(500).json({ error: error.message });
  }
};

