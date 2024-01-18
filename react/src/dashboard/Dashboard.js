import React, { useState } from 'react';
import HeatmapCalendar from './HeatmapCalendar';
import SeatDashboard from './SeatDashboard';
import Menu from '../Menu';
import './Dashboard.css';

function Dashboard() {
    const [view, setView] = useState('seat'); 

    return (
        <div>
            <Menu />
            <h1>{view === 'seat' ? 'Seat Booking Dashboard' : 'Seat Booking Heatmap'}</h1>
            <div className='main-dashboard'>
                <button onClick={() => setView('seat')}>Seat Booking Dashboard</button>
                <button onClick={() => setView('heatmap')}>Seat Booking Heatmap</button>

                {view === 'seat' ? <SeatDashboard /> : <HeatmapCalendar />}
            </div>
        </div>
    );
}

export default Dashboard;
