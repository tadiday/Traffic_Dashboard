import React, { useRef, useEffect, useState } from 'react';
import { Chart } from '@antv/g2';
import axios from 'axios';
import './TripProbe.css'
function TripProbe(props) {
    const nodeGraphRef = useRef(null);
    // eslint-disable-next-line
    const keys = [ "Time simulation produced record",
        "Vehicle ID number", 
        "Vehicle class", 
        "Vehicle last link", 
        "Origin node", 
        "Destination node", 
        "Scheduled departure time", 
        "Actual departure time", 
        "Trip duration", 
        "Total delay", 
        "Stopped delay", 
        "Number of stops", 
        "Distance covered", 
        "Average speed", 
        "Fuel used (L)", 
        "Hydrocarbon produced", 
        "Carbon monoxide produced", 
        "Nitrous oxide produced", 
        "CO2 produced", 
        "PM produced", 
        "hydrogen consumption (kg)", 
        "Number of expected crashes", 
        "Where injury was highest level", 
        "Where expected a fatal crash", 
        "Where maximum damage was low", 
        "Where maximum damage was moderate", 
        "Where maximum damage was high", 
        "Total toll paid", 
        "Total acceleration noise"
       ];
    var chart;
    
    // Render the Car Information Filter bar chart
    const CarInfoFilter = () => {
        const [selectedMetrics, setSelectedMetrics] = useState([]);

        const options = [
            //"Vehicle ID number", // show all returned id numbers
            //"Vehicle class", // Give user option to select vehicle class
            "Trip duration", 
            "Total delay", 
            "Stopped delay", 
            "Number of stops", 
            "Distance covered", 
            "Average speed", 
            "Fuel used (L)", 
            "Hydrocarbon produced", 
            "Carbon monoxide produced", 
            "Nitrous oxide produced", 
            "CO2 produced", 
            "PM produced", 
            "hydrogen consumption (kg)", 
            "Number of expected crashes", 
            "Where injury was highest level", 
            "Where expected a fatal crash", 
            "Where maximum damage was low", 
            "Where maximum damage was moderate", 
            "Where maximum damage was high", 
            "Total toll paid", 
            "Total acceleration noise"
           ];
        const bar = async () => {
            if(!props.expandedCollection){
                return null;
            }
            let dataTypes = ["injury crashes", "fatal crashes", "moderate damage", "minor damage", "no damage"];
            var data = [];
            // Get data from the API endpoint
            const token = sessionStorage.getItem('token');
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-summary?sim=${props.expandedCollection}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });
    
                dataTypes.forEach((type) => {
                    data.push({ Average: type, Amount: response.data.total[type][5] });
                });
                console.log(data);
            } catch (error) {
                console.error('Error fetching bar info:', error);
                return null;
            }
    
            if (nodeGraphRef.current) {
                chart = new Chart({
                    container: nodeGraphRef.current,
                    autoFit: true,
                    height: props.dimensions.graphHeight*.65,
                    width: props.dimensions.graphWidth,
                    title: "Car Information Filter",
                });
    
                chart
                    .interval()
                    .data(data)
                    .encode('x', 'Average')
                    .encode('y', 'Amount')
                    .encode('color', 'Damage');
    
                chart.render();
            }   

        }

        function handleMetricChange(e){
            const selected = [];
            for (const option of e.target.options) {
              if (option.selected) {
                selected.push(option.value);
              }
            }
            setSelectedMetrics(selected);
          };
        
        useEffect(() => {
            bar();
            
            return () => {
                if (chart) {
                    chart.destroy();
                }
            };
        // eslint-disable-next-line
        }, [nodeGraphRef, props.expandedCollection, props.selectedGraph]);

        return ( 
            <div id="container" style={{ width: props.dimensions.graphWidth, height: props.dimensions.graphHeight }}>
                <div id="charts" ref={nodeGraphRef} style={{ height: '65%'}}/>        
                <div className="controls" style={{ height: '50%', overflowY: 'auto'}}>
                    <div className="form-group">
                        <label>Select Metrics:</label>
                        <select multiple onChange={handleMetricChange}>
                            {options.map((metric) => (
                            <option key={metric} value={metric}>
                                {metric}
                            </option>
                            ))}
                        </select>
                    </div>
                </div>       
            </div>
        );
    }


    if (props.selectedGraph === 'Car Information Filter') {
        return (
            <CarInfoFilter/>
        );
    } else {
        return ( 
            <div id="container" style={{ width: props.dimensions.graphWidth, height: props.dimensions.graphHeight }}>
            </div>
        );
    }
        
}

export default TripProbe;
