import React, { useState, useEffect } from 'react';
import greens from '../assets/images/Healthy_Greens.jpg';
import '../css/AppointmentView.css';
import api from '../services/api';
import helpers from '../utils/helpers';
import AppointmentList from '../components/AppointmentList';
import Modal from '../components/Modal.js';

export default function AppointmentView() {

  // variables for session info
  const userInfo = localStorage.getItem('session-info');
  const parsed = helpers.JSONparser(userInfo);
  const userToken = parsed.token;
  const [userAppointments, setUserAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [filter, setFilter] = useState('ALL'); 

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
        setFilteredAppointments(data);
      } catch (error) {
        console.error("Failed to fetch appointments: ", error);
      }
    }
    fetchUserAppointments();
  }, []);

  useEffect(() => {
    if (filter === 'ALL') {
      setFilteredAppointments(userAppointments);
      console.log(userAppointments);
    } else {
      const filtered = userAppointments.filter(app => app.status.toUpperCase() === filter);
      setFilteredAppointments(filtered);
    }
  }, [filter, userAppointments])


  return (
    <div className="appointment-view">    
      <div className="appointment-main-column">
        {/* Status boxes */}
        <div className="appointment-status-buttons">

          <button type="button" className="create-appointment-btn">
          +
          </button>

          <button type="button" className="appointment-button button-all" onClick={() => setFilter("ALL")}>
            ALL
          </button>

          <button type="button" className="appointment-button button-approved" onClick={() => setFilter("APPROVED")}>
            APPROVED
          </button>

          <button type="button" className="appointment-button button-pending" onClick={() => setFilter("PENDING")}>
            PENDING
          </button>

          <button type="button" className="appointment-button button-rejected" onClick={() => setFilter("REJECTED")}>
            REJECTED
          </button>
        </div>

        <div className='appointment-content'>
          <AppointmentList userAppointments={filteredAppointments} />
        </div>

      </div>

      <div className="appointment-image-container">
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