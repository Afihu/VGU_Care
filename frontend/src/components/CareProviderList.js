// components/CareProviderList.js
import React, { useEffect, useState } from 'react';
import { getAllMedicalStaff } from '../services/medicalStaffService';
import '../css/RequestAppointment.css';

export default function CareProviderList() {
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await getAllMedicalStaff();
        if (data?.success && data.medicalStaff) {
          setProviders(data.medicalStaff);
        } else {
          console.warn('Failed to fetch medical staff.');
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
      }
    };

    fetchProviders();
  }, []);

  return (
    <div className="entry-table">
      <label><b>Available Care Providers</b></label>
      {providers.length === 0 ? (
        <p>No care providers available at the moment.</p>
      ) : (
        providers.map((provider, index) => (
          <div className="entry-card" key={index}>
            <p><strong>Name:</strong> {provider.name}</p>
            <p><strong>Position:</strong> Medical Staff</p>
            <p><strong>Speciality:</strong> {provider.specialty}</p>
            <p><strong>ID:</strong> {provider.staff_id}</p>
          </div>
        ))
      )}
    </div>
  );
}
