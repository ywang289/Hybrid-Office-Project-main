import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RoomBooking.css'
import { useAuth } from '../AuthContext';
import { jwtDecode } from 'jwt-decode';

function RoomBooking({ selectedSlots, onClose }) {
    const { token } = useAuth();
    const decoded = jwtDecode(token);
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    const [name, setName] = useState(capitalizeFirstLetter(decoded.first_name));
    const [eventName, setEventName] = useState(capitalizeFirstLetter(decoded.first_name) + '\'s Meeting');
    const [teamSize, setTeamSize] = useState(1);
    const [comment, setComment] = useState('');

    const extractBookedSlots = (selectedSlots) => {
        const bookedSlots = {};
        for (const key in selectedSlots) {
            if (selectedSlots[key] === 1) {
                const [room_id, room_name, selectedDate, timeSlot] = key.split('-');
                const roomKey = `${room_id}-${room_name}-${selectedDate}`;
                console.log(roomKey);
                if (!bookedSlots[roomKey]) {
                    bookedSlots[roomKey] = [];
                }
                bookedSlots[roomKey].push(timeSlot);
            }
        }
        return bookedSlots;
    }; 
    const room_slot = extractBookedSlots(selectedSlots);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    function formatDateString(inputDate) {
        if (inputDate.length === 8) {
            const year = inputDate.slice(0, 4);
            const month = inputDate.slice(4, 6);
            const day = inputDate.slice(6);
            return `${year}-${month}-${day}`;
        } else {
            return inputDate;
        }
    }
    const handleConfirm = async (e) => {
        e.preventDefault();
        console.log('room_slot', room_slot);
        try {
            const response = await fetch('/book-room', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    room_id: Object.keys(room_slot)[0].split('-')[0],
                    room_name: Object.keys(room_slot)[0].split('-')[1],
                    employee_name: name,
                    event_name: eventName,
                    team_size: teamSize,
                    comment: comment,
                    slot: JSON.stringify(room_slot[Object.keys(room_slot)[0]]),
                    date: formatDateString(Object.keys(room_slot)[0].split('-')[2])
                }),
            });
            if (response.ok) {
                const data = await response.json();
                if (data.alreadyBooked) {
                    setMessage('Time Conflict, Please Try Again.');
                } else {
                    setMessage('Booking Successful!');
                    setTimeout(() => {
                        navigate('/home');
                    }, 1000);
                }                
                
            } else {
                const errorText = await response.text();
                
                setMessage(errorText || 'Booking Failed, Try Again!');
                
                setTimeout(() => {
                    navigate('/home');
                }, 1000);
            }
        } catch (error) {
            console.log(error.message);
            setMessage(`Error: ${error.message}`);
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
    
    return (
        <div className='booking'>
            {Object.keys(room_slot).length === 0 ? (
                <>
                    <p>Meeting Room Booking</p>
                    <p>You Need To Select A Slot and Room</p>
                    <button type='button' onClick={onClose}>Close</button>
                </>
            ) : (
                <>
                    <p>Meeting Room Booking</p>
                    <p>Room: {Object.keys(room_slot)[0].split('-')[1]}</p>
                    <p>Slot: {slotReturn(room_slot[Object.keys(room_slot)[0]])}</p>
                    <form onSubmit={handleConfirm}>
                        Name: <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={decoded.first_name} />
                        Event Name: <input type="text" value={eventName} onChange={e => setEventName(e.target.value)} placeholder='Please Enter Event Name' />
                        Team Size: <input type="text" value={teamSize} onChange={e => setTeamSize(e.target.value)} placeholder='Please Enter Team Size' />
                        Comment: <input type="text" value={comment} onChange={e => setComment(e.target.value)} placeholder='Any Comment' />
                        <button type="submit">Confirm Booking</button>
                        <button type='button' onClick={onClose}>Cancel</button>
                    </form>
                    {message && <p>{message}</p>}
                </>
            )}
        </div>
    );
}

export default RoomBooking;