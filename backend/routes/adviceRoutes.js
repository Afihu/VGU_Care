const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireAdviceAccess } = require('../middleware/roleMiddleware');

// All advice routes require authentication
router.use(authMiddleware);

/**
 * Role-based temporary advice access:
 * - Students: View only
 * - Medical Staff: Full CRUD
 * - Admin: Full CRUD
 */

// Get all active advice - all authenticated users can view
router.get('/', requireAdviceAccess('GET'), (req, res) => {
  res.json({ message: 'Get temporary advice endpoint - all roles can view' });
});

// Get advice by category
router.get('/category/:category', requireAdviceAccess('GET'), (req, res) => {
  res.json({ message: 'Get advice by category endpoint' });
});

// Get specific advice by ID
router.get('/:adviceId', requireAdviceAccess('GET'), (req, res) => {
  res.json({ message: 'Get specific advice endpoint' });
});

// Create new advice - medical staff and admin only
router.post('/', requireAdviceAccess('POST'), (req, res) => {
  res.json({ message: 'Create advice endpoint - medical staff and admin only' });
});

// Update advice - medical staff and admin only
router.patch('/:adviceId', requireAdviceAccess('PATCH'), (req, res) => {
  res.json({ message: 'Update advice endpoint - medical staff and admin only' });
});

// Delete advice - medical staff and admin only
router.delete('/:adviceId', requireAdviceAccess('DELETE'), (req, res) => {
  res.json({ message: 'Delete advice endpoint - medical staff and admin only' });
});

// Toggle advice active status - medical staff and admin only
router.patch('/:adviceId/toggle', requireAdviceAccess('PATCH'), (req, res) => {
  res.json({ message: 'Toggle advice status endpoint - medical staff and admin only' });
});

module.exports = router;
