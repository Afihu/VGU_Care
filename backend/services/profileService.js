const userService = require('./userService');
const { pool } = require('../config/database');

class ProfileService {
  async getProfile(userId) {
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateProfile(userId, profileData) {
    this._validateProfileData(profileData);
    
    const { name, gender, age, roleSpecificData } = profileData;
    
    // Get current user to know their role
    const currentUser = await userService.getUserById(userId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update basic user data
      if (name !== undefined || gender !== undefined || age !== undefined) {
        await userService.updateUser(userId, { name, gender, age });
      }

      // Update role-specific data
      if (roleSpecificData) {
        if (currentUser.role === 'student') {
          await userService.updateStudentData(userId, roleSpecificData);
        } else if (currentUser.role === 'medical_staff') {
          await userService.updateMedicalStaffData(userId, roleSpecificData);
        }
      }

      await client.query('COMMIT');
      
      // Return updated profile
      return await userService.getUserById(userId);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    // Validate passwords
    this._validatePasswordData(currentPassword, newPassword);
    
    // Verify current password
    const isValidPassword = await userService.verifyPassword(userId, currentPassword);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash and update new password
    const newPasswordHash = await userService.hashPassword(newPassword);
    await userService.updatePassword(userId, newPasswordHash);
    
    return true;
  }

  _validateProfileData(profileData) {
    const { name, gender, age, roleSpecificData } = profileData;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      throw new Error('Name must be a non-empty string');
    }

    if (gender !== undefined && !['male', 'female', 'other'].includes(gender)) {
      throw new Error('Gender must be male, female, or other');
    }

    if (age !== undefined && (!Number.isInteger(age) || age < 1 || age > 120)) {
      throw new Error('Age must be a valid integer between 1 and 120');
    }

    if (roleSpecificData) {
      this._validateRoleSpecificData(roleSpecificData);
    }
  }

  _validateRoleSpecificData(roleSpecificData) {
    if (roleSpecificData.intakeYear !== undefined) {
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(roleSpecificData.intakeYear) || 
          roleSpecificData.intakeYear < 2000 || 
          roleSpecificData.intakeYear > currentYear + 1) {
        throw new Error('Intake year must be a valid year between 2000 and next year');
      }
    }

    if (roleSpecificData.major !== undefined && 
        (typeof roleSpecificData.major !== 'string' || roleSpecificData.major.trim().length === 0)) {
      throw new Error('Major must be a non-empty string');
    }

    if (roleSpecificData.specialty !== undefined && 
        (typeof roleSpecificData.specialty !== 'string' || roleSpecificData.specialty.trim().length === 0)) {
      throw new Error('Specialty must be a non-empty string');
    }
  }

  _validatePasswordData(currentPassword, newPassword) {
    if (!currentPassword || typeof currentPassword !== 'string') {
      throw new Error('Current password is required');
    }

    if (!newPassword || typeof newPassword !== 'string') {
      throw new Error('New password is required');
    }

    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      throw new Error('New password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
  }
}

module.exports = new ProfileService();