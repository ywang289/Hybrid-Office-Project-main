const db = require('./db');

const rooms = [
    { room_name: 'room1', map: 'f1n', status: 1, room_size: 3, equipment: 'None', loc_x: 40, loc_y: 30},
    { room_name: 'room2', map: 'f2n', status: 1, room_size: 7, equipment: 'Screen, Desktop', loc_x: 40, loc_y: 30},
    { room_name: 'room3', map: 'f3n', status: 1, room_size: 4, equipment: 'None', loc_x: 40, loc_y: 30},
    { room_name: 'room4', map: 'f1n', status: 1, room_size: 7, equipment: 'Screen, Desktop', loc_x: 40, loc_y: 30},
    { room_name: 'room5', map: 'f2n', status: 1, room_size: 7, equipment: 'Screen, Desktop', loc_x: 40, loc_y: 30},
    { room_name: 'room6', map: 'f2n', status: 1, room_size: 9, equipment: 'Screen', loc_x: 40, loc_y: 30},
    { room_name: 'room7', map: 'f1n', status: 1, room_size: 7, equipment: 'Screen', loc_x: 40, loc_y: 30},
    { room_name: 'room8', map: 'f1n', status: 1, room_size: 6, equipment: 'None', loc_x: 40, loc_y: 30},
    { room_name: 'room9', map: 'f1n', status: 1, room_size: 5, equipment: 'None', loc_x: 40, loc_y: 30},
    { room_name: 'room10', map: 'f1n', status: 1, room_size: 7, equipment: 'Screen, Desktop', loc_x: 40, loc_y: 30},
    { room_name: 'room11', map: 'f1n', status: 1, room_size: 3, equipment: 'None', loc_x: 40, loc_y: 30},
]

db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS room`);

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

    const insert = db.prepare('INSERT INTO room (room_name, map, status, room_size, equipment, loc_x, loc_y) VALUES (?, ?, ?, ?, ?, ?, ?)');

    for (const room of rooms) {
        insert.run(room.room_name, room.map, room.status, room.room_size, room.equipment, room.loc_x, room.loc_y, function(err) {
            if (err) {
                console.error(err.message);
            } else {
                console.log(`Inserted room with ID: ${this.lastID}`);
            }
        });
    }
    insert.finalize();
});

db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Closed the database connection.');
});