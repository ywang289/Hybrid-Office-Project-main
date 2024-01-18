import React, { useState, useEffect } from 'react';
import Seat from './Seat';
import './FloorMap.css';

function FloorMap({ currentMap, selectedDate }) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        setDragging(true);
        setDragStart({ x:e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
        if (dragging) {
            const containerRect = document.querySelector('.floor-map-container').getBoundingClientRect();
            const maxX = (containerRect.width * scale) - containerRect.width;
            const maxY = (containerRect.height * scale) - containerRect.height;
            setPosition(prevPosition => ({
                x: Math.min(Math.max(prevPosition.x + (e.clientX - dragStart.x), -maxX), 0),
                y: Math.min(Math.max(prevPosition.y + (e.clientY - dragStart.y), -maxY), 0)
            }));
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setDragging(false);
    }

    const zoomIn = () => {
        setScale(prevScale => Math.min(prevScale + 0.1, 1));
    };

    const zoomOut = () => {
        setScale(prevScale => Math.max(prevScale - 0.1, 0.6));
    };
    
    const [seatData, setSeatData] = useState([]);
    
    const fetchSeatData = async () => {
        try {
            const response = await fetch(`/seats?map=${currentMap}&date=${selectedDate}`);
            const data = await response.json();
            setSeatData(data);
            // console.log(data);
        } catch (error) {
            console.error('Error fetching seat data:', error);
        }
    }
    useEffect(() => {
        fetchSeatData();
    }, [currentMap, selectedDate]);

    const [isAnySeatModalOpen, setIsAnySeatModalOpen] = useState(false);

    const openSeatModal = () => {
        if (!isAnySeatModalOpen) {
            setIsAnySeatModalOpen(true);
        }
    };

    const closeSeatModal = () => setIsAnySeatModalOpen(false);

    return (
        <div className="floor-map-container"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div 
                className={`floor-map ${currentMap}`} 
                style={{ transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)` }}   
            >
                {seatData.map(seat => (
                    <Seat 
                        key={seat.seat_id} 
                        seat={seat} 
                        selectedDate={selectedDate}
                        openModal={openSeatModal}
                        closeModal={closeSeatModal}
                        isModalOpen={isAnySeatModalOpen}
                    />
                ))}
            </div>
            <div className='zoom-controls'>
                    <button className='zoom-btn in' onClick={zoomIn}>+</button>
                    <button className='zoom-btn out' onClick={zoomOut}>-</button>
            </div>
        </div>
    );
}

export default FloorMap;