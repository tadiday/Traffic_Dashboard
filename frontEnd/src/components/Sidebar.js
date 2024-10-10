// frontEnd/src/components/Sidebar.js

import React from 'react';
import './Sidebar.css';

function Sidebar(props) {
  return (
    <div className="sidebar">
      <h3>Upload Collection Zip</h3>
      <label>
        Enter Collection Name:
        <input type="text" value={props.collectionName} onChange={props.handleNameChange} required/>
      </label>
      <input type="file" onChange={props.handleFileChange} />
      <button onClick={props.handleUpload}>Upload</button>
      <h3>Uploaded Files</h3>
      <ul>
        {props.items.map((item, index) => (
          <li key={index}>
            {item} <button onClick={() => props.removeItem(index)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
