/**
 * Enhanced Role-Based Middleware
 * Provides granular role checking functions for fine-grained access control
 * Must be used after the auth middleware to ensure req.user is populated
 */

/**
 * Check for specific roles
 * @param {...string} allowedRoles - Roles that are allowed to access the resource
 * @returns {Function} Middleware function
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    // Check if user has one of the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient privileges',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Medical staff or admin access
 * Shorthand for requireRole('medical_staff', 'admin')
 */
const requireMedicalStaffOrAdmin = requireRole('medical_staff', 'admin');

/**
 * Students can only access their own data
 * Checks if the student is accessing their own resource or if user is medical staff/admin
 * @param {string} userIdParam - The parameter name containing the user ID (default: 'userId')
 * @returns {Function} Middleware function
 */
const requireStudentOwnership = (userIdParam = 'userId') => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    // Admin and medical staff can access any student data
    if (req.user.role === 'admin' || req.user.role === 'medical_staff') {
      return next();
    }    // Students can only access their own data
    if (req.user.role === 'student') {
      const requestedUserId = req.params[userIdParam];
      
      if (req.user.userId === requestedUserId) {
        return next();
      }
      
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only access your own data'
      });
    }

    // Unknown role
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'Invalid user role'
    });
  };
};

/**
 * Role-based appointment access control
 * Students: Own appointments only
 * Medical Staff: Appointments where they are assigned
 * Admin: All appointments
 */
const requireAppointmentAccess = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
  }

  // Store user info for controller to use in queries
  req.appointmentAccess = {
    role: req.user.role,
    userId: req.user.userId
  };

  // Admin can access all appointments
  if (req.user.role === 'admin') {
    req.appointmentAccess.filter = {}; // No filter for admin
    return next();
  }

  // Students can only access their own appointments
  if (req.user.role === 'student') {
    req.appointmentAccess.filter = { studentId: req.user.userId };
    return next();
  }

  // Medical staff can access appointments where they are assigned
  if (req.user.role === 'medical_staff') {
    req.appointmentAccess.filter = { medicalStaffId: req.user.userId };
    return next();
  }

  // Unknown role
  return res.status(403).json({ 
    error: 'Access denied',
    message: 'Invalid user role'
  });
};

/**
 * Check if user can access mood tracker entries
 * Students: Own mood entries only
 * Medical Staff: Can view student mood entries
 * Admin: All mood entries
 */
const requireMoodTrackerAccess = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
  }

  // Store user info for controller to use in queries
  req.moodAccess = {
    role: req.user.role,
    userId: req.user.userId
  };

  // Admin can access all mood entries
  if (req.user.role === 'admin') {
    req.moodAccess.filter = {}; // No filter for admin
    return next();
  }

  // Students can only access their own mood entries
  if (req.user.role === 'student') {
    req.moodAccess.filter = { userId: req.user.userId };
    return next();
  }

  // Medical staff can view student mood entries (will be filtered in controller)
  if (req.user.role === 'medical_staff') {
    req.moodAccess.filter = {}; // Medical staff can view all student entries
    return next();
  }

  // Unknown role
  return res.status(403).json({ 
    error: 'Access denied',
    message: 'Invalid user role'
  });
};

/**
 * Check if user can access temporary advice
 * Students: View only
 * Medical Staff: Full CRUD
 * Admin: Full CRUD
 */
const requireAdviceAccess = (method = 'GET') => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    // Admin and medical staff have full access
    if (req.user.role === 'admin' || req.user.role === 'medical_staff') {
      return next();
    }

    // Students can only view (GET requests)
    if (req.user.role === 'student') {
      if (method === 'GET' || req.method === 'GET') {
        return next();
      }
      
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Students can only view temporary advice'
      });
    }

    // Unknown role
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'Invalid user role'
    });
  };
};

/**
 * Check if user can access abuse reports
 * Students: Cannot access (reports handled through other channels)
 * Medical Staff: Full CRUD
 * Admin: Full CRUD + user management actions
 */
const requireAbuseReportAccess = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
  }

  // Only medical staff and admin can access abuse reports
  if (req.user.role === 'medical_staff' || req.user.role === 'admin') {
    req.abuseReportAccess = {
      role: req.user.role,
      userId: req.user.userId
    };
    return next();
  }

  // Students cannot access abuse reports
  return res.status(403).json({ 
    error: 'Access denied',
    message: 'Students cannot access abuse reports. Please contact support through other channels.'
  });
};

/**
 * Backward compatibility with existing adminAuth
 * @deprecated Use requireRole('admin') instead
 */
const adminAuth = requireRole('admin');

module.exports = {
  requireRole,
  requireMedicalStaffOrAdmin,
  requireStudentOwnership,
  requireAppointmentAccess,
  requireMoodTrackerAccess,
  requireAdviceAccess,
  requireAbuseReportAccess,
  adminAuth // For backward compatibility
};
