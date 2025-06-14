const profileService = require('../services/profileService');
const userService = require('../services/userService');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await profileService.getProfile(userId);
    
    res.json({ user: profile });
  } catch (err) {
    console.error('Get profile error:', err);
    if (err.message === 'User not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profileData = req.body;

    const updatedProfile = await profileService.updateProfile(userId, profileData);
    
    res.json({ 
      message: 'Profile updated successfully',
      user: updatedProfile 
    });
  } catch (err) {
    console.error('Update profile error:', err);
    if (err.message === 'User not found') {
      res.status(404).json({ error: err.message });
    } else if (err.message.includes('must be') || err.message.includes('required')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    await profileService.changePassword(userId, currentPassword, newPassword);
    
    res.json({ 
      message: 'Password changed successfully' 
    });
  } catch (err) {
    console.error('Change password error:', err);
    if (err.message === 'User not found') {
      res.status(404).json({ error: err.message });
    } else if (err.message === 'Current password is incorrect' || 
               err.message.includes('password') || 
               err.message.includes('required')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

// Role-based profile access - students can only view their own, medical staff + admin can view any
exports.getProfileById = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId);
    const profile = await profileService.getProfile(targetUserId);
    
    res.json({ user: profile });
  } catch (err) {
    console.error('Get profile by ID error:', err);
    if (err.message === 'User not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

// Get all students - medical staff and admin only
exports.getAllStudents = async (req, res) => {
  try {
    const students = await userService.getUsersByRole('student');
    
    res.json({ 
      students: students.map(student => ({
        id: student.id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: student.dateOfBirth,
        phoneNumber: student.phoneNumber,
        createdAt: student.createdAt
      }))
    });
  } catch (err) {
    console.error('Get all students error:', err);
    res.status(500).json({ error: err.message });
  }
};