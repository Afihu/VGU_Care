const { query } = require('../config/database');
const BaseService = require('./baseService');
const userService = require('./userService');
const UserQueryBuilder = require('../utils/userQueryBuilder');

class MedicalStaffService extends BaseService {  // Get medical staff profile by user ID (admin can access any medical staff profile)
  async getMedicalStaffProfile(userId, requestingUserRole = null) {
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Allow access if the user is medical staff OR if an admin is requesting
    if (user.role !== 'medical_staff' && requestingUserRole !== 'admin') {
      throw new Error('Access denied: User is not medical staff');
    }
    
    // If user is not medical staff but admin is requesting, 
    // we need to find a medical staff profile to return
    if (user.role !== 'medical_staff' && requestingUserRole === 'admin') {
      throw new Error('Requested user is not medical staff');
    }
    
    // Fetch staff_id from medical_staff table
    const staffResult = await query('SELECT staff_id FROM medical_staff WHERE user_id = $1', [userId]);
    if (staffResult.rows.length > 0) {
      user.staff_id = staffResult.rows[0].staff_id;
    } else {
      user.staff_id = null;
    }
    return user;
  }
  // Update medical staff profile
  async updateMedicalStaffProfile(userId, profileData) {
    // Verify user is medical staff
    const currentUser = await userService.getUserById(userId);
    if (!currentUser || currentUser.role !== 'medical_staff') {
      throw new Error('Access denied: User is not medical staff');
    }

    return await this.withTransaction(async (client) => {
      const { name, gender, age, specialty, shiftSchedule } = profileData;
      
      // Update basic user data if provided
      if (name !== undefined || gender !== undefined || age !== undefined) {
        await userService.updateUser(userId, { name, gender, age });
      }

      // Update medical staff specific data if provided
      if (specialty !== undefined || shiftSchedule !== undefined) {
        await userService.updateMedicalStaffData(userId, { specialty, shiftSchedule });
      }

      // Return updated profile
      return await userService.getUserById(userId);
    });
  }  // Get all student profiles for medical staff to view
  async getAllStudentProfiles() {
    const result = await query(UserQueryBuilder.buildStudentsOnlyQuery());
    return UserQueryBuilder.transformUserRows(result.rows);
  }

  // Get specific student profile by ID
  async getStudentProfile(studentId) {
    const result = await query(UserQueryBuilder.buildSingleUserQuery(), [studentId]);

    if (result.rows.length === 0 || result.rows[0].role !== 'student') {
      throw new Error('Student not found');
    }

    return UserQueryBuilder.transformUserRow(result.rows[0]);
  }

  // Validate if user is medical staff
  async validateMedicalStaff(userId) {
    const user = await userService.getUserById(userId);
    return user && user.role === 'medical_staff';
  }

  // Get available medical staff for auto-assignment based on shift schedules
  async getAvailableMedicalStaff(dayOfWeek, timeSlot) {
    const result = await query(`
      SELECT 
        m.staff_id,
        u.user_id,
        u.name,
        m.specialty,
        m.shift_schedule
      FROM medical_staff m
      INNER JOIN users u ON m.user_id = u.user_id
      WHERE u.status = 'active'
    `);

    const availableStaff = [];
    for (const staff of result.rows) {
      const schedule = staff.shift_schedule;
      const dayName = this.getDayName(dayOfWeek);
      
      if (schedule[dayName]) {
        const dayShifts = schedule[dayName];
        for (const shift of dayShifts) {
          if (this.isTimeInShift(timeSlot, shift)) {
            availableStaff.push({
              staffId: staff.staff_id,
              userId: staff.user_id,
              name: staff.name,
              specialty: staff.specialty
            });
            break; // Found a matching shift, no need to check other shifts for this day
          }
        }
      }
    }

    return availableStaff;
  }

  // Helper method to convert day number to day name
  getDayName(dayOfWeek) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayOfWeek];
  }

  // Helper method to check if a time slot is within a shift
  isTimeInShift(timeSlot, shift) {
    const [shiftStart, shiftEnd] = shift.split('-');
    return timeSlot >= shiftStart && timeSlot <= shiftEnd;
  }

  // Get all medical staff with their schedules
  async getAllMedicalStaffWithSchedules() {
    const result = await query(`
      SELECT 
        u.user_id AS id,
        u.name,
        u.gender,
        u.age,
        u.email,
        u.status,
        u.created_at,
        u.updated_at,
        m.staff_id,
        m.specialty,
        m.shift_schedule
      FROM users u
      INNER JOIN medical_staff m ON u.user_id = m.user_id
      WHERE u.role = 'medical_staff'
      ORDER BY u.name ASC
    `);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      gender: row.gender,
      age: row.age,
      email: row.email,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      staffId: row.staff_id,
      specialty: row.specialty,
      shiftSchedule: row.shift_schedule,
      role: 'medical_staff'
    }));
  }

  // Get all medical staff (for admin access)
  async getAllMedicalStaff() {
    const result = await query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        m.staff_id,
        m.specialty
      FROM users u
      INNER JOIN medical_staff m ON u.user_id = m.user_id
      WHERE u.role = 'medical_staff'
      ORDER BY u.name ASC
    `);

    return result.rows;
  }
}

module.exports = new MedicalStaffService();