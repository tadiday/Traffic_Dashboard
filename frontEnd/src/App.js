import './App.css';
import { useState } from 'react';
import axios from 'axios';

function App() {
  // Model 
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('summary');

  const upload = async () => {
    console.log("Upload button clicked");
    const formData = new FormData();
    formData.append('file', file);
    console.log("File Type: ", fileType);
    formData.append('fileType', fileType);

    try {
        const response = await axios.post('http://localhost:3000/api/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        console.log('File uploaded successfully:', response.data);
    } catch (error) {
        console.error('Error uploading file:', error);
    }
  };

  // Controller
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
    </div>
  );
}

export default App;
