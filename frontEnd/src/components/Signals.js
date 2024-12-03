// @ts-check
import React, { useRef, useEffect, useState } from 'react';
// import G6 from '@antv/g6';
import { Graph, registerEdge, registerNode} from '@antv/g6';
//import * as G6 from '@antv/g6';
import axios from 'axios';
import Popup from './Popup';
import { Tabs } from 'antd';

const { TabPane } = Tabs;

// eslint-disable-next-line
interface EdgeInfo {
    source: string;
    target: string;
    totalFlow: String;
    co2Emission: String;
}

//add icon on the edge, not finished
registerEdge('icon-edge', {
    draw(cfg, group) {
        // Draw the line for the edge
        const { startPoint, endPoint } = cfg;
        const lineShape = group.addShape('line', {
            attrs: {
                x1: startPoint.x,
                y1: startPoint.y,
                x2: endPoint.x,
                y2: endPoint.y,
                stroke: '#A0A0A0',
                lineWidth: 2,     
            },
            name: 'edge-line',
        });

        const imageSrc = cfg.icon || './icons/road.png';
        const iconX = (startPoint.x + endPoint.x) / 2; 
        const iconY = (startPoint.y + endPoint.y) / 2; 
        
        group.addShape('image', {
            attrs: {
                x: iconX - 15, 
                y: iconY - 15, 
                width: 30,  
                height: 30, 
                img: imageSrc,
            },
            name: 'edge-icon',
        });

        return lineShape;
    },
}, 'line');

registerEdge(
    'circle-running',
    {
      afterDraw(cfg, group) {
        const shape = group.get('children')[0];
        const startPoint = shape.getPoint(0);
        const circle = group.addShape('circle', {
          attrs: {
            x: startPoint.x,
            y: startPoint.y,
            fill: '#1890ff',
            r: 3,
          },
          name: 'circle-shape',
        });
        circle.animate(
          (ratio) => {
            const tmpPoint = shape.getPoint(ratio);
            return {
              x: tmpPoint.x,
              y: tmpPoint.y,
            };
          },
          {
            repeat: true,
            duration: 3000, 
          },
        );
      },
    },
    'cubic', 
);

registerNode('icon-node', {
    draw(cfg, group) {
        const keyShape = group.addShape('circle', {
            attrs: {
                x: 0,
                y: 0,
                r: 22, 
                fill: '#f6e397', 
                stroke: '#4b4941',
                lineWidth: 2,
            },
            name: 'main-circle',
        });

        group.addShape('text', {
            attrs: {
                x: 0,
                y: 1, 
                textAlign: 'center',
                textBaseline: 'middle',
                text: cfg.icon || '🚦', 
                fontSize: 26,           
                fill: '#FFFFFF',   
            },
            name: 'icon-text',
        });

        if (cfg.label) {
            group.addShape('text', {
                attrs: {
                    x: 0,
                    y: 35, 
                    textAlign: 'center',
                    textBaseline: 'middle',
                    text: cfg.label,
                    fontSize: 14,
                    fill: '#000000',
                },
                name: 'node-label',
            });
        }

        return keyShape;
    },
}, 'single-node');


const Signals = (props) => {
    const nodeGraphRef = useRef(null);
    const popUpAnimationRef = useRef(null);
    const chartRef = useRef(null);
    const [edgePopup, setEdgePopup] = useState(false);
    const [selectedEdgeInfo, setSelectedEdgeInfo] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [previousSearchedEdge, setPreviousSearchedEdge] = useState(null); // Store previous edge
    const [checkedItems, setCheckedItems] = useState({
        display: false,
        originDisplay: false,
    });
    const [maxNumberOfTrees, setMaxNumberOfTrees] = useState(0);
    const [currentOrigins, setCurrentOrigins] = useState(String['']);
    const [currentTree, setCurrentTree] = useState([]);

    const [signalTimeInfo, setSignalTimeInfo] = useState([]);

    const [time, setTime] = useState(0); // State to track slider value
    const [signal, setSignal] = useState(1); // State to track signal value

    const [tabsNum, setTabsNum] = useState([0, 0, 0]); // State to track signal value
    const [curTabInfo, setCurTabInfo] = useState([]);

    const [selectedOption, setSelectedOption] = useState('Signal 5');
    
    var popChart;
    let selectedEdge = null;

    var displayIsChecked;
    var originIsChecked;

    // popUpAnimation
    const animation = async() => {
        const edgeInfo = selectedEdgeInfo;
        if (!edgeInfo) return;
        var data;
        try{
            data = {
                nodes: [{id: edgeInfo.source, x: 100, y: 100, label: edgeInfo.source},{id: edgeInfo.target, x: 300, y: 200, label: edgeInfo.target}],
                edges: [{source: edgeInfo.source, target: edgeInfo.target}],
            };
                
        }catch(error){
            console.error('Error popAnimation:', error);
            return null;
        }
        if(popUpAnimationRef.current){
            popChart = new Graph({
                container: popUpAnimationRef.current,
                height: 300,
                width: 500,
                defaultEdge: {
                    type: 'circle-running',
                    style: {
                        lineWidth: 3,
                        stroke: '#bae7ff',
                    },
                },
                defaultNode: {
                    type: 'circle',
                    size: [35],
                    color: '#660000',
                    style: {
                        icon: true,
                        fill: '#660000',
                    },
                    labelCfg: {
                        style: {
                            fill: '#FFFFFF', // Label color
                            fontSize: 16,    // Label font size
                        },
                    },
                },
            });
            popChart.data(data);
            popChart.render();
        }
    }

    //var handleSearch = null
    //var curTrees = [];
    // Node graph Creation functions
    const getNodeGraphData = async () => {
        if(!props.expandedCollection){
            return null;
        }

        var nodes = [];
        var edges = [];
        var minPaths = [];
        var signals = [];

        const token = sessionStorage.getItem('token');
        
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-nodes?sim=${props.expandedCollection}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            nodes = response.data.nodes.map(obj => ({
                id: String(obj.id),
                x: obj.x,
                y: obj.y,
                label: String(obj.id)
            }));;  // Update the nodes
        } catch (error) {
            console.error('Error fetching nodes:', error);
            return null;
        }

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-edges?sim=${props.expandedCollection}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            const response2 = await axios.get(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-avgconds?sim=${props.expandedCollection}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            const response3 = await axios.get(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-paths?sim=${props.expandedCollection}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            const response4 = await axios.get(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-overview?sim=${props.expandedCollection}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            edges = response.data.edges.map(obj => {
                const condition = response2.data.conditions.find(cond => cond.edgeID === obj.id);
                
                return {
                    edgeIdNum: String(obj.id),
                    edgeLength: String(obj.length),
                    source: String(obj.start),
                    target: String(obj.end),
                    totalFlow: condition ? condition.totalFlow : null,
                    co2Emission: condition ? condition.CO2 : null
                };
            });

            minPaths = response3.data.periods.map(obj => {
                return {
                    iniOrigins: obj.paths[0].origins.map(subarray=>String(subarray[0])),
                    trees: obj.paths[0].edges
                }
                
            });


            signals = response4.data.signals.map(obj => {
                return {
                    timeNum: String(obj.time),
                    signalNum: String(obj.signal),
                    linkInfoA: obj.a,
                    infoB: obj.b
                }
            })


        
        } catch (error) {
            console.error('Error fetching nodes:', error);
            return null;
        }

        assignIcons(nodes);

        return { nodes: nodes, edges: edges, minPaths: minPaths, signals: signals};
    };

    var chart;

    // Renders the node graph
    const node = async () => {
        if(nodeGraphRef.current && !chartRef.current){
            chart = new Graph({
                container: nodeGraphRef.current,
                width: props.dimensions.graphWidth,
                height: props.dimensions.graphHeight,
        
                modes: {
                    default: ['drag-canvas', 'drag-node', 'zoom-canvas'],
            
                },
                defaultNode: {
                    size: [50],
                    color: '#660000',
                    type: 'icon-node',
                    style: {
                        fill: '#4b4941',
                    },
                    labelCfg: {
                        style: {
                            fill: '#FFFFFF', // Label color
                            fontSize: 16,    // Label font size
                        },
                    },
                },
                defaultEdge: {
                    color: '#FFA07A',
                // type: 'icon-edge',
                    style: {
                        endArrow: true,
                        icon: true,
                        lineWidth: 10,
                        label: true,
                        opacity: 0.1
                    },
                    
                },
            });
            
            // Tooltip for edge hover
            const tooltip = document.createElement('div');
            tooltip.style.position = 'absolute';
            tooltip.style.padding = '5px';
            tooltip.style.backgroundColor = '#660000';
            tooltip.style.color = 'white';
            tooltip.style.borderRadius = '4px';
            tooltip.style.display = 'none';
            tooltip.style.pointerEvents = 'none';
            document.body.appendChild(tooltip);

            // Get node and edge data from an API endpoint
            const data = await getNodeGraphData();

            // Add and scale the nodes and render the graph
            try {  
                if(chart && data){
                    // Calculate the bounding box of the nodes
                    const minX = Math.min(...data.nodes.map(node => node.x));
                    const maxX = Math.max(...data.nodes.map(node => node.x));
                    const minY = Math.min(...data.nodes.map(node => node.y));
                    const maxY = Math.max(...data.nodes.map(node => node.y));
                    const paddingPercent = 10;
                    // Calculate scaling factors with padding of %
                    const scaleX = (props.dimensions.graphWidth - props.dimensions.graphWidth/paddingPercent) / (maxX - minX);
                    const scaleY = (props.dimensions.graphHeight - props.dimensions.graphHeight/paddingPercent) / (maxY - minY);

                    // Choose the smaller scale to maintain aspect ratio
                    const scale = Math.min(scaleX, scaleY);

                    // Apply scaling and translation to center the graph
                    const scaledNodes = data.nodes.map(node => ({
                        ...node,
                        // Add the % padding
                        x: (node.x - minX) * scale + (props.dimensions.graphWidth/paddingPercent)/2,
                        y: (node.y - minY) * scale + (props.dimensions.graphHeight/paddingPercent)/2,
                    }));
                    data.nodes = scaledNodes;
                    
                    chart.data(data);
                    // Create the graph data structure
                    
                    data.edges.forEach(edge => {
                        
                            edge.style = {
                                stroke: '#FFA07A',
                            };
                        
                    });
                    setCurrentTree(data.minPaths[0].trees);
                    setCurrentOrigins(data.minPaths[0].iniOrigins);
                    setMaxNumberOfTrees(data.minPaths[0].trees.length);
                    
                    setSignalTimeInfo(data.signals);
                    chart.render();

                    // Event listener to show tooltip on hovering EDGE---------------------------------------------
                    chart.on('edge:mouseenter', (evt) => {
                        const edge = evt.item;
                        if(!edge){
                            console.warn("hover item is null");
                            return;
                        }
                        const edgeData = edge.getModel();
                        var edgeIdNumber = edgeData.edgeIdNum;
                        var edgeLength = edgeData.edgeLength;
                        var edgeSource = edgeData.source;
                        var edgeTartget = edgeData.target;
                        tooltip.innerHTML = `Edge ID: ${edgeIdNumber}
                                            <br>Edge Length: ${edgeLength}
                                            <br>Edge Source: ${edgeSource}
                                            <br>Edge Target: ${edgeTartget}`;
                        tooltip.style.left = `${evt.clientX + 10}px`;
                        tooltip.style.top = `${evt.clientY + 10}px`;
                        tooltip.style.display = 'block';
                    

                    });

                    chart.on('edge:mousemove', (e) => {
                        tooltip.style.left = `${e.clientX + 20}px`;
                        tooltip.style.top = `${e.clientY + 20}px`;
                    });

                    // Hide tooltip when mouse leaves the edge
                    chart.on('edge:mouseleave', (e) => {
                        tooltip.style.display = 'none';

                        // Change edge color on mouse leave
                        chart.updateItem(e.item, {
                            style: {
                                //stroke: checkedItems.originDisplay?'#FFA07A':'#FF0000',
                            },
                        });
                    }); 
                    // -----------------------------------------------EDGE ENDS ------------------------------------
                    // Event listener to show tooltip on hovering NODE---------------------------------------------
                    chart.on('node:mouseenter', (evt) => {
                        const node = evt.item;
                        if(!node){
                            console.warn("hover item is null");
                            return;
                        }
                        const nodeData = node.getModel();
                        var nodeId = nodeData.id;
                        var nodeX = nodeData.x;
                        var nodeY = nodeData.y;
                        var sourceOfEdges = data.edges.filter(edge=> edge.source === nodeData.id)
                        var sourceOf = sourceOfEdges.map(edge => edge.edgeIdNum)
                        var targetOfEdges = data.edges.filter(edge=> edge.target === nodeData.id)
                        var targetOf = targetOfEdges.map(edge => edge.edgeIdNum)
                        tooltip.innerHTML = `Node ID: ${nodeId}
                                            <br>Node X: ${nodeX}
                                            <br>Node Y: ${nodeY}
                                            <br>Source of Edge(s): ${sourceOf.map(attribute => `${attribute}`).join(', ')}
                                            <br>Target of Edge(s): ${targetOf.map(attribute => `${attribute}`).join(', ')}`;
                        tooltip.style.display = 'block';
                    

                    });

                    chart.on('node:mousemove', (e) => {
                        tooltip.style.left = `${e.clientX + 20}px`;
                        tooltip.style.top = `${e.clientY + 20}px`;
                    });

                    // Hide tooltip when mouse leaves the edge
                    chart.on('node:mouseleave', (e) => {
                        tooltip.style.display = 'none';
                    }); 

                    // -----------------------------------------------NODES ENDS ------------------------------------
                    chart.on('edge:mouseenter', (evt) => {
                        const edge = evt.item;
                        if (!edge) {
                            console.warn("hover item is null");
                            return;
                        }
                        //const edgeData = edge.getModel();
                        //const edgeId = edgeData.edgeIdNum; // assuming edgeIdNum is the identifier for the edge
                        // Check if edgeId exists in the currentOrigins array


                        if (edge !== selectedEdge) {
                            if (edge.hasState("disabledHover")) {
                                return; // Skip hover actions for this item
                            }
                            edge.setState('hover', true);
                            chart.updateItem(edge, {
                                style: {
                                    lineWidth: 14,
                                    opacity: 1
                                },
                            });
                        }         
                    });

                    chart.on('edge:mouseleave', (evt) => {
                        const edge = evt.item;
                        if (!edge) {
                            console.warn("hover item is null");
                            return;
                        }
                        //const edgeData = edge.getModel();
                        if (edge !== selectedEdge) {
                            if (edge.hasState("disabledHover")) {
                                return; // Skip hover actions for this item
                            }
                            chart.clearItemStates(edge);
                            chart.updateItem(edge, {
                                style: {

                                    lineWidth: 10,
                                    opacity: 0.1
                                },
                            });
                        }
                    });

                    chart.on('edge:click', (evt) => {
                        const edge = evt.item;
                        if (!edge) {
                            console.warn("clicked item is null");
                            return;
                        }
                        const edgeData = edge.getModel();
                        if (selectedEdge && selectedEdge !== edge) {
                            chart.clearItemStates(selectedEdge);
                            //clear previously highlighted color
                            chart.updateItem(selectedEdge, {
                                style: {
                                    //stroke: getEdgeColor(edgeData.totalFlow),
                                    lineWidth: 10,
                                    opacity: 0.1
                                },
                            });
                        }
                        selectedEdge = edge;
                        edge.setState('selected', true);
                        const edgeInfo = {
                            source: edgeData.source,
                            target: edgeData.target,
                            totalFlow: edgeData.totalFlow,
                            co2Emission: edgeData.co2Emission,
                        };
                        setSelectedEdgeInfo(edgeInfo); 
                        setEdgePopup(true);
                    })
                };
                    
            } catch {
                console.log("Error adding data");
            }
            chartRef.current=chart;
        }
    }
    
    const handleCheckboxChange = (event) => {
        const { name, checked } = event.target;
        setCheckedItems((prevItems) => ({
            ...prevItems,
            [name]: checked,
        }));
        console.log("Display info: ", checkedItems.display);
    };
    const handleOriginCheckboxChange = (event) => {
        const { name, checked } = event.target;
        setCheckedItems((prevItems) => ({
            ...prevItems,
            [name]: checked,
        }));
        if (currentOrigins){
            currentOrigins.forEach((origin) => {
                if (chartRef.current){
                    const originEdge = chartRef.current.find('edge', edge => edge.getModel().edgeIdNum === origin);
                    if (originEdge) {
                        if (!checkedItems.originDisplay){
                            chartRef.current.setItemState(originEdge, "disabledHover", true);
                        }
                        else{
                            chartRef.current.clearItemStates(originEdge);
                        }
                        chartRef.current.updateItem(originEdge, {
                            style: {
                                stroke: checkedItems.originDisplay?'#FFA07A':'#FF0000',
                                opacity: checkedItems.originDisplay?0.1:1,
                            },
                        });
                    }
                }

            });
        }
    }

    // Handle slider change
    const handleSliderChange = (newTime, option) => {
        if (!chartRef.current) {
            console.log("nochart");
            return
        };

        setTime(newTime);
        console.log("New Time: ", newTime);

        //reset previous
        if (tabsNum){
            tabsNum.forEach((num) => {
                if (chartRef.current){
                    const leafEdge = chartRef.current.find('edge', edge => edge.getModel().edgeIdNum === String(num));
                    if (leafEdge) {
                        chartRef.current.clearItemStates(leafEdge);
                        chartRef.current.updateItem(leafEdge, {
                            style: {
                                stroke: '#FFA07A',
                                lineWidth: 4,
                                opacity: 0.1
                            },
                        });
                    }
                }

            });
        }

        if (signalTimeInfo) {
            const curTimeInfo =  signalTimeInfo.find( timeInfo => timeInfo["timeNum"] === String(newTime) 
                                                        && timeInfo["signalNum"] === (option === 'Signal 5'? String(5): String(6)));
            if (curTimeInfo){
                var linkList = curTimeInfo["linkInfoA"];

                var tempTabNum = [];
                linkList.forEach((linkSignal)=>{
                    const linkNum = linkSignal["link"];
                    tempTabNum.push(linkNum);
                    if(chartRef.current)
                    {
                        const signalEdge = chartRef.current.find('edge', edge => edge.getModel().edgeIdNum === String(linkNum));
                        if (signalEdge) {
                            chartRef.current.setItemState(signalEdge, "disabledHover", true);
                            chartRef.current.updateItem(signalEdge, {
                                style: {
                                    stroke: '#000000',
                                    lineWidth: 4,
                                    opacity: 1
                                },
                            });
                        }
                    }
                })

                var tempStr = "";
                var tempArr = [];
                linkList.forEach((item) => {
                    for (const key in item) {
                        if (item.hasOwnProperty(key)) {
                            tempStr+= `${key}: ${item[key]}` + '\n'
                        }
                    }
                    tempArr.push(tempStr);
                    tempStr = "";
                })
                setTabsNum(tempTabNum);
                setCurTabInfo(tempArr);
            }
        }
    };

    const handleRadioChange = (event) => {
        console.log("Signal:" , event.target.value);
        console.log("Time:", time);
        setSelectedOption(event.target.value);
        handleSliderChange(time, event.target.value);
        
    };

    useEffect(() => {
        if (selectedEdgeInfo) {
            animation();
        }
        return () => {
            if(popChart){
                popChart.destroy();
            }
        };
    // eslint-disable-next-line
    }, [selectedEdgeInfo, popChart]);

    useEffect(() => {
        if (props.selectedGraph === 'Time Optimizations' && !chartRef.current) {
            node();
        }

        return () => {
            if (chartRef.current || chart) {
                chart.destroy(); // Cleanup on unmount
                chartRef.current = null;
            }
        };
    // eslint-disable-next-line
    }, [ props.expandedCollection, props.selectedGraph])
    
    return (
        <div>
            <div id="charts" ref={nodeGraphRef} style={{ width: props.dimensions.graphWidth, height: props.dimensions.graphHeight}}>
            </div>
            <p style={{ padding: '20px', paddingTop:'10px' }}> Timing Optimization at {time} minutes for {selectedOption}</p>
            {/* Timeline Slider with markers */}
            <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '50px',
                        borderRadius: '5px',
                        color: '#660000', fontSize: '16px', fontWeight: 'bold', padding: '20px' 
                        }}
            >
                <label>
                Start by setting the time  <span style={{ fontWeight: 'bold' }}>»</span>
                <div><input
                        type="range"
                        min="0"
                        max="100"
                        value={time}
                        step="5"  // Step value added here
                        onChange={(e) => handleSliderChange(Number(e.target.value), selectedOption)}
                        style={{
                            width: '70%',
                            height: '10px',
                            position: 'absolute',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: '#660000',
                            borderRadius: '5px',
                            outline: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            padding:'3px'
                        }}
                        className="custom-slider"
                />
                </div>
                </label>
                <style>
                    {`
                            .custom-slider::-webkit-slider-thumb {
                                -webkit-appearance: none;
                                appearance: none;
                                width: 20px;
                                height: 20px;
                                background: #FFFFFF; /* Thumb color */
                                border-radius: 50%;
                                cursor: pointer;
                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
                            }
                    `}
                </style>
            </div>

            <div style={{ color: '#660000', fontSize: '16px', fontWeight: 'bold', padding: '20px' }}>
                <label>
                    <input
                        type="radio"
                        name="group1"
                        value="Signal 5"
                        checked={selectedOption === 'Signal 5'}
                        onChange={handleRadioChange}
                    />
                    Signal 5
                </label>
                <label>
                    <input
                    type="radio"
                    name="group1"
                    value="Signal 6"
                    checked={selectedOption === 'Signal 6'}
                    onChange={handleRadioChange}
                    />
                    Signal 6
                </label>
            </div>
            
            <Popup trigger={edgePopup} setTrigger={setEdgePopup}>
                <h3>Selected Edge Information</h3>
                <div id="animation" ref={popUpAnimationRef} style={{ width: 200, height: 200 }}></div>
                    {selectedEdgeInfo && (
                        <div>
                            <p><strong>Total Flow:</strong> {selectedEdgeInfo.totalFlow}</p>
                            <p><strong>CO2 Emission:</strong> {selectedEdgeInfo.co2Emission}</p>
                        </div>

                    )}
            </Popup>

            <div style={{ padding: '20px' }}>
            <h1>Relative Edges Information</h1>
            <Tabs defaultActiveKey="1">
                <TabPane tab={"Edge " + String(tabsNum[0])} key="1">
                <h3>Information for Edge {tabsNum[0]}</h3>
                <p style={{ whiteSpace: "pre-line" }}>{tabsNum[0]!==0?curTabInfo[0]:"No Edge Information Available"}</p>
                </TabPane>
                <TabPane tab={"Edge " + String(tabsNum[1])} key="2">
                <h3>Information for Edge {tabsNum[1]}</h3>
                <p style={{ whiteSpace: "pre-line" }}>{tabsNum[1]!==0?curTabInfo[1]:"No Edge Information Available"}</p>
                </TabPane>
                <TabPane tab={"Edge " + String(tabsNum[2])} key="3">
                <h3>Information for Edge {tabsNum[2]}</h3>
                <p style={{ whiteSpace: "pre-line" }}>{tabsNum[0]!==0?curTabInfo[2]:"No Edge Information Available"}</p>
                </TabPane>
            </Tabs>
            </div>
        </div>
        
    );
}


function assignIcons(nodes) {
    const icons = ['🚦', '🛑', '⛔', '⛖','➡️'];
    nodes.forEach((node, index) => {
        node.icon = icons[Math.floor(index / 6)];
    });
}
// eslint-disable-next-line
function getEdgeColor(totalFlow) {
    if (totalFlow < 300) {
        return '#15931f';
    } else if (totalFlow >= 300 && totalFlow < 600) {
        return '#ff9f01';
    } else {
        return '#ff0901';
    }
}
// eslint-disable-next-line
function getEdgeColorForOrigins(id, list) {
    if (list.includes(id)) {
        return '#000000';
    }
    else {
        return '#FFA07A';
    }
}

export default Signals;