const moodEntryService = require('../services/moodEntryService');

// Create a new mood entry (student only)
exports.createMoodEntry = async (req, res) => {
  try {
    console.log('[DEBUG] moodEntry create - appointmentAccess:', req.appointmentAccess);
    console.log('[DEBUG] moodEntry create - body:', req.body);
    
    const userRole = req.appointmentAccess.role;
    const userId = req.appointmentAccess.userId;
    
    console.log('[DEBUG] userRole:', userRole, 'userId:', userId);
    
    if (userRole !== 'student') {
      return res.status(403).json({ error: 'Only students can create mood entries' });
    }
    const { mood, notes } = req.body;
    if (!mood) {
      return res.status(400).json({ error: 'Mood is required' });
    }
    const allowedMoods = ['happy', 'sad', 'neutral', 'anxious', 'stressed'];
    if (!allowedMoods.includes(mood)) {
      return res.status(400).json({ error: 'Invalid mood value' });
    }
    
    console.log('[DEBUG] About to call moodEntryService.createMoodEntry with userId:', userId);
    const entry = await moodEntryService.createMoodEntry(userId, mood, notes);
    console.log('[DEBUG] Successfully created mood entry:', entry);
    res.status(201).json({ moodEntry: entry });
  } catch (error) {
    console.log('[DEBUG] moodEntry create error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get all mood entries for the authenticated student
exports.getMoodEntries = async (req, res) => {
  try {
    const userRole = req.appointmentAccess.role;
    const userId = req.appointmentAccess.userId;
    if (userRole !== 'student') {
      return res.status(403).json({ error: 'Only students can view their mood entries' });
    }
    const entries = await moodEntryService.getMoodEntriesByUser(userId);
    res.json({ moodEntries: entries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Medical staff: Get all mood entries for a specific student (if they have an appointment with them)
exports.getMoodEntriesForStudent = async (req, res) => {
  try {
    const userRole = req.appointmentAccess.role;
    const staffUserId = req.appointmentAccess.userId;
    const studentUserId = req.params.studentUserId;
    if (userRole !== 'medical_staff') {
      return res.status(403).json({ error: 'Only medical staff can view student mood entries' });
    }
    // Check if staff has an appointment with this student
    const hasAppointment = await moodEntryService.staffHasAppointmentWithStudent(staffUserId, studentUserId);
    if (!hasAppointment) {
      return res.status(403).json({ error: 'You do not have access to this student\'s mood entries' });
    }
    const entries = await moodEntryService.getMoodEntriesByUser(studentUserId);
    res.json({ moodEntries: entries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a mood entry (student can only update their own)
exports.updateMoodEntry = async (req, res) => {
  try {
    const userRole = req.appointmentAccess.role;
    const userId = req.appointmentAccess.userId;
    if (userRole !== 'student') {
      return res.status(403).json({ error: 'Only students can update mood entries' });
    }
    const entryId = req.params.entryId;
    const { mood, notes } = req.body;
    if (!mood && notes === undefined) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    if (mood) {
      const allowedMoods = ['happy', 'sad', 'neutral', 'anxious', 'stressed'];
      if (!allowedMoods.includes(mood)) {
        return res.status(400).json({ error: 'Invalid mood value' });
      }
    }
    const updated = await moodEntryService.updateMoodEntry(entryId, userId, { mood, notes });
    res.json({ moodEntry: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a mood entry (student can only delete their own)
exports.deleteMoodEntry = async (req, res) => {
  try {
    const userRole = req.appointmentAccess.role;
    const userId = req.appointmentAccess.userId;
    
    if (userRole !== 'student') {
      return res.status(403).json({ error: 'Only students can delete mood entries' });
    }
    
    const entryId = req.params.entryId;
    
    const deleted = await moodEntryService.deleteMoodEntry(entryId, userId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Mood entry not found or access denied' });
    }
    
    res.json({ 
      success: true,
      message: 'Mood entry deleted successfully' 
    });
  } catch (error) {
    console.error('Delete mood entry error:', error);
    res.status(500).json({ error: error.message });
  }
};
