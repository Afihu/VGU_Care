const authService = require('../services/authService');
const { query } = require('../config/database');

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

    // Check if user already exists
    const existingUser = await query('SELECT email FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: 'User already exists with this email address' 
      });
    }

    // Create user with role-specific data
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
    const { token, user } = await authService.authenticate(req.body.email, req.body.password);
    res.json({ 
      message: 'Login successful', 
      token,
      user 
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await query(`
      SELECT 
        u.user_id   AS id,
        u.name,
        u.gender,
        u.age,
        u.role,
        u.email,
        u.status,
        u.points,
        u.created_at,
        u.updated_at,
        s.intake_year,
        s.major,
        m.specialty,
        a.admin_id    AS is_admin
      FROM users u
      LEFT JOIN students s      ON u.user_id = s.user_id
      LEFT JOIN medical_staff m ON u.user_id = m.user_id
      LEFT JOIN admins a        ON u.user_id = a.user_id
      WHERE u.user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const row = result.rows[0];
    const profile = {
      id:           row.id,
      name:         row.name,
      gender:       row.gender,
      age:          row.age,
      role:         row.role,
      email:        row.email,
      status:       row.status,
      points:       row.points,
      createdAt:    row.created_at,
      updatedAt:    row.updated_at
    };

    if (row.role === 'student') {
      profile.intakeYear = row.intake_year;
      profile.major      = row.major;
    }
    if (row.role === 'medical_staff') {
      profile.specialty  = row.specialty;
    }
    // admin doesn’t need extra fields beyond is_admin flag

    res.json({ user: profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};