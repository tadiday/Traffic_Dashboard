// @ts-check
import React from 'react';
import AveTrafficConds from './AveTrafficConds';
import Summary from './Summary';

function Charts(props) {
    const dimensions = { graphWidth: window.innerWidth * 0.6, graphHeight: window.innerHeight * 0.7};
    var file = "Summary"; // get from elsewhere later in useState

    var ret;

    switch(file){
        case "Summary":
            ret = (<Summary
                dimensions={dimensions}
                selectedGraph={props.selectedGraph}
                expandedCollection={props.expandedCollection}
            />);
            break;
        case "AveTrafficConds":
            ret = (<AveTrafficConds
                dimensions={dimensions}
                selectedGraph={props.selectedGraph}
                expandedCollection={props.expandedCollection}/>);
            break;
        default:
            ret = (<div/>);
            console.log("Should not happen");
    }
    return ret;
}

export default Charts;
