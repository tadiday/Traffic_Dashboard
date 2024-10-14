import React from 'react';
import './LoadingSpinner.css'; // Include the CSS file for styling

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner"></div>
      <p>Loading...</p> {/* You can customize this message if needed */}
    </div>
  );
};

export default LoadingSpinner;
