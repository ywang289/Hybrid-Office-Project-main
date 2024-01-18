import React, { useEffect, useState } from 'react';
import './BookingStats.css'
import { useAuth } from '../AuthContext';

const BookingStats = ({ selectedDate }) => {
    const { token } = useAuth();

    const [bookStats, setBookStats] = useState([]);
    const fetchBookingStats = async () => {
        // console.log(selectedDate);
        try {
            if (!token) {
                console.error('No token available');
                return;
            }
            const response = await fetch(`/seat-book-stats?date=${selectedDate}`, {
                method: 'GET', 
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
            const data = await response.json();
            setBookStats(data);
            // console.log(data);
        } catch (error) {
            console.error('Error fetching booking data:', error);
        }
    }
    useEffect(() => {
        fetchBookingStats();
    }, [selectedDate, token]);

    
    const [isCollapsed, setIsCollapsed] = useState(true); 
    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };
    
    return (
        <div className='booking-stats'>
            <div className='booking-stats-header'>
                <p>Your Department</p>
                <button onClick={toggleCollapse}>
                    {isCollapsed ? 'Expand' : 'Collapse'}
                </button>
            </div>
            {!isCollapsed && (
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookStats.map(stat => (
                            <tr key={stat.department_id}>
                                <td>{stat.name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
};

export default BookingStats;