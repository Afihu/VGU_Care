// components/CareProviderList.js
import React, { useEffect, useState } from 'react';
import '../css/RequestAppointment.css';
import api from '../services/api';

export default function CareProviderList() {
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const sessionInfo = JSON.parse(localStorage.getItem('session-info'));
        const token = sessionInfo?.token;

        if (!token) {
          console.warn('No token found');
          return;
        }

        const response = await api.getMedicalStaffProfile(token);
        const data = await response.json();

        if (data.success && data.user) {
          setProviders([data.user]);
        } else {
          console.warn('Invalid medical staff profile response');
        }
      } catch (error) {
        console.error('Error fetching provider:', error);
      }
    };

    fetchProfile();
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
            <p><strong>Specialty:</strong> {provider.specialty}</p>
            <p><strong>Email:</strong> {provider.email}</p>
          </div>
        ))
      )}
    </div>
  );
}