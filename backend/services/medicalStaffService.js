const { query } = require('../config/database');
const BaseService = require('./baseService');
const userService = require('./userService');

class MedicalStaffService extends BaseService {
  // Get medical staff profile by user ID
  async getMedicalStaffProfile(userId) {
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    if (user.role !== 'medical_staff') {
      throw new Error('Access denied: User is not medical staff');
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
      const { name, gender, age, specialty } = profileData;
      
      // Update basic user data if provided
      if (name !== undefined || gender !== undefined || age !== undefined) {
        await userService.updateUser(userId, { name, gender, age });
      }

      // Update specialty if provided
      if (specialty !== undefined) {
        await userService.updateMedicalStaffData(userId, { specialty });
      }

      // Return updated profile
      return await userService.getUserById(userId);
    });
  }

  // Get all student profiles for medical staff to view
  async getAllStudentProfiles() {
    const result = await query(`
      SELECT 
        u.user_id AS id,
        u.name,
        u.gender,
        u.age,
        u.email,
        u.status,
        u.points,
        u.created_at,
        u.updated_at,
        s.intake_year,
        s.major
      FROM users u
      INNER JOIN students s ON u.user_id = s.user_id
      WHERE u.role = 'student'
      ORDER BY u.name ASC
    `);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      gender: row.gender,
      age: row.age,
      email: row.email,
      status: row.status,
      points: row.points,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      intakeYear: row.intake_year,
      major: row.major,
      role: 'student'
    }));
  }

  // Get specific student profile by ID
  async getStudentProfile(studentId) {
    const result = await query(`
      SELECT 
        u.user_id AS id,
        u.name,
        u.gender,
        u.age,
        u.email,
        u.status,
        u.points,
        u.created_at,
        u.updated_at,
        s.intake_year,
        s.major
      FROM users u
      INNER JOIN students s ON u.user_id = s.user_id
      WHERE u.user_id = $1 AND u.role = 'student'
    `, [studentId]);

    if (result.rows.length === 0) {
      throw new Error('Student not found');
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      gender: row.gender,
      age: row.age,
      email: row.email,
      status: row.status,
      points: row.points,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      intakeYear: row.intake_year,
      major: row.major,
      role: 'student'
    };
  }

  // Validate if user is medical staff
  async validateMedicalStaff(userId) {
    const user = await userService.getUserById(userId);
    return user && user.role === 'medical_staff';
  }
}

module.exports = new MedicalStaffService();