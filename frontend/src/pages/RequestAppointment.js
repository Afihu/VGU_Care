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
    <div style={{ padding: '40px', margin: '20px auto',border: '1px solid #ddd', borderRadius: '8px', width: '80%', maxWidth: '1000px' }}>
      <h2 style={{ textAlign: 'center', marginTop: '5px', padding: '10px', fontSize: '30px'}}>Request an Appointment</h2>
      <div style={{display: 'flex', alignItems: 'flex-start', flexDirection: 'row', padding: '30px' }}>

        <div style={{display: 'flex', alignItems: 'flex-start', flexDirection: 'column', padding: '20px', width: '800px'}}>
          {/* Priority Level */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2"> <b>Select Priority Level </b></label>
            <div className="flex gap-12, mb-8">
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
              style={{ 
                width: '100%', 
                padding: '20px', 
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box',
                marginTop: '10px'
              }}
            />
          </div>

          {/* Input Symptoms */}
          <div className="mb-4">
            <label><b>Input Symptoms</b></label>
            <input
              required
              type="text"
              placeholder="Describe your sysmptoms here..."
              style={{ 
                width: '100%',
                padding: '30px', 
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Attach Health Data */}
          <div className="mb-4">
            <label><b>Attach Health Data (Optional)</b></label>
            <input
              type="text"
              /*placeholder="Describe your sysmptoms here..."*/
              style={{ 
                width: '100%',
                padding: '30px', 
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <CareProviderList providers={providers} />
        
      </div>
      
      {/* Buttons */}
      <div className="mb-4" style={{ display: 'flex' }} >
        <button
          type="button"
          style={{ 
            padding: '12px 24px',
            backgroundColor: '#32CD32', // lime green
            color: 'black',
            border: 'none',
            fontSize: '16px',
            borderRadius: '4px',
            cursor: 'pointer'
           }}
        >
          Submit Request
        </button>

        <button 
          onClick={() => navigate('/home')}
          type="button"
          style={{ 
            padding: '12px 24px',
            backgroundColor: '#9b59b6', // purple
            color: 'white',
            border: 'none',
            fontSize: '16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: 'auto'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}