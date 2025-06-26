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

  const rawUserInfo = localStorage.getItem('session-info');
  const navigateTo = useNavigate();
  const parsed = helpers.JSONparser(rawUserInfo);
  const userToken = parsed.token;

  const [userAppointments, setUserAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemAdviceModalOpen, setIsTemAdviceModalOpen] = useState(false);
  const [isSeeAdviceModalOpen, setIsSeeAdviceModalOpen] = useState(false);
  const [isCancelConfirmModalOpen, setIsCancelConfirmModalOpen] = useState(false);
  const [isRejectConfirmModalOpen, setIsRejectConfirmModalOpen] = useState(false);
  const [isCompleteConfirmModalOpen, setIsCompleteConfirmModalOpen] = useState(false); // New state
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [adviceList, setAdviceList] = useState([]);
  const [userInfo, setUserInfo] = useState(parsed.user);

  const handleAppointmentRetrieve = async (token) => {
    const response = await api.appointmentRetrieveService(token);
    const data = await response.json();
    return data;
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  }

  const closeTemAdviceModal = () => setIsTemAdviceModalOpen(false);
  const closeSeeAdviceModal = () => {
    setIsSeeAdviceModalOpen(false);
    setAdviceList([]);
  };
  const closeCancelConfirmModal = () => setIsCancelConfirmModalOpen(false);
  const closeRejectConfirmModal = () => setIsRejectConfirmModalOpen(false);
  const closeCompleteConfirmModal = () => setIsCompleteConfirmModalOpen(false); // New close handler

  const handleCardClick = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleProvideTempAdvice = (appointmentId) => {
    navigateTo(`/provide-advice/${appointmentId}`);
  };

  const handleRescheduleClick = () => {
    if (!selectedAppointment) return;
    if ((selectedAppointment.status === 'cancelled') || (selectedAppointment.status === 'rejected')) {
        navigateTo('/request-appointment');
    } else {
        navigateTo(`/reschedule/${selectedAppointment.id}`);
    }
  };

  const handleSeeAdvice = async () => {
    if (!selectedAppointment) return;
    try {
        const data = await api.studentTempAdviceRetrieveService(userToken, selectedAppointment.id);
        if (data && data.advice) {
            setAdviceList(data.advice);
            closeModal();
            setIsSeeAdviceModalOpen(true);
        }
    } catch (error) {
        console.error("Failed to retrieve advice:", error);
        alert("Could not retrieve advice for this appointment.");
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
        await api.appointmentUpdateService(userToken, appointmentId, "", status, "", "", "");
        const updatedAppointments = userAppointments.map(app =>
            app.id === appointmentId ? { ...app, status: status } : app
        );
        setUserAppointments(updatedAppointments);
        alert(`Appointment has been updated to ${status}.`);
        return true;
    } catch (error) {
        console.error(`Failed to update appointment to ${status}:`, error);
        alert(`There was an error updating the appointment.`);
        return false;
    }
  };

  const handleConfirmCancel = async () => {
    if (await updateAppointmentStatus(selectedAppointment.id, 'cancelled')) {
      closeModal();
      closeCancelConfirmModal();
    }
  };

  const handleConfirmReject = async () => {
    if (await updateAppointmentStatus(selectedAppointment.id, 'rejected')) {
      closeModal();
      closeRejectConfirmModal();
    }
  };

  const handleConfirmComplete = async () => {
    if (await updateAppointmentStatus(selectedAppointment.id, 'completed')) {
      closeModal();
      closeCompleteConfirmModal();
    }
  };

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
    } else {
      const filtered = userAppointments.filter(app => app.status.toUpperCase() === filter);
      setFilteredAppointments(filtered);
    }
  }, [filter, userAppointments]);


  return (
    <div className="appointment-view">
      <div className="appointment-main-column">
        <div className="appointment-status-buttons">
          <button type="button" className="create-appointment-btn" onClick={() => navigateTo('/request-appointment')}>+</button>
          <button type="button" className="appointment-button button-all" onClick={() => setFilter("ALL")}>ALL</button>
          <button type="button" className="appointment-button button-approved" onClick={() => setFilter("APPROVED")}>APPROVED</button>
          <button type="button" className="appointment-button button-pending" onClick={() => setFilter("PENDING")}>PENDING</button>
          <button type="button" className="appointment-button button-rejected" onClick={() => setFilter("REJECTED")}>REJECTED</button>
          <button type="button" className="appointment-button button-cancelled" onClick={() => setFilter("CANCELLED")}>CANCELLED</button>
          <button type="button" className="appointment-button button-completed" onClick={() => setFilter("COMPLETED")}>COMPLETED</button>
        </div>
        <div className='appointment-content'>
          <div className="appointments-container">
            <AppointmentList userAppointments={filteredAppointments} onCardClick={handleCardClick} />
          </div>
        </div>
      </div>
      <div className="appointment-image-container">
        <img src={greens} alt="Healthy Greens" className="appointment-image" />
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
                {(userInfo.role === 'medical_staff') && (
                    <>
                        <p><strong>Student Name:</strong> {selectedAppointment.studentName}</p>
                        <p><strong>Student Email:</strong> {selectedAppointment.studentEmail}</p>
                    </>
                )}
                <div className="modal-actions">
                    {selectedAppointment.status !== 'completed' && (
                        <>
                            {(selectedAppointment.status === 'pending' && userInfo.role === 'medical_staff') && (
                                <button className="modal-button accept" onClick={() => setIsTemAdviceModalOpen(true)}>Accept Appointment</button>
                            )}
                            {(selectedAppointment.status === 'approved' && userInfo.role === 'medical_staff') && (
                                <button className="modal-button complete" onClick={() => setIsCompleteConfirmModalOpen(true)}>Mark as Completed</button>
                            )}
                            {(userInfo.role === 'student') && (
                                <button className="modal-button reschedule" onClick={handleRescheduleClick}>Modify Appointment</button>
                            )}
                            {(userInfo.role === 'student' && selectedAppointment.hasAdvice) && (
                                <button className="modal-button see-advice" onClick={handleSeeAdvice}>See Provisional Advice</button>
                            )}
                            {(userInfo.role === 'student' && selectedAppointment.status !== 'cancelled') ? (
                                <button className="modal-button cancel-appointment" onClick={() => setIsCancelConfirmModalOpen(true)}>Cancel Appointment</button>
                            ) : (userInfo.role === 'medical_staff' && selectedAppointment.status === 'pending') ? (
                                <button className="modal-button cancel-appointment" onClick={() => setIsRejectConfirmModalOpen(true)}>Reject Appointment</button>
                            ) : null}
                        </>
                    )}
                    {/* --- The Close button is always visible --- */}
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
                  <button className="modal-button no" onClick={closeTemAdviceModal}>No</button>
                </div>
            </div>
        )}
      </Modal>

      <Modal isOpen={isCancelConfirmModalOpen} onClose={closeCancelConfirmModal} title="Confirm Cancellation">
          <p>Are you sure you want to cancel this appointment?</p>
          <div className="modal-actions">
              <button className="modal-button yes" onClick={handleConfirmCancel}>Yes</button>
              <button className="modal-button no" onClick={closeCancelConfirmModal}>No</button>
          </div>
      </Modal>

      <Modal isOpen={isRejectConfirmModalOpen} onClose={closeRejectConfirmModal} title="Confirm Rejection">
          <p>Are you sure you want to reject this appointment?</p>
          <div className="modal-actions">
              <button className="modal-button yes" onClick={handleConfirmReject}>Yes</button>
              <button className="modal-button no" onClick={closeRejectConfirmModal}>No</button>
          </div>
      </Modal>
      
      <Modal isOpen={isCompleteConfirmModalOpen} onClose={closeCompleteConfirmModal} title="Confirm Completion">
          <p>Are you sure you want to mark this appointment as completed?</p>
          <div className="modal-actions">
              <button className="modal-button yes" onClick={handleConfirmComplete}>Yes</button>
              <button className="modal-button no" onClick={closeCompleteConfirmModal}>No</button>
          </div>
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
                <button className="modal-button" onClick={closeSeeAdviceModal}>OK</button>
            </div>
        </div>
      </Modal>
    </div>
  );
}