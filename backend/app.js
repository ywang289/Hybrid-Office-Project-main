const express = require('express');
const sqlite3 = require('sqlite3');
const app = express();
const port = 3000;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var logger = require('morgan');
const cors = require('cors');
app.use(cors());

require('dotenv').config();
const db = new sqlite3.Database('./database/mydb.sqlite3', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
});

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1]; // Bearer <token>
  
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: "Token is not valid" });
        }
  
        req.user_id = decoded.user_id; 
        next();
      });
    } else {
      res.status(401).json({ message: "Authorization header is missing" });
    }
};
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, '../react/build')));
app.use(express.json());

app.get('/seats', (req, res) => {
    const { map, date } = req.query;
    const sql = `
        SELECT
        a.seat_id AS seat_id, 
        a.seat_name AS seat_name, 
        a.map AS map, 
        CASE 
            WHEN c.permanent_location IS NULL THEN a.status 
            ELSE 2 
        END AS status, 
        a.loc_x AS loc_x, 
        a.loc_y AS loc_y, 
        a.h AS h, 
        a.w AS w, 
        b.name AS name, 
        b.date AS date,
        c.email AS email,
        c.first_name AS first_name
    FROM 
        (SELECT * 
        FROM seat 
        WHERE map = ?) a 
    LEFT JOIN 
        (SELECT * 
        FROM seat_booking 
        WHERE date = ? AND map = ?) b 
    ON a.seat_id = b.seat_id 
    LEFT JOIN
        (SELECT *
        FROM masterlist) c
    ON a.seat_name = c.permanent_location
    `
    db.all(sql, [map, date, map], (err, result) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        res.json(result);
    })
});

app.post('/switch-seat', verifyToken, (req, res) => {
    const user_id = req.user_id;
    const { seat_id, seat_name, map, name, date } = req.body;
    const updateSql = 'UPDATE seat_booking SET seat_id = ?, seat_name = ?, map = ?, name = ? WHERE user_id = ? AND date = ?';
    db.run(updateSql, [seat_id, seat_name, map, name, user_id, date], function(err) {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        res.json({ message: 'Booking switched successfully', bookingId: this.lastID });
    });
});

app.post('/book-seat', verifyToken, (req, res) => {
    const user_id = req.user_id;
    const { seat_id, seat_name, map, name, date } = req.body;
    const checkUserBookingSql = 'SELECT * FROM seat_booking WHERE user_id = ? AND date = ?';
    const checkSql = 'SELECT * FROM seat_booking WHERE seat_id = ? AND date = ?';
    db.serialize(() => {
        db.run("BEGIN;");
        db.get(checkUserBookingSql, [user_id, date], (err, userBooking) => {
            if (err) {
                res.status(500).send(err.message);
                return;
            }
            if (userBooking) {
                db.run("ROLLBACK;");
                res.json({
                    alreadyBooked: true,
                    currentBooking: userBooking,
                    message: 'You have already booked a seat on this date.'
                });
            } else {
                db.get(checkSql, [seat_id, date], (err, row) => {
                    if (err) {
                        res.status(500).send(err.message);
                        return;
                    }
                    if (row) {
                        db.run("ROLLBACK;");
                        res.status(400).send('This seat is already booked.');
                    } else {
                        const insertSql = 'INSERT INTO seat_booking (seat_id, seat_name, map, user_id, name, date) VALUES (?, ?, ?, ?, ?, ?)';
                        db.run(insertSql, [seat_id, seat_name, map, user_id, name, date], function(err) {
                            if (err) {
                                db.run("ROLLBACK;");
                                res.status(500).send(err.message);
                                return;
                            }
                            db.run("COMMIT;");
                            res.json({ message: 'Booking successful', bookingId: this.lastID });
                        });
                    }
                });
            }
        });
    });
});

function dbAll(sql, params) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function dbRun(sql, params) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
}

app.post('/book-room', verifyToken, async (req, res) => {
    try {
        const user_id = req.user_id;
        const { room_id, room_name, employee_name, event_name, team_size, comment, slot, date } = req.body;
        const checkSql = `SELECT slot FROM room_booking WHERE room_id = ? AND date = ?`;
        const checkUserSql = `SELECT slot FROM room_booking WHERE user_id = ? AND date = ?`;
        const insertSql = 'INSERT INTO room_booking (room_id, room_name, user_id, employee_name, event_name, team_size, comment, slot, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const newSlots = JSON.parse(slot);

        const existingBookings = await dbAll(checkSql, [room_id, date]);
        for (const booking of existingBookings) {
            const existingSlots = JSON.parse(booking.slot);
            if (hasOverlap(existingSlots, newSlots)) {
                return res.json({
                    alreadyBooked: true,
                    currentBooking: existingBookings,
                    message: 'Time Conflict, Please Try Again.'
                });
            }
        }

        const userBookings = await dbAll(checkUserSql, [user_id, date]);
        for (const booking of userBookings) {
            const userSlots = JSON.parse(booking.slot);
            if (hasOverlap(userSlots, newSlots)) {
                return res.json({
                    alreadyBooked: true,
                    currentBooking: userBookings,
                    message: 'Time Conflict, Please Try Again.'
                });
            }
        }

        const result = await dbRun(insertSql, [room_id, room_name, user_id, employee_name, event_name, team_size, comment, JSON.stringify(newSlots), date]);
        return res.json({
            alreadyBooked: false,
            message: 'Booking successful.',
            bookingId: result.lastID 
        }); 
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }

});

function hasOverlap(arr1, arr2) {
    return arr1.some(item => arr2.includes(item));
}

app.get('/search-seats', (req, res) => {
    const {name, date} = req.query;
    const sql = 
    `
    SELECT a.name AS name,
    a.map AS map,
    a.seat_name AS seat_name,
    a.seat_id AS seat_id,
    b.loc_x AS loc_x,
    b.loc_y AS loc_y,
    b.h AS h,
    b.w AS w
    FROM
    (SELECT name, map, seat_name, seat_id
    FROM seat_booking 
    WHERE name LIKE ? AND date = ?) a
    LEFT JOIN 
    (SELECT *
    FROM seat) b
    ON a.seat_id = b.seat_id
    `;
    db.all(sql, [`%${name}%`, date], (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        res.json(rows);
    }) 
})
    
app.get('/meeting-rooms', async (req, res) => {
    const { date } = req.query;
    try {
        const rooms = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM room', [], (err, rooms) => {
                if (err) reject(err);
                else resolve(rooms);
            });
        });

        const bookings = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM room_booking WHERE date = ?', [date], (err, bookings) => {
                if (err) reject(err);
                else resolve(bookings);
            });
        });
        res.json({ roomData: rooms, bookingData: bookings });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/seat-book-stats', verifyToken, async (req, res) => {
    const user_id = req.user_id;
    const { date } = req.query;
    const sql = 
    `
    SELECT DISTINCT a.name
    FROM
    (SELECT *
    FROM seat_booking
    WHERE date = ?) a
    JOIN (
    SELECT *
    FROM employee
    ) b
    ON a.user_id = b.user_id
    JOIN (
    SELECT *
    FROM masterlist
    ) c
    ON LOWER(b.email) = LOWER(c.email)
    JOIN(
        SELECT b.department AS department 
            FROM
            (SELECT *
            FROM employee
            WHERE user_id = ?) a
            JOIN 
            (SELECT * 
            FROM masterlist
            ) b
            ON LOWER(a.email) = LOWER(b.email)
    ) d
    ON c.department = d.department
    `
    try {
        db.all(sql, [date, user_id], (err, result) => {
            if (err) {
                res.status(500).send(err.message);
                return;
            }
            res.json(result);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/current-bookings', verifyToken, async (req, res) => {
    const user_id = req.user_id;
    function getLocalDate() {
        const now = new Date();
        const timezoneOffsetInMinutes = now.getTimezoneOffset();
        const localDate = new Date(now.getTime() - timezoneOffsetInMinutes * 60000);
      
        return localDate.toISOString().split('T')[0];
    }
    const today = getLocalDate();
    try {
        const currentSeat = await new Promise((resolve, reject) => {
            db.all(`
            SELECT a.book_id book_id, a.seat_id seat_id, a.seat_name seat_name, a.map map, a.user_id user_id, a.name name, a.date date, 
            b.loc_x loc_x, b.loc_y loc_y, b.h h, b.w w
            FROM
            (SELECT * 
            FROM seat_booking 
            WHERE user_id = ? AND date >= ? 
            ORDER BY date) a
            LEFT JOIN (
            SELECT seat_id, loc_x, loc_y, h, w
            FROM seat
            ) b
            ON a.seat_id = b.seat_id
            `, [user_id, today], (err, currentSeat) => {
                if (err) reject(err);
                else resolve(currentSeat);
            });
        });

        const currentRoom = await new Promise((resolve, reject) => {
            db.all(`SELECT a.book_id book_id, a.room_id room_id, a.room_name room_name, a.user_id user_id, a.employee_name employee_name, a.event_name event_name, a.team_size team_size, a.comment comment, a.slot slot, a.date date, b.map map FROM (SELECT * FROM room_booking WHERE user_id = ? AND date >= ?) a LEFT JOIN (SELECT * FROM room) b ON a.room_id = b.room_id ORDER BY a.date`, [user_id, today], (err, currentRoom) => {
                if (err) reject(err);
                else resolve(currentRoom);
            });
        });
        res.json({ currentSeat: currentSeat, currentRoom: currentRoom });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../react/build', 'index.html'))
})

app.listen(port, () => {
    console.log(`Server runing on http://localhost:${port}`)
})

function clearOldBooking() {
    const sql1 = "DELETE FROM room_booking WHERE date < DATE('now', '-62 days')"
    db.run(sql1, (err) => {
      if (err) {
        console.error(err.message);
        return;
      }
      console.log('Old Room Booking Records Cleaned');
    });
    const sql2 = "DELETE FROM seat_booking WHERE date <DATE('now', '-62 days')"
    db.run(sql2, (err) => {
      if (err) {
        console.error(err.message);
        return;
      }
      console.log('Old Seat Booking Records Cleaned');
    });
  }
//   setInterval(clearOldBooking, 24 * 60 * 60 * 1000);

app.post('/cancel-seat-booking', (req, res) => {
    const { id } = req.body;
  
    const sql = 'DELETE FROM seat_booking WHERE book_id = ?';
    db.run(sql, [id], function(err) {
      if (err) {
        res.status(500).send('Error cancelling seat booking');
      } else {
        if (this.changes > 0) {
          res.send('Seat booking cancelled successfully');
        } else {
          res.status(404).send('Seat booking not found');
        }
      }
    });
  });
  
app.post('/cancel-room-booking', (req, res) => {
    const { id } = req.body;
  
    const sql = 'DELETE FROM room_booking WHERE book_id = ?';
    db.run(sql, [id], function(err) {
      if (err) {
        res.status(500).send('Error cancelling room booking');
      } else {
        if (this.changes > 0) {
          res.send('Room booking cancelled successfully');
        } else {
          res.status(404).send('Room booking not found');
        }
      }
    });
});

app.post('/create-account', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // encode
        const saltRounds = 10; // bcrypt rounds
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const checkSql = 'SELECT * FROM employee WHERE email = ?';
        db.get(checkSql, [email], (err, row) => {
            if (err) {
                res.status(500).send(err.message);
                return;
            }
            if (row) {
                return res.status(400).json({ message: 'Email already in use' });
            } else {
                const insertSql = 'INSERT INTO employee (nickname, first_name, last_name, email, password) VALUES (?, ?, ?, ?, ?)';
                db.run(insertSql, [name, email.split('@')[0].split('.')[0], email.split('@')[0].split('.')[1], email, hashedPassword], function(err) {
                    if (err) {
                        res.status(500).send(err.message);
                        return;
                    }
                    res.json({ message: 'Account created successfully' });
                });
            }
        });
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ message: 'Error creating account' });
    }
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = `
    SELECT 
    a.user_id AS user_id, 
    a.nickname AS nickname,
    a.first_name AS first_name,
    a.last_name AS last_name,
    a.email AS email,
    a.password AS password,
    b.permission AS permission,
    b.department AS department
    FROM
    (SELECT * 
    FROM employee 
    WHERE email = ?) a
    LEFT JOIN 
    (SELECT *
    FROM masterlist) b
    ON LOWER(a.email) = LOWER(b.email)
    `;
    db.get(query, [email], (err, user) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        bcrypt.compare(password, user.password, (err, match) => {
            if (err) {
                return res.status(500).json({ message: 'Error during password verification' });
            }
            if (!match) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
            const secret = process.env.JWT_SECRET;
            
            if (!secret) {
                return res.status(500).json({ message: 'Secret Key not exist' });
            }

            jwt.sign({ user_id: user.user_id, nickname: user.nickname, first_name: user.first_name, last_name: user.last_name, email: user.email, permission: user.permission, department: user.department }, secret, { expiresIn: '1h' }, (err, token) => {
                if (err) {
                    return res.status(500).json({ message: 'Error generating token' });
                }
                res.json({ token });
            });
        });
    });
});

app.post('/seat-dashboard', (req, res) => {
    const { startDate, endDate } = req.body;

    const sql = `
    SELECT 
        c.department AS department,
        a.first_name AS name,
        b.date AS date,
        CASE 
        WHEN strftime('%w', b.date) = '0' THEN
            strftime('%Y-%m-%d', b.date) || ' ~ ' || strftime('%Y-%m-%d', b.date, '+6 days')
        ELSE
            strftime('%Y-%m-%d', b.date, 'weekday 0', '-7 days') || ' ~ ' || strftime('%Y-%m-%d', b.date, 'weekday 0', '-1 days')
        END AS week,
        strftime('%Y-%m', b.date) AS month,
        strftime('%Y', b.date) 
        || ' Q' 
        || CAST((CAST(strftime('%m', b.date) AS integer) + 2) / 3 AS TEXT) AS quarter,
        CASE strftime('%w', b.date)
            WHEN '0' THEN 'Sunday'
            WHEN '1' THEN 'Monday'
            WHEN '2' THEN 'Tuesday'
            WHEN '3' THEN 'Wednesday'
            WHEN '4' THEN 'Thursday'
            WHEN '5' THEN 'Friday'
            ELSE 'Saturday'
        END AS weekday,
        b.map AS map,
        COUNT(DISTINCT b.book_id) AS cnt
    FROM
        (SELECT *
        FROM employee) a
    LEFT JOIN
        (SELECT *
        FROM seat_booking
        WHERE date BETWEEN ? AND ?) b
    ON a.user_id = b.user_id
    LEFT JOIN
        (SELECT *
        FROM masterlist) c 
    ON LOWER(a.email) = LOWER(c.email)
    GROUP BY 
        c.department, 
        a.first_name, 
        b.date, 
        week, 
        month, 
        quarter, 
        weekday,
        map
    `;

    db.all(sql, [startDate, endDate], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Server error');
            return;
        } else {
            res.json(results);
        }
    });
});

app.post('/room-dashboard', async (req, res) => {
    const { startDate, endDate } = req.body;
    const sql = `
    SELECT c.department AS department, 
    CASE WHEN a.team_size < 6
    THEN 'Small'
    WHEN a.team_size < 11 
    THEN 'Medium'
    ELSE 'Large'
    END AS team_size,
    a.room_name AS room_name,
    CASE strftime('%w', a.date)
        WHEN '0' THEN 'Sunday'
        WHEN '1' THEN 'Monday'
        WHEN '2' THEN 'Tuesday'
        WHEN '3' THEN 'Wednesday'
        WHEN '4' THEN 'Thursday'
        WHEN '5' THEN 'Friday'
        ELSE 'Saturday'
    END AS weekday,
    COUNT(DISTINCT a.book_id) AS cnt
    FROM
    (SELECT *
    FROM room_booking
    WHERE date BETWEEN ? AND ?) a
    LEFT JOIN
    (SELECT *
    FROM employee
    ) b
    ON a.user_id = b.user_id
    LEFT JOIN
    (SELECT *
    FROM masterlist
    ) c
    ON LOWER(b.email) = LOWER(c.email)
    GROUP BY c.department, 
    CASE WHEN a.team_size < 6
    THEN 'Small'
    WHEN a.team_size < 11 
    THEN 'Medium'
    ELSE 'Large'
    END,
    a.room_name,
    CASE strftime('%w', a.date)
        WHEN '0' THEN 'Sunday'
        WHEN '1' THEN 'Monday'
        WHEN '2' THEN 'Tuesday'
        WHEN '3' THEN 'Wednesday'
        WHEN '4' THEN 'Thursday'
        WHEN '5' THEN 'Friday'
        ELSE 'Saturday'
    END
    `;

    try {
        db.all(sql, [startDate, endDate], (err, results) => {
            if (err) {
                res.status(500).send(err.message);
                return;
            }
            res.json(results);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/heatmap', async (req, res) => {
    const { year } = req.body;

    const sql = `
    SELECT 
        c.department AS department,
        b.date AS date,
        COUNT(DISTINCT b.book_id) AS cnt
    FROM
        employee a
    LEFT JOIN
        (SELECT *
        FROM seat_booking
        WHERE date >= ? AND date <= ?) b
    ON a.user_id = b.user_id
    LEFT JOIN
        masterlist c 
    ON LOWER(a.email) = LOWER(c.email)
    GROUP BY 
        c.department, 
        b.date
    `;
    
    const startDate = new Date(year, 0, 1).toISOString().split('T')[0];
    const endDate = new Date(year, 11, 31).toISOString().split('T')[0];
    db.all(sql, [startDate, endDate], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Server error');
            return;
        } else {
            res.json(results);
        }
    });
});

app.post('/available-seats', async (req, res) => {
    try {
        const { date, map } = req.body;
        if (!date || !map) {
            return res.status(400).send('Date and map are required');
        }
        sql = `
        SELECT COUNT(DISTINCT a.seat_id) cnt
        FROM 
        (SELECT *
        FROM seat 
        WHERE map = ?) a
        LEFT JOIN 
        (SELECT *
        FROM seat_booking
        WHERE date = ?) b
        ON a.seat_id = b.seat_id
        LEFT JOIN
        masterlist c
        ON a.seat_name = c.permanent_location
        WHERE b.seat_id IS NULL
        AND c.permanent_location IS NULL
        `
        db.all(sql, [map, date], (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                res.status(500).send('Server error');
                return;
            } else {
                res.json(results);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/admin', async (req, res) => {
    const email = req.body.email;
    const query = 'SELECT * FROM masterlist WHERE LOWER(email) = LOWER(?)';
    db.get(query, [email], (err, user) => {
        if (err) {
            return res.status(500).send('Server error');
        }
        if (!user) {
            return res.status(500).send('invalid email');
        }
        if (user){
            res.json({ employer: user.employer, firstName: user.first_name, lastName: user.last_name, email: user.email, classification: user.classification,
                 department: user.department, permanent_location:user.permanent_location, permission: user.permission  });
        }
   
    });
});



app.post('/update-admin', async (req, res) => {
    const user = req.body.data;
    console.log(user);
    const data = {
        employer: user.employer,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        classification: user.classification,
        department: user.department,
        permanent_location: user.permanent_location,
        permission: user.permission
        };
    const query = 'UPDATE masterlist SET employer = ?, first_name = ?, last_name = ?, email = ?, classification = ?, department = ?, permanent_location = ?, permission = ? WHERE email = ?';

    db.run(query, [data.employer, data.firstName, data.lastName, data.email, data.classification, data.department, data.permanent_location, data.permission, data.email], function(err) {
        if (err) {
            res.status(500).send('Error updating user information: ' + err.message);
            return;
        }
        res.json({ message: 'User information updated successfully', email: data.email });
    });
});