// @ts-check
import React, { useRef, useEffect } from 'react';
import { Chart } from '@antv/g2';
import { Graph } from '@antv/g6';
import axios from 'axios';
import AveTrafficConds from './AveTrafficConds';

function Charts(props) {
    const nodeGraphRef = useRef(null);
    const dimensions = { graphWidth: window.innerWidth * 0.6, graphHeight: window.innerHeight * 0.7};
    var file = "AveTrafficConds"; // get from elsewhere later in useState

    var chart;
    var ret;
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
            nodes = response.data.nodes.map(obj => ({
                id: String(obj.id),
                x: obj.x,
                y: obj.y,
                label: String(obj.id)
            }));  // Update the nodes
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
            edges = response.data.edges.map(obj => ({
                    edgeId: String(obj.id),
                    source: String(obj.start),
                    target: String(obj.end),
            }));
        } catch (error) {
            console.error('Error fetching nodes:', error);
            return null;
        }
        assignIcons(nodes)
        return { nodes: nodes, edges: edges,};
    };
    
    // Renders the node graph
    const node = async () => {
        if(nodeGraphRef.current){
            chart = new Graph({
                container: nodeGraphRef.current,
                width: dimensions.graphWidth,
                height: dimensions.graphHeight,
        
                modes: {
                    default: ['drag-canvas', 'drag-node', 'zoom-canvas'],
               
                },
                defaultNode: {
                    size: [50],
                    color: '#660000',
                    style: {
                        fill: '#660000',
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

                    },
                    
                },
            });
        

            // Get node and edge data from an API endpoint
            const data = await getNodeGraphData();

            // Add and scale the nodes and render the graph
            try {  
                if(chart && data){
                    // console.log(data.nodes);
                    // console.log(data.edges);
                    // Calculate the bounding box of the nodes
                    const minX = Math.min(...data.nodes.map(node => node.x));
                    const maxX = Math.max(...data.nodes.map(node => node.x));
                    const minY = Math.min(...data.nodes.map(node => node.y));
                    const maxY = Math.max(...data.nodes.map(node => node.y));
                    const paddingPercent = 10;
                    // Calculate scaling factors with padding of %
                    const scaleX = (dimensions.graphWidth - dimensions.graphWidth/paddingPercent) / (maxX - minX);
                    const scaleY = (dimensions.graphHeight - dimensions.graphHeight/paddingPercent) / (maxY - minY);

                    // Choose the smaller scale to maintain aspect ratio
                    const scale = Math.min(scaleX, scaleY);

                    // Apply scaling and translation to center the graph
                    const scaledNodes = data.nodes.map(node => ({
                        ...node,
                        // Add the % padding
                        x: (node.x - minX) * scale + (dimensions.graphWidth/paddingPercent)/2,
                        y: (node.y - minY) * scale + (dimensions.graphHeight/paddingPercent)/2,
                    }));
                    data.nodes = scaledNodes;
                    
                    chart.data(data);
                    // Create the graph data structure
                    chart.render();
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
                height: dimensions.graphHeight,
                width: dimensions.graphWidth,
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

    useEffect(() => {
        if(file === "default") {
            if (props.selectedGraph === 'node') {
                node();
            } else if (props.selectedGraph === 'bar') {
                bar();
            }
        }

        return () => {
            if (chart) {
                chart.destroy();
            }
        };
    // eslint-disable-next-line
    }, [nodeGraphRef, props.expandedCollection, props.selectedGraph, file])

    switch(file){
        case "default":
            ret = ( <div id="charts" ref={nodeGraphRef} style={{ width: dimensions.graphWidth, height: dimensions.graphHeight }}></div>);
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


function assignIcons(nodes) {
    //const icons = ['🚦', '🛑', '⛔', '⛖','➡️'];
    nodes.forEach((node, index) => {
        //node.icon = icons[Math.floor(index / 6)];
        node.icon = node.id;
    });
}

export default Charts;
