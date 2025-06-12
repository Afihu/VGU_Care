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
      // Medical staff see appointments where they are assigned
      appointments = await appointmentService.getAppointmentsByMedicalStaff(userId);
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
    const { symptoms, priorityLevel } = req.body; // Student API format
    const userRole = req.appointmentAccess.role;
    const userId = req.appointmentAccess.userId;
    
    // Validate required fields
    if (!symptoms || !priorityLevel) {
      return res.status(400).json({ 
        error: 'Symptoms and priority level are required' 
      });
    }
    
    let appointment;
    
    if (userRole === 'student') {
      // Students create appointments for themselves
      appointment = await appointmentService.createAppointment(userId, symptoms, priorityLevel);
    } else if (userRole === 'admin') {
      // Admin can create appointments for students via different route (/api/admin/appointments/users/:userId)
      return res.status(400).json({ 
        error: 'Admins should use /api/admin/appointments/users/:userId endpoint' 
      });    } else if (userRole === 'medical_staff') {
      // Medical staff can create appointments for students with their assignment
      appointment = await appointmentService.createAppointmentByMedicalStaff(userId, symptoms, priorityLevel);
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
    const appointmentId = parseInt(req.params.appointmentId);
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
exports.updateAppointment = async (req, res) => {
  try {
    const appointmentId = parseInt(req.params.appointmentId);
    const updates = req.body;
    const userRole = req.appointmentAccess.role;
    const userId = req.appointmentAccess.userId;
    
    let updatedAppointment;
    
    if (userRole === 'admin') {
      // Admin can update any appointment via admin service
      updatedAppointment = await adminService.updateAppointment(appointmentId, updates);
    } else if (userRole === 'student') {
      // Students can only update their own appointments
      // First check ownership
      const appointment = await appointmentService.getAppointmentById(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      if (appointment.userId !== userId) {
        return res.status(403).json({ 
          error: 'You can only update your own appointments' 
        });
      }
      
      // Students have limited update permissions
      const allowedFields = ['symptoms', 'status', 'priorityLevel', 'dateScheduled'];
      const studentUpdates = {};
      
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          studentUpdates[field] = updates[field];
        }
      }
      
      if (Object.keys(studentUpdates).length === 0) {
        return res.status(400).json({ 
          error: 'No valid fields provided for update. Allowed: symptoms, status, priorityLevel, dateScheduled' 
        });
      }
      
      updatedAppointment = await appointmentService.updateAppointment(appointmentId, studentUpdates);    } else if (userRole === 'medical_staff') {
      // Medical staff can update appointments where they are assigned
      const appointment = await appointmentService.getAppointmentById(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      const isAssigned = await appointmentService.isMedicalStaffAssigned(appointmentId, userId);
      if (!isAssigned) {
        return res.status(403).json({ 
          error: 'You can only update appointments where you are assigned' 
        });
      }
      
      // Medical staff have different update permissions than students
      const allowedFields = ['status', 'dateScheduled', 'symptoms']; // Medical staff can complete appointments
      const medicalStaffUpdates = {};
      
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          medicalStaffUpdates[field] = updates[field];
        }
      }
      
      if (Object.keys(medicalStaffUpdates).length === 0) {
        return res.status(400).json({ 
          error: 'No valid fields provided for update. Allowed: status, dateScheduled, symptoms' 
        });
      }
      
      updatedAppointment = await appointmentService.updateAppointment(appointmentId, medicalStaffUpdates);
    }
    
    res.json({ 
      message: 'Appointment updated successfully',
      appointment: updatedAppointment,
      updatedBy: userRole 
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete appointment with role-based permissions
exports.deleteAppointment = async (req, res) => {
  try {
    const appointmentId = parseInt(req.params.appointmentId);
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

