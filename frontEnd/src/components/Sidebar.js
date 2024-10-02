// frontEnd/src/components/Sidebar.js

import React from 'react';
import './Sidebar.css';

function Sidebar({ file, setFile, fileType, setFileType, handleUpload, items, removeItem }) {
  return (
    <div className="sidebar">
      <h3>Upload Files</h3>
      <select value={fileType} onChange={(e) => setFileType(e.target.value)}>
        <option value='summary'>Summary</option>
        <option value='file10'>File 10</option>
        <option value='file11'>File 11</option>
        <option value='file12'>File 12</option>
        <option value='file13'>File 13</option>
        <option value='file14'>File 14</option>
        <option value='file15'>File 15</option>
        <option value='file16'>File 16</option>
      </select>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
      <h3>Uploaded Files</h3>
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

export default Sidebar;
