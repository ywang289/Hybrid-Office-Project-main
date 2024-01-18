import Menu from '../Menu'
import './MeetingRoomBooking.css'
import 'react-datepicker/dist/react-datepicker.css';
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import Calendar from './Calendar';

function MeetingRoomBooking() {
    
    const [selectedDate, setSelectedDate] = useState(new Date());
    const minDate = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 61);

    const [bookingData, setbookingData] = useState([]);
    const [teamSize, setTeamSize] = useState(1);
    const [roomData, setRoomData] = useState([]);
    useEffect(() => {
        fetchAllMeetingRooms();
    }, [selectedDate]);

    const fetchAllMeetingRooms = async () => {
        try {
            const response = await fetch(`/meeting-rooms?date=${new Date(selectedDate).toISOString().split('T')[0]}`);
            if (response.ok) {
                const data = await response.json();
                setRoomData(data.roomData);
                setbookingData(data.bookingData)
                console.log(data.bookingData)
            } else {
                console.error('Failed to fetch meeting room');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleSearch = () => {
        fetchAllMeetingRooms(new Date(selectedDate).toISOString().split('T')[0]);
    };

    return (
        <div>
            <Menu />
            <div className='search-section'>
                Team Size: <input 
                    type='number' 
                    value={teamSize} 
                    onChange={e => setTeamSize(Math.max(1, e.target.value))} 
                    min="1"
                    max="15"
                    placeholder='Team Size' />
                {/* <button onClick={handleSearch}>Search</button> */}
            </div>
            <div className='search-section'>
                Date: <DatePicker 
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    minDate={minDate}
                    maxDate={maxDate}
                />
            </div>
            <div className='calendar-container'>
                <Calendar room={roomData} booking={bookingData} selectedDate={new Date(selectedDate).toISOString().split('T')[0]} teamSize={teamSize}/>
            </div>
            
        </div>
    );
};

export default MeetingRoomBooking;