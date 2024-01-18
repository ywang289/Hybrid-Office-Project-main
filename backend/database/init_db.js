const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./mydb.sqlite3', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the mydb.sqlite database.');
});



db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS seat`);
  db.run(`DROP TABLE IF EXISTS room`);
  db.run(`DROP TABLE IF EXISTS employee`);
  db.run(`DROP TABLE IF EXISTS seat_booking`);
  db.run(`DROP TABLE IF EXISTS room_booking`);
  db.run(`DROP TABLE IF EXISTS masterlist`);
  
  //masterlist
  db.run(`
    CREATE TABLE masterlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employer VARCHAR(255),
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        classification VARCHAR(255),
        department VARCHAR(255),
        permanent_location VARCHAR(255),
        permission INTEGER
    )
    `);

  //seat
  db.run(`
  CREATE TABLE seat (
    seat_id INTEGER PRIMARY KEY AUTOINCREMENT,
    seat_name VARCHAR(50) NOT NULL,
    map VARCHAR(50) NOT NULL,
    status INT NOT NULL,
    loc_x FLOAT NOT NULL,
    loc_y FLOAT NOT NULL,
    h FLOAT NOT NULL,
    w FLOAT NOT NULL
    )
  `);

  //room
  db.run(`
  CREATE TABLE room (
    room_id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_name VARCHAR(50) NOT NULL,
    map VARCHAR(50) NOT NULL,
    status INT NOT NULL,
    room_size INT NOT NULL,
    equipment VARCHAR(255),
    loc_x FLOAT NOT NULL,
    loc_y FLOAT NOT NULL
    )
  `);

  //employee
  db.run(`
  CREATE TABLE employee (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
    )
  `);

  //seat_booking
  db.run(`
    CREATE TABLE seat_booking (
      book_id INTEGER PRIMARY KEY AUTOINCREMENT,
      seat_id INTEGER NOT NULL,
      seat_name VARCHAR(50) NOT NULL,
      map VARCHAR(50) NOT NULL,
      user_id INTEGER NOT NULL,
      name VARCHAR(50) NOT NULL,
      date DATE NOT NULL
      )
    `);

  //room_booking
  db.run(`
  CREATE TABLE room_booking (
    book_id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    room_name VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL,
    employee_name VARCHAR(50) NOT NULL,
    event_name VARCHAR(255),
    team_size INTEGER NOT NULL,
    comment VARCHAR(255),
    slot TEXT NOT NULL,
    date DATE NOT NULL
    )
  `);
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Closed the database connection.');
});