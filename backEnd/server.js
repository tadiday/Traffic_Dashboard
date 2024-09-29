const express = require('express')
const app = express()
const mysql = require('mysql');
const multer = require('multer');
const cors = require('cors');
// Used for uploading a file, though its not stored locally with this config
const upload = multer();

// Enable CORS so no complaints with FE & BE communication
app.use(cors());
// express.json() middleware is used to parse incoming requests with JSON payloads
app.use(express.json());

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

// Test Select Query
app.get('/api/select-uploads', (req, res) => {
    var selectQuery = 'SELECT file_name FROM text_files WHERE user_id = ? AND collection_id = ?';
    var userId = 1;
    var collectionId= 1;
    console.log("Selecting file names.")
    connection.query(selectQuery, [userId, collectionId], (err, results) => {
        if (err) throw err;
        // Transform the results into an array of file names
        const fileNames = results.map(row => row.file_name);
        console.log(fileNames);
        res.json(fileNames);
    });
});

// Upload file Query
app.post('/api/upload', upload.single('file'),(req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    
    const fileData = req.file.buffer.toString('utf-8');

    var InsertQuery = "INSERT INTO text_files (file_type, file_name, user_id, file_content, collection_id) VALUES (?, ?, 1, ?, 1)";
    connection.query(InsertQuery, [req.body.fileType, req.file.originalname,  fileData], (error, results) => {
        if (error) {
            console.error('Error inserting data:', error);
            return res.status(500).send('Error inserting data.');
        }

        res.send('File data inserted successfully.');
        console.log('File data inserted successfully.');
    });
});

app.post('/api/delete-upload', (req, res) => {
    console.log(req.body);
    let fileName = req.body.fileName;
    console.log('Removing file_name: ', fileName);

    var DeleteQuery = "DELETE FROM text_files WHERE file_name = ? LIMIT 1";
    connection.query(DeleteQuery, [fileName], (err, results) => {
        if(err) {
            console.error('Error deleting data:', err);
            return res.status(500).send('Error deleting data.');
        }
        res.send("File deletion successfull");
        console.log("File deleted");
    });
});

app.listen(3000, () => {
    console.log('Server.js App is listening on port 3000');
});

// Closes DB Connections on receiving end signals
const shutdown = () => {
    connection.end((err) => {
        if (err) throw err;
        console.log('Database Connection closed.');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);