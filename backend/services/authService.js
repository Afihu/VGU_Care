const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, pool } = require('../config/database');
const userService = require('./userService');

class AuthService {
  async authenticate(email, password) {
    const user = await userService.getUserByEmail(email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new Error('Account is not active');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
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
  }

  async createUser(email, password, userData) {
    const { name, gender, age, role, roleSpecificData } = userData;
    
    // Check if user already exists
    const userExists = await userService.checkUserExists(email);
    if (userExists) {
      throw new Error('User already exists with this email address');
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert into users table
      const userResult = await client.query(`
        INSERT INTO users (email, password_hash, name, gender, age, role, status, points)
        VALUES ($1, $2, $3, $4, $5, $6, 'active', 0)
        RETURNING user_id, email, role
      `, [email, hashedPassword, name, gender, age, role]);

      const newUser = userResult.rows[0];

      // Insert into role-specific table
      await this._createRoleSpecificRecord(client, newUser.user_id, role, roleSpecificData);

      await client.query('COMMIT');
      return newUser;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async _createRoleSpecificRecord(client, userId, role, roleSpecificData = {}) {
    switch (role) {
      case 'student':
        const { intakeYear = new Date().getFullYear(), major = 'Undeclared' } = roleSpecificData;
        await client.query(`
          INSERT INTO students (user_id, intake_year, major)
          VALUES ($1, $2, $3)
        `, [userId, intakeYear, major]);
        break;

      case 'medical_staff':
        const { specialty = 'General Medicine' } = roleSpecificData;
        await client.query(`
          INSERT INTO medical_staff (user_id, specialty)
          VALUES ($1, $2)
        `, [userId, specialty]);
        break;

      case 'admin':
        await client.query(`
          INSERT INTO admins (user_id)
          VALUES ($1)
        `, [userId]);
        break;

      default:
        throw new Error(`Invalid role: ${role}`);
    }
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = new AuthService();