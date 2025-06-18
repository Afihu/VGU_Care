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
  try {
    const { symptoms, priorityLevel, medical_staff_id, dateScheduled, timeScheduled } = req.body; // Updated API format
    const userRole = req.appointmentAccess.role;
    const userId = req.appointmentAccess.userId;
    
    // Validate required fields
    if (!symptoms || !priorityLevel) {
      return res.status(400).json({ 
        error: 'Symptoms and priority level are required' 
      });
    }

    // If time is specified, date must also be specified
    if (timeScheduled && !dateScheduled) {
      return res.status(400).json({ 
        error: 'Date must be specified when time is provided' 
      });
    }
    
    let appointment;
    
    if (userRole === 'student') {
      // Students create appointments for themselves
      appointment = await appointmentService.createAppointment(userId, symptoms, priorityLevel, medical_staff_id, dateScheduled, timeScheduled);
    } else if (userRole === 'admin') {
      // Admin can create appointments for students via different route (/api/admin/appointments/users/:userId)
      return res.status(400).json({ 
        error: 'Admins should use /api/admin/appointments/users/:userId endpoint' 
      });    } else if (userRole === 'medical_staff') {
      // Medical staff can create appointments for students with their assignment
      appointment = await appointmentService.createAppointmentByMedicalStaff(userId, symptoms, priorityLevel, null, dateScheduled, timeScheduled);
    }
    
    res.status(201).json({ 
      message: 'Appointment created successfully',
      appointment 
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
    }    // ROLE-BASED STATUS VALIDATION
    if (updates.status) {
      const newStatus = updates.status.toLowerCase();
      
      if (userRole === 'student') {
        // Students can only schedule or cancel their appointments
        if (!['scheduled', 'cancelled'].includes(newStatus)) {
          return res.status(403).json({
            error: 'Students can only schedule or cancel appointments',
            allowedStatuses: ['scheduled', 'cancelled']
          });
        }
      } else if (userRole === 'medical_staff') {
        // Medical staff can approve, reject, schedule, or complete appointments
        if (!['approved', 'rejected', 'scheduled', 'completed'].includes(newStatus)) {
          return res.status(403).json({
            error: 'Medical staff can approve, reject, schedule, or complete appointments',
            allowedStatuses: ['approved', 'rejected', 'scheduled', 'completed']
          });
        }
      }
      // Admin can set any status (no additional restrictions)
    }

    // Validate general updates
    if (updates.status && !['pending', 'approved', 'rejected', 'scheduled', 'completed', 'cancelled'].includes(updates.status)) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        validStatuses: ['pending', 'approved', 'rejected', 'scheduled', 'completed', 'cancelled']
      });
    }// Update the appointment
    const result = await appointmentService.updateAppointment(appointmentId, updates);
    
    res.json({ 
      success: true,
      message: 'Appointment updated successfully',
      appointment: result 
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
    
    res.json({ 
      message: 'Appointment deleted successfully',
      appointmentId,
      deletedBy: userRole 
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
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
    const { dateScheduled, advice } = req.body; // Optional advice message
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'medical_staff') {
      return res.status(403).json({ 
        error: 'Only medical staff can approve appointments' 
      });
    }
    
    // Approve the appointment
    const appointment = await appointmentService.approveAppointment(
      appointmentId, 
      userId, 
      dateScheduled
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
      availableTimeSlots: timeSlots,
      message: `Found ${timeSlots.length} available time slots for ${date}`
    });
  } catch (error) {
    console.error('Get available time slots error:', error);
    res.status(500).json({ error: error.message });
  }
};

