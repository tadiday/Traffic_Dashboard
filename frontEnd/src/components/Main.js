// frontEnd/src/components/Main.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../components/Main.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';


function Main(props) {
    const [username, setUsername] = useState('')
    const [file, setFile] = useState(null);
    const [fileType, setFileType] = useState('summary');
    const [items, setItems] = useState([]);
    const navigate = useNavigate()
    
    useEffect(() => {
        const token = sessionStorage.getItem('token')
        if (!token) {
            navigate('/')
        }
        try {
            const decodedToken = jwtDecode(token); // Decode the JWT
            setUsername(decodedToken.username);
        } catch (error) {
            console.error('Invalid token', error);
        }
        // verify login via token
        fetchItems();  
    }, [navigate])

    function handleFileTypeChange (e) {
        setFileType(e.target.value);
    }
      
    function handleFileChange (e) {
        setFile(e.target.files[0]);
    }

    // Upload function
    const upload = async () => {
        if (!file) {
            alert("Please select a file to upload.");
            return;
        }

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
        const token = sessionStorage.getItem('token');
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}:3000/api/select-uploads`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
            });
            setItems(response.data);
        } catch (error) {
            console.error('Error fetching entries:', error);
        }
        console.log("Got items");
    };

    // Handle logout
    const handleLogout = () => {
        // delete token redirect to login
        sessionStorage.removeItem('token')
        navigate('/')
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


    return (
        <div className="app-container">
          <Navbar username={username} onLogout={handleLogout} />
          <div className="content">
            <Sidebar 
              file={file} 
              fileType={fileType} 
              handleUpload={upload} 
              items={items} 
              removeItem={removeItem}
              handleFileChange={handleFileChange}
              handleFileTypeChange={handleFileTypeChange}
            />
            <div className="main-content">
              <h2>Welcome, {username}!</h2>
              {/* Placeholder for additional content */}
            </div>
            <div id="container"></div>
          </div>
        </div>
    );
}


export default Main