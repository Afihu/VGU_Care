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
    
    localStorage.setItem('user-appointments', JSON.stringify(data));
    
  }

  handleAppointmentRetrieve(userToken);
  console.log(JSON.parse(localStorage.getItem('user-appointments')));  

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

  // const testHandle = () => { //only used for testing 
  //   try {
  //     handleAppointmentRetrieve(userToken);
  //   } catch (error) {
  //     console.log(error);   
  //   }
  // }
  // testHandle();