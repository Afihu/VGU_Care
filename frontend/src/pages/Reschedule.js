import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import helpers from '../utils/helpers';
import '../css/Reschedule.css';

function Reschedule() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();

    const rawUserInfo = localStorage.getItem('session-info');
    const parsed = helpers.JSONparser(rawUserInfo);
    const userToken = parsed.token;

    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [newSymptoms, setNewSymptoms] = useState(''); 
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReschedule = async () => {
        if (!newDate && !newTime && !newSymptoms) {
            alert("Please provide at least one change: a new date, time, or updated symptoms.");
            return;
        }
        setIsSubmitting(true);

        try {
            await api.appointmentUpdateService(
                userToken,
                appointmentId,
                newSymptoms, 
                "",   // newStatus
                "",          
                newDate,
                newTime
            );
            alert("Your appointment has been successfully updated and is pending approval.");
            navigate('/appointment-view');

        } catch (error) {
            console.error("Failed to reschedule appointment:", error);
            alert("There was an error rescheduling your appointment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="reschedule-page">
            <div className="reschedule-container">
                <div className="reschedule-header">
                    <h1 className="reschedule-title">Update Appointment</h1>
                    <p className="reschedule-subtitle">You can update your symptoms, select a new date and time, or both.</p>
                </div>

                <div className="form-section">
                    <label htmlFor="symptoms-input">Update Symptoms (optional)</label>
                    <textarea
                        id="symptoms-input"
                        className="reschedule-textarea"
                        placeholder="Enter your updated symptoms..."
                        value={newSymptoms}
                        onChange={(e) => setNewSymptoms(e.target.value)}
                        disabled={isSubmitting}
                        rows="4"
                    ></textarea>
                </div>

                <div className="form-section">
                    <label htmlFor="date-input">Select New Date (optional)</label>
                    <input
                        id="date-input"
                        type="date"
                        className="reschedule-input"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="form-section">
                    <label htmlFor="time-input">Select New Time (optional)</label>
                    <input
                        id="time-input"
                        type="time"
                        className="reschedule-input"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="info-box">
                    <p className="info-title">💡 Time Slot Information:</p>
                    <ul>
                        <li>Appointments are available in 20-minute slots.</li>
                        <li>Morning: 9:00 AM - 12:00 PM (9:00, 9:20, 9:40, etc.)</li>
                        <li>Afternoon: 1:00 PM - 4:00 PM (13:00, 13:20, 13:40, etc.)</li>
                        <li>If your requested time is not available, we'll find the nearest available slot.</li>
                    </ul>
                </div>

                <div className="reschedule-actions">
                    <button 
                        className="reschedule-button confirm"
                        onClick={handleReschedule}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Submitting...' : 'Confirm Changes'}
                    </button>
                    <button 
                        className="reschedule-button cancel"
                        onClick={() => navigate(-1)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Reschedule;