const { query } = require('../config/database');
const bcrypt = require('bcrypt');

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

    console.log('[LOGIN SUCCESS] Email:', email);
    res.json({ 
      message: 'Login successful', 
      user: { 
        email: user.email, 
        role: user.role 
      } 
    });

  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { loginUser };