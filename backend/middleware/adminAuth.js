/**
 * Admin Authorization Middleware
 * This middleware ensures that only users with 'admin' role can access admin-specific endpoints
 * Must be used after the auth middleware to ensure req.user is populated
 */

const adminAuth = (req, res, next) => {
  // Check if user is authenticated (should be handled by auth middleware before this)
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
  }

  // Check if user has admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      message: 'You do not have sufficient privileges to access this resource. Admin role required.'
    });
  }

  // User is authenticated and has admin role
  next();
};

/**
 * Optional admin auth - allows access but adds admin flag
 * Useful for endpoints that may have different behavior for admins vs regular users
 */
const optionalAdminAuth = (req, res, next) => {
  req.isAdmin = req.user && req.user.role === 'admin';
  next();
};

module.exports = {
  adminAuth,
  optionalAdminAuth
};
