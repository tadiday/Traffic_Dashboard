const express = require('express')
const app = express()
const mysql = require('mysql');

// Create a sql connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'rootpass',
  database: 'traffic_visual'
});
// Connect to the DB
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to the database!');
});

app.get('/api/select', (req, res) => {
    var selectQuery = 'SELECT * FROM text_files WHERE user_id = ?';
    var userId = 1;

    connection.query(selectQuery, [userId], (err, results) => {
        if (err) throw err;
        console.log('Records found:', results);
    });

    console.log("Selected");
});


app.get('/api/insert', (req, res) => {

    console.log("Inserting");
    res.status(200).json({message: "You got em"});
});

app.listen(3000, () => {
    console.log('Server.js App is listening on port 3000');
});

// Closes DB Connections on receiving end signals
const shutdown = () => {
    connection.end((err) => {
        if (err) throw err;
        console.log('Database Connection closed.');
    });
    console.log('Closed out remaining connections');
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);