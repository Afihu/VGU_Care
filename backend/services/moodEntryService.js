const { query } = require("../config/database");

class MoodEntryService {
  async createMoodEntry(userId, mood, notes = null) {
    const result = await query(
      `INSERT INTO mood_entries (user_id, mood, notes)
       VALUES ($1, $2, $3)
       RETURNING entry_id as "id", user_id, mood, entry_date, notes`,
      [userId, mood, notes]
    );
    return result.rows[0];
  }

  async getMoodEntriesByUser(userId) {
    const result = await query(
      `SELECT entry_id as "id", user_id, mood, entry_date, notes
       FROM mood_entries
       WHERE user_id = $1
       ORDER BY entry_date DESC`,
      [userId]
    );
    return result.rows;
  }

  async updateMoodEntry(entryId, userId, updates) {
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
    values.push(userId);

    const result = await query(
      `UPDATE mood_entries SET ${fields.join(", ")}
       WHERE entry_id = $${idx++} AND user_id = $${idx}
       RETURNING entry_id as "id", user_id, mood, entry_date, notes`,
      values
    );
    if (result.rows.length === 0) {
      throw new Error("Mood entry not found or not owned by user");
    }
    return result.rows[0];
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
