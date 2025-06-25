const userService = require('./userService');
const BaseService = require('./baseService');

class ProfileService extends BaseService {
  async getProfile(userId) {
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateProfile(userId, profileData) {
    this._validateProfileData(profileData);
    
    const { name, gender, age, address, roleSpecificData } = profileData;
    
    // Get current user to know their role
    const currentUser = await userService.getUserById(userId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Use BaseService transaction method
    return await this.withTransaction(async (client) => {
      // Update basic user data
      if (name !== undefined || gender !== undefined || age !== undefined) {
        await userService.updateUser(userId, { name, gender, age });
      }

      // Add address validation
      if (address !== undefined && !['dorm_1', 'dorm_2', 'off_campus'].includes(address)) {
        throw new Error('Address must be dorm_1, dorm_2, or off_campus');
      }
      
      // Update role-specific data
      if (roleSpecificData) {
        if (currentUser.role === 'student' && address !== undefined) {
          const updatedRoleData = { ...roleSpecificData, housingLocation: address };
          await userService.updateStudentData(userId, updatedRoleData);
        } else if (currentUser.role === 'medical_staff') {
          await userService.updateMedicalStaffData(userId, roleSpecificData);
        }
      }

      // Return updated profile
      return await userService.getUserById(userId);
    });
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

    if (roleSpecificData.housingLocation !== undefined && 
        !['dorm_1', 'dorm_2', 'off_campus'].includes(roleSpecificData.housingLocation)) {
      throw new Error('Housing location must be dorm_1, dorm_2, or off_campus');
    }

    if (roleSpecificData.specialty !== undefined && 
        (typeof roleSpecificData.specialty !== 'string' || roleSpecificData.specialty.trim().length === 0)) {
      throw new Error('Specialty must be a non-empty string');
    }

    if (roleSpecificData.shiftSchedule !== undefined) {
      this._validateShiftSchedule(roleSpecificData.shiftSchedule);
    }
  }

  _validateShiftSchedule(shiftSchedule) {
    if (typeof shiftSchedule !== 'object' || shiftSchedule === null) {
      throw new Error('Shift schedule must be an object');
    }

    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    for (const [day, shifts] of Object.entries(shiftSchedule)) {
      if (!validDays.includes(day.toLowerCase())) {
        throw new Error(`Invalid day: ${day}. Must be one of: ${validDays.join(', ')}`);
      }

      if (!Array.isArray(shifts)) {
        throw new Error(`Shifts for ${day} must be an array`);
      }

      for (const shift of shifts) {
        if (typeof shift !== 'string') {
          throw new Error(`Each shift must be a string in format "HH:MM-HH:MM"`);
        }

        const [startTime, endTime] = shift.split('-');
        if (!startTime || !endTime || !timeRegex.test(startTime) || !timeRegex.test(endTime)) {
          throw new Error(`Invalid shift format: ${shift}. Must be "HH:MM-HH:MM"`);
        }

        // Validate that start time is before end time
        const [startHour, startMin] = startTime.split(':').map(Number);        const [endHour, endMin] = endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (startMinutes >= endMinutes) {
          throw new Error(`Invalid shift: ${shift}. Start time must be before end time`);
        }
      }
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