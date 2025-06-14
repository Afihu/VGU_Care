const bcrypt = require('bcrypt');
const { query } = require('../config/database');
const BaseService = require('./baseService');

class UserService extends BaseService {
  async getUserById(userId) {
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
      return null;
    }

    const row = result.rows[0];
    const user = {
      id: row.id,
      name: row.name,
      gender: row.gender,
      age: row.age,
      role: row.role,
      email: row.email,
      status: row.status,
      points: row.points,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    // Add role-specific data
    if (row.role === 'student') {
      user.intakeYear = row.intake_year;
      user.major = row.major;
    }
    if (row.role === 'medical_staff') {
      user.specialty = row.specialty;
    }
    if (row.role === 'admin') {
      user.isAdmin = !!row.is_admin;
    }

    return user;
  }

  async getUserByEmail(email) {
    const result = await query(`
      SELECT 
        u.user_id   AS id,
        u.name,
        u.gender,
        u.age,
        u.role,
        u.email,
        u.status,
        u.password_hash
      FROM users u
      WHERE u.email = $1
    `, [email]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async checkUserExists(email) {
    const result = await query('SELECT user_id FROM users WHERE email = $1', [email]);
    return result.rows.length > 0;
  }

  async updateUser(userId, userData) {
    const { name, gender, age } = userData;
    
    // Validate userId exists
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount}`);
      updateValues.push(name);
      paramCount++;
    }
    if (gender !== undefined) {
      updateFields.push(`gender = $${paramCount}`);
      updateValues.push(gender);
      paramCount++;
    }
    if (age !== undefined) {
      updateFields.push(`age = $${paramCount}`);
      updateValues.push(age);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return; // Nothing to update
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(userId);
    
    try {
      const result = await query(`
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE user_id = $${paramCount}
      `, updateValues);
      
      if (result.rowCount === 0) {
        throw new Error('User not found or no changes made');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateStudentData(userId, studentData) {
    const { intakeYear, major } = studentData;
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (intakeYear !== undefined) {
      updateFields.push(`intake_year = $${paramCount}`);
      updateValues.push(intakeYear);
      paramCount++;
    }
    if (major !== undefined) {
      updateFields.push(`major = $${paramCount}`);
      updateValues.push(major);
      paramCount++;
    }

    if (updateFields.length > 0) {
      updateValues.push(userId);
      await query(`
        UPDATE students 
        SET ${updateFields.join(', ')}
        WHERE user_id = $${paramCount}
      `, updateValues);
    }
  }

  async updateMedicalStaffData(userId, medicalData) {
    const { specialty } = medicalData;
    if (specialty !== undefined) {
      await query(`
        UPDATE medical_staff 
        SET specialty = $1
        WHERE user_id = $2
      `, [specialty, userId]);
    }
  }

  async verifyPassword(userId, password) {
    const userResult = await query(`
      SELECT password_hash FROM users WHERE user_id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];
    return await bcrypt.compare(password, user.password_hash);
  }

  // New method for authentication
  async verifyPasswordByEmail(email, password) {
    const userResult = await query(`
      SELECT password_hash FROM users WHERE email = $1
    `, [email]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];
    return await bcrypt.compare(password, user.password_hash);
  }

  async updatePassword(userId, newPasswordHash) {
    await query(`
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
    `, [newPasswordHash, userId]);
  }

  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }
}

module.exports = new UserService();