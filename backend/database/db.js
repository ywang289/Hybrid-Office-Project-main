const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./mydb.sqlite3', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
});

module.exports = db;