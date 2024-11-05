// @ts-check
import React, { useRef, useEffect, useState } from 'react';
import { Chart } from '@antv/g2';
// import G6 from '@antv/g6';
import { Graph, registerEdge, registerNode} from '@antv/g6';
//import * as G6 from '@antv/g6';
import axios from 'axios';
import Popup from './Popup';

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

function assignIcons(nodes) {
    const icons = ['🚦', '🛑', '⛔', '⛖','➡️'];
    nodes.forEach((node, index) => {
        node.icon = icons[Math.floor(index / 6)];
    });
}

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


  function getEdgeColor(totalFlow) {
    if (totalFlow < 300) {
        return '#15931f';
    } else if (totalFlow >= 300 && totalFlow < 600) {
        return '#ff9f01';
    } else {
        return '#ff0901';
    }
}

function Charts(props) {
    const nodeGraphRef = useRef(null);
    const popUpAnimationRef = useRef(null)
    const [edgePopup, setEdgePopup] = useState(false);
    const [selectedEdgeInfo, setSelectedEdgeInfo] = useState(null);

    var chart;
    var popChart;
    const graphWidth = 800;
    const graphHeight = 500;
    let selectedEdge = null;

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
                    co2Emission: condition ? condition.CO2 : null
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
                width: graphWidth,
                height: graphHeight,
        
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
                layout: {
                    type: 'force',
                    preventOverlap: true,
                    linkDistance: 180,
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
                    const scaleX = (graphWidth - graphWidth/paddingPercent) / (maxX - minX);
                    const scaleY = (graphHeight - graphHeight/paddingPercent) / (maxY - minY);

                    // Choose the smaller scale to maintain aspect ratio
                    const scale = Math.min(scaleX, scaleY);

                    // Apply scaling and translation to center the graph
                    const scaledNodes = data.nodes.map(node => ({
                        ...node,
                        // Add the % padding
                        x: (node.x - minX) * scale + (graphWidth/paddingPercent)/2,
                        y: (node.y - minY) * scale + (graphHeight/paddingPercent)/2,
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
                        };
                        setSelectedEdgeInfo(edgeInfo); 
                        setEdgePopup(true);
                    });

                };
            } catch {
                console.log("Error adding data");
            }
        }
    }

    // Render the bar chart
    // eslint-disable-next-line
    const bar = async () => {
        if(!props.expandedCollection){
            return null;
        }
        let dataTypes = ["injury crashes", "fatal crashes", "moderate damage", "minor damage", "no damage"];
        var data = [];
        // Get data from the API endpoint
        const token = sessionStorage.getItem('token');
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}:3000/api/file-summary?sim=${props.expandedCollection}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            dataTypes.forEach((type) => {
                data.push({ Damage: type, Vehicles: response.data.total[type][5] });
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
                height: graphHeight,
                width: graphWidth,
                title: "Total Vehicle Damage",
            });

            chart
                .interval()
                .data(data)
                .encode('x', 'Damage')
                .encode('y', 'Vehicles')
                .encode('color', 'Damage');

            chart.render();
        }    
    }
    
    // Renders the rose chart
    // eslint-disable-next-line
    const rose = () => {    
        if (nodeGraphRef.current) {
            chart = new Chart({
                container: nodeGraphRef.current,
                width: graphWidth,
                height: graphHeight,
            });

            chart.coordinate({ type: 'polar', outerRadius: 0.85 });

            chart
                .interval()
                .transform({ type: 'groupX', y: 'sum' })
                .data({
                    type: 'fetch',
                    value: 'https://gw.alipayobjects.com/os/bmw-prod/87b2ff47-2a33-4509-869c-dae4cdd81163.csv',
                })
                .encode('x', 'year')
                .encode('color', 'year')
                .encode('y', 'people')
                .scale('y', { type: 'sqrt' })
                .scale('x', { padding: 0 })
                .axis(false)
                .label({
                    text: 'people',
                    position: 'outside',
                    formatter: '~s',
                    transform: [{ type: 'overlapDodgeY' }],
                })
                .legend({ color: { length: 400, layout: { justifyContent: 'center' } } })
                .animate('enter', { type: 'waveIn' })
                .tooltip({ channel: 'y', valueFormatter: '~s' });

            chart.render();
        }
    }

    // Renders the line chart
    // eslint-disable-next-line
    const line = () => {    
        if (nodeGraphRef.current) {
            chart = new Chart({
                container: nodeGraphRef.current,
                autoFit: true,
                insetRight: 10,
                width: graphWidth,
                height: graphHeight,
            });

            chart
                .line()
                .data({
                    type: 'fetch',
                    value: 'https://assets.antv.antgroup.com/g2/indices.json',
                })
                .transform({ type: 'normalizeY', basis: 'first', groupBy: 'color' })
                .encode('x', (d) => new Date(d.Date))
                .encode('y', 'Close')
                .encode('color', 'Symbol')
                .scale('y', { type: 'log' })
                .axis('y', { title: '↑ Change in price (%)' })
                .label({
                    text: 'Symbol',
                    selector: 'last',
                    fontSize: 10,
                })
                .tooltip({ channel: 'y', valueFormatter: '.1f' });

            chart.render();
        }
    }

    // Renders the scatter chart
    // eslint-disable-next-line
    const scatter = () => {
        if (nodeGraphRef.current) {
            chart = new Chart({
                container: nodeGraphRef.current,
                autoFit: true,
                width: graphWidth,
                height: graphHeight,
            });

            chart
                .point()
                .data({
                    type: 'fetch',
                    value:
                        'https://gw.alipayobjects.com/os/bmw-prod/56b6b137-e04e-4757-8af5-d75bafaef886.csv',
                })
                .encode('x', 'date')
                .encode('y', 'value')
                .encode('color', 'value')
                .encode('shape', 'point')
                .scale('color', {
                    palette: 'rdBu',
                    offset: (t) => 1 - t,
                })
                .style('stroke', '#000')
                .style('strokeOpacity', 0.2)
                .tooltip([
                    { channel: 'x', name: 'year', valueFormatter: (d) => d.getFullYear() },
                    { channel: 'y' },
                ]);

            chart.lineY().data([0]).style('stroke', '#000').style('strokeOpacity', 0.2);

            chart.render();
        }
    }

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

    useEffect(() => {
        if (props.selectedGraph === 'node') {
            node();
        } else if (props.selectedGraph === 'bar') {
            bar();
        }

        return () => {
            if (chart) {
                chart.destroy();
            }
        };
    }, [nodeGraphRef, props.expandedCollection, props.selectedGraph]);
    useEffect(() => {
        if (selectedEdgeInfo) {
            animation();
        }
        return () => {
            if(popChart){
                popChart.destroy();
            }
        };
    }, [selectedEdgeInfo]);

    return (
        <div>
            <div id="charts" ref={nodeGraphRef} style={{ width: 800, height: 500 }}></div>
            
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

export default Charts;
