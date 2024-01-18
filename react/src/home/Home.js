import './Home.css';
import Menu from '../Menu'
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { jwtDecode } from 'jwt-decode';

function Home() {
  const { token } = useAuth();
  const decoded = jwtDecode(token);
  const nickname = decoded.nickname;

  const [currentSeat, setCurrentSeat] = useState([]);
  const [currentRoom, setCurrentRoom] = useState([]);
  const fetchBookings = async () => {
    try {
      const response = await fetch('/current-bookings', {
        method: 'GET', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const data = await response.json();
      setCurrentSeat(data.currentSeat);
      setCurrentRoom(data.currentRoom);
    } catch (error) {
      console.error('Error fetching current bookings:', error);
    }
  };

  useEffect(() => {
      fetchBookings();
  }, [token]);

  const getFloorLabel = (map) => {
    switch(map) {
        case 'f1n': return 'Level 1 North';
        case 'f1s': return 'Level 1 South';
        case 'f2n': return 'Level 2 North';
        case 'f2s': return 'Level 2 South';
        case 'f3n': return 'Level 3 North';
        case 'f3s': return 'Level 3 South';
        default: return '';
    }
  };

  function slotReturn(slot) {
    const formatTime = (timeStr) => {
        const timeParts = timeStr.match(/(\d+):(\d+)(AM|PM)/);
        return new Date(`1970/01/01 ${timeParts[1]}:${timeParts[2]} ${timeParts[3]}`);
    };

    const times = slot.map(time => formatTime(time));
    times.sort((a, b) => a - b);

    let timeRanges = [];
    let currentStart = times[0];

    for (let i = 1; i < times.length; i++) {
        let difference = (times[i] - times[i - 1]) / (1000 * 60);
        if (difference !== 30) {
            let endTime = new Date(times[i - 1]);
            endTime.setMinutes(endTime.getMinutes() + 30);
            let range = `${currentStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}-${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
            timeRanges.push(range);
            currentStart = times[i];
        } 
    }

    let finalEndTime = new Date(times[times.length - 1]);
    finalEndTime.setMinutes(finalEndTime.getMinutes() + 30);
    timeRanges.push(`${currentStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}-${finalEndTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`);

    return timeRanges;
  };

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelBookingData, setCancelBookingData] = useState(null);
  const [message, setMessage] = useState('');
  const openCancelModal = (arg) => {
    setCancelBookingData(arg);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelBookingData(null);
  };

  const confirmCancel = async () => {
    if (!cancelBookingData) return;
    const cancelApiUrl = cancelBookingData.type === 'seat' ? '/cancel-seat-booking' : '/cancel-room-booking';
    try {
      const response = await fetch(cancelApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: cancelBookingData.type === 'seat' ? cancelBookingData.booking.book_id : cancelBookingData.booking.book_id
        }),
      });
  
      if (response.ok) {
        setMessage('Booking Cancelled Successfully!');
        setShowCancelModal(false);
        fetchBookings();
        window.location.reload();
      } else {
        const errorText = await response.text();
        setMessage(`Failed to cancel booking: ${errorText}`);
        fetchBookings();
      }
    } catch (error) {
      setMessage(`Error while cancelling booking: ${error.message}`);
    }
  };
  
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [checkData, setCheckData] = useState(null);
  const openCheckModal = (arg) => {
    setCheckData(arg);
    setShowCheckModal(true);
  };
  
  const closeCheckModal = () => {
    setShowCheckModal(false);
    setCheckData(null);
  };

  const getFloorMapImage = (map) => {
    switch(map) {
      case 'f1n': return 'Level1_North.png';
      case 'f1s': return 'Level1_South.png';
      case 'f2n': return 'Level2_North.png';
      case 'f2s': return 'Level2_South.png';
      case 'f3n': return 'Level3_North.png';
      case 'f3s': return 'Level3_South.png';
      default: return ''; 
    }
  };

  return (
    <div>
      <Menu />
      <h1 className='title'>Welcome {nickname}!</h1>
      <h2>Current Booking: </h2>
      {currentSeat.length > 0 || currentRoom.length > 0 ? (
        <div className='stats'>
          <h3>Current Seat Bookings:</h3>
          {currentSeat.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Seat Name</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentSeat.map((seat) => (
                  <tr key={seat.book_id}>
                    <td>{getFloorLabel(seat.map)}</td>
                    <td>{seat.seat_name}</td>
                    <td>{seat.date}</td>
                    <td>
                      <button onClick={() => openCheckModal({booking: seat, type: 'seat'})}>Detail</button>
                      <button onClick={() => openCancelModal({booking: seat, type: 'seat'})}>Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No current seat bookings.</p>
          )}

          <h3>Current Room Bookings:</h3>
          {currentRoom.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Meeting Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentRoom.map((room) => (
                  <tr key={room.book_id}>
                    <td>{room.date}</td>
                    <td>{slotReturn(JSON.parse(room.slot))}</td>
                    <td>{room.event_name}</td>
                    <td>
                      <button onClick={() => openCheckModal({booking: room, type: 'room'})}>Detail</button>
                      <button onClick={() => openCancelModal({booking: room, type: 'room'})}>Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No current room bookings.</p>
          )}
        </div>
      ) : (
        <p>Currently, there are no bookings.</p>
      )}
      {showCancelModal && (
        <div className='modal'>
          <p>Are you sure you want to cancel the {cancelBookingData.type === 'seat' ? `seat ${cancelBookingData.booking.seat_name}` : `room ${cancelBookingData.booking.room_name}`} booking for {cancelBookingData.booking.date}?</p>
          <button onClick={confirmCancel}>Confirm Cancel</button>
          <button onClick={closeCancelModal}>Close</button>
          {message && <p>{message}</p>}
        </div>
      )}
      {showCheckModal && (
        <div className='check'>
          <p>Location: {getFloorLabel(checkData.booking.map)} - 
          {checkData.type === 'seat' ? `${checkData.booking.seat_name}` : `${checkData.booking.room_name}`}</p>
          <p>
              {checkData.type === 'room' && checkData.booking.comment && checkData.booking.comment.length > 0 
                  ? `Meeting Comment: ${checkData.booking.comment}` 
                  : ''}
          </p>
          <p>
              {checkData.type === 'room'
                  ? `Oganizer: ${checkData.booking.employee_name}` 
                  : ''}
          </p>
          <p>
              {checkData.type === 'room' && checkData.booking.comment.length > 0
                  ? `Comment: ${checkData.booking.comment}` 
                  : ''}
          </p>
          <button onClick={closeCheckModal}>Close</button>
          <div className='map'>
            <img src={`/floor_map/${getFloorMapImage(checkData.booking.map)}`} alt="Floor Map" />

            {checkData && checkData.type === 'seat' && (
              <div 
                className="marker"
                style={{
                  position: 'absolute',
                  left: `${checkData.booking.loc_x}%`,
                  top: `${checkData.booking.loc_y + checkData.booking.h}%`
                }}
              >★</div>
            )}
            {checkData && checkData.type === 'room' && (
              <div 
                className="marker"
                style={{
                  position: 'absolute',
                  left: `${checkData.booking.loc_x}%`,
                  top: `${checkData.booking.loc_y}%`
                }}
              >★</div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default Home;
