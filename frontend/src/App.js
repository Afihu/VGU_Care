import React from 'react';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Header from './components/Header';
import Home from './pages/Home';
import RequestAppointment from './pages/RequestAppointment';
import AppointmentUserView from './pages/AppointmentUserView';
import TrackMood from './pages/TrackMood';

// Import other pages here, e.g. Home, Dashboard, etc.

function App() {
  return (
    <div>
      <BrowserRouter>
      <Header/>
      <main className="main-content-wrapper">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Add other routes here */}

          {/* All routes below are protected. If you want any route to be protected, just add the tag<ProtectedRoute> </ProtectedRoute>*/}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/request-appointment" element={<ProtectedRoute><RequestAppointment /></ProtectedRoute>} />
          <Route path="/appointment-user-view" element={<ProtectedRoute><AppointmentUserView /></ProtectedRoute>} />
          <Route path="/track-mood" element={<ProtectedRoute><TrackMood /></ProtectedRoute>} />
        </Routes>

      </main>
      </BrowserRouter>
    </div>
  );
}

export default App;