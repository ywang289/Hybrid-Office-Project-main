import React, { useState } from 'react';
import Booking from './Booking';
import './Seat.css';



function Seat({ seat, selectedDate, openModal, closeModal, isModalOpen }) {
    const style = {
        position: 'absolute',
        left: `${seat.loc_x}%`,
        top: `${seat.loc_y}%`,
        width: `${seat.w}%`,
        height: `${seat.h}%`
    };

    const [flag, setFlag] = useState(false);
    const handleOpenModal = () => {
        if (!isModalOpen) {
            openModal();
            setFlag(true);
        }
    };
    const handleCloseModal = () => {
        closeModal();
        setFlag(false);
    };

    let seatStatus = '';
    let seatShown = '';
    // 0 unavailable, 1 available, 2 permanent
    if (seat.status === 0) {
        seatStatus = 'seat unavailable';
    } else {
        if (seat.name === null){
            if (seat.status === 1) {
                seatStatus = 'seat available';
                seatShown = seat.seat_name;
            } else if (seat.status === 2) {
                seatStatus = 'seat permanent';
                seatShown = seat.first_name + `'s Permanent Office`;
            }
        } else {
            seatStatus = 'seat booked';
            seatShown = seat.name;
        }
    }

    return (
        <>
            <div className={seatStatus}
                style={style}
                onClick={handleOpenModal}
            >
                {seatShown}
            </div>

            {flag && <Booking seat={seat} selectedDate={selectedDate} onClose={handleCloseModal} />}
        </>
    );
}



export default Seat;
 