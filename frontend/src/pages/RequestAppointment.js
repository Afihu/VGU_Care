import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/TrackMood.css';
import CareProviderList from '../components/CareProviderList';

export default function RequestAppointment() {
  const navigate = useNavigate();

  const [priority, setPriority] = useState('');
  const [dateScheduled, setDateScheduled] = useState('');
  const [timeScheduled, setTimeScheduled] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [healthIssueType, setHealthIssueType] = useState('');
  const [selectedMedicalStaff, setSelectedMedicalStaff] = useState('');
  const [availableStaff, setAvailableStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);

  // Fetch available medical staff on component mount
  useEffect(() => {
    const fetchMedicalStaff = async () => {
      try {
        const sessionInfo = JSON.parse(localStorage.getItem('session-info'));
        const token = sessionInfo?.token;

        if (!token) {
          console.warn('No token found');
          return;
        }        // Fetch available medical staff
        const response = await fetch('https://vgu-care-backend-production.up.railway.app/api/appointments/medical-staff', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableStaff(data.medicalStaff || []);
        }
      } catch (error) {
        console.error('Error fetching medical staff:', error);
      }
    };

    fetchMedicalStaff();
  }, []);

  // Filter staff based on health issue type
  useEffect(() => {
    if (healthIssueType) {
      const filtered = availableStaff.filter(staff => 
        staff.specialtyGroup === healthIssueType
      );
      setFilteredStaff(filtered);
      // Reset selected staff if they don't match the new health issue type
      if (selectedMedicalStaff && !filtered.find(staff => staff.staffId === selectedMedicalStaff)) {
        setSelectedMedicalStaff('');
      }
    } else {
      setFilteredStaff([]);
      setSelectedMedicalStaff('');
    }
  }, [healthIssueType, availableStaff]);
  const handleSubmit = async () => {
    const sessionInfo = JSON.parse(localStorage.getItem('session-info'));
    const token = sessionInfo?.token;

    if (!token) {
      alert('You must be logged in to submit an appointment.');
      return;
    }

    // Basic validation
    if (!priority || !dateScheduled || !timeScheduled || !symptoms || !healthIssueType) {
      alert('Please fill out all required fields.');
      return;
    }

    const appointmentData = {
      symptoms,
      priorityLevel: priority.toLowerCase(), // 'low', 'medium', 'high'
      healthIssueType, // 'physical' or 'mental'
      dateScheduled,
      timeScheduled
    };

    // Add medical staff ID if selected (not auto-assign)
    if (selectedMedicalStaff && selectedMedicalStaff !== 'auto-assign') {
      appointmentData.medical_staff_id = selectedMedicalStaff;
    }try {
      const response = await fetch('https://vgu-care-backend-production.up.railway.app/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(appointmentData)
      });

      const result = await response.json();      if (response.ok) {
        const assignmentMessage = result.assignmentMethod === 'manual_selection' 
          ? 'Your appointment has been created with your selected medical staff!'
          : 'Your appointment has been automatically assigned to an available specialist!';
        
        let timeAdjustmentMessage = '';
        if (result.timeAdjustment) {
          timeAdjustmentMessage = `\n\nTime Adjustment: Your requested time ${result.timeAdjustment.requested} was not available. We've scheduled you for ${result.timeAdjustment.assigned} instead (the nearest available slot).`;
        }
        
        alert(`Appointment request submitted successfully!\n${assignmentMessage}${timeAdjustmentMessage}`);
        navigate('/home');
      } else {
        alert(result.error || result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting appointment');
    }
  };

  return (
    <div className="request-appointment-container">
      <div className='request-title'>
        <h2 className="request-appointment-title">Request an Appointment</h2>
      </div>

      <div className="request-appointment-flex">

        <div className="request-appointment-form">          {/* Health Issue Type */}
          <div className="mb-4">
            <label><b>Health Issue Type</b></label>
            <div className="health-issue-options">
              {['Physical', 'Mental'].map((type) => (
                <label key={type}>
                  <input
                    type="radio"
                    name="healthIssueType"
                    value={type.toLowerCase()}
                    checked={healthIssueType === type.toLowerCase()}
                    onChange={(e) => setHealthIssueType(e.target.value)}
                  />
                  {type} Health
                </label>
              ))}
            </div>
          </div>

          {/* Medical Staff Selection */}
          {healthIssueType && (
            <div className="mb-4">
              <label><b>Choose Medical Staff</b></label>
              <select
                className="appointment-datetime"
                value={selectedMedicalStaff}
                onChange={(e) => setSelectedMedicalStaff(e.target.value)}
              >
                <option value="">Select an option...</option>
                <option value="auto-assign">🤖 Auto-assign (Recommended)</option>
                {filteredStaff.map((staff) => (
                  <option key={staff.staffId} value={staff.staffId}>
                    👨‍⚕️ {staff.name} - {staff.specialty}
                  </option>
                ))}
              </select>
              <div className="selection-info">
                {selectedMedicalStaff === 'auto-assign' || !selectedMedicalStaff ? (
                  <p>💡 The system will automatically assign you to the best available {healthIssueType} health specialist.</p>
                ) : (
                  <p>✅ You have selected a specific medical staff member.</p>
                )}
              </div>
            </div>
          )}

          {/* Priority Level */}
          <div>
            <label><b>Select Priority Level</b></label>
            <div className="priority-options">
              {['Low', 'Medium', 'High'].map((level) => (
                <label key={level}>
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
          </div>          <div className="mb-4">
            <label><b>Select Time</b></label>
            <input
              type="time"
              className="appointment-datetime"
              value={timeScheduled}
              onChange={(e) => setTimeScheduled(e.target.value)}
            />
            <div className="time-slot-info">
              <p><strong>💡 Time Slot Information:</strong></p>
              <p>• Appointments are available in 20-minute slots</p>
              <p>• Morning: 9:00 AM - 12:00 PM (9:00, 9:20, 9:40, etc.)</p>
              <p>• Afternoon: 1:00 PM - 4:00 PM (13:00, 13:20, 13:40, etc.)</p>
              <p>• If your requested time is not available, we'll find the nearest available slot</p>
            </div>
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
          </div>          {/* Reminder Note */}
          <div className="mb-4">
            <div className="reminder-note">
              <h4><b>📋 Important Reminders:</b></h4>
              <ul>
                <li>✅ Please bring relevant health documents to your appointment</li>
                <li>🕒 Arrive 10 minutes early for check-in</li>
                <li>🤖 Auto-assignment ensures balanced workload and faster service</li>
                <li>👨‍⚕️ You can choose a specific doctor if you prefer</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="care-provider-info">
          <h3><b>Available Care Providers</b></h3>
          {healthIssueType ? (
            <div>
              <p><strong>Specialty:</strong> {healthIssueType.charAt(0).toUpperCase() + healthIssueType.slice(1)} Health Specialists</p>
              <p><strong>Available Providers:</strong> {filteredStaff.length}</p>
              
              {selectedMedicalStaff === 'auto-assign' || !selectedMedicalStaff ? (
                <div className="auto-assign-info">
                  <p>🤖 <strong>Auto-Assignment Active</strong></p>
                  <p>You will be assigned to the specialist with the least workload for optimal service.</p>
                </div>
              ) : (
                <div className="selected-staff-info">
                  {(() => {
                    const selectedStaff = filteredStaff.find(staff => staff.staffId === selectedMedicalStaff);
                    return selectedStaff ? (
                      <div>
                        <p>✅ <strong>Selected:</strong> {selectedStaff.name}</p>
                        <p><strong>Specialty:</strong> {selectedStaff.specialty}</p>
                        <p><strong>Current Appointments:</strong> {selectedStaff.appointmentCount}</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          ) : (
            <p>Please select a health issue type to see available providers.</p>
          )}
        </div>

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