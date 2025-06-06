const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

exports.createUser = async (email, password, userData) => {
  try {
    // Validate VGU email
    if (!email.includes('@vgu.edu.vn')) {
      throw new Error('Invalid VGU email domain');
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const result = await query(`
      INSERT INTO users (name, gender, age, role, email, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING user_id, email, role
    `, [userData.name, userData.gender, userData.age, userData.role, email, password_hash]);

    return result.rows[0];
  } catch (error) {
    throw new Error(`User creation failed: ${error.message}`);
  }
};

exports.authenticate = async (email, password) => {
  try {
    // Get user from database
    const result = await query(`
      SELECT user_id, email, password_hash, role, status
      FROM users 
      WHERE email = $1
    `, [email]);

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Check if user is active
    if (user.status !== 'active') {
      throw new Error('Account is inactive');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
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

    return {
      token,
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

exports.verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};