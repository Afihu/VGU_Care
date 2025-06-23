// services/medicalStaffService.js
import apiCall from './apiCall'; // wrapper with token & headers

export const getAllMedicalStaff = async () => {
  const response = await apiCall('/admin/users/medical-staff');
  return response.json(); // returns { success: true, medicalStaff: [...] }
};
