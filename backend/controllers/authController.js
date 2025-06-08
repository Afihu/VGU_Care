const authService = require('../services/authService');
const { query } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  console.log(`[LOGIN ATTEMPT] Email: ${email}`);

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      console.log('[LOGIN FAILED] No user found for email:', email);
      return res.status(401).json({ message: 'Login failed.' });
    }

    console.log('[LOGIN CHECK] User found:', user.email);

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    console.log('[LOGIN CHECK] Password match result:', passwordMatch);

    if (!passwordMatch) {
      console.log('[LOGIN FAILED] Incorrect password for:', email);
      return res.status(401).json({ message: 'Login failed.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.user_id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '24h' }
    );

    console.log('[LOGIN SUCCESS] Email:', email);
    res.json({ 
      message: 'Login successful', 
      user: { 
        email: user.email, 
        role: user.role 
      },
      token: token 
    });

  } catch (error) {
    console.error('[LOGIN ERROR]', error);
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