import React, { useState, useEffect } from 'react';
import {useNavigate} from 'react-router-dom';
import greens from '../assets/images/Healthy_Greens.jpg';
import '../css/AppointmentView.css';
import api from '../services/api';
import helpers from '../utils/helpers';
import AppointmentList from '../components/AppointmentList';
import Modal from '../components/Modal.js';
import LogoutButton from '../components/LogoutButton.js';

export default function AppointmentView() {

  // variables for session info
  const rawUserInfo = localStorage.getItem('session-info');
  const navigateTo = useNavigate();
  const parsed = helpers.JSONparser(rawUserInfo);
  const userToken = parsed.token;
  

  // states
  const [userAppointments, setUserAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [filter, setFilter] = useState('ALL'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemAdviceModalOpen, setIsTemAdviceModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [userInfo, setUserInfo] = useState(parsed.user);
  const [isSeeAdviceModalOpen, setIsSeeAdviceModalOpen] = useState(false);
  const [adviceList, setAdviceList] = useState([]);; // New state for advice text


  //functions
  const handleAppointmentRetrieve = async (token) => {
    const response = await api.appointmentRetrieveService(token); 
    const data = await response.json(); 
    return data;
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  }

  const closeTemAdviceModal = () => {
    setIsTemAdviceModalOpen(false);
  }

  const closeSeeAdviceModal = () => {
    setIsSeeAdviceModalOpen(false);
    setAdviceList('');
  }

  const handleCardClick = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleProvideTempAdvice = (appointmentId) => {
    navigateTo(`/provide-advice/${appointmentId}`);
  }

  const handleSeeAdvice = async () => {
    if (!selectedAppointment) return;
    try {
        const data = await api.studentTempAdviceRetrieveService(userToken, selectedAppointment.id);
        if (data && data.advice) { // Check for the advice array
            setAdviceList(data.advice); // Store the whole array
            closeModal();
            setIsSeeAdviceModalOpen(true);
        }
    } catch (error) {
        console.error("Failed to retrieve advice:", error);
        alert("Could not retrieve advice for this appointment.");
    }
  };

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

          <button type="button" className="create-appointment-btn" onClick={() => navigateTo('/request-appointment')}>
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
          <div className="appointments-container">
            <AppointmentList userAppointments={filteredAppointments} onCardClick={handleCardClick} />
          </div>
        </div>

      </div>

      <div className="appointment-image-container">
        <img
          src={greens}
          alt="Healthy Greens"
          className="appointment-image"
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Appointment Details">
        {selectedAppointment && (
            <div>
                <p><strong>Status:</strong> <span className={`modal-status status-${selectedAppointment.status.toLowerCase()}`}>{selectedAppointment.status}</span></p>
                <p><strong>Symptoms:</strong> {selectedAppointment.symptoms}</p>
                <p><strong>Date Requested:</strong> {new Date(selectedAppointment.dateRequested).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Date Scheduled:</strong> {new Date(selectedAppointment.dateScheduled).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Time Scheduled:</strong> {selectedAppointment.timeScheduled}</p>
                <p><strong>Priority:</strong> {selectedAppointment.priorityLevel}</p>
                {
                  (userInfo.role == 'medical_staff') ?
                  (
                    <>
                      <p><strong>Student Name:</strong> {selectedAppointment.studentName}</p>
                      <p><strong>Student Email:</strong> {selectedAppointment.studentEmail}</p>  
                    </>
                  ) : null
                }

                <div className="modal-actions">
                    {
                      (selectedAppointment.status == 'pending' && userInfo.role == 'medical_staff') ? 
                      (
                        <button className="modal-button accept" onClick={() => setIsTemAdviceModalOpen(true)}>Accept Appointment</button>
                      ) : null
                    }

                    {
                      (userInfo.role == 'student') ?
                      (
                        <button className="modal-button reschedule">Reschedule Appointment</button>
                      ) : null
                    }

                    {
                      (userInfo.role == 'student' && selectedAppointment.hasAdvice) ?
                      (
                        <button className="modal-button see-advice" onClick={handleSeeAdvice}>See Provisional Advice</button>
                      ) : null
                    }

                    {
                      (userInfo.role == 'student') ?
                      (
                        <button className="modal-button cancel-appointment">Cancel Appointment</button>
                      ) : <button className="modal-button cancel-appointment">Reject Appointment</button>
                    }
                        
                    <button className="modal-button" onClick={closeModal}>Close</button>
                </div>
            </div>
        )}
      </Modal>

      <Modal isOpen={isTemAdviceModalOpen} onClose={closeTemAdviceModal} title="Would You Like to Provide Provisional Advice?">
        {selectedAppointment && (
            <div>
                <div className="modal-actions">
                  <button className="modal-button yes" onClick={() => handleProvideTempAdvice(selectedAppointment.id)}>Yes</button>      
                  <button className="modal-button no" onClick={() => closeModal}>No</button>
                  <button className="modal-button close" onClick={() => closeModal}>Close</button>
                </div>
            </div>
        )}
      </Modal>

      <Modal isOpen={isSeeAdviceModalOpen} onClose={closeSeeAdviceModal} title="Provisional Advice">
        <div className="advice-list-container">
            {adviceList.length > 0 ? (
                adviceList.map(item => (
                    <div key={item.id} className="advice-item">
                        <p className="advice-message">{item.message}</p>
                        <p className="advice-meta">
                            From: {item.staffName} on {new Date(item.dateSent).toLocaleDateString()}
                        </p>
                    </div>
                ))
            ) : (
                <p>No advice has been provided for this appointment yet.</p>
            )}
            <div className="modal-actions">
                <button className="modal-button ok" onClick={closeSeeAdviceModal}>OK</button>
            </div>
        </div>
      </Modal>

      <LogoutButton/>

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