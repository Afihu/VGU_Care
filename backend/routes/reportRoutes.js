const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireAbuseReportAccess, requireRole } = require('../middleware/roleMiddleware');

// All abuse report routes require authentication
router.use(authMiddleware);

/**
 * Role-based abuse report access:
 * - Students: Cannot access (reports handled through other channels)
 * - Medical Staff: Full CRUD
 * - Admin: Full CRUD + user management actions
 */

// Get all abuse reports - medical staff and admin only
router.get('/', requireAbuseReportAccess, (req, res) => {
  res.json({ message: 'Get abuse reports endpoint - medical staff and admin only' });
});

// Get reports by status
router.get('/status/:status', requireAbuseReportAccess, (req, res) => {
  res.json({ message: 'Get reports by status endpoint' });
});

// Get reports by type
router.get('/type/:type', requireAbuseReportAccess, (req, res) => {
  res.json({ message: 'Get reports by type endpoint' });
});

// Get specific report by ID
router.get('/:reportId', requireAbuseReportAccess, (req, res) => {
  res.json({ message: 'Get specific abuse report endpoint' });
});

// Create new abuse report - medical staff and admin only
router.post('/', requireAbuseReportAccess, (req, res) => {
  res.json({ message: 'Create abuse report endpoint - medical staff and admin only' });
});

// Update report status - medical staff and admin only
router.patch('/:reportId/status', requireAbuseReportAccess, (req, res) => {
  res.json({ message: 'Update report status endpoint' });
});

// Update report details - medical staff and admin only
router.patch('/:reportId', requireAbuseReportAccess, (req, res) => {
  res.json({ message: 'Update report details endpoint' });
});

// Delete report - medical staff and admin only
router.delete('/:reportId', requireAbuseReportAccess, (req, res) => {
  res.json({ message: 'Delete abuse report endpoint' });
});

// Admin-only: User management actions related to abuse reports
router.post('/:reportId/user-action', requireRole('admin'), (req, res) => {
  res.json({ message: 'User management action endpoint - admin only' });
});

// Admin-only: Bulk operations on reports
router.post('/bulk/status-update', requireRole('admin'), (req, res) => {
  res.json({ message: 'Bulk status update endpoint - admin only' });
});

module.exports = router;
