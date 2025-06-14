const medicalStaffService = require('../services/medicalStaffService');

// Get medical staff's own profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await medicalStaffService.getMedicalStaffProfile(userId);
    
    res.json({ 
      success: true,
      staff: profile 
    });
  } catch (err) {
    console.error('Get medical staff profile error:', err);
    if (err.message === 'User not found') {
      res.status(404).json({ error: err.message });
    } else if (err.message.includes('Access denied')) {
      res.status(403).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

// Update medical staff's own profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profileData = req.body;

    // Validate profile data
    const { name, gender, age, specialty } = profileData;
    
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return res.status(400).json({ error: 'Name must be a non-empty string' });
    }

    if (gender !== undefined && !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({ error: 'Gender must be male, female, or other' });
    }

    if (age !== undefined && (!Number.isInteger(age) || age < 1 || age > 120)) {
      return res.status(400).json({ error: 'Age must be a valid integer between 1 and 120' });
    }

    if (specialty !== undefined && (typeof specialty !== 'string' || specialty.trim().length === 0)) {
      return res.status(400).json({ error: 'Specialty must be a non-empty string' });
    }

    const updatedProfile = await medicalStaffService.updateMedicalStaffProfile(userId, profileData);
    
    res.json({ 
      success: true,
      message: 'Profile updated successfully',
      user: updatedProfile 
    });
  } catch (err) {
    console.error('Update medical staff profile error:', err);
    if (err.message === 'User not found') {
      res.status(404).json({ error: err.message });
    } else if (err.message.includes('Access denied')) {
      res.status(403).json({ error: err.message });
    } else if (err.message.includes('must be') || err.message.includes('required')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

// Get all student profiles
exports.getAllStudents = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Verify user is medical staff
    const isMedicalStaff = await medicalStaffService.validateMedicalStaff(userId);
    if (!isMedicalStaff) {
      return res.status(403).json({ error: 'Access denied: Medical staff only' });
    }

    const students = await medicalStaffService.getAllStudentProfiles();
    
    res.json({ 
      success: true,
      students: students,
      count: students.length
    });
  } catch (err) {
    console.error('Get all students error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get specific student profile
exports.getStudentProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const studentId = req.params.studentId;

    // Verify user is medical staff
    const isMedicalStaff = await medicalStaffService.validateMedicalStaff(userId);
    if (!isMedicalStaff) {
      return res.status(403).json({ error: 'Access denied: Medical staff only' });
    }

    const student = await medicalStaffService.getStudentProfile(studentId);
    
    res.json({ 
      success: true,
      student: student 
    });
  } catch (err) {
    console.error('Get student profile error:', err);
    if (err.message === 'Student not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};