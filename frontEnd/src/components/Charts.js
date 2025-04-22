// @ts-check
import React from 'react';
import AveTrafficConds from './AveTrafficConds';
import TrafficConds from './TrafficConds';
import Summary from './Summary';
import TripProbe from './TripProbe';
import MinPathTree from './MinPathTree';
import Signals from './Signals';
import CustomSummaryChart from './CustomSummaryChart';
import EdgeLogsBarChart from './EdgeLogsBarChart';
import EdgeLogsTreemap from './EdgeLogsTreemap';
import LinkFlow from './LinkFlow';
import ODByVehicleClass from './ODByVehicleClass';

function Charts(props) {
    const dimensions = { graphWidth: window.innerWidth * 0.6, graphHeight: window.innerHeight * 0.7 };

    let ret;

    switch (props.file_type) {
        case "Summary":
            if (props.selectedGraph === "Custom Summary Chart") {
                ret = (
                    <CustomSummaryChart
                        dimensions={dimensions}
                        expandedCollection={props.expandedCollection}
                    />
                );
            } else {
                ret = (
                    <Summary
                        dimensions={dimensions}
                        selectedGraph={props.selectedGraph}
                        expandedCollection={props.expandedCollection}
                    />
                );
            }
            break;
        case "Average Traffic Conditions":
            ret = (
                <AveTrafficConds
                    dimensions={dimensions}
                    selectedGraph={props.selectedGraph}
                    expandedCollection={props.expandedCollection}
                />
            );
            break;
        case "Traffic Conditions":
            ret = (
                <TrafficConds
                    dimensions={dimensions}
                    selectedGraph={props.selectedGraph}
                    expandedCollection={props.expandedCollection}
                />
            );
            break;
        case "Trip Completion Probes":
            ret = (
                <TripProbe
                    dimensions={dimensions}
                    selectedGraph={props.selectedGraph}
                    expandedCollection={props.expandedCollection}
                />
            );
            break; // Added missing break statement here
        case "Paths":
            ret = (
                <MinPathTree
                    dimensions={dimensions}
                    selectedGraph={props.selectedGraph}
                    expandedCollection={props.expandedCollection}
                />
            );
            break;
        case "Simulation Details":
            if (props.selectedGraph === 'O-D Trip Times By Vehicle Class') {
                ret = (
                    <ODByVehicleClass
                        dimensions={dimensions}
                        selectedGraph={props.selectedGraph}
                        expandedCollection={props.expandedCollection}
                    />
                );
            }
            else if (props.selectedGraph === "Link Flow Table") {
                ret = (
                    <LinkFlow
                        dimensions={dimensions}
                        selectedGraph={props.selectedGraph}
                        expandedCollection={props.expandedCollection}
                    />
                );
            }
            else {
                ret = (
                    <Signals
                        dimensions={dimensions}
                        selectedGraph={props.selectedGraph}
                        expandedCollection={props.expandedCollection}
                    />
                );
            }
            break;
        case 'Road Probes':
            if (props.selectedGraph === 'Edge Logs Bar Chart') {
                ret = (
                    <EdgeLogsBarChart
                        dimensions={dimensions}
                        selectedGraph={props.selectedGraph}
                        expandedCollection={props.expandedCollection}
                    />
                );
            } else {
                ret = (
                    <EdgeLogsTreemap
                        dimensions={dimensions}
                        selectedGraph={props.selectedGraph}
                        expandedCollection={props.expandedCollection}
                    />
                );
            }
            break;
        default:
            ret = (
                <div>
                    <p>Please Select a Collection on the left and then a Visualization on the right.</p>
                </div>
            );
    }
    return ret;
}

export default Charts;
