const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');

/**
 * Admin Routes - All routes require authentication + admin privileges
 * These routes implement all admin privileges as specified in the TODO:
 * 
 * Admin Privileges:
 * - View all student profiles
 * - View all medical staff profiles  
 * - View/create/update appointments for all students * - View/create/update mood tracker entries for all students
 * - Create/update/delete temporary advice for all students
 * - View/create/update/delete system abuse reports for all users
 * - Manage user roles and permissions
 */

// Apply authentication and admin authorization to all routes
router.use(authMiddleware);
router.use(requireRole('admin'));

// ==================== USER MANAGEMENT ROUTES ====================

/**
 * GET /api/admin/users/students
 * Admin privilege: View all student profiles
 */
router.get('/users/students', adminController.getAllStudents);

/**
 * GET /api/admin/users/medical-staff
 * Admin privilege: View all medical staff profiles
 */
router.get('/users/medical-staff', adminController.getAllMedicalStaff);

/**
 * PATCH /api/admin/users/:userId/role
 * Admin privilege: Manage user roles and permissions
 * Body: { role: 'student'|'medical_staff'|'admin', roleSpecificData?: {} }
 */
router.patch('/users/:userId/role', adminController.updateUserRole);

/**
 * PATCH /api/admin/users/:userId/status
 * Admin privilege: Manage user permissions (active/inactive/banned)
 * Body: { status: 'active'|'inactive'|'banned' }
 */
router.patch('/users/:userId/status', adminController.updateUserStatus);

// ==================== APPOINTMENT MANAGEMENT ROUTES ====================

/**
 * GET /api/admin/appointments
 * Admin privilege: View appointments for all students
 */
router.get('/appointments', adminController.getAllAppointments);

/**
 * POST /api/admin/appointments/users/:userId
 * Admin privilege: Create appointments for all students
 * Body: { priorityLevel: 'low'|'medium'|'high', symptoms: string, dateScheduled?: timestamp }
 */
router.post('/appointments/users/:userId', adminController.createAppointment);

/**
 * PATCH /api/admin/appointments/:appointmentId
 * Admin privilege: Update appointments for all students
 * Body: { status?: string, dateScheduled?: timestamp, priorityLevel?: string, symptoms?: string }
 */
router.patch('/appointments/:appointmentId', adminController.updateAppointment);

// ==================== MOOD TRACKER MANAGEMENT ROUTES ====================

/**
 * GET /api/admin/mood-entries
 * Admin privilege: View mood tracker entries for all students
 */
router.get('/mood-entries', adminController.getAllMoodEntries);

/**
 * POST /api/admin/mood-entries/users/:userId
 * Admin privilege: Create mood tracker entries for all students
 * Body: { mood: 'happy'|'sad'|'neutral'|'anxious'|'stressed', notes?: string }
 */
router.post('/mood-entries/users/:userId', adminController.createMoodEntry);

/**
 * PATCH /api/admin/mood-entries/:entryId
 * Admin privilege: Update mood tracker entries for all students
 * Body: { mood?: string, notes?: string }
 */
router.patch('/mood-entries/:entryId', adminController.updateMoodEntry);

// ==================== TEMPORARY ADVICE MANAGEMENT ROUTES ====================

/**
 * GET /api/admin/temporary-advice
 * Admin privilege: View temporary advice for all students
 */
router.get('/temporary-advice', adminController.getAllTemporaryAdvice);

/**
 * POST /api/admin/temporary-advice/appointments/:appointmentId
 * Admin privilege: Create temporary advice for all students
 * Body: { message: string }
 */
router.post('/temporary-advice/appointments/:appointmentId', adminController.createTemporaryAdvice);

/**
 * PATCH /api/admin/temporary-advice/:adviceId
 * Admin privilege: Update temporary advice for all students
 * Body: { message: string }
 */
router.patch('/temporary-advice/:adviceId', adminController.updateTemporaryAdvice);

/**
 * DELETE /api/admin/temporary-advice/:adviceId
 * Admin privilege: Delete temporary advice for all students
 */
router.delete('/temporary-advice/:adviceId', adminController.deleteTemporaryAdvice);

// ==================== ABUSE REPORTS MANAGEMENT ROUTES ====================

/**
 * GET /api/admin/abuse-reports
 * Admin privilege: View abuse reports for all users
 */
router.get('/abuse-reports', adminController.getAllAbuseReports);

/**
 * POST /api/admin/abuse-reports
 * Admin privilege: Create abuse reports for all users
 * Body: { staffId: uuid, studentId?: uuid, description: string }
 */
router.post('/abuse-reports', adminController.createAbuseReport);

/**
 * PATCH /api/admin/abuse-reports/:reportId
 * Admin privilege: Update abuse reports for all users
 * Body: { description?: string, status?: 'open'|'investigating'|'resolved' }
 */
router.patch('/abuse-reports/:reportId', adminController.updateAbuseReport);

/**
 * DELETE /api/admin/abuse-reports/:reportId
 * Admin privilege: Delete abuse reports for all users
 */
router.delete('/abuse-reports/:reportId', adminController.deleteAbuseReport);

module.exports = router;
