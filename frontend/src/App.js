import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
// Import other pages here, e.g. Home, Dashboard, etc.

function App() {
  return (
    <div>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Add other routes here */}
      </Routes>
    </div>
  );
}

export default App;
