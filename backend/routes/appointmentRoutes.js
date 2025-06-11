 
const express = require('express');
const router = express.Router();
const { getAppointments, createAppointment, getAppointmentById, updateAppointment, deleteAppointment } = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/auth');
const { requireAppointmentAccess } = require('../middleware/roleMiddleware');

// All appointment routes require authentication
router.use(authMiddleware);

/**
 * Role-based appointment access:
 * - Students: Own appointments only
 * - Medical Staff: Appointments where they are assigned
 * - Admin: All appointments
 */

// Get appointments with role-based filtering
router.get('/', requireAppointmentAccess, getAppointments);

// Create appointment - students can book their own, medical staff and admin can book for anyone
router.post('/', requireAppointmentAccess, createAppointment);

// Get specific appointment by ID with ownership/assignment check
router.get('/:appointmentId', requireAppointmentAccess, getAppointmentById);

// Update appointment
router.patch('/:appointmentId', requireAppointmentAccess, updateAppointment);

// Delete appointment
router.delete('/:appointmentId', requireAppointmentAccess, deleteAppointment);

module.exports = router;