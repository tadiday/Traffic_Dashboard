// @ts-check
import React, { useRef, useEffect, useState } from 'react';
import { Chart } from '@antv/g2';
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
    totalAverageTime: String;
    averageTime: String;
    averageVehicles: String;
    averageQueue: String;
    averageStops: String;
    fuel: String;
    expectedCrashes: String;
    expectedTopInjurt: String;
    fatelCrashes: String;
    crashLowDamage: String;
    crashMedDamage: String;
    crashHighDamage: String;

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


const AveTrafficConds = (props) => {
    const nodeGraphRef = useRef(null);
    const popUpAnimationRef = useRef(null);
    const [edgePopup, setEdgePopup] = useState(false);
    const [selectedEdgeInfo, setSelectedEdgeInfo] = useState(null);
    
    var chart;
    var popChart;
    let selectedEdge = null;
    
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
    };

    // Node graph Creation functions
    const getNodeGraphData = async () => {
        if(!props.expandedCollection){
            return null;
        }

        var nodes = [];
        var edges = [];

        const token = sessionStorage.getItem('token');
        
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}:3000/api/file-nodes?sim=${props.expandedCollection}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            //console.log("Fetched Nodes:", response.data); 
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
            //console.log("Fetched Nodes:", response.data); 
            //console.log('Edges:', response.data.edges);
            //console.log('Conditions:', response2.data.conditions);
            edges = response.data.edges.map(obj => {
                const condition = response2.data.conditions.find(cond => cond.edgeID === obj.id);
                // console.log('Test:',response2.data.conditions.map(cond => ({ edgeId: cond.edgeID, totalFlow: cond.totalFlow, CO2: cond.CO })));
                
                return {
                    edgeId: String(obj.id),
                    source: String(obj.start),
                    target: String(obj.end),
                    totalFlow: condition ? condition.totalFlow : null,
                    co2Emission: condition ? condition.CO2 : null,
                    totalAverageTime: condition ? condition.totalAverageTime : null,
                    averageVehicles: condition ? condition.averageVehicles : null,
                    averageQueue: condition ? condition.averageQueue : null,
                    averageStops: condition ? condition.averageStops : null,
                    fuel: condition ? condition.fuel : null,
                    expectedCrashes: condition ? condition.expectedCrashes : null,
                    expectedTopInjurt: condition ? condition.expectedTopInjurt : null,
                    fatelCrashes: condition ? condition.fatelCrashes : null,
                    crashLowDamage: condition ? condition.crashLowDamage : null,
                    crashMedDamage: condition ? condition.crashMedDamage : null,
                    crashHighDamage: condition ? condition.crashHighDamage : null,
                };
            });
        
        } catch (error) {
            console.error('Error fetching nodes:', error);
            return null;
        }

        assignIcons(nodes);

        return { nodes: nodes, edges: edges,};
    };

    // Renders the node graph
    const node = async () => {
        if(nodeGraphRef.current){
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

                    },
                    
                },
            });
        

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
                            stroke: getEdgeColor(edge.totalFlow), // Set edge color based on totalFlow
                        };
                    });
                    chart.render();

                    chart.on('edge:mouseenter', (evt) => {
                        const edge = evt.item;
                        if (!edge) {
                            console.warn("hover item is null");
                            return;
                        }
                        if (edge !== selectedEdge) {
                            edge.setState('hover', true);
                            chart.updateItem(edge, {
                                style: {
                                    stroke: '#FF6347',
                                    lineWidth: 14,
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
                        const edgeData = edge.getModel();
                        if (edge !== selectedEdge) {
                            chart.clearItemStates(edge);
                            chart.updateItem(edge, {
                                style: {
                                    stroke: getEdgeColor(edgeData.totalFlow),
                                    lineWidth: 10,
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
                                    stroke: getEdgeColor(edgeData.totalFlow),
                                    lineWidth: 10,
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
                            totalAverageTime: edgeData.totalAverageTime,
                            averageVehicles: edgeData.averageVehicles,
                            averageQueue: edgeData.averageQueue,
                            averageStops: edgeData.averageStops,
                            fuel: edgeData.fuel,
                            expectedCrashes: edgeData.expectedCrashes,
                            expectedTopInjurt: edgeData.expectedTopInjurt,
                            fatelCrashes: edgeData.fatelCrashes,
                            crashLowDamage: edgeData.crashLowDamage,
                            crashMedDamage: edgeData.crashMedDamage,
                            crashHighDamage: edgeData.crashHighDamage,
                        };
                        setSelectedEdgeInfo(edgeInfo); 
                        setEdgePopup(true);
                    });

                };
            } catch {
                console.log("Error adding data");
            }
        }
    };

    const pie = async () =>{
        if(!props.expandedCollection){
            return null;
        }
        //let dataTypes = ["expectedCrashes", "expectedTopInjurt"];
        var data = [];
        // // Get data from the API endpoint
        const token = sessionStorage.getItem('token');
        try {
             const response = await axios.get(`${process.env.REACT_APP_API_URL}:3000/api/file-avgconds?sim=${props.expandedCollection}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            response.data.conditions.forEach(elem =>{
    
                data.push(
                    { totalFlow: elem.totalFlow, category: 'Expected Crashes', value: elem.expectedCrashes },
                    { totalFlow: elem.totalFlow, category: 'Expected Top Injury', value: elem.expectedTopInjurt },
                    { totalFlow: elem.totalFlow, category: 'Fatal Crashes', value: elem.fatelCrashes },
                    { totalFlow: elem.totalFlow, category: 'Low Crashes', value: elem.crashLowDamage },
                    { totalFlow: elem.totalFlow, category: 'Med Crashes', value: elem.crashMedDamage },
                    { totalFlow: elem.totalFlow, category: 'High Crashes', value: elem.crashHighDamage }
                );
   
            });
            data.sort((a, b) => a.totalFlow - b.totalFlow);
            console.log(data);
        } catch (error) {
            console.error('Error fetching bar info:', error);
            return null;
        }


        if (nodeGraphRef.current) {
            chart = new Chart({
                container: nodeGraphRef.current,
                //autoFit: true,
                height: props.dimensions.graphHeight,
                width: props.dimensions.graphWidth,
                title: "Average Crashes",
            });

            chart
                .interval()
                .data(data)
                .transform({ type: 'groupX', y: 'mean', groupBy: ['category', 'totalFlow']})
                .transform({ type: 'stackY', reverse: true, orderBy: 'category' })
                .encode('x', 'totalFlow')
                .encode('y', 'value')
                .encode('color', 'category')
                .scale('color', {
                    domain: ['Expected Crashes', 'Expected Top Injury', 'Fatal Crashes', 'Low Crashes', 'Med Crashes', 'High Crashes'],
                    range: ['#baaeea', '#84c2ea', '#ff0000', '#a6ea84', '#ead084','#ea9a84']
                })
                .axis('y', { title: 'Average Crash' })
                .axis('x', { title: 'Total Flow' })
                

            chart.render();
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
        if (props.selectedGraph === 'Traffic Map') {
            node();
        }else if(props.selectedGraph === 'Avg Crashes'){
            pie();
        }

        return () => {
            if (chart) {
                chart.destroy();
            }
        };
    // eslint-disable-next-line
    }, [nodeGraphRef, props.expandedCollection, props.selectedGraph])

    return (
        <div>
            <div id="charts" ref={nodeGraphRef} style={{ width: props.dimensions.graphWidth, height: props.dimensions.graphHeight }}></div>
            
            <Popup trigger={edgePopup} setTrigger={setEdgePopup}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Selected Edge Information</h2>
                <div id="animation" ref={popUpAnimationRef} style={{ width: 100, height: 250, marginTop: '-60px',marginLeft: '190px' }}></div>
                <div style={{ display: 'flex' }}>
                    {/* Left Section: Animation on top, Information below */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '20px' }}>
                    
                    <div>
                        {selectedEdgeInfo && (
                        <div>
                            <p><strong>Total Flow:</strong> {selectedEdgeInfo.totalFlow.toFixed(3)}</p>
                            <p><strong>CO2 Emission:</strong> {selectedEdgeInfo.co2Emission.toFixed(3)}</p>
                            <p><strong>Total Average Time:</strong> {selectedEdgeInfo.totalAverageTime.toFixed(3)}</p>
                            <p><strong>Average Vehicles:</strong> {selectedEdgeInfo.averageVehicles.toFixed(3)}</p>
                            <p><strong>Average Queue:</strong> {selectedEdgeInfo.averageQueue.toFixed(3)}</p>
                            <p><strong>Average Stops:</strong> {selectedEdgeInfo.averageStops.toFixed(3)}</p>
                            <p><strong>Fuel:</strong> {selectedEdgeInfo.fuel.toFixed(3)}</p>
                        </div>
                        )}
                    </div>
                    </div>

                    {/* Right Section: Additional Information */}
                    <div style={{ marginLeft: '150px'}}>
                    {selectedEdgeInfo && (
                        <div>
                        <p><strong>Expected Crashes:</strong> {selectedEdgeInfo.expectedCrashes.toFixed(3)}</p>
                        <p><strong>Expected Top Injury:</strong> {selectedEdgeInfo.expectedTopInjurt.toFixed(3)}</p>
                        <p><strong>Fatal Crashes:</strong> {selectedEdgeInfo.fatelCrashes.toFixed(3)}</p>
                        <p><strong>Crash Low Damage:</strong> {selectedEdgeInfo.crashLowDamage.toFixed(3)}</p>
                        <p><strong>Crash Med Damage:</strong> {selectedEdgeInfo.crashMedDamage.toFixed(3)}</p>
                        <p><strong>Crash High Damage:</strong> {selectedEdgeInfo.crashHighDamage.toFixed(3)}</p>
                        </div>
                    )}
                    </div>
                </div>
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



export default AveTrafficConds;