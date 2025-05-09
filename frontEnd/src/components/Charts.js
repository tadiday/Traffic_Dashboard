// @ts-check
import React from 'react';
import AveTrafficConds from './AveTrafficConds';
import TrafficConds from './TrafficConds';
import TripProbe from './file_15/TripProbe';
import MinPathTree from './MinPathTree';
import Signals from './file_10/Signals';
import CustomSummaryChart from './file_summary/CustomSummaryChart';
import SecondBySecond from './file_16/SecondBySecond';
import CO2LineChart from './file_16/CO2LineChart';
import LinkFlow from './file_10/LinkFlow';
import ODByVehicleClass from './file_10/ODByVehicleClass';
import TripDurationFrequency from './file_15/TripDurationFrequency';
import OriginDestinationAvg from './file_15/OriginDestinationAvg';

function Charts(props) {
    const dimensions = { graphWidth: window.innerWidth * 0.6, graphHeight: window.innerHeight * 0.7 };

    let ret;

    switch (props.file_type) {
        case "Summary":
            ret = (
                <CustomSummaryChart
                    dimensions={dimensions}
                    expandedCollection={props.expandedCollection}
                />
            );
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
            if (props.selectedGraph === 'Summary of Trip Probes') {
                ret = (
                <TripProbe
                    dimensions={dimensions}
                    selectedGraph={props.selectedGraph}
                    expandedCollection={props.expandedCollection}
                />
                );
            }
            else if (props.selectedGraph === 'Trip Duration Frequency') {
                ret = (
                <TripDurationFrequency
                    dimensions={dimensions}
                    selectedGraph={props.selectedGraph}
                    expandedCollection={props.expandedCollection}
                />
                );
            }
            else {
                ret = (
                <OriginDestinationAvg
                    dimensions={dimensions}
                    selectedGraph={props.selectedGraph}
                    expandedCollection={props.expandedCollection}
                />
                );
            }

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
            if (props.selectedGraph === 'Second-by-Second Table') {
                ret = (
                    <SecondBySecond
                        dimensions={dimensions}
                        selectedGraph={props.selectedGraph}
                        expandedCollection={props.expandedCollection}
                    />
                );
            } else {
                ret = (
                    <CO2LineChart
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
