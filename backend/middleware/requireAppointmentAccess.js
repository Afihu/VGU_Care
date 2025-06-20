const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    // Support various payload shapes: { id, role }, { userId, role }, { user: { id, role } }
    let role = decoded.role;
    let userId = decoded.id || decoded.userId;
    if (decoded.user) {
      role = role || decoded.user.role;
      userId = userId || decoded.user.id || decoded.user.userId;
    }
    if (!role || !userId) {
      return res.status(403).json({ error: 'Invalid token payload' });
    }
    req.appointmentAccess = {
      role,
      userId
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
