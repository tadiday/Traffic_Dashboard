import React, { useRef, useEffect, useState } from 'react';
import { Chart } from '@antv/g2';
import axios from 'axios';
import './TripProbe.css'
function TripProbe(props) {
    const nodeGraphRef = useRef(null);
    const [vClass, setVClass] = useState(["All"]);
    const [resultsCount, setResultsCount] = useState(0); // Store results count
    const [queries, setQueries] = useState([]);
    const [maxResult, setMaxResult] = useState(500); // Store max result
    const [skip, setSkip] = useState(0); // Store skip value
    const [used, setUsed] = useState(0);
    var tripProbeData = null;
    // eslint-disable-next-line
    // const keys = [ "Time simulation produced record",
    //     "Vehicle ID number", 
    //     "Vehicle class", 
    //     "Vehicle last link", 
    //     "Origin node", 
    //     "Destination node", 
    //     "Scheduled departure time", 
    //     "Actual departure time", 
    //     "Trip duration", 
    //     "Total delay", 
    //     "Stopped delay", 
    //     "Number of stops", 
    //     "Distance covered", 
    //     "Average speed", 
    //     "Fuel used (L)", 
    //     "Hydrocarbon produced", 
    //     "Carbon monoxide produced", 
    //     "Nitrous oxide produced", 
    //     "CO2 produced", 
    //     "PM produced", 
    //     "hydrogen consumption (kg)", 
    //     "Number of expected crashes", 
    //     "Where injury was highest level", 
    //     "Where expected a fatal crash", 
    //     "Where maximum damage was low", 
    //     "Where maximum damage was moderate", 
    //     "Where maximum damage was high", 
    //     "Total toll paid", 
    //     "Total acceleration noise"
    //    ];
    var chart = null;
    
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
            if(!props.expandedCollection){ return; }
            // Get data from the API endpoint
            const token = sessionStorage.getItem('token');
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-tripprobes?sim=${props.expandedCollection}&origin=-1&skip=${skip}&max=${maxResult}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });
                tripProbeData = response.data
                setResultsCount(tripProbeData.length)
                //console.log(response.data)
            } catch (error) {
                console.error('Error fetching bar info:', error);
                return;
            }
    
            if (nodeGraphRef.current) {
                chart = new Chart({
                    container: nodeGraphRef.current,
                    autoFit: true,
                    height: props.dimensions.graphHeight*.65,
                    width: props.dimensions.graphWidth,
                    title: "Car Information Filter",
                });
            }   

        }

        function handleMetricChange(e){
            var selected = [];
            if(e.target.options[0].selected) {
                selected = options
                for(const option of e.target.options){
                    option.selected = true;
                }
                e.target.options[0].selected = false; // deselect all now
            } else {
                for (const option of e.target.options) {
                    if (option.selected) {
                      selected.push(option.value);
                    }
                  }
            }
            setSelectedMetrics(selected);
            //console.log(selected.toString())
        };
        
        function handleNumChange(e, set){
            set(Math.floor(e.target.value));
        }

        function addQuery(){
            var num
            if(document.getElementById("value-input").value === "") {
                num = 0;
            } else {
                num = parseFloat(document.getElementById("value-input").value);
            }

            const query = {"item" :document.getElementById("field-dropdown").value,
                "operator" : document.getElementById("operator-dropdown").value,
                "value" : num }
            //console.log(query);
            const newQueries = [...structuredClone(queries), query];
            setQueries(newQueries);
            //console.log(newQueries);
        }

        function clearAll(){
            setQueries([]);
        }
        // Draw the bar chart
        useEffect(() => {
            bar();
            
            return () => {
                if (chart) {
                    chart.destroy();
                }
            };
        // eslint-disable-next-line
        }, [nodeGraphRef, props.expandedCollection, props.selectedGraph]);
        // Update chart when a metric changes
        useEffect(() => {
            if (!tripProbeData || selectedMetrics.length === 0 || selectedMetrics[0] === "All") return;
            // filter by car class
            const classedData = tripProbeData.filter(item => {
                if (vClass === "All" || item["Vehicle class"] === parseInt(vClass)){
                    return true;
                } else {
                    console.log(vClass + "  " + item["Vehicle class"]);
                    return false;
                } 
            })
            
            // Prepare data by filtering queries
            const filteredData = classedData.filter(item => {
                return queries.every(query => {
                    if (query.operator === '>') {
                        return item[query.item] > query.value;
                    }
                    if (query.operator === '<') {
                        return item[query.item] < query.value;
                    }
                    if (query.operator === '==') {
                        return item[query.item] === query.value;
                    }
            
                    // If operator is unrecognized, return false (or handle as needed)
                    return false;
                });
            });
            // Show user how much of gathered data will be shown
            setUsed(filteredData.length);            

            // Calculate data
            const data = selectedMetrics.map((metric) => {
                // Sum the values for the selected metric across all entries (assuming tripProbeData is an array of objects)
                const total = filteredData.reduce((sum, entry) => sum + entry[metric], 0);
                const average = total / filteredData.length;  // Calculate the average
                var sub = metric;
                if (sub.length > 10) {
                    sub = sub.substring(0, 10) + "...";
                }
                return {
                    Metric: sub,
                    Value: average,  // Use the average value
                };
            });
            // Clear previous chart content
            chart.clear();
            // Configure the chart
            chart
              .interval()
              .data(data)
              .encode('x', 'Metric')
              .encode('y', 'Value')
              .encode('color', 'Metric');
            // Render the chart
            chart.render();
          }, [selectedMetrics]);
        // Update query output
        useEffect(() => {
            document.getElementById("queries-display").innerHTML = queries.length
                ? queries.map((q) => `<p>${q["item"]} ${q["operator"]} ${q["value"]}</p>`).join('')
                : '<em>No queries added yet.</em>';
        },  [])
        return ( 
            <div id="container" style={{ width: props.dimensions.graphWidth, height: props.dimensions.graphHeight }}>
                <div id="charts" ref={nodeGraphRef} style={{ height: '65%'}}/>        
                <div className="controls" style={{ height: '50%', overflowY: 'auto'}}>
                    <div className="form-group">
                        <label>Select Metrics * :</label>
                        <select multiple onChange={handleMetricChange}>
                            <option key={'All'} value={'All'}>All</option>
                            {options.map((metric) => (
                            <option key={metric} value={metric}>
                                {metric}
                            </option>
                            ))}
                        </select>
                        <div className='QueryOptions'>
                            <label>Vehicle Class:</label>
                            <select id="classDropdown" value={vClass} onChange={(e) => {setVClass(e.target.value)}}>
                                <option value="All">All</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                            </select>
                            <div className='horizontal-container'>
                                <label>Max Entries:</label>    
                                <input type="number" id="max-input" 
                                placeholder="Enter a number (500 default)" 
                                value={maxResult} 
                                onChange={(e) => {handleNumChange(e, setMaxResult)}} />
                            </div>
                            <div className='horizontal-container'>
                                <label>Results Returned:</label>
                                <label className='results-returned'>{resultsCount}</label>
                            </div>
                            <div className='horizontal-container'>
                                <label>Results Used:</label>
                                <label className='results-used'>{used}</label>
                            </div>
                        <label>Skip DB Entries:</label>    
                        <input type="number" id="skip-input" 
                        placeholder="Enter a number" 
                        value={skip}
                        onChange={(e) => {handleNumChange(e, setSkip)}}/>
                        </div>
                    </div>
                    <div className="vertical-container">
                    <label>Dynamic Query Builder</label>

                    <div className="query-container">
                        <select id="field-dropdown">
                            {options.map((metric) => (
                            <option key={metric} value={metric}>
                                {metric}
                            </option>
                            ))}
                        </select>

                        <select id="operator-dropdown">
                            <option value="==">Equals</option>
                            <option value=">">Greater Than</option>
                            <option value="<">Less Than</option>
                        </select>

                        <input type="number" id="value-input" placeholder="Enter a number" />
                    </div>

                    <div className="queries-list" id="queries-display">
                        <em>No queries added yet.</em>
                    </div>

                    <div className="buttons">
                        <button id="add-query-btn" onClick={addQuery}>Add Query</button>
                        <button id="clear-queries-btn" onClick={clearAll}>Clear All</button>
                    </div>
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
