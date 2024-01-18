import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MeetingRoomBooking from './meeting_room_booking/MeetingRoomBooking'
import SeatBooking from './seat_booking/SeatBooking'
import RoomDashboard from './dashboard/RoomDashboard';
import Home from './home/Home';
import Dashboard from './dashboard/Dashboard';
import Admin from './admin/Admin';
import { AuthProvider } from './AuthContext';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/home" element={<Home />} />
          <Route path="/meeting" element={<MeetingRoomBooking />} />
          <Route path="/seats" element={<SeatBooking />} />
          <Route path="/room-dashboard" element={<RoomDashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();

