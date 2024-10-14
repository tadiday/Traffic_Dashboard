// frontEnd/src/components/Main.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../components/Main.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';  // Make sure this is the correct import
import Charts from '../components/Charts';

function Main(props) {
    const [username, setUsername] = useState('');
    const [file, setFile] = useState(null);
    const [collectionName, setCollectionName] = useState('');
    const [items, setItems] = useState([]);
    const navigate = useNavigate();
    
    // Get items and username
    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            navigate('/');
        }
        try {
            const decodedToken = jwtDecode(token); // Decode the JWT
            setUsername(decodedToken.username);
        } catch (error) {
            console.error('Invalid token', error);
        }
        // Fetch collections after verifying token
        fetchItems();
    }, [navigate]);

    function handleNameChange(e) {
        setCollectionName(e.target.value);
    }
      
    function handleFileChange(e) {
        setFile(e.target.files[0]);
    }

    // Upload Function
    const upload = async () => {
        const token = sessionStorage.getItem('token');
        if (!file) {
            alert("Please select a zip file to upload.");
            return;
        }
    
        if (file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed') {
            alert("Please select a valid zip file.");
            return;
        }
    
        const formData = new FormData();
        formData.append('file', file);
        formData.append('collectionName', collectionName);
    
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}:3000/api/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Collection uploaded successfully:', response.data);
            // Refetch collections after successful upload
            fetchItems();
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    // Fetch collections
    const fetchItems = async () => {
        const token = sessionStorage.getItem('token');
        
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}:3000/api/get-collections`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            console.log("Fetched collections:", response.data); 
            setItems(response.data);  // Update the collections
        } catch (error) {
            console.error('Error fetching entries:', error);
        }
    };

    // Handle logout
    const handleLogout = () => {
        sessionStorage.removeItem('token');  // Remove token
        navigate('/');  // Redirect to login
    };

    // Remove collection function
    const removeCollection = async (collectionName) => {
        const token = sessionStorage.getItem('token');

        try {
            console.log("Removing collection:", collectionName);
            await axios.post(`${process.env.REACT_APP_API_URL}:3000/api/delete-collection`, null, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    collection_name: collectionName  // Pass collection name
                }
            });
            // Fetch updated collections after deletion
            fetchItems();
        } catch (error) {
            console.error('Error removing collection:', error);
        }
    };

    return (
        <div className="app-container">
            <Navbar username={username} onLogout={handleLogout} />
            <div className="content">
                <Sidebar 
                    file={file} 
                    collectionName={collectionName} 
                    handleUpload={upload} 
                    items={items} 
                    removeCollection={removeCollection}  // Pass removeCollection instead of removeItem
                    handleFileChange={handleFileChange}
                    handleNameChange={handleNameChange}
                />
                <div className="main-content">
                    <h2>Welcome, {username}!</h2>
                    <Charts />
                </div>
            </div>
        </div>
    );
}

export default Main;
