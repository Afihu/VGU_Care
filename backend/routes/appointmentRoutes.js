const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// All appointment routes require authentication
router.use(auth);

// Get all appointments for the authenticated student
router.get('/', appointmentController.getStudentAppointments);

// Create a new appointment (students only)
router.post('/', roleAuth(['student']), appointmentController.createAppointment);

// Update an existing appointment (students can only update their own)
router.patch('/:id', roleAuth(['student']), appointmentController.updateAppointment);

// Get advice for a specific appointment
router.get('/:id/advice', roleAuth(['student']), appointmentController.getAppointmentAdvice);

module.exports = router;