// const db = require('./db');


// db.serialize(() => {
//   db.all(`
//   SELECT COUNT(DISTINCT a.seat_id) cnt
//   FROM 
//   (SELECT *
//   FROM seat 
//   WHERE map = ?) a
//   LEFT JOIN 
//   (SELECT *
//   FROM seat_booking
//   WHERE date = ?) b
//   ON a.seat_id = b.seat_id
//   LEFT JOIN
//   masterlist c
//   ON a.seat_name = c.permanent_location
//   WHERE b.seat_id IS NULL
//   AND c.permanent_location IS NULL
//   `, ['f1n', '2024-12-31'], (err, rows) => {
//     if (err) {
//         console.error(err.message);
//         return;
//     }
//     console.log(rows);
// });
// });

// db.close((err) => {
//     if (err) {
//       console.error(err.message);
//     }
//     console.log('Closed the database connection.');
// });

// function slotReturn(slot) {
//   const formatTime = (timeStr) => {
//       const timeParts = timeStr.match(/(\d+):(\d+)(AM|PM)/);
//       return new Date(`1970/01/01 ${timeParts[1]}:${timeParts[2]} ${timeParts[3]}`);
//   };

//   const times = slot.map(time => formatTime(time));
//   times.sort((a, b) => a - b);

//   let timeRanges = [];
//   let currentStart = times[0];

//   for (let i = 1; i < times.length; i++) {
//       let difference = (times[i] - times[i - 1]) / (1000 * 60);
//       if (difference !== 30) {
//           let endTime = new Date(times[i - 1]);
//           endTime.setMinutes(endTime.getMinutes() + 30);
//           let range = `${currentStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}-${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
//           timeRanges.push(range);
//           currentStart = times[i];
//       } 
//   }

//   let finalEndTime = new Date(currentStart);
//   finalEndTime.setMinutes(finalEndTime.getMinutes() + 30);
//   timeRanges.push(`${currentStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}-${finalEndTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`);

//   return timeRanges;
// };

// console.log(slotReturn(['8:00AM', '8:30AM', '9:00PM']))
const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const { weeksToDays } = require('date-fns');
const moment = require('moment-timezone');

// console.log(new Date(2024, 0, 1))
const generateDateRange = (startDate, endDate, reportType) => {
    const dates = [];
    let start = new Date(startDate);
    let end = new Date(endDate);

    if (reportType === 'daily') {
        let current = new Date(start);
        while (current <= end) {
            current.setDate(current.getDate() + 1);
            dates.push(formatDate(current));
        }
    } else if (reportType === 'weekly') {
        let current = start;
        while (current <= end) {
            let weekStart = current;
            if (weekStart.getDay() !== 6) {
                weekStart.setDate(weekStart.getDate() - weekStart.getDay() - 1);
            }
            weekStart.setDate(weekStart.getDate() + 1)
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
console.log(generateDateRange(new Date('2023-12-30'), new Date('2024-01-01'), 'weekly'))