const { query } = require("../config/database");

class MoodEntryService {  async createMoodEntry(userId, mood, notes = null) {
    // First get the student_id from user_id
    const studentResult = await query(
      `SELECT student_id FROM students WHERE user_id = $1`,
      [userId]
    );
    
    if (studentResult.rows.length === 0) {
      throw new Error('Student not found for user');
    }
    
    const studentId = studentResult.rows[0].student_id;
    
    const result = await query(
      `INSERT INTO mood_entries (student_id, mood, notes)
       VALUES ($1, $2, $3)
       RETURNING entry_id as "id", student_id, mood, entry_date, notes`,
      [studentId, mood, notes]
    );
    
    // Return user_id instead of student_id for API consistency
    const entry = result.rows[0];
    entry.user_id = userId;
    delete entry.student_id;
    return entry;
  }  async getMoodEntriesByUser(userId) {
    // First get the student_id from user_id
    const studentResult = await query(
      `SELECT student_id FROM students WHERE user_id = $1`,
      [userId]
    );
    
    if (studentResult.rows.length === 0) {
      throw new Error('Student not found for user');
    }
    
    const studentId = studentResult.rows[0].student_id;
    
    const result = await query(
      `SELECT entry_id as "id", student_id, mood, entry_date, notes
       FROM mood_entries
       WHERE student_id = $1
       ORDER BY entry_date DESC`,
      [studentId]
    );
    
    // Return user_id instead of student_id for API consistency
    return result.rows.map(entry => {
      entry.user_id = userId;
      delete entry.student_id;
      return entry;
    });
  }
  async updateMoodEntry(entryId, userId, updates) {
    // First get the student_id from user_id
    const studentResult = await query(
      `SELECT student_id FROM students WHERE user_id = $1`,
      [userId]
    );
    
    if (studentResult.rows.length === 0) {
      throw new Error('Student not found for user');
    }
    
    const studentId = studentResult.rows[0].student_id;
    
    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.mood !== undefined) {
      fields.push(`mood = $${idx++}`);
      values.push(updates.mood);
    }
    if (updates.notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(updates.notes);
    }
    if (fields.length === 0) {
      throw new Error("No valid fields to update");
    }
    values.push(entryId);
    values.push(studentId);    const result = await query(
      `UPDATE mood_entries SET ${fields.join(", ")}
       WHERE entry_id = $${idx++} AND student_id = $${idx}
       RETURNING entry_id as "id", student_id, mood, entry_date, notes`,
      values
    );
    if (result.rows.length === 0) {
      throw new Error("Mood entry not found or not owned by user");
    }
    
    // Return user_id instead of student_id for API consistency
    const entry = result.rows[0];
    entry.user_id = userId;
    delete entry.student_id;
    return entry;
  }
  
  async deleteMoodEntry(entryId, userId) {
    // First get the student_id from user_id
    const studentResult = await query(
      `SELECT student_id FROM students WHERE user_id = $1`,
      [userId]
    );
    
    if (studentResult.rows.length === 0) {
      throw new Error('Student not found for user');
    }
    
    const studentId = studentResult.rows[0].student_id;
    
    const result = await query(
      `DELETE FROM mood_entries 
       WHERE entry_id = $1 AND student_id = $2
       RETURNING entry_id`,
      [entryId, studentId]
    );
    
    return result.rows.length > 0;
  }

  // Check if a medical staff has an appointment with a student (by userId)
  async staffHasAppointmentWithStudent(staffUserId, studentUserId) {
    // Get staff_id from user_id
    const staffResult = await query(
      'SELECT staff_id FROM medical_staff WHERE user_id = $1',
      [staffUserId]
    );
    if (staffResult.rows.length === 0) return false;
    const staffId = staffResult.rows[0].staff_id;
    // Check for any appointment between this staff and student
    const apptResult = await query(
      'SELECT 1 FROM appointments WHERE user_id = $1 AND medical_staff_id = $2 LIMIT 1',
      [studentUserId, staffId]
    );
    return apptResult.rows.length > 0;
  }
}

module.exports = new MoodEntryService();
