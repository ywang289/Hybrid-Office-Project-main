import React from 'react';
import './Menu.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { jwtDecode } from 'jwt-decode';

function Menu() {
  const { token } = useAuth();
  const decoded = jwtDecode(token);
  const permission = decoded.permission;

  const navigate = useNavigate();

  const handleSeatBooking = () => {
    navigate('/seats');
  };

  const handleMeetingRoomBooking = () => {
    navigate('/meeting');
  };

  const handleRoomDashboard = () => {
    navigate('/room-dashboard');
  };

  const handleHome = () => {
    navigate('/home')
  };

  const handleDashboard = () => {
    navigate('/dashboard')
  };

  const handleAdmin= () => {
    navigate('/admin')
  };

  return (
    <div>
      <div className='header'>
        <div className='main-title'>Booking System</div>
        <div className='logo'>
          <img src={'/logo/logo_top.png'} alt="Logo" />
        </div>
      </div>
      <div className='menu'>
        <button onClick={handleHome}>Home</button>
        <button onClick={handleSeatBooking}>Book Seat</button>
        <button onClick={handleMeetingRoomBooking}>Book Meeting Room</button>
        <button onClick={handleRoomDashboard}>Room Dashboard</button>
        <button onClick={handleDashboard} style={{ display: permission < 6 ? 'block' : 'none' }}>Seat Dashboard</button>
        <button onClick={handleAdmin} style={{ display: permission < 4 ? 'block' : 'none' }}>Admin</button>
      </div>
    </div>
  );

}

export default Menu;
