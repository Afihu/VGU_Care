const router = require('express').Router();
const { signup, login, getProfile, updateProfile, changePassword } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/me', authMiddleware, getProfile);
router.patch('/profile', authMiddleware, updateProfile);
router.patch('/change-password', authMiddleware, changePassword);

module.exports = router;
