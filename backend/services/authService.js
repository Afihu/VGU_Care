const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool, query } = require('../config/database');
const userService = require('./userService');

class AuthService {
  async authenticate(email, password) {
    try {
      console.log(`[AUTH SERVICE] Attempting authentication for: ${email}`);
      
      // Use UserService instead of direct query
      const user = await userService.getUserByEmail(email);
      
      if (!user) {
        console.log('[AUTH SERVICE] User not found:', email);
        throw new Error('Invalid credentials');
      }

      console.log('[AUTH SERVICE] User found, verifying password');
      
      // Use UserService password verification
      const isValidPassword = await userService.verifyPasswordByEmail(email, password);
      
      if (!isValidPassword) {
        console.log('[AUTH SERVICE] Invalid password for:', email);
        throw new Error('Invalid credentials');
      }

      // Generate JWT token with consistent property names
      const token = jwt.sign(
        { 
          userId: user.id,  // Keep as userId (not id)
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        { expiresIn: '24h' }
      );

      console.log('[AUTH SERVICE] Authentication successful for:', email);
        return {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status
        }
      };
      
    } catch (error) {
      console.error('[AUTH SERVICE] Authentication failed:', error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }
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

      // Use UserService for password hashing
      const hashedPassword = await userService.hashPassword(password);

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
        const { 
          intakeYear = new Date().getFullYear(), 
          major = 'Undeclared',
          housingLocation = 'off_campus'
        } = roleSpecificData;
        await client.query(`
          INSERT INTO students (user_id, intake_year, major, housing_location)
          VALUES ($1, $2, $3, $4)
        `, [userId, intakeYear, major, housingLocation]);
        break;

      case 'medical_staff':
        const { 
          specialty = 'General Medicine',
          shiftSchedule = {
            "monday": ["09:00-17:00"],
            "tuesday": ["09:00-17:00"],
            "wednesday": ["09:00-17:00"],
            "thursday": ["09:00-17:00"],
            "friday": ["09:00-17:00"]
          }
        } = roleSpecificData;
        await client.query(`
          INSERT INTO medical_staff (user_id, specialty, shift_schedule)
          VALUES ($1, $2, $3)
        `, [userId, specialty, JSON.stringify(shiftSchedule)]);
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
      return jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = new AuthService();