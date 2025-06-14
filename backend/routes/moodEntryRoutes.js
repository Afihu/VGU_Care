const express = require('express');
const router = express.Router();
const moodEntryController = require('../controllers/moodEntryController');
const requireAppointmentAccess = require('../middleware/requireAppointmentAccess');

// All routes require authentication and role extraction
router.use(requireAppointmentAccess);

// Create a new mood entry (student only)
router.post('/', moodEntryController.createMoodEntry);

// Get all mood entries for the authenticated student
router.get('/', moodEntryController.getMoodEntries);

// Update a mood entry (student can only update their own)
router.patch('/:entryId', moodEntryController.updateMoodEntry);

// Medical staff: Get all mood entries for a specific student (if they have an appointment with them)
router.get('/student/:studentUserId', moodEntryController.getMoodEntriesForStudent);

module.exports = router;
