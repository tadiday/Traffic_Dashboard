// frontEnd/src/components/RightSidebar.js
import React from 'react';
import './RightSidebar.css';

function RightSidebar(props) {
    if(props.expandedCollection != null){
        return (
            <div className="right-sidebar">
                <h3>Select Visualization</h3>
                <button onClick={() => props.setSelectedGraph('node')}>Node Graph</button>
                <button onClick={() => props.setSelectedGraph('bar')}>Bar Graph</button>
            </div>
        );
    }
    else {
        return (
            <div></div>
        );
    };
}

export default RightSidebar;
