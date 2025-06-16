const authService = require('../services/authService');

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  console.log(`[LOGIN ATTEMPT] Email: ${email}`);

  try {
    // Use authService.authenticate instead of duplicating logic
    const authResult = await authService.authenticate(email, password);
      console.log('[LOGIN SUCCESS] Email:', email);    res.json({ 
      message: 'Login successful', 
      user: { 
        id: authResult.user.id,
        email: authResult.user.email, 
        role: authResult.user.role,
        status: authResult.user.status
      },
      token: authResult.token 
    });

  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    
    // Handle authentication-specific errors
    if (error.message.includes('Invalid credentials') || 
        error.message.includes('User not found')) {
      return res.status(401).json({ message: 'Login failed.' });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const signup = async (req, res) => {
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

module.exports = { loginUser, signup };