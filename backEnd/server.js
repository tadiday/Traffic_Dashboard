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
  queueLimit: 0,
  multipleStatements: true
});

const promisePool = pool.promise() // Makes the query commands return a promise

/*
 * Takes a request object and tries to get a valid username from it
 * @param req (app.get/post req) The request to read from
 * @return The username found
 * @throws If there is no "token" or the "token" is invalid, and object is thrown ({status, message})
 */
function verifyToken(req) {
  const token = req.headers['authorization'];
  if (!token) {
	throw { status: 403, message: 'No token provided!' };
  }
  const actualToken = token.split(' ')[1];

  try{
	  let decoded = jwt.verify(actualToken, process.env.SECRET_KEY);
	  if (!decoded) {
		throw { status: 401, message: 'Failed to authenticate token.' };
	  }

	  return decoded;
  }catch(err){
  	throw { status: 401, message: "Login Token has expired" };
  }
}

// Verifies User token
app.get('/api/verify-token', async (req, res) => {
  try{
  	let username = verifyToken(req).username;
  	res.status(200).json({ message: 'Token is valid', username: username });
  } catch(exception) {
  	console.log(exception);
  	res.status(exception.status).json({ message: exception.message });
  }
});



// Gets Collection Names associated with the token
app.get('/api/get-collections', async (req, res) => {
  try{
  	//var username = verifyToken(req);
  	var user_id = verifyToken(req).user_id;
  } catch(exception){
	return res.status(exception.status).json({ message: exception.message });
  }

  try{

  	const [sims] = await promisePool.query("SELECT sim_name FROM simulations WHERE sim_owner = ?", [user_id]);

	// reduce from simulation info to just simulation name
  	const simNames = sims.map((sim) => sim.sim_name);
  	return res.json(simNames);

  } catch (err) {
    console.error("Error getting collections:", err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


/*
 * Gets the directory for the logged in user, returning an array
 * of objects with values: "sim_name", "sim_date", "sim_id"
 */
app.get("/api/get-directory", async (req, res) => {
  try{
  	var user_id = verifyToken(req).user_id;
  } catch(exception){
	return res.status(exception.status).json({ message: exception.message });
  }

  try{

  	const [sims] = await promisePool.query("SELECT sim_name, sim_date, sim_id FROM simulations WHERE sim_owner = ?", [user_id]);

  	return res.json(simNames);

  } catch (err) {
    console.error("Error getting collections:", err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Selects file names from a given collection_name and username from verified token
app.get('/api/select-uploads', async (req, res) => {

    // get the username
    try{
      var user_id = verifyToken(req).user_id;
    } catch(exception) {
      return res.status(exception.status).json({ message: exception.message });
    }

    // query database and stuff
    try{
     const sim_name = req.query.collection_name;

     if(!sim_name)
		return res.status(400).send("Missing simulation name");

     // bad, but this entire thing is bad
     const [[{sim_id}]] = await promisePool.query("SELECT sim_id FROM simulations WHERE sim_owner = ? AND sim_name = ?", [user_id, sim_name]);
     const [files] = await promisePool.query("SELECT file_type FROM text_files WHERE file_sim = ?", [sim_id]);

     // convert returned object to strings
     const fileNames = files.map((file) => (FileTypeToName(file.file_type)));
     res.json(fileNames);

    }catch(err){
	  console.error(err);
      res.status(500).send('Server Error');
    }
});

// Delete Collection query
app.post('/api/delete-collection', async (req, res) => {

  // get the username
  try{
    var user_id = verifyToken(req).user_id;
  } catch(exception) {
  	if(!exception.status)
		exception.status = 500;
    return res.status(exception.status).json({ message: exception.message });
  }

  try {
  	const {collection_name} = req.query;

    // bad, but this entire thing is bad
    const [[{sim_id}]] = await promisePool.query("SELECT sim_id FROM simulations WHERE sim_owner = ? AND sim_name = ?", [user_id, collection_name]);

    const deleteFileQuery = "DELETE FROM text_files WHERE file_sim = ?";
	const deleteSimQuery = "DELETE FROM simulations WHERE sim_id = ?";
	var awaitA = promisePool.query(deleteFileQuery, [sim_id]);
	var awaitB = promisePool.query(deleteSimQuery, [sim_id]);
	await awaitA;
	await awaitB;
	res.send("File deletion successful");
  } catch (err) {
	console.error('Error deleting data:', err);
	res.status(500).send('Error deleting data.');
  }
});

// Delete file query - Removed
app.post('/api/delete-upload', async (req, res) => {

  // get the username
  try{
    var user_id = verifyToken(req).user_id;
  } catch(exception) {
    return res.status(exception.status).json({ message: exception.message });
  }

  try{
    // delete file
    await promisePool.query("DELETE FROM text_files where file_name = ? AND file_owner = ?", [req.body.fileName, user_id])

  	res.send("File deletion successful");
  }catch(err){
  	console.error('Error deleting data:', err);
    res.status(500).send('Error deleting data.');
  }
});

// Upload file Query
app.post('/api/upload', upload.single('file'), async (req, res) => {

  // make sure a file was actually uploaded
  if(!req.file)
	return res.status(400).send('No file uploaded.');

  // Check if the uploaded file is a zip file
  const file = req.file;
  if (file.mimetype !== 'application/zip' && file.mimetype !== 'application/x-zip-compressed')
    return res.status(400).send('Please upload a valid zip file.');

  // get the username
  try{
    var user_id = verifyToken(req).user_id;
  } catch(exception) {
    return res.status(exception.status).json({ message: exception.message });
  }

  // try and create the simulation document
  try {

	const name = req.body.collectionName;
	const date = (new Date()).toLocaleString();
	const simInsert = "INSERT INTO simulations (sim_name, sim_date, sim_owner) VALUES (?, ?, ?); SELECT LAST_INSERT_ID();";
	var [[_,[sim_id]]] = await promisePool.query(simInsert, [name, date, user_id]);
	sim_id = sim_id["LAST_INSERT_ID()"];

	console.log("Simulation: " + sim_id);

	//res.send('File data inserted successfully.');
  } catch (error) {
	console.error('Error inserting data:', error);
	return res.status(500).send('Error inserting data.');
  }


  // try and read the actual zip file
  try{
    const zip = new AdmZip(file.buffer);
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
      if (!entry.isDirectory) {
		try{
          const fileContent = entry.getData().toString('ascii');
		  await ReadFile(user_id, sim_id, fileContent);
		}catch(e){console.error("ERRORRR", e);/* not a text file? (ignore it)*/}
      }
    }
  }catch(err){
	console.error("Error reading zip file: ", err);
	return res.status(500).send("Error reading data.");
  }

  res.send('File data inserted successfully.');
});

/*
 * Gets the summary file for a specific simulation
 * The query value "sim" is specified to be the simulation
 *   id of the simulation being accessed
 */
app.get('/api/file-summary', async (req, res) => {

  // get the username
  try{
   var username = verifyToken(req);

   // get the user_id
	try{
  	  // get user_id
  	  var [[{user_id}]] = await promisePool.query("SELECT user_id FROM users WHERE username = ?", [username]);
	}catch(err){
      return res.status(500).send("No such user");
	}
  } catch(exception) {
    var user_id = 1;
    //return res.status(exception.status).json({ message: exception.message });
  }


	try {
		const sim_id = parseInt(req.query.sim); // to throw exception
		const query = "SELECT file_owner, file_content FROM text_files WHERE file_type = 4 AND file_sim = ?";
		const [[entry]] = await promisePool.query(query, [sim_id]);

		if(!entry)
		  return res.status(500).send("File not found");

		if(entry.file_owner != user_id)
			console.log("file-summary: Wrong owner! (" + user_id + " != " + entry.file_owner + ")");
		let buf = Buffer.from(entry.file_content);
		let obj = ReadFile_summary(buf);
		res.json(obj);
	} catch (err) {
		console.error(err);
		res.status(500).send("Server Error: Couldn't retrieve directory");
	}
});


/*
 * Gets input file 1 (node file) for a specific simulation
 * The query value "sim" is specified to be the simulation
 *   id of the simulation being accessed
 */
app.get("/api/file-nodes", async (req, res) => {

  // get the username
  try{
   var username = verifyToken(req);

   // get the user_id
	try{
  	  // get user_id
  	  var [[{user_id}]] = await promisePool.query("SELECT user_id FROM users WHERE username = ?", [username]);
	}catch(err){
      return res.status(500).send("No such user");
	}
  } catch(exception) {
    var user_id = 1;
    //return res.status(exception.status).json({ message: exception.message });
  }


	try {
		const sim_id = parseInt(req.query.sim); // to throw exception
		const query = "SELECT file_owner, file_content FROM text_files WHERE file_type = 7 AND file_sim = ?";
		const [[entry]] = await promisePool.query(query, [sim_id]);

		if(!entry)
		  return res.status(500).send("File not found");

		if(entry.file_owner != user_id)
			console.log("file-summary: Wrong owner! (" + user_id + " != " + entry.file_owner + ")");
		let buf = Buffer.from(entry.file_content);
		let obj = ReadFile_nodes(buf);
		res.json(obj);
	} catch (err) {
		console.error(err);
		res.status(500).send("Server Error: Couldn't retrieve directory");
	}
});

/*
 * Gets input file 1 (node file) for a specific simulation
 * The query value "sim" is specified to be the simulation
 *   id of the simulation being accessed
 */
app.get('/api/file-signals', async (req, res) => {

  // get the username
  try{
   var username = verifyToken(req);

   // get the user_id
	try{
  	  // get user_id
  	  var [[{user_id}]] = await promisePool.query("SELECT user_id FROM users WHERE username = ?", [username]);
	}catch(err){
      return res.status(500).send("No such user");
	}
  } catch(exception) {
    var user_id = 1;
    //return res.status(exception.status).json({ message: exception.message });
  }


	try {
		const sim_id = parseInt(req.query.sim); // to throw exception
		const query = "SELECT file_owner, file_content FROM text_files WHERE file_type = ? AND file_sim = ?";
		const [[entry]] = await promisePool.query(query, [FILE_SIGNALS, sim_id]);

		if(!entry)
		  return res.status(500).send("File not found");

		if(entry.file_owner != user_id)
			console.log("file-summary: Wrong owner! (" + user_id + " != " + entry.file_owner + ")");
		let buf = Buffer.from(entry.file_content);
		let obj = ReadFile_signals(buf);
		res.json(obj);
	} catch (err) {
		console.error(err);
		res.status(500).send("Server Error: Couldn't retrieve directory");
	}
});

// Route to login and generate a JWT
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login Requested with:', username, password);

    try{
      const [[user]] = await promisePool.query("SELECT user_id FROM users WHERE username = ? AND password = ?", [username, password]);

      // username pair does not exist
      if(!user){
		console.log('Invalid username or password');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Sign the token with the secret key
      const userInfo = { username: username, user_id: user.user_id}; // Payload data for the token
      const token = jwt.sign(userInfo, process.env.SECRET_KEY, { expiresIn: '1h' });

      return res.json({ token: token });

    }catch(err){
      console.error('Error checking user login:', error);
      return res.status(401).json({ message: 'Query Failed' });
    }
});

// Route to register a new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
      // Check if the username already exists
      const [[{existingUser}]] = await promisePool.query("SELECT EXISTS( SELECT * FROM users WHERE username = ?)", [username]);
      console.log(existingUser);

      if (existingUser) {
          return res.status(409).json({ message: 'Username already exists' });
      }

      // Insert new user
      await promisePool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
      return res.status(201).json({ message: 'User created successfully. Please log in.' });
  } catch (error) {
      console.error('Error registering user:', error);
      return res.status(500).json({ message: 'Server error' });
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




// file read and write functions //

const FILE_SUMMARY = 4;
const FILE_NODE = 7;
const FILE_EDGES = 8;
const FILE_SIGNALS = 9;

/*
 * Reads an input as a summary file.
 * @param buf (nodejs buffer) The nodejs buffer to read from
 * @return (table) The summary file as a table/object
 */
function ReadFile_summary(buf){
	const SUMMARY_TAGS = [
		"vehicle trips", "person trips", "vehicle-km", "person-km", "vehicle-stops", "vehicle-secs",
		"person-secs", "total delay", "stopped delay", "accel/decel delay", "accel-noise", "fuel (l)",
		"HC (g)", "CO (g)", "NOx (g)", "CO2 (g)", "PM (g)", "crashes*10e-6",
		"injury crashes", "fatal crashes", "no damage", "minor damage", "moderate damage", "dollars of toll"
	];

	let out = {total:{}, average:{}};
	let off = -4;

	// read the total
	for(let i = 0; i < 24; i++){
		let line = [1,2,3,4,5,6];
		for(let ii = 0; ii < 6; ii++)
			line[ii] = buf.readFloatLE(off += 4);
		out.total[SUMMARY_TAGS[i]] = line;
	}

	// read the average
	for(let i = 0; i < 24; i++){
		let line = [1,2,3,4,5,6];
		for(let ii = 0; ii < 6; ii++)
			line[ii] = buf.readFloatLE(off += 4);
		out.average[SUMMARY_TAGS[i]] = line;
	}

	return out;
}


/*
 * Reads an input as input file 1 (node file)
 * @param buf (nodejs buffer) The nodejs buffer to read from
 * @return (table) The summary file as a table/object
 */
function ReadFile_nodes(buf){
	let out = {};

	// define and read initial values
	out.count = buf.readInt16LE(0);
	out.xScale = buf.readFloatLE(2);
	out.yScale = buf.readFloatLE(6);
	out.nodes = [];

	// read each node
	let off = 10;
	for(let i = 0; i < out.count; i++){
	  let node = {};
	  node.id = buf.readInt16LE(off + 0);
	  node.x = buf.readFloatLE(off + 2);
	  node.y = buf.readFloatLE(off + 6);
	  node.type = buf.readInt8(off + 10);
	  node.zone = buf.readInt16LE(off + 11);
	  const info = buf.readFloatLE(off + 13);
	  if(info != 0) node.info
	  const tagLen = buf.readInt8(off + 17);
	  if(tagLen > 0){
	  	node.tag = buf.toString("ascii", off + 18, off + 18 + tagLen);
	  }
	  off += 18 + tagLen;
	  out.nodes[i] = node;
	}

	return out;
}


/*
 * Reads an input as input file 1 (signals file)
 * @param buf (nodejs buffer) The nodejs buffer to read from
 * @return (table) The summary file as a table/object
 */
function ReadFile_signals(buf){
	let out = {};

	// define and read initial values
	const signalCount = buf.readInt16LE(0);
	out.planCount = buf.readInt16LE(2);
	out.planTime = buf.readInt16LE(4);
	out.planNumber = buf.readInt16LE(6);
	out.signals = [];

	// read each node
	let off = 8;
	for(let i = 0; i < signalCount; i++){
	  let node = {};
	  node.signalNum = buf.readFloatLE(off + 0);
	  node.baseTime = buf.readFloatLE(off + 4);
	  node.minTime = buf.readFloatLE(off + 8);
	  node.maxTime = buf.readFloatLE(off + 12);
	  node.signalOff = buf.readInt16LE(off + 16);
	  node.splitFreq = buf.readInt16LE(off + 18);
	  const phaseCount = buf.readInt8(off + 20);
	  node.phases = [];
	  for(let ii = 0; ii < phaseCount; ii++){
		node.phases[ii] = [];
		node.phases[ii][0] = buf.readFloatLE(off + 21 + ii*8);
		node.phases[ii][1] = buf.readFloatLE(off + 25 + ii*8);
	  }
	  out.signals[i] = node;
	  off += 21 + 8 * phaseCount;
	}

	return out;
}


/*
 * Splits a string by any number of white space.
 * Written as a function so I don't have to remember
 *  the nonsense format required to do this
 * @param line (string) The line to split into arguments
 * @return (string[]) The input split by its whitespaces
 */
function ReadLineArgs(line){
	return line.split(/\s+/);
}

/*
 * Reads the summary file from an array of lines and
 *  writes it into the database with the corresponding
 *  simulation and user owners
 * @param user_id (int) The user id of whom that uploaded the file
 * @param sim_id (int) The id of the simulation this file is a part of
 * @param lines (string[]) The file as an array of lines
 */
 async function WriteFile_summary(user_id, sim_id, lines){

	// make sure doesn't already exist
	try{
	  const [ret] = await promisePool.query("SELECT file_index FROM text_files WHERE file_type = ? AND file_sim = ?", [FILE_SUMMARY, sim_id]);
	  if(ret.length != 0)
		return;
	}catch(e){
	  console.error(e);
	  return;
	}

	let buf = Buffer.allocUnsafe(1152);
	// 6*4 numbers + 17 string for 48 lines -> (24 + 17) * 48 = 1968

	// write total stats
	let off = 0;
	for(let i = 0; i < 24; i++){
		const nums = lines[i + 2].substring(3, 87).trim();
		const args = ReadLineArgs(nums);
		for(let ii = 0; ii < 6; ii++)
			off = buf.writeFloatLE(parseFloat(args[ii]), off);
	}

	// write average stats
	for(let i = 0; i < 24; i++){
		const nums = lines[i + 28].substring(3, 87).trim();
		const args = ReadLineArgs(nums);
		for(let ii = 0; ii < 6; ii++)
			off = buf.writeFloatLE(parseFloat(args[ii]), off);
	}

	const query = "INSERT INTO text_files (file_type, file_content, file_owner, file_sim) VALUES (?, ?, ?, ?)";
	pool.query(query, [FILE_SUMMARY, buf, user_id, sim_id]);
}

/*
 * Reads the node file from an array of lines and
 *  writes it into the database with the corresponding
 *  simulation and user owners
 * @param user_id (int) The user id of whom that uploaded the file
 * @param sim_id (int) The id of the simulation this file is a part of
 * @param lines (string[]) The file as an array of lines
 */
async function WriteFile_Input1(user_id, sim_id, lines){

	// make sure doesn't already exist
	try{
	  const [ret] = await promisePool.query("SELECT file_index FROM text_files WHERE file_type = ? AND file_sim = ?", [FILE_NODE, sim_id]);
	  if(ret.length != 0)
		return;
	}catch(e){
	  return;
	}

	const initArgs = ReadLineArgs(lines[1]);
	const nodeC = parseInt(initArgs[0]);
	const xScale = parseFloat(initArgs[1]);
	const yScale = parseFloat(initArgs[2]);

	// a line has a base size of 17 + 1

	// count the extra size
	let bonusSize = 0;
	for(let i = 0; i < nodeC; i++){
	  lines[2 + i] = lines[2 + i].trim();
	  const args = ReadLineArgs(lines[2 + i]);
	  if(args.length > 5){
	    bonusSize += args.reduce((hoard, next) => (hoard + next.length + 1), 0);
	  }
	}

	// create the buffer
	let buf = Buffer.allocUnsafe(18 * nodeC + bonusSize + 10);
	buf.writeInt16LE(nodeC, 0);
	buf.writeFloatLE(xScale, 2);
	buf.writeFloatLE(yScale, 6);

	// read the lines
	let off = 10;
	for(let i = 0; i < nodeC; i++){
		let args = ReadLineArgs(lines[2 + i]);
		off = buf.writeInt16LE(parseInt(args[0]), off);
		off = buf.writeFloatLE(parseFloat(args[1]), off);
		off = buf.writeFloatLE(parseFloat(args[2]), off);
		off = buf.writeInt8(parseInt(args[3]), off);
		off = buf.writeInt16LE(parseInt(args[4]), off);
		off = buf.writeFloatLE(parseFloat(args[5]), off);
		if(args.length > 5){
		  const tag = args.slice(6).join(" ");
		  buf.writeInt8(tag.length, off);
		  buf.write(tag, off+1, tag.length + 1, "ascii");
		  off += tag.length + 1;
		}else{
		  off = buf.writeInt8(0, off);
		}
	}


	const query = "INSERT INTO text_files (file_type, file_content, file_owner, file_sim) VALUES (?, ?, ?, ?)";
	pool.query(query, [FILE_NODE, buf, user_id, sim_id]);
}

/*
 * Reads the signal file from an array of lines and
 *  writes it into the database with the corresponding
 *  simulation and user owners
 * @param user_id (int) The user id of whom that uploaded the file
 * @param sim_id (int) The id of the simulation this file is a part of
 * @param lines (string[]) The file as an array of lines
 */
async function WriteFile_Input3(user_id, sim_id, lines){

	// make sure doesn't already exist
	try{
	  const [ret] = await promisePool.query("SELECT file_index FROM text_files WHERE file_type = ? AND file_sim = ?", [FILE_SIGNALS, sim_id]);
	  if(ret.length != 0)
		return;
	}catch(e){
	  return;
	}

	const initArgs = ReadLineArgs(lines[1]);
	const signalC = parseInt(initArgs[0]);
	const planC = parseInt(initArgs[1]);
	const planTime = parseInt(initArgs[2]);
	const planNumber = parseInt(lines[2].trim());

	// calculate entry variable size
	let varSize = 0;
	for(let i = 0; i < signalC; i++){
	  const args = ReadLineArgs(lines[3 + i].trim());
	  varSize += 8 * parseInt(args[5]);
	}

	// create the buffer
	// 2 + 2 + 2 + 2 = 8
	// 4 + 4 + 4 + 4 + 2 + 1 + 2 = 21
	let buf = Buffer.allocUnsafe(8 + 21 * signalC + varSize);
	buf.writeInt16LE(signalC, 0);
	buf.writeInt16LE(planC, 2);
	buf.writeInt16LE(planTime, 4);
	buf.writeInt16LE(planNumber, 6);

	// read the lines
	let off = 8;
	for(let i = 0; i < signalC; i++){
		let args = ReadLineArgs(lines[3 + i]);
		off = buf.writeFloatLE(parseFloat(args[0]), off);
		off = buf.writeFloatLE(parseFloat(args[1]), off);
		off = buf.writeFloatLE(parseFloat(args[2]), off);
		off = buf.writeFloatLE(parseFloat(args[3]), off);
		off = buf.writeInt16LE(parseInt(args[4]), off);
		off = buf.writeInt16LE(parseFloat(args[-1]), off);
		const phaseC = parseFloat(args[5]);
		off = buf.writeInt8(phaseC, off);
		for(let ii = 0; ii < phaseC; ii++){
		  off = buf.writeFloatLE(parseFloat(args[6 + ii*2]), off);
		  off = buf.writeFloatLE(parseFloat(args[7 + ii*2]), off);
		}
	}


	const query = "INSERT INTO text_files (file_type, file_content, file_owner, file_sim) VALUES (?, ?, ?, ?)";
	pool.query(query, [FILE_SIGNALS, buf, user_id, sim_id]);
}

/*
 * Takes a file as a string, determines which file it
 *   is, then reads it according to this conclusion and
 *   writes the output into the database at the specified
 *   user and simulation owners
 * @param user_id (int) The user id of whom that uploaded the file
 * @param sim_id (int) The id of the simulation this file is a part of
 * @param str (string) The file as a string
 */
async function ReadFile(user_id, sim_id, str){
	try{

		const lines = str.split(/\r?\n/); // end of line, but can work with only \n

		if(lines[1] === " Total Statistics: ")
			await WriteFile_summary(user_id, sim_id, lines);

		const argC = lines[1].trim().split(/\s+/).length;
		if(argC == 3){
			// can either be input file 1 or 3
			if(lines[2].trim().split(/\s+/).length == 1)
			  await WriteFile_Input3(user_id, sim_id, lines);
			else
			  await WriteFile_Input1(user_id, sim_id, lines);
		}

		/*const args = lines[1].split(/\s+/);
		const argC = args.length - 1; // any number of spaces; -1 because lines start with a space
		if(argC == 4){
			console.log("" + sim_id + ": 11, 12");
		}else if(argC == 7){
			console.log("" + sim_id + ": 13");
		}else if(argC == 29){
			console.log("" + sim_id + ": 15");
		}else if(argC == 33){ // should be 34?
			console.log("" + sim_id + ": 16");
		}else{
			console.log("" + sim_id + ": No: " + argC);
			//console.log(args);
		}*/
	}catch(error){
		console.error("Couldnt read file: ", error);
	}
	// 4 -> file 11, 12
	// 7 -> file 13
	// 29 -> file 15
	// 34 -> file 16
	// 3 -> file 1, 3
	//   line 2: 1 -> 3
	// 6 -> file 2

}

function FileTypeToName(fileType){
  const FILE_NAMES = [
	/*0*/"Simulation Details",
	/*1*/"Average Traffic Conditions",
	/*2*/"Traffic Conditions",
	/*3*/"Paths",
	/*4*/"Summary",
	/*5*/"Trip Completion Probes",
	/*6*/"Road Probes",
	/*7*/"Nodes",
	/*8*/"Edges",
	/*9*/"Signals"
  ];
  return FILE_NAMES[fileType];
}

function FileNumToFileType(fileNum){
  switch(fileNum){
  	case 10: return 0;
  	case 11: return 1;
  	case 12: return 2;
  	case 13: return 3;
  	case 1:  return 4;
  	case 15: return 5;
  	case 16: return 6;

  }
}





