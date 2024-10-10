// frontEnd/src/components/Main.js
import React, { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../components/Main.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import Charts from '../components/Charts';


function Main(props) {
    const [username, setUsername] = useState('')
    const [file, setFile] = useState(null);
    const [collectionName, setCollectionName] = useState('');
    const [items, setItems] = useState([]);
    const navigate = useNavigate()
    
    // Get items and username
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


    function handleNameChange (e) {
        setCollectionName(e.target.value);
    }
      
    function handleFileChange (e) {
        setFile(e.target.files[0]);
    }

    // Upload Function
    const upload = async () => {
        const token = sessionStorage.getItem('token');
        if (!file) {
            alert("Please select a zip file to upload.");
            return;
        }
    
        // Check if the file is a zip file
        if (file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed') {
            alert("Please select a valid zip file.");
            return;
        }
    
        const formData = new FormData();
        formData.append('file', file);
        console.log("Collection name: ", collectionName);
        formData.append('collectionName', collectionName);
    
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}:3000/api/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Collection uploaded successfully:', response.data);
            // Update the items
            fetchItems();
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };
    

    // Fetch items
    const fetchItems = async () => {
        const token = sessionStorage.getItem('token');
        const collectionName = "Hard coded"; // Brett change this to be the selected collection name
        //, it should not work right now unless you call a collection 'Hard coded' 
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}:3000/api/select-uploads`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
                params: {
                    collection_name: collectionName
                }
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
              collectionName={collectionName} 
              handleUpload={upload} 
              items={items} 
              removeItem={removeItem}
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


export default Main