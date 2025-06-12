const router = require('express').Router();
const { 
  getProfile, 
  updateProfile, 
  getAllStudents, 
  getStudentProfile 
} = require('../controllers/medicalStaffController');
const authMiddleware = require('../middleware/auth');

// All medical staff routes require authentication
router.use(authMiddleware);

// Medical staff profile management
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

// Student profile viewing
router.get('/students', getAllStudents);
router.get('/students/:studentId', getStudentProfile);

module.exports = router;