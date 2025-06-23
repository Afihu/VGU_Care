import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/TrackMood.css';
import CareProviderList from '../components/CareProviderList';

export default function RequestAppointment() {
  const navigate = useNavigate();

  const [priority, setPriority] = useState('');
  const [dateScheduled, setDateScheduled] = useState('');
  const [timeScheduled, setTimeScheduled] = useState('');
  const [symptoms, setSymptoms] = useState('');

  const handleSubmit = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!user || !token) {
      alert('You must be logged in to submit an appointment.');
      return;
    }

    // Basic validation
    if (!priority || !dateScheduled || !timeScheduled || !symptoms) {
      alert('Please fill out all fields.');
      return;
    }

    const appointmentData = {
      symptoms,
      priorityLevel: priority.toLowerCase(), // 'low', 'medium', 'high'
      dateScheduled,
      timeScheduled
    };

    try {
      const response = await fetch('http://localhost:5001/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(appointmentData)
      });

      const result = await response.json();

      if (response.ok) {
        alert('Appointment request submitted!');
        navigate('/home');
      } else {
        alert(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting appointment');
    }
  };

  return (
    <div className="request-appointment-container">
      <h2 className="request-appointment-title">Request an Appointment</h2>

      <div className="request-appointment-flex">

        <div className="request-appointment-form">

          {/* Priority Level */}
          <div>
            <label className="block text-gray-700 font-medium mb-2"><b>Select Priority Level</b></label>
            <div className="priority-options">
              {['Low', 'Medium', 'High'].map((level) => (
                <label key={level} className="flex items-center gap-1 mt-8">
                  <input
                    type="radio"
                    name="priority"
                    value={level}
                    checked={priority === level}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                  {level}
                </label>
              ))}
            </div>
          </div>

          {/* Date & Time Inputs */}
          <div className="mb-4 mt-6">
            <label><b>Select Date</b></label>
            <input
              type="date"
              className="appointment-datetime"
              value={dateScheduled}
              onChange={(e) => setDateScheduled(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label><b>Select Time</b></label>
            <input
              type="time"
              className="appointment-datetime"
              value={timeScheduled}
              onChange={(e) => setTimeScheduled(e.target.value)}
            />
          </div>

          {/* Input Symptoms */}
          <div className="mb-4">
            <label><b>Input Symptoms</b></label>
            <input
              type="text"
              placeholder="Describe your symptoms here..."
              className="appointment-textarea"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>

          {/* Reminder Note */}
          <div>
            <label><b>Please bring the relevant health document to the appointment!</b></label>
          </div>
        </div>

        <CareProviderList />

      </div>

      {/* Buttons */}
      <div className="request-appointment-buttons">
        <button
          type="button"
          className="submit-button"
          onClick={handleSubmit}
        >
          Submit Request
        </button>

        <button
          type="button"
          className="cancel-button"
          onClick={() => navigate('/home')}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/*
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

  const [priority, setPriority] = useState('');
  const [datetime, setDatetime] = useState('');
  const [symptoms, setSymptoms] = useState('');
  //const [healthData, setHealthData] = useState('');

  const handleSubmit = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
  
    const appointmentData = {
      user_id: user?.id, // assuming you stored this
      priority,
      datetime,
      symptoms,
      healthData
    };
  
    try {
      const response = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });
  
      const result = await response.json();
  
      if (response.ok) {
        alert('Appointment request submitted!');
        navigate('/home');
      } else {
        alert(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting appointment');
    }
  };
  
  return (
    <div className="request-appointment-container">
      <h2 className="request-appointment-title">Request an Appointment</h2>
      <div className="request-appointment-flex">

        <div className="request-appointment-form">

          <div>
            <label className="block text-gray-700 font-medium mb-2"> <b>Select Priority Level </b></label>
            <div className="priority-options">
              {['Low', 'Medium', 'High'].map((level) => (
                <label key={level} className="flex items-center gap-1 mt-8">
                  <input
                    type="radio"
                    name="priority"
                    value={level}
                    checked={priority === level}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                  {level}
                </label>
              ))}
            </div>
          </div>

}
          <div className="mb-4">
            <label style ={{marginTop: '50px',}}> <b> Select Date & Time </b></label>
            <input
              required
              type="text"
              placeholder="YYYY/MM/DD, HH:MM:SS"
              className="appointment-datetime"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
            />
          </div>


          <div className="mb-4">
            <label><b>Input Symptoms</b></label>
            <input
              required
              type="text"
              placeholder="Describe your sysmptoms here..."
              className="appointment-textarea"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>


          <div>
            <label><b>Please bring the relevant health document to the appointment!</b></label>
          </div>
        </div>

        <CareProviderList providers={providers} />
        
      </div>
      

      <div className="request-appointment-buttons">
        <button
          type="button" 
          className="submit-button"
          onClick={handleSubmit}
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
} */