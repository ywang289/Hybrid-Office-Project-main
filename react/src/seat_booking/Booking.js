import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Booking.css'
import { useAuth } from '../AuthContext';
import { jwtDecode } from 'jwt-decode';

function Booking({ seat, selectedDate, onClose }) {
    const { token } = useAuth();
    const decoded = jwtDecode(token);
    const employee_id = decoded.employee_id;
    const userEmail = decoded.email;
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    const [name, setName] = useState(capitalizeFirstLetter(decoded.first_name));
    let seatStatus = seat.status === 0 ? 'Unavailable' : (seat.name ? `Booked By: ${seat.name}` : (seat.status === 1 ? 'Available' : `${seat.master_name}'s Permanent Office`));
    // -1 means booked, 1 means available, 2 means permanant office
    let isAvailable = seat.name ? -1 : seat.status;

    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const handleConfirm = async (e) => {
        e.preventDefault();

        if (seat.status === 2 
            && userEmail.toLowerCase() !== seat.email.toLowerCase()
            && employee_id !== seat.master_employee_id) {
            setMessage(`This is ${seat.first_name}'s permanent office and can only be booked by its owner.`);
            return;
        }

        try {
            const response = await fetch('/book-seat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    seat_id: seat.seat_id,
                    seat_name: seat.seat_name,
                    map: seat.map,
                    name: name,
                    date: selectedDate
                }),
            });
            if (response.ok) {
                const data = await response.json();
                if (data.alreadyBooked) {
                    const switchSeat = window.confirm(
                        `You have already booked the seat ${data.currentBooking.seat_name}. Do you want to switch to the seat ${seat.seat_name}?`
                    );
                    if (switchSeat) {
                        const switchResponse = await fetch('/switch-seat', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                seat_id: seat.seat_id,
                                seat_name: seat.seat_name,
                                map: seat.map,
                                name: name,
                                date: selectedDate
                            }),
                        });
                        const switchData = await switchResponse.json();
                        setMessage('Seat Switch Successful!');
                        setTimeout(() => {
                            navigate('/home');
                        }, 1000);
                    }
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
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <div className='booking'>
            <p>Seat: {seat.seat_name}</p>
            <p>{seatStatus}</p>
            {isAvailable !== -1 && (
                <form onSubmit={handleConfirm}>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={decoded.first_name} />
                    <button type="submit">Confirm Booking</button>
                    <button type='button' onClick={onClose}>Cancel</button>
                </form>
            )}
            {isAvailable === -1 && (
                <button type='button' onClick={onClose}>Close</button>
            )}
            {message && <p>{message}</p>}
        </div>
    );
}

export default Booking;