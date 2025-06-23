import React, { useState, useEffect } from 'react';
import greens from '../assets/images/Healthy_Greens.jpg';
import '../css/AppointmentView.css';
import api from '../services/api';
import helpers from '../utils/helpers';
import AppointmentList from '../components/AppointmentList';

export default function AppointmentView() {

  // variables for session info
  const userInfo = localStorage.getItem('session-info');
  const parsed = helpers.JSONparser(userInfo);
  const userToken = parsed.token;
  const [userAppointments, setUserAppointments] = useState([]);

  const handleAppointmentRetrieve = async (token) => {
    const response = await api.appointmentRetrieveService(token); 
    const data = await response.json(); 
    return data;
  }

  // handleAppointmentRetrieve(userToken);

  useEffect(() => {
    const fetchUserAppointments = async() => {
      try {
        let data = await handleAppointmentRetrieve(userToken);
        data = Object.entries(data.appointments).map(item => item[1]);
        setUserAppointments(data);
      } catch (error) {
        console.error("Failed to fetch appointments: ", error);
      }
    }
    fetchUserAppointments();
  }, []);

  useEffect(() => {
    console.log("appointmnrnt: ", userAppointments);
  })


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
        {/* <img
          src={greens}
          alt="Healthy Greens"
          className="appointment-image"
        />       */}
        <AppointmentList userAppointments={userAppointments} />
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