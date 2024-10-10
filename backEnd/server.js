const express = require('express')
const app = express()
const mysql = require('mysql2');
const multer = require('multer');
const cors = require('cors');
const AdmZip = require('adm-zip');
//const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config(); // Gets environment variables working
// Used for uploading a file, though its not stored locally with this config
const upload = multer();

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

// Returns the username of the token if it is valid
function verifyToken(req, callback) {
  const token = req.headers['authorization'];
  if (!token) {
    return callback({ status: 403, message: 'No token provided!' });
  }
  const actualToken = token.split(' ')[1];

  jwt.verify(actualToken, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return callback({ status: 401, message: 'Failed to authenticate token.' });
    }
    callback(null, decoded.username);  // Pass username with no error
  });
}

// Verifies User token
app.get('/api/verify-token', async (req, res) => {
  verifyToken(req, (err, username) => {
    if (err) {
      return res.status(err.status).json({ message: err.message });
    }
    res.status(200).json({ message: 'Token is valid', username: username });
  });
});

// Gets Collections associated with the token
app.get('/api/get-collections', async (req, res) => {
  verifyToken(req, async (err, username) => {
    if (err) {
      return res.status(err.status).json({ message: err.message });
    }
    
    try {
      const [rows] = await promisePool.query('SELECT collection_name FROM collections c JOIN users u ON c.user_id = u.user_id WHERE username = ?', [username]);
      
      // If no collections found
      if (!rows.length) {
        return res.json([]); // No collections, return empty array
      }
      
      // Extract collection names
      const collectionNames = rows.map(row => row.collection_name);
      return res.json(collectionNames);
      
    } catch (err) {
      console.error("Error getting collections:", err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
});

// Selects files from a given collection_name and username from verified token
app.get('/api/select-uploads', async (req, res) => {
    const { collection_name } = req.query;
    // Verify the token
    verifyToken(req, async (err, username) => {
      if (err) {
        return res.status(err.status).json({ message: err.message });
      } // Username is not null
      console.log('GET collections uploaded by:', username);
      
      var selectQuery = 'SELECT tf.file_name FROM text_files tf JOIN collections c ON tf.collection_id = c.collection_id JOIN users u ON c.user_id = u.user_id WHERE u.username = ? AND c.collection_name = ?';
      try {
          const [results] = await promisePool.query(selectQuery, [username, collection_name]);
          const fileNames = results.map(row => row.file_name);
          res.json(fileNames);
      } catch (err) {
          console.error(err);
          res.status(500).send('Server Error');
      }
    });   
});

// Delete Collection query
app.post('/api/delete-collection', async (req, res) => {
  const { collection_name } = req.query;

  // Verify the token
  verifyToken(req, async (err, username) => {
    if (err) {
      return res.status(err.status).json({ message: err.message });
    } // Username is not null

    console.log('Removing collection:', collection_name);

    try {
      const [results] = await promisePool.query(
        "SELECT collection_id FROM collections c JOIN users u ON c.user_id = u.user_id WHERE u.username = ? AND c.collection_name = ?",
        [username, collection_name]
      );

      if (!results.length) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      const collection_id = results[0].collection_id;

      // Delete from text_files
      await promisePool.query("DELETE FROM text_files WHERE collection_id = ?", [collection_id]);

      // Delete from collections
      await promisePool.query("DELETE FROM collections WHERE collection_id = ?", [collection_id]);

      return res.json({ message: 'Collection deleted successfully' });

    } catch (err) {
      console.error("Error deleting collection:", err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
});

// Delete file query - Removed
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

// Upload file Query
app.post('/api/upload', upload.single('file'), async (req, res) => {
  const collectionName = req.body.collectionName;
  if (!req.file) {
      return res.status(400).send('No file uploaded.');
  }
  const file = req.file;
  
  // Check if the uploaded file is a zip file
  if (file.mimetype !== 'application/zip' && file.mimetype !== 'application/x-zip-compressed') {
      return res.status(400).send('Please upload a valid zip file.');
  }

  const zip = new AdmZip(file.buffer);
  const zipEntries = zip.getEntries();
  
  // Run file Integrity verification here, identify file types and ensure one of each kind
    // TBD if necessary ask Client
  //
  // Verify the token
  verifyToken(req, async (err, username) => {
    if (err) {
      return res.status(err.status).json({ message: err.message });
    } // Username is not null
    try{
      // Step 1: Get user_id
      const [userResult] = await promisePool.query('SELECT user_id FROM users WHERE username = ?', [username]);
      if (userResult.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      const userId = userResult[0].user_id;

      // Step 2: Insert into collections
      await promisePool.query('INSERT INTO collections (collection_name, user_id) VALUES (?, ?)', [collectionName, userId]);

      // Step 3: Get collection_id
      const [collectionResult] = await promisePool.query('SELECT collection_id FROM collections WHERE collection_name = ? AND user_id = ?', [collectionName, userId]);
      if (collectionResult.length === 0) {
          return res.status(404).json({ message: 'New collection not found' });
      }
      const collectionId = collectionResult[0].collection_id;

      // Step 4: Insert into text_files
      for (const entry of zipEntries) {
        if (!entry.isDirectory) {
            const fileContent = entry.getData().toString('utf8');
            const insertQuery = "INSERT INTO text_files (file_type, file_name, file_content, collection_id) VALUES (?, ?, ?, ?)";
            await promisePool.query(insertQuery, [' ', path.basename(entry.entryName), fileContent, collectionId]);
        } 
      }
      res.send('File data inserted successfully.');
      console.log('File data inserted successfully.');
    } catch (error) {
      console.error('Error inserting data:', error);
      res.status(500).send('Error inserting data.');
    }
  });       
});

// Route to login and generate a JWT
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login Requested with:', username, password)
    try {
        // Call the stored procedure
        const [rows] = await promisePool.query(
          'CALL CheckUserLogin(?, ?)',
          [username, password]
        );
        //console.log(rows)
        // Check the value of 'is_valid_user' returned by the procedure
        if (rows.length > 0 && rows[0][0].is_valid_user === 1) {
          console.log('User is valid');
          // Generate token
          const user = { username }; // Payload data for the token

          // Sign the token with the secret key
          const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: '1h' });

          return res.json({ token: token });
        } else {
          console.log('Invalid username or password');
          return res.status(401).json({ message: 'Invalid credentials' });
        }
      } catch (error) {
        console.error('Error checking user login:', error);
        return res.status(401).json({ message: 'Query Failed' });
    }
});

app.listen(3000, () => {
    console.log('Server.js App is listening on port 3000');
});

// Closes DB Connections on receiving end signals
const shutdown = async () => {
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