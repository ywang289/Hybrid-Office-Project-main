import React, { useEffect, useState } from 'react';
import './Calendar.css';
import RoomBooking from './RoomBooking';

const Calendar = ({ room, booking, selectedDate, teamSize }) => {
    const timeSlots = [];
    for (let hour = 8; hour <= 20; hour++) {
        const amPm = hour < 12 ? 'AM' : 'PM';
        const hourFormatted = hour <= 12 ? hour : hour - 12;
        timeSlots.push(`${hourFormatted}:00${amPm}`, `${hourFormatted}:30${amPm}`);
    }

    const [selectedSlots, setSelectedSlots] = useState({});
    useEffect(() => {
        const initialSlots = {};
        // console.log(typeof booking.slot, booking.slot);
        booking.forEach(booking => {
            const slotsArray = JSON.parse(booking.slot);
            slotsArray.forEach(slot => {
                const key = `${booking.room_id}-${booking.room_name}-${formatDate(booking.date)}-${slot}`;
                initialSlots[key] = -1;
            });
        });
        // console.log(initialSlots);
        setSelectedSlots(initialSlots);
    }, [booking]);

    function formatDate(str) {
        const year = str.split('-')[0];
        const month = str.split('-')[1];
        const day = str.split('-')[2];
        return `${year}${month}${day}`;
    }
    
    const handleSlotClick = (roomId, room_name, selectedDate, timeSlot) => {
        const key = `${roomId}-${room_name}-${formatDate(selectedDate)}-${timeSlot}`;
        const selectedSlotKey = Object.keys(selectedSlots).find(key => selectedSlots[key] === 1);
        const existingSlotBaseKey = selectedSlotKey ? selectedSlotKey.split('-').slice(0, 3).join('-') + '-' : '-1';
        const slotFlag = !selectedSlotKey || key.startsWith(existingSlotBaseKey);
    
        if (selectedSlots[key] !== -1 && slotFlag) { 
            setSelectedSlots(prev => ({
                ...prev,
                [key]: prev[key] === 1 ? 0 : 1
            }));
        }
    };
    const [flag, setFlag] = useState(false);
    const openModal = () => setFlag(true);
    const closeModal =() => {
        setFlag(false);
    }
    const handleBookClick = () => {
        openModal();
        console.log('Booked', selectedSlots);
    };

    const handleClearClick = () => {
        const initialSlots = {};
        booking.forEach(booking => {
            const slotsArray = JSON.parse(booking.slot);
            slotsArray.forEach(slot => {
                const key = `${booking.room_id}-${booking.room_name}-${formatDate(booking.date)}-${slot}`;
                initialSlots[key] = -1;
            });
        });
        setSelectedSlots(initialSlots);
        // setSelectedSlots({});
    }
    
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

    const getBookingDataForRoom = (roomId, selectedDate, slotKey) => {
        const slot = slotKey.split('-')[3];
        const matchingBooking = booking.find(b => 
            b.room_id === roomId && 
            b.date === selectedDate &&
            JSON.parse(b.slot).includes(slot)
            );
        return matchingBooking;
      };
    
    const sortedRoom = room.slice().sort((a, b) => Math.abs(a.room_size - teamSize) - Math.abs(b.room_size - teamSize));
    
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
        <div className='calendar'>
            <div className='win'>
                {flag && <RoomBooking selectedSlots={selectedSlots} onClose={closeModal} />}
            </div>
            <div className='calendar-control'>
                <button onClick={handleBookClick}>Book</button>
                <button onClick={handleClearClick}>Clear</button>
            </div>
            <table className='calendar'>
                <thead>
                    <tr>
                        <th>Time / Room</th>
                        {sortedRoom.map(room => <th key={room.id}>{room.room_name}</th>)}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Detail</td>
                        {sortedRoom.map(room => (
                            <td key={`${room.id}-action`}>
                                <button onClick={() => openCheckModal(room)}>Detail</button>
                            </td>
                        ))}
                    </tr>
                    {timeSlots.map(slot => (
                        <tr key={slot}>
                            <td>{slot}</td>
                            {sortedRoom.map(room => {
                                const slotKey = `${room.room_id}-${room.room_name}-${formatDate(selectedDate)}-${slot}`;
                                return (
                                    <td key={slotKey} 
                                        className={
                                            selectedSlots[slotKey] === 1 ? 'selected' : 
                                            selectedSlots[slotKey] === -1 ? 'booked' : 'available'}
                                        onClick={() => {
                                            if (!flag) {
                                                handleSlotClick(room.room_id, room.room_name, selectedDate, slot);
                                            }
                                        }}
                                    >
                                        {selectedSlots[slotKey] === -1 && (
                                            <div>
                                                <p>{getBookingDataForRoom(room.room_id, selectedDate, slotKey).event_name}</p>
                                                {/* <p>Organizer: {getBookingDataForRoom(room.room_id, selectedDate, slotKey).employee_name}</p> */}
                                                {/* <p>Team Size: {getBookingDataForRoom(room.room_id, selectedDate, slotKey).team_size}</p> */}
                                            </div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            {showCheckModal && (
                <div className='check'>
                    <p>Location: {getFloorLabel(checkData.map)}</p>
                    <p>Equipment: {(checkData.equipment)}</p>
                    <p>Room Size: {(checkData.room_size)}</p>
                    <button onClick={closeCheckModal}>Close</button>
                    <div className='map'>
                        <img src={`/floor_map/${getFloorMapImage(checkData.map)}`} alt="Floor Map" />
                        {checkData && (
                        <div 
                            className="marker"
                            style={{
                            position: 'absolute',
                            left: `${checkData.loc_x}%`,
                            top: `${checkData.loc_y}%`
                            }}
                        >★</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;