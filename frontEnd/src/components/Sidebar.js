// frontEnd/src/components/Sidebar.js

import React from 'react';
import './Sidebar.css';

function Sidebar(props) {
  return (
    <div className="sidebar">
      <h3>Upload Files</h3>
      <select value={props.fileType} onChange={props.handleFileTypeChange}>
        <option value='summary'>Summary</option>
        <option value='file10'>File 10</option>
        <option value='file11'>File 11</option>
        <option value='file12'>File 12</option>
        <option value='file13'>File 13</option>
        <option value='file14'>File 14</option>
        <option value='file15'>File 15</option>
        <option value='file16'>File 16</option>
      </select>
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
