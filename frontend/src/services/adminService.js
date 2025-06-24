// services/adminService.js
import apiCall from './api'; // wrapper with token & headers

// ==================== USER MANAGEMENT ====================

/**
 * Get all students with their profiles
 * Admin privilege: View all student profiles
 */
export const getAllStudents = async () => {
  const response = await apiCall('/admin/users/students');
  return response; // apiCall already returns parsed JSON
};

/**
 * Get all medical staff with their profiles
 * Admin privilege: View all medical staff profiles
 */
export const getAllMedicalStaff = async () => {
  const response = await apiCall('/admin/users/medical-staff');
  return response; // apiCall already returns parsed JSON
};

/**
 * Update user role
 * Admin privilege: Manage user roles and permissions
 */
export const updateUserRole = async (userId, role, roleSpecificData = {}) => {
  const response = await apiCall(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role, roleSpecificData })
  });
  return response;
};

/**
 * Update user status (active/inactive/banned)
 * Admin privilege: Manage user permissions
 */
export const updateUserStatus = async (userId, status) => {
  const response = await apiCall(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  return response;
};

/**
 * Update user name
 * Admin privilege: Update user information
 */
export const updateUserName = async (userId, name) => {
  const response = await apiCall(`/admin/users/${userId}/name`, {
    method: 'PATCH',
    body: JSON.stringify({ name })
  });
  return response;
};

// ==================== APPOINTMENT MANAGEMENT ====================

/**
 * Get all appointments across all users
 * Admin privilege: View appointments for all students
 */
export const getAllAppointments = async () => {
  const response = await apiCall('/admin/appointments');
  return response;
};

/**
 * Create appointment for a specific user
 * Admin privilege: Create appointments for all students
 */
export const createAppointmentForUser = async (userId, appointmentData) => {
  const response = await apiCall(`/admin/appointments/users/${userId}`, {
    method: 'POST',
    body: JSON.stringify(appointmentData)
  });
  return response;
};

/**
 * Update any appointment
 * Admin privilege: Update appointments for all students
 */
export const updateAppointment = async (appointmentId, updateData) => {
  const response = await apiCall(`/admin/appointments/${appointmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData)
  });
  return response;
};

// ==================== MOOD TRACKER MANAGEMENT ====================

/**
 * Get all mood entries across all users
 * Admin privilege: View mood tracker entries for all students
 */
export const getAllMoodEntries = async () => {
  const response = await apiCall('/admin/mood-entries');
  return response;
};

/**
 * Create mood entry for a specific user
 * Admin privilege: Create mood tracker entries for all students
 */
export const createMoodEntryForUser = async (userId, moodData) => {
  const response = await apiCall(`/admin/mood-entries/users/${userId}`, {
    method: 'POST',
    body: JSON.stringify(moodData)
  });
  return response;
};

/**
 * Update any mood entry
 * Admin privilege: Update mood tracker entries for all students
 */
export const updateMoodEntry = async (entryId, updateData) => {
  const response = await apiCall(`/admin/mood-entries/${entryId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData)
  });
  return response;
};

// ==================== TEMPORARY ADVICE MANAGEMENT ====================

/**
 * Get all temporary advice
 * Admin privilege: View temporary advice for all students
 */
export const getAllTemporaryAdvice = async () => {
  const response = await apiCall('/admin/temporary-advice');
  return response;
};

/**
 * Create temporary advice for an appointment
 * Admin privilege: Create temporary advice for all students
 */
export const createTemporaryAdvice = async (appointmentId, adviceData) => {
  const response = await apiCall(`/admin/temporary-advice/appointments/${appointmentId}`, {
    method: 'POST',
    body: JSON.stringify(adviceData)
  });
  return response;
};

/**
 * Update temporary advice
 * Admin privilege: Update temporary advice for all students
 */
export const updateTemporaryAdvice = async (adviceId, updateData) => {
  const response = await apiCall(`/admin/temporary-advice/${adviceId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData)
  });
  return response;
};

/**
 * Delete temporary advice
 * Admin privilege: Delete temporary advice for all students
 */
export const deleteTemporaryAdvice = async (adviceId) => {
  const response = await apiCall(`/admin/temporary-advice/${adviceId}`, {
    method: 'DELETE'
  });
  return response;
};

// ==================== ABUSE REPORTS MANAGEMENT ====================

/**
 * Get all abuse reports
 * Admin privilege: View abuse reports for all users
 */
export const getAllAbuseReports = async () => {
  const response = await apiCall('/admin/abuse-reports');
  return response;
};

/**
 * Create abuse report
 * Admin privilege: Create abuse reports for all users
 */
export const createAbuseReport = async (reportData) => {
  const response = await apiCall('/admin/abuse-reports', {
    method: 'POST',
    body: JSON.stringify(reportData)
  });
  return response;
};

/**
 * Update abuse report
 * Admin privilege: Update abuse reports for all users
 */
export const updateAbuseReport = async (reportId, updateData) => {
  const response = await apiCall(`/admin/abuse-reports/${reportId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData)
  });
  return response;
};

/**
 * Delete abuse report
 * Admin privilege: Delete abuse reports for all users
 */
export const deleteAbuseReport = async (reportId) => {
  const response = await apiCall(`/admin/abuse-reports/${reportId}`, {
    method: 'DELETE'
  });
  return response;
};

// ==================== BLACKOUT DATE MANAGEMENT ====================

/**
 * Get all blackout dates
 * Admin privilege: View all blackout dates
 */
export const getBlackoutDates = async (queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  const url = `/admin/blackout-dates${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiCall(url);
  return response;
};

/**
 * Add blackout date
 * Admin privilege: Add blackout dates to prevent appointment booking
 */
export const addBlackoutDate = async (dateData) => {
  const response = await apiCall('/admin/blackout-dates', {
    method: 'POST',
    body: JSON.stringify(dateData)
  });
  return response;
};

/**
 * Remove blackout date
 * Admin privilege: Remove blackout dates to restore appointment booking
 */
export const removeBlackoutDate = async (date) => {
  const response = await apiCall(`/admin/blackout-dates/${date}`, {
    method: 'DELETE'
  });
  return response;
};
