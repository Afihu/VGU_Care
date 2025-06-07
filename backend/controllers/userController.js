const authService = require('../services/authService');
const profileService = require('../services/profileService');

exports.signup = async (req, res) => {
  try {
    const { email, password, name, gender, age, role, roleSpecificData } = req.body;
    
    // Validate required fields
    if (!email || !password || !name || !gender || !age || !role) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, password, name, gender, age, role' 
      });
    }

    // Validate VGU email domain
    if (!email.includes('@vgu.edu.vn')) {
      return res.status(400).json({ 
        error: 'Invalid email domain. Please use a valid VGU email address (@vgu.edu.vn)' 
      });
    }

    // Validate role
    const validRoles = ['student', 'medical_staff', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be student, medical_staff, or admin' 
      });
    }

    // Create user using auth service
    const userData = { name, gender, age, role, roleSpecificData };
    const user = await authService.createUser(email, password, userData);
    
    res.status(201).json({ 
      message: 'User account created successfully',
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    const { token, user } = await authService.authenticate(email, password);
    
    res.json({ 
      message: 'Login successful', 
      token,
      user 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(401).json({ error: err.message });
  }
};

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