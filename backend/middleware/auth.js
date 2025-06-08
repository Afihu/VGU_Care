const jwt = require('jsonwebtoken');
const authService = require('../services/authService');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        // Use authService for consistency
        const decoded = authService.verifyToken(token);
        req.user = decoded;   // { userId, email, role, iat, exp }
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
