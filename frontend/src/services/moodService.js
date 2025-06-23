// services/moodService.js
import apiCall from './apiCall';

export const getMoodEntries = async () => {
  //const response = await apiCall('/mood'); // for admin role
  //return await response.json();
  return await apiCall('/mood');
};
