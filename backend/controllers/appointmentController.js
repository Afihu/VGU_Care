/**
 * Appointment Controller with Role-Based Access Control
 * Demonstrates how to use the appointment access middleware
 */

// Get appointments with role-based filtering
exports.getAppointments = async (req, res) => {
  try {
    // Use the filter from requireAppointmentAccess middleware
    const filter = req.appointmentAccess.filter;
    const userRole = req.appointmentAccess.role;
    
    // Mock data for demonstration
    const mockAppointments = [
      { id: 1, studentId: 1, medicalStaffId: 2, date: '2025-06-15', status: 'scheduled' },
      { id: 2, studentId: 2, medicalStaffId: 2, date: '2025-06-16', status: 'completed' },
      { id: 3, studentId: 1, medicalStaffId: 3, date: '2025-06-17', status: 'pending' }
    ];
    
    // Apply role-based filtering
    let filteredAppointments = mockAppointments;
    
    if (userRole === 'student') {
      filteredAppointments = mockAppointments.filter(apt => apt.studentId === filter.studentId);
    } else if (userRole === 'medical_staff') {
      filteredAppointments = mockAppointments.filter(apt => apt.medicalStaffId === filter.medicalStaffId);
    }
    // Admin sees all appointments (no filtering)
    
    res.json({ 
      appointments: filteredAppointments,
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
    const { studentId, medicalStaffId, date, reason } = req.body;
    const userRole = req.appointmentAccess.role;
    const userId = req.appointmentAccess.userId;
    
    // Role-based validation
    if (userRole === 'student' && studentId !== userId) {
      return res.status(403).json({ 
        error: 'Students can only book appointments for themselves' 
      });
    }
    
    // Mock appointment creation
    const newAppointment = {
      id: Math.floor(Math.random() * 1000),
      studentId,
      medicalStaffId,
      date,
      reason,
      status: 'pending',
      createdBy: userId,
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json({ 
      message: 'Appointment created successfully',
      appointment: newAppointment 
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
    
    // Mock appointment data
    const mockAppointment = { 
      id: appointmentId, 
      studentId: 1, 
      medicalStaffId: 2, 
      date: '2025-06-15', 
      status: 'scheduled',
      reason: 'Regular checkup'
    };
    
    // Check access permissions
    const hasAccess = userRole === 'admin' || 
                     (userRole === 'student' && mockAppointment.studentId === userId) ||
                     (userRole === 'medical_staff' && mockAppointment.medicalStaffId === userId);
    
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'You do not have access to this appointment' 
      });
    }
    
    res.json({ appointment: mockAppointment });
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
    
    res.json({ 
      message: 'Appointment updated successfully',
      appointmentId,
      updates,
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

