import './App.css';
import { useState } from 'react';

function App() {
  // Model 
  const [file, setFile] = useState(null);

  function upload(file){
    console.log("Upload button clicked");
  };

  // Controller

  function handleFileChange(file){
    ;
  };

  function handleUpload(){
    upload();
  };

  // View

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}

export default App;
