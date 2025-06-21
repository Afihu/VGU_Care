import React from 'react';
import greens from '../assets/images/Healthy_Greens.jpg';
import '../css/AppointmentView.css';
import api from '../services/api';
import helpers from '../utils/helpers';

export default function AppointmentView() {
  const userInfo = localStorage.getItem('session-info');
  const parsed = helpers.JSONparser(userInfo);
  console.log("first");
  

  if(parsed != null){
    const userToken = parsed.token;
    const AppointmentsJSON = api.appointmentRetrieveService(userToken);
    
    const AppointmentParsed = helpers.JSONparser(AppointmentsJSON);
    console.log(AppointmentParsed);
    
  } 

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
