const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  sendAdvice,
  getAdviceForStudent,
  getAdviceBySentByStaff
} = require('../controllers/adviceController');
const { sendAdviceForAppointment } = require('../services/adviceService');

// All advice routes require authentication
router.use(authMiddleware);

/**
 * Simple temporary advice routes:
 * - Medical Staff: Send advice for appointments
 * - Students: View their received advice
 */

// Send advice for specific appointment - medical staff only
router.post('/appointments/:appointmentId', sendAdvice);

// Get advice for current student
router.get('/student', getAdviceForStudent);

// Get advice sent by current medical staff
router.get('/sent', getAdviceBySentByStaff);

module.exports = router;