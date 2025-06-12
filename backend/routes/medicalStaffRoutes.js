const router = require('express').Router();
const { 
  getProfile, 
  updateProfile, 
  getAllStudents, 
  getStudentProfile 
} = require('../controllers/medicalStaffController');
const { 
  getPendingAppointments, 
  approveAppointment, 
  rejectAppointment 
} = require('../controllers/appointmentController');
const { 
  getAdviceBySentByStaff,
  sendAdvice 
} = require('../controllers/adviceController');
const authMiddleware = require('../middleware/auth');

// All medical staff routes require authentication
router.use(authMiddleware);

// Medical staff profile management
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

// Student profile viewing
router.get('/students', getAllStudents);
router.get('/students/:studentId', getStudentProfile);

// Appointment approval workflow
router.get('/appointments/pending', getPendingAppointments);
router.post('/appointments/:appointmentId/approve', approveAppointment);
router.post('/appointments/:appointmentId/reject', rejectAppointment);

// Temporary advice management
router.get('/advice/sent', getAdviceBySentByStaff);
router.post('/advice', sendAdvice);

module.exports = router;