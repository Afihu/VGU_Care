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
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle confirming the advice
    const handleConfirm = async (userToken, appointmentId) => {
        if (isSubmitting) return; // Prevent double clicks
        setIsSubmitting(true);

        try {
            // Step 1: Send the provisional advice
            const adviceResponse = await api.tempAdviceCourierService(userToken, appointmentId, adviceText);
            
            // Step 2: If advice is sent, update the appointment status
            if (adviceResponse && adviceResponse.message === "Advice sent successfully") {
                await api.appointmentUpdateService(
                    userToken,
                    appointmentId,
                    "",         
                    "approved", 
                    "",         
                    "",         
                    ""          
                );

                alert("Advice has been sent and the appointment is approved!");
                navigate('/appointment-view');
            } else {
                 throw new Error("Failed to get a success message from the advice service.");
            }
        } catch (error) {
            console.error("Failed to confirm advice and update status:", error);
            alert("There was an error processing the request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
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