const bcrypt = require('bcrypt');
const { query } = require('../config/database');
const BaseService = require('./baseService');
const UserQueryBuilder = require('../utils/userQueryBuilder');

class UserService extends BaseService {

  async getUserById(userId) {
    const result = await query(UserQueryBuilder.buildSingleUserQuery(), [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return UserQueryBuilder.transformUserRow(result.rows[0]);
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
    const { intakeYear, major, housingLocation } = studentData;
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
    if (housingLocation !== undefined) {
      updateFields.push(`housing_location = $${paramCount}`);
      updateValues.push(housingLocation);
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
    const { specialty, shiftSchedule } = medicalData;
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (specialty !== undefined) {
      updateFields.push(`specialty = $${paramCount}`);
      updateValues.push(specialty);
      paramCount++;
    }
    if (shiftSchedule !== undefined) {
      updateFields.push(`shift_schedule = $${paramCount}`);
      updateValues.push(JSON.stringify(shiftSchedule));
      paramCount++;
    }

    if (updateFields.length > 0) {
      updateValues.push(userId);
      await query(`
        UPDATE medical_staff 
        SET ${updateFields.join(', ')}
        WHERE user_id = $${paramCount}
      `, updateValues);
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

  async getUsersByRole(role) {
    if (role === 'student') {
      const result = await query(UserQueryBuilder.buildStudentsOnlyQuery());
      return result.rows.map(row => UserQueryBuilder.transformUserRow(row));
    } else if (role === 'medical_staff') {
      const result = await query(UserQueryBuilder.buildMedicalStaffOnlyQuery());
      return result.rows.map(row => UserQueryBuilder.transformUserRow(row));
    } else {
      throw new Error(`Unsupported role: ${role}`);
    }
  }
}

module.exports = new UserService();