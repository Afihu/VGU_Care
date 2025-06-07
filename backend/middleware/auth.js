const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your_jwt_secret_key_here'
        );
        req.user = decoded;   // { userId, email, role, iat, exp }
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
