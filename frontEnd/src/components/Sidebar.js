//ts-check
import React from 'react';
import './Sidebar.css';

function Sidebar(props) {

  function FileNumToFileType(fileNum) {
    switch (fileNum) {
      case 0: return 10;
      case 1: return 11;
      case 2: return 12;
      case 3: return 13;
      case 4: return 'summary';
      case 5: return 14;
      case 6: return 15;
      case 7: return 1;
      case 8: return 2;
      case 9: return 3;

    }
  }
  // Handle expanding/collapsing the collection and fetching files
  const toggleCollection = async (collectionName) => {
    if (props.expandedCollection === collectionName) {
      // If the collection is already expanded, collapse it
      props.setExpandedCollection(null);
      props.setFile_Type(null);
      props.setFiles([]);
    } else {
      // Otherwise, expand the collection and fetch the files
      props.setExpandedCollection(collectionName);
      props.setFile_Type(null);
      const token = sessionStorage.getItem('token');
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/select-uploads?collection_name=${collectionName}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        const data = await response.json();
        props.setFiles(data); // Set the fetched files for this collection
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    }
  };

  // useEffect(() => {
  //   if (props.items.length > 0) {
  //     toggleCollection(props.items[0]); // Toggle the first item on initial render
  //   }
  //   // eslint-disable-next-line
  // }, []);

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
            {props.expandedCollection === item && (
              <ul className="file-list">
                {props.files.length === 0 ? (
                  <li>No files found in this collection</li>
                ) : (
                  props.files.map((file, fileIndex) => 
                  <li key={fileIndex}>
                    {file}
                  </li>)
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
