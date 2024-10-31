// frontEnd/src/components/RightSidebar.js
import React from 'react';
import './RightSidebar.css';

function RightSidebar({ setSelectedGraph }) {
    return (
        <div className="right-sidebar">
            <h3>Select Visualization</h3>
            <button onClick={() => setSelectedGraph('node')}>Node Graph</button>
            <button onClick={() => setSelectedGraph('bar')}>Bar Graph</button>
        </div>
    );
}

export default RightSidebar;
