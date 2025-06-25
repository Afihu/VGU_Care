import React from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Header from './components/Header';
import Home from './pages/Home';
import RequestAppointment from './pages/RequestAppointment';
import AppointmentView from './pages/AppointmentView';
import TrackMood from './pages/TrackMood';
import PasswordRetrieve from './pages/PasswordRetrieve';
import ManageStudent from './pages/ManageStudent';
import ProvideTempAdvice from './pages/ProvideTempAdvice';
import ProfilePage from './pages/ProfilePage';
import Reschedule from './pages/Reschedule';

// Import other pages here, e.g. Home, Dashboard, etc.

function App() {
  return (
    <div>
      <BrowserRouter>
      <Header/>
      <main className="main-content-wrapper">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/password-retrieve" element={<PasswordRetrieve />} />
          {/* Add other routes here */}

          {/* All routes below are protected. If you want any route to be protected, just add the tag<ProtectedRoute> </ProtectedRoute>*/}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/request-appointment" element={<ProtectedRoute allowedRoles={['student']}><RequestAppointment /></ProtectedRoute>} />
          <Route path="/appointment-view" element={<ProtectedRoute><AppointmentView /></ProtectedRoute>} />
          <Route path="/track-mood" element={<ProtectedRoute allowedRoles={['student']}><TrackMood /></ProtectedRoute>} />
          <Route path="/manage-student" element={<ProtectedRoute allowedRoles={['medical_staff']}><ManageStudent /></ProtectedRoute>} />
          <Route path="/provide-advice/:appointmentId" element={<ProtectedRoute allowedRoles={['medical_staff']}><ProvideTempAdvice /></ProtectedRoute>} />
          <Route path="/reschedule/:appointmentId" element={<ProtectedRoute allowedRoles={['student']}><Reschedule /></ProtectedRoute>} />
        </Routes>
      </main>
      </BrowserRouter>
    </div>
  );
}

export default App;