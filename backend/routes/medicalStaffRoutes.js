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
const { requireRole } = require('../middleware/roleMiddleware');

// All medical staff routes require authentication
router.use(authMiddleware);

// Require medical staff or admin role for all routes
router.use(requireRole('medical_staff', 'admin'));

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
router.post('/appointments/:appointmentId', sendAdvice);

module.exports = router;