import React from 'react';
import greens from '../assets/images/Healthy_Greens.jpg';
import '../css/AppointmentView.css';
import api from '../services/api';
import helpers from '../utils/helpers';

export default function AppointmentView() {

  const userInfo = localStorage.getItem('session-info');
  const parsed = helpers.JSONparser(userInfo);
  const userToken = parsed.token;
  
  const handleAppointmentRetrieve = async (token) => {
  
    const response = await api.appointmentRetrieveService(token); 
    const data = await response.json();
    
    return data;
  }

  async function testHandle() { //only used for testing 
    console.trace("Call stack for testHandle()"); 
    try {
      const appointmentData = await handleAppointmentRetrieve(userToken);
      console.log(appointmentData);
    } catch (error) {
      console.log(error);
    }
  }
  testHandle();
    
  

  return (
    <div className="appointment-view">
      {/* Title Box */}
      <div className="appointment-title-box">
        MY APPOINTMENTS
      </div>

      {/* Status boxes and image side by side */}
      <div className="appointment-content">

        {/* Status boxes */}
        <div className="appointment-status-buttons">
          <button type="button" className="appointment-button button-all">
            ALL
          </button>

          <button type="button" className="appointment-button button-approved">
            APPROVED
          </button>

          <button type="button" className="appointment-button button-pending">
            PENDING
          </button>

          <button type="button" className="appointment-button button-rejected">
            REJECTED
          </button>
        </div>

        {/* Image on the right */}
        <img
          src={greens}
          alt="Healthy Greens"
          className="appointment-image"
        />
      </div>
    </div>
  );
}
