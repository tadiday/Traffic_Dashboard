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
     const [[files, big_files],_] = await promisePool.query("SELECT file_type FROM text_files WHERE file_sim = ?; SELECT file_type FROM big_Files WHERE file_sim = ?;", [sim_id, sim_id]);

     // convert returned object to strings
     const fileNames = files.map((file) => (FileTypeToName(file.file_type)));
     const bigFileNames = big_files.map((file) => (FileTypeToName(file.file_type)));
     res.json(fileNames.concat(bigFileNames));

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

    const deleteFileQuery = "DELETE FROM text_files WHERE file_sim = ?; DELETE FROM big_files WHERE file_sim = ?; DELETE FROM simulations WHERE sim_id = ?;";
	await promisePool.query(deleteFileQuery, [sim_id, sim_id, sim_id]);
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

  // make sure its only simple strings
  if(!IsValidUserInfo(req.body.collectionName))
	return res.status(403).send("Invalid username or password");

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
 * Gets a specific file for a specific simulation based
 * on the variables in the request and the constant file type
 * The query value "sim" is specified to be the simulation
 *   id of the simulation being accessed
 */
async function tryGetFile(req, res, fileType, isBig){
	if(!isBig) isBig = 0;

	// get the username
	try{
		var username = verifyToken(req);
		// get the user_id
		var user_id = username.user_id;
	} catch(exception) {
		var user_id = 1;
		// Commented for testing TBD
		//return res.status(500).send("Invalid token");
	}


	try {
		const sim_name = req.query.sim; // to throw exception
		// Get the sim_id based on the sim_name
		let id_query = "SELECT sim_id FROM simulations WHERE sim_name = ?";
		const [[sim_id_json]] = await promisePool.query(id_query, [sim_name]);

		if(!sim_id_json)
			return res.status(500).send("Collection not found");

		const sim_id = sim_id_json.sim_id;

		let query;
		if(isBig)
			query = "SELECT file_owner, file_content FROM big_files WHERE file_type = ? AND file_sim = ?";
		else
			query = "SELECT file_owner, file_content FROM text_files WHERE file_type = ? AND file_sim = ?";
		const [[entry]] = await promisePool.query(query, [fileType, sim_id]);

		if(!entry)
		  return res.status(500).send("File not found");

		if(entry.file_owner != user_id)
			console.log("tryGetFile: Wrong owner! (" + user_id + " != " + entry.file_owner + ")");
		let buf = Buffer.from(entry.file_content);
		let obj = ReadFile_Any(buf, fileType);
		return res.json(obj);
	} catch (err) {
		console.error(err);
		return res.status(500).send("Server Error: Couldn't retrieve directory");
	}
}

/*
 * Gets the summary file
 */
app.get('/api/file-summary', async (req, res) => await tryGetFile(req,res, FILE_SUMMARY));

/*
 * Gets the node file (input file 1)
 */
app.get("/api/file-nodes", async (req, res) => await tryGetFile(req, res, FILE_NODES));

/*
 * Gets the edge file (input file 2)
 */
app.get('/api/file-edges', async (req, res) => await tryGetFile(req, res, FILE_EDGES));

/*
 * Gets the signals file (input file 3)
 */
app.get('/api/file-signals', async (req, res) => await tryGetFile(req, res, FILE_SIGNALS));

/*
 * Gets the shortest paths file (output file 11)
 */
app.get('/api/file-avgconds', async (req, res) => await tryGetFile(req, res, FILE_AVGCONDS));

/*
 * Gets the shortest paths file (output file 13)
 */
app.get('/api/file-paths', async (req, res) => await tryGetFile(req, res, FILE_PATHS, 1));


function IsValidUserInfo(str){
	if(!str || !("" + str === str))
		return 0;
	const len = str.length;
	const n0 = "0".charCodeAt(0);
	const n1 = "9".charCodeAt(0);
	const a0 = "a".charCodeAt(0);
	const a1 = "z".charCodeAt(0);
	const A0 = "A".charCodeAt(0);
	const A1 = "Z".charCodeAt(0);
	for(let i = 0; i < len; i++){
		const c = str.charCodeAt(i);
		if(!(c == " ".charCodeAt(0) || (c >= n0 && c <= n1) || (c >= a0 && c <= a1) || (c >= A0 && c <= A1)))
			return 0;
	}
	return 1;
}

// Route to login and generate a JWT
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login Requested with:', username, password);

    // make sure its only simple strings
    if(!IsValidUserInfo(username) || !IsValidUserInfo(password))
	  return res.status(403).send("Invalid username or password");

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

  // make sure its only simple strings
  if(!IsValidUserInfo(username) || !IsValidUserInfo(password))
	return res.status(403).send("Invalid username or password");

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

const FILE_AVGCONDS = 1;
const FILE_CONDS = 2;
const FILE_PATHS = 3;
const FILE_SUMMARY = 4;
const FILE_NODES = 7;
const FILE_EDGES = 8;
const FILE_SIGNALS = 9;


/*
 * Reads floats from a nodejs buffer and puts them into
 *   an object at specific names
 * @param obj (table) Where the resulting values are placed into
 * @param names (string[]) The indexs, in order, that the values should put at in the object/table
 * @param buf (nodejs buffer) The buffer to read from
 * @param off (int) The offset in the buffer to read from
 * @return (int) The resulting offset from all of the reads
 */
function ReadFromBufFloats(obj, names, buf, off){
  for(let i = 0; i < names.length; i++){
  	obj[names[i]] = buf.readFloatLE(off);
  	off += 4;
  }
  return off;
}

/*
 * Reads ints from a nodejs buffer and puts them into
 *   an object at specific names
 * @param obj (table) Where the resulting values are placed into
 * @param names (string[]) The indexs, in order, that the values should put at in the object/table
 * @param buf (nodejs buffer) The buffer to read from
 * @param off (int) The offset in the buffer to read from
 * @return (int) The resulting offset from all of the reads
 */
function ReadFromBufInts(obj, names, buf, off){
  for(let i = 0; i < names.length; i++){
  	obj[names[i]] = buf.readInt32LE(off);
  	off += 4;
  }
  return off;
}

/*
 * Reads shorts from a nodejs buffer and puts them into
 *   an object at specific names
 * @param obj (table) Where the resulting values are placed into
 * @param names (string[]) The indexs, in order, that the values should put at in the object/table
 * @param buf (nodejs buffer) The buffer to read from
 * @param off (int) The offset in the buffer to read from
 * @return (int) The resulting offset from all of the reads
 */
function ReadFromBufShorts(obj, names, buf, off){
  for(let i = 0; i < names.length; i++){
  	obj[names[i]] = buf.readInt16LE(off);
  	off += 2;
  }
  return off;
}

/*
 * Reads a string from a nodejs buffer that was written
 *   with WriteString().
 * The string should be stored by a single byte specifying
 *   its length, then the actual string
 * @param buf (nodejs buffer) The buffer to read from
 * @param off (int) The offset to read from
 * @return ([int, string]) The resulting offset and string
 */
function ReadString(buf, off){
  const len = buf.readInt8(off);
  const tag = buf.toString("ascii", off + 1, off + 1 + len);
  return [off + 1 + len, tag];
}

/*
 * Reads some number of shorts from a buffer and makes an
 *   array of them. A "short" is 2 bytes
 * @param buf (nodejs buffer) The buffer to read from
 * @param len (int) The number of shorts to read
 * @param off (int) The initial offset in "buf" to read from
 * @return ([int, int[]]) The resulting offset and array
 */
function ReadFromBufShortArray(buf, len, off){
	let arr = new Array(len);
	for(let i = 0; i < len; i++)
		arr[i] = buf.readInt16LE(off + 2 * i);
	return [off + 2 * len, arr];
}

/*
 * Same as ReadFromBufShortArray(), but with floats
 */
function ReadFromBufFloatArray(buf, len, off){
	let arr = new Array(len);
	for(let i = 0; i < len; i++)
		arr[i] = buf.readFloatLE(off + 4 * i);
	return [off + 4 * len, arr];
}



/*
 * Reads an input as a summary file.
 * @param buf (nodejs buffer) The nodejs buffer to read from
 * @return (table) The summary file as a table/object
 */
function ReadFile_summary(buf){
	const SUMMARY_TAGS = [
		"vehicle trips", "person trips", "vehicle-km", "person-km", "vehicle-stops", "vehicle-secs",
		"person-secs", "total delay", "stopped delay", "accel/decel delay", "accel-noise", "fuel (l)", "Energy (KWh)",
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
 * Reads an input as input file 1 (node file)
 * @param buf (nodejs buffer) The nodejs buffer to read from
 * @return (table) The summary file as a table/object
 */
function ReadFile_edges(buf){
	let out = {};

	// define and read initial values
	out.count = buf.readInt16LE(0);
	out.lengthScale = buf.readFloatLE(2);
	out.freeSpeedScale = buf.readFloatLE(6);
	out.flowRateScale = buf.readFloatLE(10);
	out.capSpeedScale = buf.readFloatLE(14);
	out.jamScale = buf.readFloatLE(18);
	out.edges = new Array(out.count);

	// read each node
	let off = 22;
	for(let i = 0; i < out.count; i++){
	  let node = {};
	  off = ReadFromBufShorts(node, ["id", "start", "end"], buf, off);
	  off = ReadFromBufFloats(node, ["length", "freeSpeed", "satFlowRate", "numOfLanes", "speedVar", "capSpeed", "jamDensity"], buf, off);
	  off = ReadFromBufShorts(node, ["prohIndc"], buf, off);
	  off = ReadFromBufInts(node, ["enableTime", "disableTime"], buf, off);
	  off = ReadFromBufShorts(node, ["oppose1", "oppose2", "signal", "phase1", "phase2", "vehProhIndc", "survLevel"], buf, off);
	  [off, node.tag] = ReadString(buf, off);
	  out.edges[i] = node;
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
 * Reads an input as output file 11 (average traffic conditions file)
 * @param buf (nodejs buffer) The nodejs buffer to read from
 * @return (table) The summary file as a table/object
 */
function ReadFile_AvgConditions(buf){
	let out = {};

	let off = 0;
	out.time = buf.readInt32LE(off + 0);

	const edgeCount = buf.readInt16LE(off + 4);
	out.flow = Array(edgeCount).fill({});
	out.conditions = Array(edgeCount).fill({});

	// 5s6fsssssss7ffffffffffff6fffAffffff9ffffff
	// 5s7s5sss7s5sss7s5sss7s5sss7s5sss

	const countA = buf.readInt16LE(off + 6);
	off += 8;

	for(let i = 0; i < countA; i++){
		let obj = {};
		const index = buf.readInt16LE(off) - 1;		
		obj.edgeID = index+1;
		obj.length = buf.readFloatLE(off + 2);
		off = ReadFromBufShorts(obj, ["baseCapacity", "totalFlow"], buf, off + 6);
		[off, obj["flow"]] = ReadFromBufShortArray(buf, 5, off);
		off = ReadFromBufFloats(obj, ["freeSpeedTime", "totalAverageTime"],  buf, off);
		[off, obj["averageTime"]] = ReadFromBufFloatArray(buf, 5, off);
		[off, obj["averageToll"]] = ReadFromBufFloatArray(buf, 5, off);
		off = ReadFromBufFloats(obj, ["averageVehicles", "averageQueue", "averageStops"],  buf, off);
		off = ReadFromBufFloats(obj, ["fuel", "HC", "CO", "NO", "CO2", "PM"],  buf, off);
		off = ReadFromBufFloats(obj, ["expectedCrashes", "expectedTopInjurt", "fatelCrashes", "crashLowDamage", "crashMedDamage", "crashHighDamage"],  buf, off);
		out.conditions[index] = obj;
	}

	const countB = buf.readInt16LE(off);
	off += 2;

	for(let i = 0; i < countB; i++){
		let obj = {};
		const index = buf.readInt16LE(off) - 1;
		obj.edgeId = index + 1;
		off+=2;
		obj.direction = new Array(5).fill({});

		for(let ii = 0; ii < 5; ii++){
			obj.direction[ii] = {};
			off = ReadFromBufShorts(obj.direction[ii], ["leftTurn", "through", "rightTurn", "total"], buf, off);
			
		}
		out.flow[index] = obj;
	}

	return out;
}


function ReadFile_Conditions(buf){
	let out = {};

	let off = 0;
	out.periodCount = buf.readInt16LE(off + 0);
	out.time = buf.readInt32LE(off + 2);
	out.edgeCount = buf.readInt16LE(off + 6);
	out.edgeMaxID = buf.readInt16LE(off + 8);
	off += 10;

	out.periods = new Array(out.periodCount);
	for(let i = 0; i < out.periodCount; i++){
		let periodObj = {};
		periodObj.time = buf.readInt32LE(off + 0);
		periodObj.index = buf.readInt16LE(off + 4);
		off += 6;

		periodObj.edges = Array(out.edgeMaxID + 1).fill({});
		for(let ii = 0; ii < out.edgeCount; ii++){

		}

	}

	const edgeCount = buf.readInt16LE(off + 4);
	out.flow = Array(edgeCount + 1).fill([]);
	out.conditions = Array(edgeCount + 1).fill({});

	// 5s6fsssssss7ffffffffffff6fffAffffff9ffffff
	// 5s7s5sss7s5sss7s5sss7s5sss7s5sss

	const countA = buf.readInt16LE(off + 6);
	off += 8;

	for(let i = 0; i < countA; i++){
		let obj = {};
		const index = buf.readInt16LE(off);
		obj.length = buf.readFloatLE(off + 2);
		off = ReadFromBufShorts(obj, ["baseCapacity", "totalFlow"], buf, off + 6);
		[off, obj["flow"]] = ReadFromBufShortArray(buf, 5, off);
		off = ReadFromBufFloats(obj, ["freeSpeedTime", "totalAverageTime"],  buf, off);
		[off, obj["averageTime"]] = ReadFromBufFloatArray(buf, 5, off);
		[off, obj["averageToll"]] = ReadFromBufFloatArray(buf, 5, off);
		off = ReadFromBufFloats(obj, ["averageVehicles", "averageQueue", "averageStops"],  buf, off);
		off = ReadFromBufFloats(obj, ["fuel", "HC", "CO", "NO", "CO2", "PM"],  buf, off);
		off = ReadFromBufFloats(obj, ["expectedCrashes", "expectedTopInjurt", "fatelCrashes", "crashLowDamage", "crashMedDamage", "crashHighDamage"],  buf, off);
		out.conditions[index] = obj;
	}

	const countB = buf.readInt16LE(off);
	off += 2;

	for(let i = 0; i < countB; i++){
		const index = buf.readInt16LE(off);
		off+=2;
		out.flow[index] = new Array(5).fill({});
		for(let ii = 0; ii < 5; ii++){
			out.flow[index][ii] = {};
			off = ReadFromBufShorts(out.flow[index][ii], ["leftTurn", "through", "rightTurn", "total"], buf, off);
		}
	}

	return out;
}

/*
 * Reads an input as output file 13 (min path file)
 * @param buf (nodejs buffer) The nodejs buffer to read from
 * @return (table) The summary file as a table/object
 */
function ReadFile_paths(buf){
	let out = {};

	// define and read initial values
	out.periodCount = buf.readInt16LE(0);
	out.time = buf.readInt32LE(2);
	let off = ReadFromBufShorts(out, ["maxOriginID", "originCount", "maxDestID", "edgeCount", "maxEdgeID"], buf, 6);

	out.periods = new Array(out.periodCount);
	for(let i = 0; i < out.periodCount; i++){
		let periodObj = {};
		periodObj.index = buf.readInt16LE(off + 0)
		const periodVal2 = 1; // off + 2
		periodObj.treeCount = buf.readInt8(off + 3);
		off += 4;

		periodObj.paths = new Array(periodObj.treeCount);
		for(let ii = 0; ii < periodObj.treeCount; ii++){
			let treeObj = {};
			treeObj.treeVal1 = buf.readInt8(off + 0);
			treeObj.proportion = buf.readFloatLE(off + 1);
			treeObj.index = buf.readInt8(off + 5);
			off += 6;

			treeObj.origins = new Array(out.maxOriginID).fill([]);
			treeObj.edges = new Array(out.maxEdgeID).fill([]);

			for(let Q = 0; Q < out.originCount; Q++){
				const indx = buf.readInt16LE(off);
				[off, treeObj.origins[Q]] = ReadFromBufShortArray(buf, out.maxDestID, off + 2);
			}

			for(let Q = 0; Q < out.edgeCount; Q++){
				const indx = buf.readInt16LE(off);
				[off, treeObj.edges[Q]] = ReadFromBufShortArray(buf, out.maxDestID, off + 2);
			}
			periodObj.paths[ii] = treeObj;
		}
		out.periods[i] = periodObj;
	}

	return out;
}

/*
 * Reads a file from a nodejs buffer based on type.
 * This returns whatever the corresponding function
 *   would return, which is (probably) an object/table
 * @param buf (nodejs buffer) The buffer to read from
 * @param fileType (int) The file type to read as. Use the FILE_ constants for this
 * @return (table) The interpretation of the file from the buffer
 * @throws Probably something if you use this wrong
 */
function ReadFile_Any(buf, fileType){
	switch(fileType){
		case FILE_NODES: return ReadFile_nodes(buf);
		case FILE_EDGES: return ReadFile_edges(buf);
		case FILE_SIGNALS: return ReadFile_signals(buf);
		case FILE_SUMMARY: return ReadFile_summary(buf);
		case FILE_AVGCONDS: return ReadFile_AvgConditions(buf);
		case FILE_PATHS: return ReadFile_paths(buf);
	}
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
 * Reads some number of elements from an array and writes
 *   them to a buffer.
 * This uses nodejsBuffer.writeFloatLE() and parseFloat()
 * @param args (String[]) The array to read from
 * @param indx (int) The starting index in the array to read from
 * @param count (int) The number of elements to read, write
 * @param buf (nodejs buffer) The buffer to write to
 * @param off (int) The starting offset in the buff to write to
 * @return (int) The resulting offset in the buffer after all writes
 */
function CopyToBufFloats(args, indx, count, buf, off){
	for(let i = indx; i < indx + count; i++)
		off = buf.writeFloatLE(parseFloat(args[i]), off);
	return off;
}

/*
 * Reads some number of elements from an array and writes
 *   them to a buffer.
 * This uses nodejsBuffer.writeInt32LE() and parseInt()
 * @param args (String[]) The array to read from
 * @param indx (int) The starting index in the array to read from
 * @param count (int) The number of elements to read, write
 * @param buf (nodejs buffer) The buffer to write to
 * @param off (int) The starting offset in the buff to write to
 * @return (int) The resulting offset in the buffer after all writes
 */
function CopyToBufInts(args, indx, count, buf, off){
	for(let i = indx; i < indx + count; i++)
		off = buf.writeInt32LE(parseInt(args[i]), off);
	return off;
}

/*
 * Reads some number of elements from an array and writes
 *   them to a buffer.
 * This uses nodejsBuffer.writeInt16LE() and parseInt()
 * @param args (String[]) The array to read from
 * @param indx (int) The starting index in the array to read from
 * @param count (int) The number of elements to read, write
 * @param buf (nodejs buffer) The buffer to write to
 * @param off (int) The starting offset in the buff to write to
 * @return (int) The resulting offset in the buffer after all writes
 */
function CopyToBufShorts(args, indx, count, buf, off){
	for(let i = indx; i < indx + count; i++)
		off = buf.writeInt16LE(parseInt(args[i]), off);
	return off;
}

/*
 * Writes a string to a file by writing the length as 1 byte
 *   and then the actual string as format "ascii"
 * @param buf (nodejs buffer) The buffer to write to
 * @param str (string) The string to write
 * @param off (int) The offset in the buffer to write to
 * @return (int) The resulting offset in the buffer
 */
function WriteString(buf, str, off){
  buf.writeInt8(str.length, off);
  buf.write(str, off + 1, str.length + 1, "ascii");
  return off + str.length + 1;
}

/*
 * bruh
 * a bunch of nonsense
 */
function CopyToBufLine(line, buf, off, format){
	let curOff = 0;
	let curLen = 1;
	for(let i = 0; i < format.length; i++){
		let c = format.charCodeAt(i);
		if(c <= "9".charCodeAt(0)){ // set length from [0, 9]
			curLen = c - "0".charCodeAt(0);
		}else if(c <= "Z".charCodeAt(0)){ // set length from [10, ...]
			curLen = 10 + c - "A".charCodeAt(0);
		}else{ // read value
			let val = line.substring(curOff, curOff + curLen);
			let ch = format.charAt(i);
			if(ch != "_"){ // "_" means ignore a value
				let num;
				if(val.charAt(0) == "*") // invalid value
					num = -1;
				else if(ch == "s" || ch == "i") // short
					num = parseInt(val);
				else if(ch == "f") // float
					num = parseFloat(val);
				switch(ch){
					case "s": // short
						off = buf.writeInt16LE(num, off);
					break;
					case "i": // int
						off = buf.writeInt32LE(num, off);
					break;
					case "f": // float
						off = buf.writeFloatLE(num, off);
					break;
				}
			}
			curOff += curLen;
		}
	}
	return off;
}

function GetLineFormatSize(format){
	let size = 0;
	for(let i = 0; i < format.length; i++){
		switch(format.charAt(i)){
			case "s":
				size += 2;
			break;
			case "i": case "f":
				size += 4;
			break;
		}
	}
	return size;
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
	  const [ret] = await promisePool.query("SELECT file_index FROM text_files WHERE file_type = ? AND file_sim = ?", [FILE_NODES, sim_id]);
	  if(ret.length != 0)
		return;
	}catch(e){
	  return;
	}

	const initArgs = ReadLineArgs(lines[1]);
	// console.log(" Node Coordinate file params: "lines[0] +"\n"+lines[1] + " " + initArgs[0]);
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
	    bonusSize += args.slice(5).reduce((hoard, next) => (hoard + next.length + 1), 0);
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
		const tag = args.slice(6).join(" ");
		off = WriteString(buf, tag, off);
	}


	const query = "INSERT INTO text_files (file_type, file_content, file_owner, file_sim) VALUES (?, ?, ?, ?)";
	pool.query(query, [FILE_NODES, buf, user_id, sim_id]);
}

/*
 * Reads the edge file from an array of lines and
 *  writes it into the database with the corresponding
 *  simulation and user owners
 * @param user_id (int) The user id of whom that uploaded the file
 * @param sim_id (int) The id of the simulation this file is a part of
 * @param lines (string[]) The file as an array of lines
 */
async function WriteFile_Input2(user_id, sim_id, lines){

	// make sure doesn't already exist
	try{
	  const [ret] = await promisePool.query("SELECT file_index FROM text_files WHERE file_type = ? AND file_sim = ?", [FILE_EDGES, sim_id]);
	  if(ret.length != 0)
		return;
	}catch(e){
	  return;
	}

	const initArgs = ReadLineArgs(lines[1]);
	const edgeC = parseInt(initArgs[0]);

	// count the extra size
	let bonusSize = 0;
	for(let i = 0; i < edgeC; i++){
	  lines[2 + i] = lines[2 + i].trim();
	  const args = ReadLineArgs(lines[2 + i]);
	  if(args.length > 20){
	    bonusSize += args.slice(20).reduce((hoard, next) => (hoard + next.length + 1), 0);
	  }
	}

	// create the buffer
	// (2 + 4*5) + (2*3 + 4*7 + 2 + int*2 + 2*7 + 1 + x)
	let buf = Buffer.allocUnsafe(22 + 59 * edgeC + bonusSize);
	buf.writeInt16LE(edgeC, 0);
	CopyToBufFloats(initArgs, 1, 5, buf, 2);

	// read the lines
	let off = 22;
	for(let i = 0; i < edgeC; i++){
		let args = ReadLineArgs(lines[2 + i]);

		off = CopyToBufShorts(args, 0, 3, buf, off);
		off = CopyToBufFloats(args, 3, 7, buf, off);
		off = CopyToBufShorts(args, 10, 1, buf, off);
		off = CopyToBufInts(args, 11, 2, buf, off);
		off = CopyToBufShorts(args, 13, 7, buf, off);
		const tag = args.slice(20).join(" ");
		off = WriteString(buf, tag, off);
	}

	const query = "INSERT INTO text_files (file_type, file_content, file_owner, file_sim) VALUES (?, ?, ?, ?)";
	pool.query(query, [FILE_EDGES, buf, user_id, sim_id]);
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


async function WriteFile_AvgConditions(user_id, sim_id, lines){

	try{
		const [ret] = await promisePool.query("SELECT file_index FROM text_files WHERE file_type = ? AND file_sim = ?", [FILE_AVGCONDS, sim_id]);
		if(ret.length != 0)
			return;
	}catch(e){
		return;
	}


	let formatType; // distributed of provided formated file
	let lineA0 = -1, lineA1 = -1; // start and of the first section
	let lineB0, lineB1; // start and end of the second secction
	for(let i = 0; i < lines.length; i++){
		if(lineA0 == -1){
			if(lines[i].length == 269 || lines[i].length == 312){
				lineA0 = i;
				formatType = (lines[i].length == 270) ? 1 : 0;
			}
		}else{
			if(lines[i].trim() === "Turning movements by dir and veh class"){
				lineA1 = i;
				break;
			}
		}
	}
	lineB0 = lineA1 + 2;
	lineB1 = lines.length;

	const formatA = formatType ?
		"5s6fsssssss7ffffffffffff6fffAffffff9ffffff" : // distributed
		"5s6fsssssss7ffffffffffff5_6fffEffffff_9ffffff"; // provided
	const formatB = "5s7s5sss7s5sss7s5sss7s5sss7s5sss";

	const entryASize = GetLineFormatSize(formatA);
	const entryBSize = GetLineFormatSize(formatB);
	const lineCA = lineA1 - lineA0;
	const lineCB = lineB1 - lineB0;
	const totalSize = entryASize * lineCA + entryBSize * lineCB + 4 + 2 + 2 + 2;

	let off = 0;
	let buf = Buffer.allocUnsafe(totalSize);

	let initArgs = ReadLineArgs(lines[lineB0 - 1].trim());
	console.log(initArgs);
	off = buf.writeInt32LE(parseInt(initArgs[0]), off); // sim time
	off = buf.writeInt16LE(parseInt(initArgs[1]), off); // max edge ID

	off = buf.writeInt16LE(lineCA, off);
	for(let i = 0; i < lineCA; i++)
		off = CopyToBufLine(lines[lineA0 + i], buf, off, formatA);

	off = buf.writeInt16LE(lineCB, off);
	for(let i = 0; i < lineCB; i++)
		off = CopyToBufLine(lines[lineB0 + i], buf, off, formatB);

	const query = "INSERT INTO text_files (file_type, file_content, file_owner, file_sim) VALUES (?, ?, ?, ?)";
	pool.query(query, [FILE_AVGCONDS, buf, user_id, sim_id]);
}

async function WriteFile_Conditions(user_id, sim_id, lines){

	try{
		const [ret] = await promisePool.query("SELECT file_index FROM text_files WHERE file_type = ? AND file_sim = ?", [FILE_CONDS, sim_id]);
		if(ret.length != 0)
			return;
	}catch(e){
		return;
	}

	let initArgs = ReadLineArgs(lines[1].trim());
	const periodC = parseInt(initArgs[0]);
	const edgeC = parseInt(initArgs[2]);

	const format = "8s9f8sssssss9fffffffCffffffffKffGffffffCfffffffCffffff"; //9

	const formatSize = GetLineFormatSize(format);
	const periodSize = formatSize * edgeC + 4 + 2;
	const totalSize = 2 + 4 + 2 + 2 + periodSize * periodC;

	let off = 0;
	let buf = Buffer.allocUnsafe(totalSize);

	off = buf.writeInt16LE(parseInt(initArgs[0])); // period count
	off = buf.writeInt32LE(parseInt(initArgs[1]), off); // sim time
	off = buf.writeInt16LE(parseInt(initArgs[2]), off); // edge count
	off = buf.writeInt16LE(parseInt(initArgs[3]), off); // max edge ID

	let curLine = 2;
	for(let i = 0; i < periodC; i++){
		const lineArgs = ReadLineArgs(lines[curLine].trim());
		off = buf.writeInt32LE(parseInt(lineArgs[0]));
		off = buf.writeInt16LE(parseInt(lineArgs[1]));
		for(let ii = 0; ii < edgeC; ii++)
			off = CopyToBufLine(lines[curLine + 1 + ii], buf, off, format);
		curLine += edgeC + 1;
	}

	const query = "INSERT INTO text_files (file_type, file_content, file_owner, file_sim) VALUES (?, ?, ?, ?)";
	pool.query(query, [FILE_CONDS, buf, user_id, sim_id]);
}


/*
 * Reads the min path file from an array of lines and
 *  writes it into the database with the corresponding
 *  simulation and user owners
 * @param user_id (int) The user id of whom that uploaded the file
 * @param sim_id (int) The id of the simulation this file is a part of
 * @param lines (string[]) The file as an array of lines
 */
async function WriteFile_MinTree(user_id, sim_id, lines){
	// make sure doesn't already exist
	try{
	  const [ret] = await promisePool.query("SELECT file_index FROM big_files WHERE file_type = ? AND file_sim = ?", [FILE_PATHS, sim_id]);
	  if(ret.length != 0)
		return;
	}catch(e){
	  return;
	}

	// 0 numberOfPeriods
	// 1 time
	// 2 maxStartID
	// 3 startCount
	// 4 endCount/maxEndID
	// 5 edgeCount
	// 6 maxEdgeID

	// period index
	// number of trees per proportion thing?
	// number of "trees" in this section

	// number of trees in proportion? (always 1? matches with)
	// proportion
	// index of section

	const initArgs = ReadLineArgs(lines[1].trim());
	const periodC = parseInt(initArgs[0]);
	const startC = parseInt(initArgs[3]);
	const endC = parseInt(initArgs[4]);
	const edgeC = parseInt(initArgs[5]);

	const entriesPerTree = startC + edgeC;
	const linesPerEntry = Math.floor((endC + 14) / 15);
	const linesPerTree = entriesPerTree * linesPerEntry + 1;
	const bytesPerTree = 1 + 4 + 1 + ((endC + 1) * entriesPerTree) * 2;

	// size of base line
	let varSize = (2 + 4 + 2 + 2 + 2 + 2 + 2);
	let curLine = 2;
	for(let i = 0; i < periodC; i++){
		const args = ReadLineArgs(lines[curLine].trim());
		const treeC = parseInt(args[2]);
		// size of period info + size of trees
		varSize += (2 + 1 + 1) + bytesPerTree * treeC;
		curLine += linesPerTree * treeC + 1;
	}

	let off = 0;
	let buf = Buffer.allocUnsafe(varSize);
	off = CopyToBufShorts(initArgs, 0, 1, buf, off);
	off = CopyToBufInts(initArgs, 1, 1, buf, off);
	off = CopyToBufShorts(initArgs, 2, 5, buf, off);

	curLine = 2;
	for(let i = 0; i < periodC; i++){
		const periodArgs = ReadLineArgs(lines[curLine].trim());
		const periodIndx = parseInt(periodArgs[0]);
		const treeC = parseInt(periodArgs[2]);

		if(periodIndx != i + 1){
			console.log("Bad file13: period " + periodIndx + " != " + (i + 1));
			throw "bad file13: period indx";
		}

		off = buf.writeInt16LE(periodIndx, off);
		off = buf.writeInt8(parseInt(periodArgs[1]), off);
		off = buf.writeInt8(treeC, off);
		curLine++;

		for(let ii = 0; ii < treeC; ii++){
			const treeArgs = ReadLineArgs(lines[curLine].trim());
			off = buf.writeInt8(parseInt(treeArgs[0]), off);
			off = buf.writeFloatLE(parseFloat(treeArgs[1]), off);
			off = buf.writeInt8(parseInt(treeArgs[2]), off);
			curLine++;

			for(let Q = 0; Q < entriesPerTree; Q++){
				for(let QQ = 0; QQ < linesPerEntry; QQ++){
					const entryArgs = ReadLineArgs(lines[curLine].trim());
					off = CopyToBufShorts(entryArgs, 0, entryArgs.length, buf, off);
					curLine++;
				}
			}
		}
	}

	const query = "INSERT INTO big_files (file_type, file_content, file_owner, file_sim) VALUES (?, ?, ?, ?)";
	await promisePool.query(query, [FILE_PATHS, buf, user_id, sim_id]);
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
		//console.log(lines[0]);
		if(lines[1] === " Total Statistics: ")
			return await WriteFile_summary(user_id, sim_id, lines);

		const argC = lines[1].trim().split(/\s+/).length;
		if(argC == 3){
			// can either be input file 1 or 3
			if(lines[2].trim().split(/\s+/).length == 1)
			  await WriteFile_Input3(user_id, sim_id, lines);
			else if(lines[0].includes("Node Coordinate File"))
			  await WriteFile_Input1(user_id, sim_id, lines);
			return
		}else if(argC == 6)
		  return await WriteFile_Input2(user_id, sim_id, lines);
		else if(argC == 7)
		  return await WriteFile_MinTree(user_id, sim_id, lines);
		else if(lines[1].length == 312 || lines[1].length == 269)
		  return await WriteFile_AvgConditions(user_id, sim_id, lines);

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






