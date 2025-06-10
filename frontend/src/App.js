import React from 'react';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
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
          <Route path="/home" element={<Home />} />
          <Route path="/request-appointment" element={<RequestAppointment />} />
          <Route path="/appointment-user-view" element={<AppointmentUserView />} />
          <Route path="/track-mood" element={<TrackMood />} />
          {/* Add other routes here */}
        </Routes>

      </main>
      </BrowserRouter>
    </div>
  );
}

export default App;