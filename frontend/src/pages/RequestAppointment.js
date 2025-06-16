import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/TrackMood.css';
import CareProviderList from '../components/CareProviderList';

export default function RequestAppointment() {
  const navigate = useNavigate();
  
  // Sample entries for testing
  const [providers] = useState([
    {
      name: 'Dr. Alice Johnson',
      position: 'Therapist',
      speciality: 'Cognitive Behavioral Therapy',
      staff_id: 'T001'
    },
    {
      name: 'Nurse Bob Smith',
      position: 'Nurse',
      speciality: 'Mental Health',
      staff_id: 'N002'
    }
  ]);

  return (
    <div className="request-appointment-container">
      <h2 className="request-appointment-title">Request an Appointment</h2>
      <div className="request-appointment-flex">

        <div className="request-appointment-form">
          {/* Priority Level */}
          <div>
            <label className="block text-gray-700 font-medium mb-2"> <b>Select Priority Level </b></label>
            <div className="priority-options">
              {['Low', 'Medium', 'High'].map((level) => (
                <label key={level} className="flex items-center gap-1 mt-8">
                  <input
                    type="radio"
                    name="priority"
                    value={level}
                    /*checked={priority === level}*/
                    /*onChange={(e) => setPriority(e.target.value)}*/
                  />
                  {level}
                </label>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="mb-4">
            <label style ={{marginTop: '50px',}}> <b> Select Date & Time </b></label>
            <input
              required
              type="text"
              placeholder="DD/MM/YYYY, HH:MM AM/PM"
              className="appointment-datetime"
            />
          </div>

          {/* Input Symptoms */}
          <div className="mb-4">
            <label><b>Input Symptoms</b></label>
            <input
              required
              type="text"
              placeholder="Describe your sysmptoms here..."
              className="appointment-textarea"
            />
          </div>

          {/* Attach Health Data */}
          <div className="mb-4">
            <label><b>Attach Health Data (Optional)</b></label>
            <input
              type="text"
              /*placeholder="Describe your sysmptoms here..."*/
              className="appointment-textarea"
            />
          </div>
        </div>

        <CareProviderList providers={providers} />
        
      </div>
      
      {/* Buttons */}
      <div className="request-appointment-buttons">
        <button
          type="button" 
          className="submit-button"
        >
          Submit Request
        </button>

        <button 
          onClick={() => navigate('/home')}
          type="button"
          className="cancel-button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}