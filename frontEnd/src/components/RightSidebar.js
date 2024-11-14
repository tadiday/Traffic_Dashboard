// frontEnd/src/components/RightSidebar.js
import React from 'react';
import './RightSidebar.css';

function RightSidebar(props) {
    // props.file_type is the selected visualization file type/source
    // props.files is the list returned from the backend of the file types associated with the collection
    // Fix dependecies for node graphs TBD 
    const visualizations = ({ 
        'Summary': ['Traffic Map', 'Total Vehicle Damage'],
        'Average Traffic Conditions': ['Traffic Map','Avg Crashes'],
        'Traffic Conditions': [],
        'Paths' : ['node'],
        'Trip Completion Probes' : ["Car Information Filter"],
        'Road Probes' : []
    });
    const outputFileTypes = ['Summary', 'Average Traffic Conditions', 'Traffic Conditions', 'Paths', 'Trip Completion Probes','Road Probes'];

    // Handle expanding/collapsing the file types and showing visualizations
    const toggleFile = async (fileName) => {
        if (props.file_type === fileName) {
            // If the file type is already expanded, collapse it
            props.setFile_Type(null);
        } else {
            // Otherwise, expand the file type
            props.setFile_Type(fileName);
            if(visualizations[fileName].length > 0){
                props.setSelectedGraph(visualizations[fileName][0]);
            }
        }
    };

    if(props.expandedCollection != null){
        
        return ( 
        <div className="right-sidebar"> 
            <h3>Select Visualization</h3> 
            <ul> {props.files 
                .filter(file => outputFileTypes.includes(file)) 
                .map((file, index) => ( 
                    <li key={index}> 
                        <div className="file-type" onClick={() => toggleFile(file)}> 
                            {file} 
                        </div> {/* Display visualizations if the file type is expanded */} 
                        {props.file_type === file && ( 
                            <ul className="visualization-list"> 
                                {visualizations[props.file_type].map((visFile, fileIndex) => <li key={fileIndex} onClick={() => props.setSelectedGraph(visFile)}>{visFile}</li>
                                ) } 
                            </ul> 
                        )} 
                    </li> 
                ))} 
            </ul>
        </div>
        );
                /*<button onClick={() => props.setSelectedGraph('bar')}>Bar Graph</button>*/
    }
    else {
        return (
            <div/>
        );
    };
}

export default RightSidebar;
