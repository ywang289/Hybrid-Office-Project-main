import Menu from '../Menu';
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import FloorMap from './FloorMap';
import BookingStats from './BookingStats';
import './SeatBooking.css';
import 'react-datepicker/dist/react-datepicker.css';

function SeatBooking() {
    // set map
    const [currentMap, setCurrentMap] = useState('f1n');
    
    const [selectedDate, setSelectedDate] = useState(new Date());
    const minDate = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 61);

    const [searchName, setSearchName] = useState('');
    const [searchResult, setSearchResult] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const handleCloseModal = () => {
        setShowModal(false);
    }
    const handleSearch = async () => {
        try {
            const response = await fetch(`/search-seats?name=${searchName}&date=${new Date(selectedDate).toISOString().split('T')[0]}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResult(data);
                setShowModal(true);
            } else {
                console.error('Search Failed');
            }
        } catch (error) {
            console.error('Error: ', error);
        }
    }
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

    const [selectedResult, setSelectedResult] = useState(null);
    const [showMapModal, setShowMapModal] = useState(false);

    const handleMapClick = (result) => {
        setSelectedResult(result);
        setShowMapModal(true);
    };

    const handleCloseMapModal = () => {
        setShowMapModal(false);
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

    
    const [availableSeats, setAvailableSeats] = useState(0);
    const fetchAvailableSeats = async () => {
        try {
            const response = await fetch('/available-seats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: new Date(selectedDate).toISOString().split('T')[0],
                    map: currentMap,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setAvailableSeats(data[0]['cnt']);
            } else {
                console.error('Failed to fetch available seats');
            }
        } catch (error) {
            console.error('Error: ', error);
        }
    };

    useEffect(() => {
        fetchAvailableSeats();
    }, [currentMap, selectedDate]);
    
    return (
        <div className='seat-booking'>
            <Menu />
            <h2>Seat Booking</h2>
            
            <div className='search-section'>
                Find: <input 
                    type="text"
                    value={searchName}
                    onChange={e => {
                        if (!showModal) {
                            setSearchName(e.target.value);
                        }
                    }}
                    placeholder='Search By Name'
                />
                <button 
                onClick={() => {
                    if (!showModal) {
                        handleSearch();
                    }
                }}
                >
                    Search
                </button>
            </div>
            
            <div className='search-section'>
                Map: <select 
                    value={currentMap} 
                    onChange={(e) => {
                        if (!showModal) {
                            setCurrentMap(e.target.value);
                        }
                    }}
                >
                    <option value="f1n">Level 1 North</option>
                    <option value="f1s">Level 1 South</option>
                    <option value="f2n">Level 2 North</option>
                    <option value="f2s">Level 2 South</option>
                    <option value="f3n">Level 3 North</option>
                    <option value="f3s">Level 3 South</option>
                </select>
                <span> Available Seats: {availableSeats} </span>
            </div>
            <div className='search-section'>
                Date: <DatePicker 
                    selected={selectedDate}
                    onChange={(date) => {
                        if (!showModal) {
                            setSelectedDate(date);
                        }
                    }}
                    minDate={minDate}
                    maxDate={maxDate}
                />
            </div>
            
            <div className='search-section'>
                {showModal && (
                    <div className='modal-backdrop'>
                        <div className='modal-content'>
                            <h2>Search Result</h2>
                            {searchName.length > 0 ? (
                                searchResult.length > 0 ? (
                                    <>
                                        {searchResult.map((result, index) => (
                                            <div key={index} className="result-item">
                                                <p>{result.name} Booked {getMapName(result.map)} - Seat: {result.seat_name}</p>
                                                <button onClick={() => handleMapClick(result)}>Map</button>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <p>No Booking Found For {searchName}.</p>
                                )
                            ) : (
                                <p>Please enter a name to search.</p>
                            )}
                            <button onClick={handleCloseModal}>Close</button>
                        </div>
                    </div>
                )}
                {showMapModal && selectedResult && (
                    <div className='check'>
                        <h2>Map View</h2>
                        <p>{selectedResult.name} - {getMapName(selectedResult.map)} - Seat: {selectedResult.seat_name}</p>
                        <button onClick={handleCloseMapModal}>Close</button>
                        <div className='map'>
                            <img src={`/floor_map/${getFloorMapImage(selectedResult.map)}`} alt="Floor Map" />
                            <div 
                                className="marker"
                                style={{
                                    position: 'absolute',
                                    left: `${selectedResult.loc_x}%`,
                                    top: `${selectedResult.loc_y + selectedResult.h}%`
                                }}
                            >★</div>
                            
                        </div>
                    </div>
                )}
            </div>
            <BookingStats selectedDate={new Date(selectedDate).toISOString().split('T')[0]}/>
            <FloorMap currentMap={currentMap} selectedDate={new Date(selectedDate).toISOString().split('T')[0]}/>
        </div>
    );
};

export default SeatBooking;