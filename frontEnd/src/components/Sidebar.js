import React, { useState } from 'react';
import './Sidebar.css';

function Sidebar(props) {
  const [expandedCollection, setExpandedCollection] = useState(null); // Track which collection is expanded
  const [files, setFiles] = useState([]); // Store files for the expanded collection

  // Handle expanding/collapsing the collection and fetching files
  const toggleCollection = async (collectionName) => {
    if (expandedCollection === collectionName) {
      // If the collection is already expanded, collapse it
      setExpandedCollection(null);
      setFiles([]);
    } else {
      // Otherwise, expand the collection and fetch the files
      setExpandedCollection(collectionName);
      const token = sessionStorage.getItem('token');
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}:3000/api/select-uploads?collection_name=${collectionName}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        const data = await response.json();
        setFiles(data); // Set the fetched files for this collection
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    }
  };

  return (
    <div className="sidebar">
      <h3>Upload Collection Zip</h3>
      <label>
        Enter Collection Name:
        <input type="text" value={props.collectionName} onChange={props.handleNameChange} required />
      </label>
      <input type="file" onChange={props.handleFileChange} />
      <button onClick={props.handleUpload}>Upload</button>

      <h3>Uploaded Collections</h3>
      <ul>
        {props.items.map((item, index) => (
          <li key={index}>
            <div className="collection-name" onClick={() => toggleCollection(item)}>
              {item}
            </div>
            <button className="remove-btn" onClick={() => props.removeCollection(item)}>X</button>
            {/* Display files if the collection is expanded */}
            {expandedCollection === item && (
              <ul className="file-list">
                {files.length === 0 ? (
                  <li>No files found in this collection</li>
                ) : (
                  files.map((file, fileIndex) => <li key={fileIndex}>{file}</li>)
                )}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
