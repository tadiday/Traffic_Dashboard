// @ts-check
import React from 'react';
import AveTrafficConds from './AveTrafficConds';
import Summary from './Summary';

function Charts(props) {
    const dimensions = { graphWidth: window.innerWidth * 0.6, graphHeight: window.innerHeight * 0.7};
    //props.setFile_Type("Summary"); // get from elsewhere later in useState

    var ret;

    switch(props.file_type){
        case "Summary":
            ret = (<Summary
                dimensions={dimensions}
                selectedGraph={props.selectedGraph}
                expandedCollection={props.expandedCollection}
            />);
            break;
        case "Average Traffic Conditions":
            ret = (<AveTrafficConds
                dimensions={dimensions}
                selectedGraph={props.selectedGraph}
                expandedCollection={props.expandedCollection}/>);
            break;
        default:
            ret = (
            <div>
                <p>Please Select a Collection on the left and then a Visualization on the right.</p>
            </div>
            );
            //console.log("No file type selected");
    }
    return ret;
}

export default Charts;
