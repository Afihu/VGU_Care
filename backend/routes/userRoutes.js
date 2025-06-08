const router = require('express').Router();
const { getProfile, updateProfile, changePassword } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// All user routes require authentication
router.get('/me', authMiddleware, getProfile);
router.patch('/profile', authMiddleware, updateProfile);
router.patch('/change-password', authMiddleware, changePassword);

module.exports = router;
