const router = require('express').Router();
const { getProfile, updateProfile, changePassword, getProfileById, getAllStudents } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { requireStudentOwnership, requireMedicalStaffOrAdmin } = require('../middleware/roleMiddleware');

// All user routes require authentication
router.get('/me', authMiddleware, getProfile);
router.patch('/profile', authMiddleware, updateProfile);
router.patch('/change-password', authMiddleware, changePassword);

// Role-based access routes
// Students can only view their own profile, Medical Staff + Admin can view any
router.get('/profile/:userId', authMiddleware, requireStudentOwnership(), getProfileById);
router.patch('/profile/:userId', authMiddleware, requireStudentOwnership(), updateProfile);

// Only medical staff and admin can view all students
router.get('/students', authMiddleware, requireMedicalStaffOrAdmin, getAllStudents);

module.exports = router;