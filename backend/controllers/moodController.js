const moodService = require('../services/moodService');
const userService = require('../services/userService');

exports.getMoodEntries = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get the student_id from the user_id
    const user = await userService.getUserById(userId);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access mood entries' });
    }
    
    const entries = await moodService.getMoodEntriesByUserId(userId);
    
    res.json({ entries });
  } catch (err) {
    console.error('Get mood entries error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createMoodEntry = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { mood, notes } = req.body;
    
    // Validate mood value
    if (!mood || !['happy', 'sad', 'neutral', 'anxious', 'stressed'].includes(mood)) {
      return res.status(400).json({ error: 'Valid mood value is required' });
    }
    
    // Get the student_id from the user_id
    const user = await userService.getUserById(userId);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can create mood entries' });
    }
    
    const entry = await moodService.createMoodEntry(user.id, mood, notes);
    
    res.status(201).json({ 
      message: 'Mood entry created successfully',
      entry 
    });
  } catch (err) {
    console.error('Create mood entry error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateMoodEntry = async (req, res) => {
  try {
    const userId = req.user.userId;
    const entryId = req.params.id;
    const { mood, notes } = req.body;
    
    // Get the student_id from the user_id
    const user = await userService.getUserById(userId);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can update mood entries' });
    }
    
    // Verify the entry belongs to the student
    const entry = await moodService.getMoodEntryById(entryId);
    if (!entry) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }
    
    if (entry.studentId !== user.id) {
      return res.status(403).json({ error: 'You can only update your own mood entries' });
    }
    
    const updatedEntry = await moodService.updateMoodEntry(entryId, { mood, notes });
    
    res.json({ 
      message: 'Mood entry updated successfully',
      entry: updatedEntry 
    });
  } catch (err) {
    console.error('Update mood entry error:', err);
    res.status(500).json({ error: err.message });
  }
};