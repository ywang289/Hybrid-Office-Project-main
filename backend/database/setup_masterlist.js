const db = require('./db');

const xlsx = require('xlsx');
const workbook = xlsx.readFile('./masterlist.xlsx');
sheet1 = workbook.Sheets['Sheet1'];
const masterlist = xlsx.utils.sheet_to_json(sheet1);
/*Permission:
1: every permission
2: HR Manager - Admin everyone > 2, All Seat Dashboard View
3: HR Member - All Seat Dashboard View
4: Department Manager - Admin everyone in Department, Department Seat Dashboard View
5: Department Member - Department Seat Dashboard View
6: Normal User
*/
db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS masterlist`);
    
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

    const insert1 = db.prepare('INSERT INTO masterlist (employer, first_name, last_name, email, classification, department, permanent_location, permission) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

    masterlist.forEach((row) => {
        insert1.run(row['Employer'], row['First_Name'], row['Last_Name'], row['Email'], row['Classification'], row['Department'], row['Permanent_Location'], row['Permission'], function(err) {
            if (err) {
                console.error(err.message);
            } else {
                console.log(`Inserted master with ID: ${this.lastID}`);
            }
        });
    });

    insert1.finalize();
    
});

db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Closed the database connection.');
});