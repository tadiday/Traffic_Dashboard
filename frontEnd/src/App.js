import './App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  // Model 
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('summary');
  const [items, setItems] = useState([]);

  const upload = async () => {
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

  // Controller
  // Used to get initial items in the list
  useEffect(() => {
    fetchItems();
  }, []);

  function handleFileChange(e){
    setFile(e.target.files[0]);
  };

  function handleUpload(){
    upload();
  };

  function handleFileTypeChange(e){
    setFileType(e.target.value);
  };

  // View
  return (
    <div>
      <select onChange={handleFileTypeChange}>
        <option value='summary'>Summary</option>
        <option value='file10'>File 10</option>
        <option value='file11'>File 11</option>
        <option value='file12'>File 12</option>
        <option value='file13'>File 13</option>
        <option value='file14'>File 14</option>
        <option value='file15'>File 15</option>
        <option value='file16'>File 16</option>
      </select>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <br />
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            {item} <button onClick={() => removeItem(index)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
