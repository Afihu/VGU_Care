import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../css/ProvideTempAdvice.css';
import helpers from '../utils/helpers';
import api from '../services/api';

function ProvideTempAdvice() {
    // Get the appointment ID from the URL, e.g., /provide-advice/123
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const rawUserInfo = localStorage.getItem('session-info');
    const parsed = helpers.JSONparser(rawUserInfo);
    const userToken = parsed.token;

    const [adviceText, setAdviceText] = useState('');
    const [savedAdvice, setSavedAdvice] = useState(''); // To show confirmation

    // Handle confirming the advice
    const handleConfirm = (userToken, appointmentId) => {
        console.log('Advice for student: ', adviceText);

        // alert('Advice has been saved!'); 
        setSavedAdvice(adviceText);
        const response = api.tempAdviceCourierService(userToken, appointmentId, adviceText);
        if (response.status == 201) {
            alert('success');
        } else {
            console.log('oh shit oh fuck', response);
        }

        // navigate('/appointment-view');
    };

    const handleDiscard = () => {
        setAdviceText('');
    };

    // Handle navigating back
    const handleCancel = () => {
        navigate('/appointment-view');
    };

    return (
        <div className="provide-advice-page">
            <div className="advice-container">
                <div className="advice-header">
                    <h1 className="advice-title">Provisional Advice</h1>
                    <p className="advice-subtitle">Enter your advice below: </p>
                </div>

                <textarea
                    className="advice-textarea"
                    placeholder="Start typing your advice here..."
                    value={adviceText}
                    onChange={(e) => setAdviceText(e.target.value)}
                />

                <div className="advice-actions">
                    <button className="advice-button confirm-btn" onClick={() => handleConfirm(userToken, appointmentId)}>Confirm</button>
                    <button className="advice-button discard-btn" onClick={handleDiscard}>Discard</button>
                    <button className="advice-button cancel-btn" onClick={handleCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

export default ProvideTempAdvice;