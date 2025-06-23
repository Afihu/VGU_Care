// services/moodService.js
import apiCall from './apiCall';

export const getMoodEntries = async () => {
  const response = await apiCall('/admin/mood-entries'); // for admin role
  return await response.json();
};
