/**
 * Role-based authorization middleware
 * Checks if the authenticated user has one of the allowed roles
 */
module.exports = (allowedRoles) => {
    return (req, res, next) => {
        // User should be attached by the auth middleware
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const { role } = req.user;
        
        if (!allowedRoles.includes(role)) {
            return res.status(403).json({ 
                error: 'Access denied. You do not have permission to perform this action.' 
            });
        }
        
        next();
    };
};