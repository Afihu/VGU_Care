/**
 * Query Builder for User Profile Operations
 * Centralizes common user profile queries to reduce duplication
 */

class UserQueryBuilder {
  /**
   * Base user profile SELECT clause with all common fields
   */
  static get baseUserFields() {
    return `
      u.user_id AS id,
      u.name,
      u.gender,
      u.age,
      u.email,
      u.status,
      u.points,
      u.created_at,
      u.updated_at,
      u.role
    `;
  }

  /**
   * Student-specific fields
   */
  static get studentFields() {
    return `
      s.intake_year,
      s.major,
      s.housing_location
    `;
  }

  /**
   * Medical staff-specific fields
   */
  static get medicalStaffFields() {
    return `
      m.staff_id,
      m.specialty,
      m.shift_schedule
    `;
  }

  /**
   * Build complete user profile query with role-specific joins
   * @param {string} roleFilter - Filter by role ('student', 'medical_staff', 'admin', or null for all)
   * @param {string} orderBy - Order by clause (default: 'u.name ASC')
   * @returns {string} Complete SQL query
   */
  static buildUserProfileQuery(roleFilter = null, orderBy = 'u.name ASC') {
    let query = `
      SELECT 
        ${this.baseUserFields},
        ${this.studentFields},
        ${this.medicalStaffFields},
        a.admin_id AS is_admin
      FROM users u
      LEFT JOIN students s ON u.user_id = s.user_id
      LEFT JOIN medical_staff m ON u.user_id = m.user_id
      LEFT JOIN admins a ON u.user_id = a.user_id
    `;

    if (roleFilter) {
      query += ` WHERE u.role = $1`;
    }

    query += ` ORDER BY ${orderBy}`;

    return query;
  }

  /**
   * Build query for single user by ID
   * @returns {string} SQL query for single user
   */
  static buildSingleUserQuery() {
    return `
      SELECT 
        ${this.baseUserFields},
        ${this.studentFields},
        ${this.medicalStaffFields},
        a.admin_id AS is_admin
      FROM users u
      LEFT JOIN students s ON u.user_id = s.user_id
      LEFT JOIN medical_staff m ON u.user_id = m.user_id
      LEFT JOIN admins a ON u.user_id = a.user_id
      WHERE u.user_id = $1
    `;
  }

  /**
   * Build query for students only with INNER JOIN for performance
   * @param {string} orderBy - Order by clause
   * @returns {string} SQL query for students
   */
  static buildStudentsOnlyQuery(orderBy = 'u.name ASC') {
    return `
      SELECT 
        ${this.baseUserFields},
        ${this.studentFields}
      FROM users u
      INNER JOIN students s ON u.user_id = s.user_id
      WHERE u.role = 'student'
      ORDER BY ${orderBy}
    `;
  }

  /**
   * Build query for medical staff only with INNER JOIN for performance
   * @param {string} orderBy - Order by clause
   * @returns {string} SQL query for medical staff
   */
  static buildMedicalStaffOnlyQuery(orderBy = 'u.name ASC') {
    return `
      SELECT 
        ${this.baseUserFields},
        ${this.medicalStaffFields}
      FROM users u
      INNER JOIN medical_staff m ON u.user_id = m.user_id
      WHERE u.role = 'medical_staff'
      ORDER BY ${orderBy}
    `;
  }

  /**
   * Transform database row to user object with role-specific data
   * @param {Object} row - Database row
   * @returns {Object} Formatted user object
   */
  static transformUserRow(row) {
    const user = {
      id: row.id,
      name: row.name,
      gender: row.gender,
      age: row.age,
      email: row.email,
      status: row.status,
      points: row.points,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    // Add role-specific data
    if (row.role === 'student' && row.intake_year) {
      user.intakeYear = row.intake_year;
      user.major = row.major;
      user.housingLocation = row.housing_location;
    }

    if (row.role === 'medical_staff' && row.staff_id) {
      user.staffId = row.staff_id;
      user.specialty = row.specialty;
      user.shiftSchedule = row.shift_schedule;
    }

    if (row.role === 'admin' && row.is_admin) {
      user.isAdmin = !!row.is_admin;
    }

    return user;
  }

  /**
   * Transform multiple database rows to user objects
   * @param {Array} rows - Array of database rows
   * @returns {Array} Array of formatted user objects
   */
  static transformUserRows(rows) {
    return rows.map(row => this.transformUserRow(row));
  }
}

module.exports = UserQueryBuilder;
