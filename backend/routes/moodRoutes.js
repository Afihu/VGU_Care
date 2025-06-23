const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireMoodTrackerAccess, requireStudentOwnership } = require('../middleware/roleMiddleware');

// All mood tracker routes require authentication
router.use(authMiddleware);

/**
 * Role-based mood tracker access:
 * - Students: Own mood entries only
 * - Medical Staff: View student mood entries
 * - Admin: All mood entries
 */

// // Get mood entries with role-based filtering
// router.get('/', requireMoodTrackerAccess, (req, res) => {
//   // Controller will use req.moodAccess.filter for query filtering
//   res.json({ message: 'Get mood entries endpoint - role-based access implemented' });
// });
const moodController = require('../controllers/moodController');
router.get('/', requireMoodTrackerAccess, moodController.getMoodEntries);
// SOMEONE FORGOT TO CALL THE CONTROLLER HERE, FIXED IT


// Create mood entry - students can only create their own
router.post('/', requireMoodTrackerAccess, (req, res) => {
  res.json({ message: 'Create mood entry endpoint' });
});

// Get mood entries for specific user
router.get('/user/:userId', requireStudentOwnership(), (req, res) => {
  res.json({ message: 'Get user mood entries endpoint' });
});

// Get specific mood entry by ID
router.get('/:moodId', requireMoodTrackerAccess, (req, res) => {
  res.json({ message: 'Get specific mood entry endpoint' });
});

// Update mood entry - students can only update their own
router.patch('/:moodId', requireMoodTrackerAccess, (req, res) => {
  res.json({ message: 'Update mood entry endpoint' });
});

// Delete mood entry - students can only delete their own
router.delete('/:moodId', requireMoodTrackerAccess, (req, res) => {
  res.json({ message: 'Delete mood entry endpoint' });
});

module.exports = router;
