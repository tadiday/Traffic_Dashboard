// @ts-check
import React, { useRef, useEffect, useState } from 'react';
// import G6 from '@antv/g6';
import { Graph, registerEdge, registerNode} from '@antv/g6';
//import * as G6 from '@antv/g6';
import axios from 'axios';
import Popup from './Popup';

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


const MinPathTree = (props) => {
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
    const [previousBranch, setPreviousBranch] = useState([]);
    //var chart;
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

    // Node graph Creation functions
    const getNodeGraphData = async () => {
        if(!props.expandedCollection){
            return null;
        }

        var nodes = [];
        var edges = [];
        var minPaths = [];

        const token = sessionStorage.getItem('token');
        
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}:3000/api/file-nodes?sim=${props.expandedCollection}`, {
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
            const response = await axios.get(`${process.env.REACT_APP_API_URL}:3000/api/file-edges?sim=${props.expandedCollection}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            const response2 = await axios.get(`${process.env.REACT_APP_API_URL}:3000/api/file-avgconds?sim=${props.expandedCollection}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            const response3 = await axios.get(`${process.env.REACT_APP_API_URL}:3000/api/file-paths?sim=${props.expandedCollection}`, {
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
                    trees: obj.paths[0].edges // root = index# + 1 = search link number
                }
                
            });

        
        } catch (error) {
            console.error('Error fetching nodes:', error);
            return null;
        }

        assignIcons(nodes);

        return { nodes: nodes, edges: edges, minPaths: minPaths};
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
            tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
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
                    console.log(data.nodes);
                    console.log(data.edges);
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
                    console.log("Current: ", data.minPaths[0].trees.length);
                    console.log("origins: ", data.minPaths[0].iniOrigins);
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
                            chart.updateItem(selectedEdge, {
                                style: {
                                    lineWidth: 10,
                                    opacity: (selectedEdge===previousSearchedEdge || selectedEdge.hasState("disabledHover"))?1:0.1
                                },
                            });
                            chart.clearItemStates(selectedEdge, 'selected');
                            //clear previously highlighted color
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
            console.log("Current Origins: ", currentOrigins);
            currentOrigins.forEach((origin) => {
                console.log("origin: ", origin);
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

    const handleSearch = () => {
        if (!chartRef.current) {
            console.log("nochart");
            return
        };
        // Reset previous searched edge style
        if (previousSearchedEdge) {
            chartRef.current.updateItem(previousSearchedEdge, {
                style: { stroke: '#FFA07A', lineWidth: 10, opacity: 0.1 },
            });
            chartRef.current.clearItemStates(previousSearchedEdge);
            if (previousBranch){
                previousBranch.forEach((leaf) => {
                    console.log("Leaf: ", leaf);
                    if (leaf !== 0 && leaf !== -1 && chartRef.current){
                        const leafEdge = chartRef.current.find('edge', edge => edge.getModel().edgeIdNum === String(leaf));
                        if (leafEdge) {
                            chartRef.current.updateItem(leafEdge, {
                                style: {
                                    stroke: '#FFA07A',
                                    lineWidth: 10,
                                    opacity: 0.1
                                },
                            });
                             chartRef.current.clearItemStates(leafEdge);
                        }
                    }

                });
            }
        }
        
        // Find nodes or edges that match the search input
        const resultEdge = chartRef.current.find('edge', edge => edge.getModel().edgeIdNum === searchInput);
        if (resultEdge) {
            // Highlight the node by updating its style
            chartRef.current.updateItem(resultEdge, {
                style: {
                    stroke: getEdgeColor(resultEdge.getModel().totalFlow),
                    lineWidth: 16,
                    opacity: 1
                },
            });
            chartRef.current.setItemState(resultEdge, "disabledHover", true);
            const root = parseInt(searchInput, 10)
            if (currentTree) {
                const tree = currentTree[root-1];
                tree.forEach((leaf) => {
                    if (leaf !== 0 && leaf !== -1 && chartRef.current){
                        const leafEdge = chartRef.current.find('edge', edge => edge.getModel().edgeIdNum === String(leaf));
                        if (leafEdge) {
                            chartRef.current.updateItem(leafEdge, {
                                style: {
                                    stroke: getEdgeColor(leafEdge.getModel().totalFlow),
                                    lineWidth: 16,
                                    opacity: 1
                                },
                            });
                            chartRef.current.setItemState(leafEdge, "disabledHover", true);
                        }

                    }

                });
                setPreviousBranch(tree);
            }

            if (checkedItems.display){
                const edgeData = resultEdge.getModel();
                const edgeInfo = {
                    source: edgeData.source,
                    target: edgeData.target,
                    totalFlow: edgeData.totalFlow,
                    co2Emission: edgeData.co2Emission,
                };
                setSelectedEdgeInfo(edgeInfo); 
                setEdgePopup(true);
            }

            // Center the view on the searched node
            chartRef.current.focusItem(resultEdge, true);
            setPreviousSearchedEdge(resultEdge);
        } else {
            alert('Edge not found');
        }
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
        if (props.selectedGraph === 'node' && !chartRef.current) {
            console.log("Chart is Created NODE----------------------------")
            node();
        }

        return () => {
            if (chartRef.current || chart) {
                chart.destroy(); // Cleanup on unmount
                chartRef.current = null;
                console.log("Chart is destroyed")
            }
        };
    // eslint-disable-next-line
    }, [ props.expandedCollection, props.selectedGraph])

    const placeholder = `Enter edge ID 1-${maxNumberOfTrees}`
    
    return (
        <div>
            <div style={{ marginBottom: "8px" }}>
                <span style={{ marginRight: "8px" }}>Search a minimum path tree by its root:</span>
                <input
                    type="text"
                    value={searchInput}
                    placeholder={placeholder}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
                <button onClick={handleSearch}>Search</button>
            </div>

            <div>
                <label>
                    <input
                        type="checkbox"
                        name="display"
                        checked={displayIsChecked}
                        onChange={handleCheckboxChange}
                    />
                    <span style={{ marginRight: "8px" }}>Display searched root information</span>
                </label>
            </div>
            <div>
                <label>
                    <input
                        type="checkbox"
                        name="originDisplay"
                        checked={originIsChecked}
                        onChange={handleOriginCheckboxChange}
                    />
                    <span style={{ marginRight: "8px" }}>Display origins</span>
                </label>
            </div>
            <div id="charts" ref={nodeGraphRef} style={{ width: props.dimensions.graphWidth, height: props.dimensions.graphHeight }}>
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
        </div>
    );
}


function assignIcons(nodes) {
    const icons = ['🚦', '🛑', '⛔', '⛖','➡️'];
    nodes.forEach((node, index) => {
        node.icon = icons[Math.floor(index / 6)];
    });
}

function getEdgeColor(totalFlow) {
    if (totalFlow < 300) {
        return '#15931f';
    } else if (totalFlow >= 300 && totalFlow < 600) {
        return '#ff9f01';
    } else {
        return '#ff0901';
    }
}

export default MinPathTree;