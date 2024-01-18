import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import './Dashboard.css';
import { useAuth } from '../AuthContext';
import { jwtDecode } from 'jwt-decode';

function SeatDashboard() {
    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const { token } = useAuth();
    const decoded = jwtDecode(token);
    const permission = decoded.permission;
    const userDepartment = decoded.department;

    const [dashboardData, setDashboardData] = useState([]);
    const [allData, setAllData] = useState([]);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [filter, setFilter] = useState({ department: '', map: '', name: '' });
    const [reportType, setReportType] = useState('daily');
    const [name, setName] = useState('');
    
    const [mapFlag, setMapFlag] = useState(true);
    const [nameFlag, setNameFlag] = useState(true);
    const [departmentFlag, setDepartmentFlag] = useState(true);

    const handleSearch = () => {
        setFilter(f => ({...f, name: name}));
    };
    
    const handleClear = () => {
        setName('');
        setFilter(f => ({...f, name: ''}));
    };

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

    const [headers, setHeaders] = useState([
        formatDate(startDate)
    ]);
    
    const generateDateRange = (startDate, endDate, reportType) => {
        const dates = [];
        let start = new Date(startDate);
        let end = new Date(endDate);
    
        if (reportType === 'daily') {
            let current = new Date(start);
            current.setDate(current.getDate() - 1);
            end.setDate(end.getDate() - 1);
            while (current <= end) {
                current.setDate(current.getDate() + 1);
                dates.push(formatDate(current));
            }
        } else if (reportType === 'weekly') {
            let current = new Date(start);
            current.setDate(current.getDate() - 1);
            end.setDate(end.getDate() - 1);
            while (current <= end) {
                let weekStart = current;
                if (weekStart.getDay() !== 6) {
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay() - 1);
                }
                weekStart.setDate(weekStart.getDate() + 1);
                let weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);            
                const range = `${formatDate(new Date(weekStart))} ~ ${formatDate(new Date(weekEnd))}`;
                dates.push(range);
                current = new Date(weekEnd);            
            }
        } else if (reportType === 'monthly') {
            let current = new Date(start);
            current.setDate(1)
            while (current <= end) {
                const monthString = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
                if (!dates.includes(monthString)) {
                    dates.push(monthString);
                }
                current.setMonth(current.getMonth() + 1);
            }
        } else if (reportType === 'quarterly') {
            const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
            let current = new Date(start);
            current.setDate(1)
            
            while (current <= end) {
                const quarterIndex = Math.floor(current.getMonth() / 3);
                const quarterLabel = `${current.getFullYear()} ${quarters[quarterIndex]}`;
        
                if (!dates.includes(quarterLabel)) {
                    dates.push(quarterLabel);
                }
    
                if (quarterIndex === 3) {
                    current.setFullYear(current.getFullYear() + 1);
                    current.setMonth(0);
                } else {
                    current.setUTCMonth(quarterIndex * 3 + 3);
                }
            }
        } else if (reportType === 'weekday') {
            const weekday = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            weekday.forEach(day => {
                dates.push(day);
            });            
        } else if (reportType === 'all') {
            dates.push('Total');
        }
      
        return dates;
    };

    const aggregateData = (data, mapFlag, nameFlag, departmentFlag, filter, reportType) => {
        let groupByColumns = [];
        if (reportType === 'daily') {
            groupByColumns = ['date', ...(departmentFlag ? ['department'] : []), ...(nameFlag ? ['name'] : []), ...(mapFlag ? ['map'] : [])];
        } else if (reportType === 'weekly') {
            groupByColumns = ['week', ...(departmentFlag ? ['department'] : []), ...(nameFlag ? ['name'] : []), ...(mapFlag ? ['map'] : [])];
        } else if (reportType === 'monthly') {
            groupByColumns = ['month', ...(departmentFlag ? ['department'] : []), ...(nameFlag ? ['name'] : []), ...(mapFlag ? ['map'] : [])];
        } else if (reportType === 'quarterly') {
            groupByColumns = ['quarter', ...(departmentFlag ? ['department'] : []), ...(nameFlag ? ['name'] : []), ...(mapFlag ? ['map'] : [])];
        } else if (reportType === 'weekday') {
            groupByColumns = ['weekday', ...(departmentFlag ? ['department'] : []), ...(nameFlag ? ['name'] : []), ...(mapFlag ? ['map'] : [])];
        } else if (reportType === 'all') {
            groupByColumns = [...(departmentFlag ? ['department'] : []), ...(nameFlag ? ['name'] : []), ...(mapFlag ? ['map'] : [])];
        }

        const filteredData = data.filter(row => {
            return (filter.department === '' || row.department === filter.department) &&
                   (filter.map === '' || row.map === filter.map) &&
                   (filter.name === '' || row.name.toLowerCase().includes(filter.name.toLowerCase()));
        });

        const aggregatedData = filteredData.reduce((acc, row) => {
            const groupKey = groupByColumns.map(col => row[col]).join('-');
    
            if (!acc[groupKey]) {
                acc[groupKey] = { cnt: 0 };
                groupByColumns.forEach(col => acc[groupKey][col] = row[col]);
            }
            acc[groupKey].cnt += row.cnt;
            return acc;
        }, {});
        return Object.values(aggregatedData);
    }; 

    const transformedData = (aggregatedData, reportType, header, departmentFlag, nameFlag, mapFlag) => {
        const transformedData = {};
        aggregatedData.forEach(item => {
            const key = [
                ...(departmentFlag ? [`${item.department}`] : []), 
                ...(nameFlag ? [`${item.name}`] : []), 
                ...(mapFlag ? [`${item.map}`] : [])
            ].join('-');
            if (!transformedData[key]) {
                transformedData[key] = {};
                if (departmentFlag) {
                    transformedData[key]['Department'] = item.department;
                }
                if (nameFlag) {
                    transformedData[key]['Name'] = item.name;
                }
                if (mapFlag) {
                    transformedData[key]['Map'] = item.map;
                }

                if (reportType === 'all') {
                    transformedData[key]['Total'] = 0;
                } else {
                    header.forEach(date => transformedData[key][date] = 0);
                }
                
            }

            if (reportType === 'daily') {
                transformedData[key][item.date] += item.cnt;
            } else if (reportType === 'weekly') {
                transformedData[key][item.week] += item.cnt;
            } else if (reportType === 'monthly') {
                transformedData[key][item.month] += item.cnt;
            } else if (reportType === 'quarterly') {
                transformedData[key][item.quarter] += item.cnt;
            } else if (reportType === 'weekday') {
                transformedData[key][item.weekday] += item.cnt;
            } else if (reportType === 'all') {
                transformedData[key]['Total'] += item.cnt;
            }
        });
        return Object.values(transformedData);
    };

    const fetchSeatDashboard = async () => {
        try {
            const response = await fetch('/seat-dashboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    startDate:formatDate(new Date(startDate)), 
                    endDate:formatDate(new Date(endDate)) }),
            });
            const data = await response.json();
            setAllData(data);
            const aggregated = aggregateData(data, mapFlag, nameFlag, departmentFlag, filter, reportType);
            const transformed = transformedData(aggregated, reportType, headers, departmentFlag, nameFlag, mapFlag)
            setDashboardData(transformed);
        } catch (error) {
            console.error('Load Data Failed:', error);
        }
    };

    useEffect(() => {
        const headers = [
            ...generateDateRange(startDate, endDate, reportType)
        ];
        setHeaders(headers);
        if ([3, 5].includes(permission)) {
            setFilter({...filter, department: {userDepartment}});
        };
        fetchSeatDashboard();
    }, [startDate, endDate]);
    
    useEffect(() => {
        const headers = [
            ...generateDateRange(startDate, endDate, reportType)
        ];
        setHeaders(headers);
        const aggregated = aggregateData(allData, mapFlag, nameFlag, departmentFlag, filter, reportType);
        const transformed = transformedData(aggregated, reportType, headers, departmentFlag, nameFlag, mapFlag)
        setDashboardData(transformed);
    }, [allData, mapFlag, nameFlag, departmentFlag, filter, reportType]);
    
    function capitalizeName(str) {
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    function getMapName(map) {
        let res = '';
        if (map === 'f1n') {
            res = 'Level 1 North'
        } else if (map === 'f1s') {
            res = 'Level 1 South'
        } else if (map === 'f2n') {
            res = 'Level 2 North'
        } else if (map === 'f2s') {
            res = 'Level 2 South'
        } else if (map === 'f3n') {
            res = 'Level 3 North'
        } else if (map === 'f3s') {
            res = 'Level 3 South'
        } 
        return res;
    };

    return (
        <div>
            <h1>Seat Dashboard</h1>
            <div>
                <div className='search-section'>
                    Report Type: 
                    <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="weekday">Weekday</option>
                        <option value="all">All</option>
                    </select>
                </div>
                <div className='search-section'>
                    {[1, 2, 4].includes(permission) && <label>
                        <input
                            type="checkbox"
                            name="department"
                            checked={departmentFlag}
                            onChange={() => {setDepartmentFlag(prevDepartmentFlag => !prevDepartmentFlag);}}
                        />
                        Department
                    </label>}
                    {departmentFlag && <div>
                        Department: 
                        {[1, 2, 4].includes(permission) ? (
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
                        ) : <span>{userDepartment}</span>}
                    </div>}
                </div>
                <div className='search-section'>
                    <label>
                        <input
                            type="checkbox"
                            name="map"
                            checked={mapFlag}
                            onChange={() => {setMapFlag(prevMapFlag => !prevMapFlag);}}
                        />
                        Map
                    </label>
                    {mapFlag && <div>
                        Map: 
                        <select name="map" onChange={e => setFilter({...filter, map: e.target.value})}>
                            <option value="">All</option>
                            <option value="f1n">Level 1 North</option>
                            <option value="f1s">Level 1 South</option>
                            <option value="f2n">Level 2 North</option>
                            <option value="f2s">Level 2 South</option>
                            <option value="f3n">Level 3 North</option>
                            <option value="f3s">Level 3 South</option>
                        </select>
                    </div>}
                </div>
                <div className='search-section'>
                    <label>
                        <input
                            type="checkbox"
                            name="name"
                            checked={nameFlag}
                            onChange={() => {setNameFlag(prevNameFlag => !prevNameFlag);}}
                        />
                        Name
                    </label>
                    {nameFlag && <div>
                        Name: 
                        <input type="text" value={name} onChange={e => setName(e.target.value)} />
                        <button onClick={() => {handleSearch()}}>Search</button>
                        <button onClick={() => {handleClear()}}>Clear</button>
                    </div>}
                </div>
                <div className='search-section'>
                    Start Date: <DatePicker selected={startDate} onChange={handleStartDateChange} />
                    End Date: <DatePicker selected={endDate} onChange={handleEndDateChange} />
                </div>
                <div className='dashboard'>
                    <table>
                        <thead>
                                <tr>
                                    {departmentFlag && <th>Department</th>}
                                    {nameFlag && <th>Name</th>}
                                    {mapFlag && <th>Map</th>}
                                    {headers.map(header => (
                                        <th key={header}>{header}</th>
                                    ))}
                                </tr>
                        </thead>
                        <tbody>
                            {dashboardData.map((booking, index) => (
                                <tr key={index}>
                                    {departmentFlag && <td>{booking['Department']}</td>}
                                    {nameFlag && <td>{capitalizeName(booking['Name'])}</td>}
                                    {mapFlag && <td>{getMapName(booking['Map'])}</td>}
                                    {headers.map((header, headerIndex) => (
                                        <td key={`${index}-${headerIndex}`}>
                                            {booking[header] !== undefined ? booking[header] : '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
};

export default SeatDashboard;