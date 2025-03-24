// frontEnd/src/components/Main.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Main.css'; // Ensure Main.css is imported for styling
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';  // Correct the import for jwtDecode
import Charts from '../components/Charts';
import RightSidebar from '../components/RightSidebar';

function Main(props) {
    const [expandedCollection, setExpandedCollection] = useState(null);
    const [username, setUsername] = useState('');
    const [file, setFile] = useState(null); // File to be uploaded
    const [collectionName, setCollectionName] = useState('');
    const [items, setItems] = useState([]);
    const [selectedGraph, setSelectedGraph] = useState('node'); // Add selectedGraph state
    const navigate = useNavigate();
    const [files, setFiles] = useState([]); // Store files for the expanded collection
    const [file_type, setFile_Type] = useState(null);

    const [showSpinner, setShowSpinner] = useState(false);

    const [isHelpOpen, setIsHelpOpen] = useState(false);

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
        if (collectionName === '') {
            alert("Please enter a collection name.");
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
            // Show the spinner
            setShowSpinner(true);

            const response = await axios.post(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Collection uploaded successfully:', response.data);
            // Hide the spinner after completion
            setShowSpinner(false);
            // Refetch collections after successful upload
            fetchItems();
        } catch (error) {
            console.error('Error uploading file:', error);
            setShowSpinner(false);
            if (error.response && error.response.data) {
                alert(error.response.data);
            } else {
                alert("An error occurred uploading the file.");
            }
        }
    };

    // Fetch collections
    const fetchItems = async () => {
        const token = sessionStorage.getItem('token');

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/get-collections`, {
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
            await axios.post(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/delete-collection`, null, {
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
                    file={file} // File to be uploaded
                    files={files} // Files within the selected collection
                    setFiles={setFiles}
                    file_type={file_type} // The type of file whose visualizations can be chosen
                    setFile_Type={setFile_Type}
                    collectionName={collectionName}
                    handleUpload={upload}
                    items={items}
                    removeCollection={removeCollection}
                    handleFileChange={handleFileChange}
                    handleNameChange={handleNameChange}
                    expandedCollection={expandedCollection}
                    setExpandedCollection={setExpandedCollection}
                />
                <div className="main-content">
                    <div className="header-container">
                        <h2>Welcome, {username}!</h2>
                        <button className="help-button" onClick={() => setIsHelpOpen(true)}>Help</button>
                    </div>

                    {isHelpOpen && (
                        <div className="help-overlay">
                            <div className="help-box">
                                <h3>Need Help?</h3>
                                <p>{selectedGraph}</p>
                                <button onClick={() => setIsHelpOpen(false)}>Close</button>
                            </div>
                        </div>
                    )}

                    <Charts
                        expandedCollection={expandedCollection}
                        selectedGraph={selectedGraph} // Pass selectedGraph to Charts
                        file_type={file_type}
                        setFile_Type={setFile_Type}
                    />
                </div>
                <RightSidebar
                    setSelectedGraph={setSelectedGraph}
                    expandedCollection={expandedCollection}
                    files={files} // Files within the selected collection
                    file_type={file_type}
                    setFile_Type={setFile_Type}
                />
            </div>
            {showSpinner && (
                <div className="spinner-overlay">
                    <div className="spinner-container">
                        <button className="close-button" onClick={() => setShowSpinner(false)}>×</button>
                        <div className="spinner-message">
                            <p>Uploading and processing file, please wait...</p>
                            <div className="spinner"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Main;
