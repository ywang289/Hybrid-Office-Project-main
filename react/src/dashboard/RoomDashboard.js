import Menu from '../Menu';
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import './Dashboard.css'

function RoomDashboard() {
    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const [dashboardData, setDashboardData] = useState([]);
    const [allData, setAllData] = useState([]);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    
    const [sort, setSort] = useState('desc');
    const [filter, setFilter] = useState({ department: '', weekday: '', team_size: '' });

    const handleStartDateChange = (date) => {
        if (date > endDate) {
            setEndDate(new Date(date));
        }
        setStartDate(new Date(date));
    };

    const handleEndDateChange = (date) => {
        if (date < startDate) {
            setStartDate(new Date(date));
        }
        setEndDate(new Date(date));
    };

    const fetchRoomDashboard = async () => {
        try {
            const response = await fetch('/room-dashboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ startDate:formatDate(startDate), endDate:formatDate(endDate) }),
            });
            const data = await response.json();
            setAllData(data);
            const aggregatedData = aggregateData(data, selectedColumns, filter, sort);
            setDashboardData(aggregatedData);
        } catch (error) {
            console.error('Error fetching booking data:', error);
        }
    }

    const [selectedColumns, setSelectedColumns] = useState({
        department: true,
        team_size: true,
        weekday: true,
        room_name: true,
        cnt: true
    });

    const handleColumnChange = (e) => {
        setSelectedColumns({ ...selectedColumns, [e.target.name]: e.target.checked });
    };
    
    const handleSortChange = () => {
        const newDirection = sort === 'asc' ? 'desc' : 'asc';
        setSort(newDirection);
    };
    
    const aggregateData = (data, selectedColumns, filter, sort) => {
        const filteredData = data.filter(row => {
            return (filter.department === '' || row.department === filter.department) &&
                   (filter.weekday === '' || row.weekday === filter.weekday) &&
                   (filter.team_size === '' || row.team_size === filter.team_size);
        });
        const groupByColumns = ['department', 'team_size', 'weekday', 'room_name'].filter(col => selectedColumns[col]);
        
        const aggregatedData = filteredData.reduce((acc, row) => {
            const groupKey = groupByColumns.map(col => row[col]).join('-');
    
            if (!acc[groupKey]) {
                acc[groupKey] = { cnt: 0 };
                groupByColumns.forEach(col => acc[groupKey][col] = row[col]);
            }
            acc[groupKey].cnt += row.cnt;
            return acc;
        }, {});
        let aggregatedArray = Object.values(aggregatedData);
        aggregatedArray = aggregatedArray.sort((a, b) => {
            if (sort === 'asc') {
                    return a.cnt - b.cnt;
            } else {
                return b.cnt - a.cnt;
            }
        });
        return aggregatedArray;
    };

    useEffect(() => {
        fetchRoomDashboard();
    }, [startDate, endDate]);
    
    useEffect(() => {
        const aggregatedData = aggregateData(allData, selectedColumns, filter, sort);
        setDashboardData(aggregatedData);
    }, [allData, selectedColumns, filter, sort]);
    
    return (
        <div>
            <Menu />
            <h1>Room Bookings Dashboard</h1>
            <div>
                <div className='search-section'>
                    <label>
                        <input
                            type="checkbox"
                            name="department"
                            checked={selectedColumns.department}
                            onChange={handleColumnChange}
                        />
                        Department
                    </label>
                    {selectedColumns.department && <div>
                        Department: 
                        <select name="department" onChange={e => setFilter({...filter, department: e.target.value})}>
                            <option value="">All</option>
                            <option value="ACT Consortium">ACT Consortium</option>
                            <option value="Admin">Admin</option>
                            <option value="Contracts">Contracts</option>
                            <option value="CRLB">CRLB</option>
                            <option value="Digital Health">Digital Health</option>
                            <option value="Finance">Finance</option>
                            <option value="Global Health">Global Health</option>
                            <option value="ICT">ICT</option>
                            <option value="Investigator">Investigator</option>
                            <option value="Perioperative">Perioperative</option>
                            <option value="PHRI Networks">PHRI Networks</option>
                            <option value="Population Genetics">Population Genetics</option>
                            <option value="Prevention">Prevention</option>
                            <option value="Quality Assurance">Quality Assurance</option>
                            <option value="Research Admin">Research Admin</option>
                            <option value="RSSM">RSSM</option>
                            <option value="Statistics">Statistics</option>
                            <option value="Stroke">Stroke</option>
                        </select>
                    </div>}
                </div>
                <div className='search-section'>
                    <label>
                        <input
                            type="checkbox"
                            name="team_size"
                            checked={selectedColumns.team_size}
                            onChange={handleColumnChange}
                        />
                        Team Size
                    </label>
                    {selectedColumns.team_size && <div>
                        Team Size (1-5 Small, 6-10 Medium, 10+ Large): 
                        <select name="team_size" onChange={e => setFilter({...filter, team_size: e.target.value})}>
                            <option value="">All</option>
                            <option value="Small">Small Size</option>
                            <option value="Medium">Medium Size</option>
                            <option value="Large">Large Size</option>
                        </select>
                    </div>}
                </div>
                <div className='search-section'>
                    <label>
                        <input
                            type="checkbox"
                            name="weekday"
                            checked={selectedColumns.weekday}
                            onChange={handleColumnChange}
                        />
                        Weekday
                    </label>
                    {selectedColumns.weekday && <div>
                        Weekday: 
                        <select name="weekday" onChange={e => setFilter({...filter, weekday: e.target.value})}>
                            <option value="">All</option>
                            <option value="Sunday">Sunday</option>
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Wednesday">Wednesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="Friday">Friday</option>
                            <option value="Saturday">Saturday</option>
                        </select>
                    </div>}
                </div>
                <div className='search-section'>
                    <label>
                        <input
                            type="checkbox"
                            name="room_name"
                            checked={selectedColumns.room_name}
                            onChange={handleColumnChange}
                        />
                        Room Name
                    </label>
                </div>
                <div className='search-section'>
                    Start Date: <DatePicker selected={startDate} onChange={handleStartDateChange} />
                    End Date: <DatePicker selected={endDate} onChange={handleEndDateChange} />
                </div>
                <div className='dashboard'>
                    <table>
                        <thead>
                            <tr>
                                {selectedColumns.department && <th>Department</th>}
                                {selectedColumns.team_size && <th>Team Size</th>}
                                {selectedColumns.weekday && <th>Weekday</th>}
                                {selectedColumns.room_name && <th>Room Name</th>}
                                <th 
                                className='sortable'
                                onClick={handleSortChange}>
                                    Booking Count {sort === 'asc' ? '▲' : '▼'}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(dashboardData) && dashboardData.map((booking, index) => (
                                <tr key={index}>
                                    {selectedColumns.department && <td>{booking.department}</td>}
                                    {selectedColumns.team_size && <td>{booking.team_size}</td>}
                                    {selectedColumns.weekday && <td>{booking.weekday}</td>}
                                    {selectedColumns.room_name && <td>{booking.room_name}</td>}
                                    <td>{booking.cnt}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
};

export default RoomDashboard;