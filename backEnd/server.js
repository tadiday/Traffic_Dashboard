const express = require('express')
const app = express()
const mysql = require('mysql2');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config(); // Gets environment variables working
// Used for uploading a file, though its not stored locally with this config
const upload = multer();
const crypto = require('crypto');

// Enable CORS so no complaints with FE & BE communication
app.use(cors());
// express.json() middleware is used to parse incoming requests with JSON payloads
app.use(express.json());

// Create a sql connection pool, using mysql 2 its already promise based
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'rootpass',
  database: 'traffic_visual',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise() // Makes the query commands return a promise

// Select files Query
app.get('/api/select-uploads', async (req, res) => {
    var selectQuery = 'SELECT file_name FROM text_files WHERE user_id = ? AND collection_id = ?';
    var userId = 1;
    var collectionId= 1;
    try {
        console.log("Getting files uploaded")
        const [results] = await promisePool.query(selectQuery, [userId, collectionId]);
        const fileNames = results.map(row => row.file_name);
        res.json(fileNames);
      } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
      }
});

// Upload file Query
app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    console.log("Uploading files")
  
    const fileData = req.file.buffer.toString('utf-8');
    const insertQuery = "INSERT INTO text_files (file_type, file_name, user_id, file_content, collection_id) VALUES (?, ?, 1, ?, 1)";
  
    try {
      console.log("Uploading files 1")
      const [results] = await promisePool.query(insertQuery, [req.body.fileType, req.file.originalname, fileData]);
      res.send('File data inserted successfully.');
      console.log('File data inserted successfully.');
    } catch (error) {
      console.error('Error inserting data:', error);
      res.status(500).send('Error inserting data.');
    }
});

// Delete file query
app.post('/api/delete-upload', async (req, res) => {
    let fileName = req.body.fileName;
    console.log('Removing file_name: ', fileName);
    var deleteQuery = "DELETE FROM text_files WHERE file_name = ? LIMIT 1";

    try {
        const [results] = await promisePool.query(deleteQuery, [fileName]);
        res.send("File deletion successful");
        console.log("File deleted");
      } catch (err) {
        console.error('Error deleting data:', err);
        res.status(500).send('Error deleting data.');
      }
});

// Route to login and generate a JWT
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Implement

    if (username === 'user' && password === 'password') {
        const user = { username }; // Payload data for the token

        // Sign the token with the secret key
        const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: '1h' });

        return res.json({ token: encryptedToken });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
});

async function checkUserLogin(username, password) {
    try {
      // Call the stored procedure
      const [rows] = await promisePool.query(
        'CALL CheckUserLogin(?, ?)',
        [username, password]
      );
  
      // Check the value of 'is_valid_user' returned by the procedure
      if (rows.length > 0 && rows[0].is_valid_user === 1) {
        console.log('User is valid');
        return true;  // User exists and credentials are correct
      } else {
        console.log('Invalid username or password');
        return false; // User doesn't exist or credentials are incorrect
      }
    } catch (error) {
      console.error('Error checking user login:', error);
      return false;
    }
  }


app.listen(3000, () => {
    console.log('Server.js App is listening on port 3000');
});

// Closes DB Connections on receiving end signals
const shutdown =  async () => {
    try {
        await pool.end();
        console.log('Connection pool closed.');
        process.exit(0);
      } catch (err) {
        console.error('Error closing connection pool:', err);
        process.exit(1);
      }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);