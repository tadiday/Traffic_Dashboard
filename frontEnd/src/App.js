// frontEnd/src/App.js

import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  // File upload state
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('summary');
  const [items, setItems] = useState([]);

  // Handle login
  const handleLogin = (username) => {
    setUsername(username);
    setIsLoggedIn(true);
    fetchItems();
  };

  // Handle logout
  const handleLogout = () => {
    setUsername('');
    setIsLoggedIn(false);
    setItems([]);
    setFile(null);
    setFileType('summary');
  };

  // Upload function
  const upload = async () => {
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    console.log("Upload button clicked");
    const formData = new FormData();
    formData.append('file', file);
    console.log("File Type: ", fileType);
    formData.append('fileType', fileType);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}:3000/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('File uploaded successfully:', response.data);
      // Update the items
      fetchItems();
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Fetch items
  const fetchItems = async () => {
    console.log("Fetching items at", `${process.env.REACT_APP_API_URL}:3000/api/select-uploads`);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}:3000/api/select-uploads`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
    console.log("Got items");
  };

  // Remove item
  const removeItem = async (index) => {
    // Remove the item from the DB
    let fileName = items[index];

    console.log("Removing item:", fileName);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}:3000/api/delete-upload`, { fileName });
    } catch (error) {
      console.error('Error removing item:', error);
    }
    // Get the updated items
    fetchItems();
  };

  // Initial fetch if logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchItems();
    }
  }, [isLoggedIn]);

  // Main App View
  const mainView = (
    <div className="app-container">
      <Navbar username={username} onLogout={handleLogout} />
      <div className="content">
        <Sidebar 
          file={file} 
          setFile={setFile} 
          fileType={fileType} 
          setFileType={setFileType} 
          handleUpload={upload} 
          items={items} 
          removeItem={removeItem} 
        />
        <div className="main-content">
          <h2>Welcome, {username}!</h2>
          {/* Placeholder for additional content */}
        </div>
      </div>
    </div>
  );

  return (
    <div className="App">
      {isLoggedIn ? mainView : <Login onLogin={handleLogin} />}
    </div>
  );
}

export default App;
