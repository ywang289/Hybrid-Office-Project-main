import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip'
import { useAuth } from '../AuthContext';
import { jwtDecode } from 'jwt-decode';

function HeatmapCalendar() {
    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const moment = require('moment-timezone');
    
    const { token } = useAuth();
    const decoded = jwtDecode(token);
    const permission = decoded.permission;
    const userDepartment = decoded.department;
    const [data, setData] = useState([]);
    const [heatmapData, setHeatmapData] = useState([]);
    const [year, setYear] = useState(new Date(formatDate(moment.tz(new Date(), 'America/Toronto'))).getFullYear());
    const [department, setDepartment] = useState('');

    const filteredData = (data, department) => {
        const filteredData = data.filter(row => {
            return (department === '' || row.department === department);
        });
        const aggregatedData = filteredData.reduce((acc, row) => {
            if (!acc[row.date]) {
                acc[row.date] = { date: row.date, count: 0 };
            }
            acc[row.date].count += row.cnt; // 修改此处 cnt 为 count
            return acc;
        }, {});
        return Object.values(aggregatedData);
    };

    const fetchHeatmap = async () => {
        try {
            const response = await fetch('/heatmap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ year: year }),
            });
            const data = await response.json();
            setData(data);
            const newFilteredData = filteredData(data, department);
            setHeatmapData(newFilteredData);
        } catch (error) {
            console.error('Load Data Failed:', error);
        }
    };

    useEffect(() => {
        if ([3, 5].includes(permission)) {
            setDepartment({userDepartment});
        };
        fetchHeatmap();
    }, [year]);

    useEffect(() => {
        if ([3, 5].includes(permission)) {
            setDepartment({userDepartment});
        };
        const newFilteredData = filteredData(data, department);
        setHeatmapData(newFilteredData);
    }, [department, data]);

    const handleYearChange = (e) => {
        setYear(e.target.value);
    };
    
    return (
        <div>
            <h1>Heatmap Calendar</h1>
            <div className='search-section'>
                <label>
                    Year:
                    <select value={year} onChange={handleYearChange}>
                        {[...Array(6).keys()].map(i => {
                            const yearOption = new Date(formatDate(moment.tz(new Date(), 'America/Toronto'))).getFullYear() - 2 + i;
                            return <option key={yearOption} value={yearOption}>{yearOption}</option>
                        })}
                    </select>
                </label>
            </div>
            <div className='search-section'>
                <label>
                    Department:
                    {[1, 2, 4].includes(permission) ? (
                        <select name="department" onChange={e => setDepartment(e.target.value)}>
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
                </label>
            </div>
            
            <CalendarHeatmap
                startDate={new Date(Date.UTC(year, 0, 1))}
                endDate={new Date(Date.UTC(year, 11, 31))}
                values={heatmapData}
                classForValue={value => {
                    if (!value) {
                        return 'color-empty';
                    }
                    return `color-github-${value['count']}`;
                }}
                tooltipDataAttrs={value => ({
                    'data-tooltip-id': 'my-tooltip',
                    'data-tooltip-content': `${value['count']} employees come in office on ${formatDate(value['date'])}.`,
                    'data-tooltip-place': 'top',
                })}
                showWeekdayLabels={true}
                onClick={value => {
                    if (value && value['count'] > 0) {
                        alert(`${value['count']} employees come in office on ${formatDate(value['date'])}.`);
                    } else {
                        alert(`No employee comes in office on ${formatDate(value['date'])}.`);
                    }
                }}
            />
            <Tooltip id="my-tooltip" />
        </div>
    );
}

export default HeatmapCalendar;