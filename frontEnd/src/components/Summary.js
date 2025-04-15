// @ts-check
import React, { useRef, useEffect } from 'react';
import { Graph } from '@antv/g6';
import axios from 'axios';

function Summary(props) {
    const nodeGraphRef = useRef(null); // Reference to the DOM element for the graph container
    
    var chart; // Variable to hold the graph instance
    
    // Node graph creation functions
    const getNodeGraphData = async () => {
        if(!props.expandedCollection){
            return null; // Return null if no collection is expanded
        }

        var nodes = []; // Array to store node data
        var edges = []; // Array to store edge data

        const token = sessionStorage.getItem('token'); // Retrieve token from session storage
        try {
            // Fetch node data from the API
            const response = await axios.get(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-nodes?sim=${props.expandedCollection}`, {
                headers: {
                    'Authorization': `Bearer ${token}`, // Add authorization header
                }
            });
            nodes = response.data.nodes.map(obj => ({
                id: String(obj.id), // Convert id to string
                x: obj.x, // X-coordinate of the node
                y: obj.y, // Y-coordinate of the node
                label: String(obj.id) // Label for the node
            }));  // Update the nodes
        } catch (error) {
            console.error('Error fetching nodes:', error); // Log error if fetching nodes fails
            return null;
        }

        try {
            // Fetch edge data from the API
            const response = await axios.get(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-edges?sim=${props.expandedCollection}`, {
                headers: {
                    'Authorization': `Bearer ${token}`, // Add authorization header
                }
            });
            edges = response.data.edges.map(obj => ({
                    edgeId: String(obj.id), // Convert edge id to string
                    source: String(obj.start), // Source node id
                    target: String(obj.end), // Target node id
            }));
        } catch (error) {
            console.error('Error fetching nodes:', error); // Log error if fetching edges fails
            return null;
        }
        assignIcons(nodes); // Assign icons to nodes
        return { nodes: nodes, edges: edges }; // Return nodes and edges
    };
    
    // Renders the node graph
    const TrafficMap = async () => {
        if(nodeGraphRef.current){
            // Initialize the graph instance
            chart = new Graph({
                container: nodeGraphRef.current, // DOM element for the graph
                width: props.dimensions.graphWidth, // Graph width
                height: props.dimensions.graphHeight, // Graph height
        
                modes: {
                    default: ['drag-canvas', 'drag-node', 'zoom-canvas'], // Interaction modes
                },
                defaultNode: {
                    size: [50], // Node size
                    color: '#660000', // Node color
                    style: {
                        fill: '#660000', // Node fill color
                    },
                    labelCfg: {
                        style: {
                            fill: '#FFFFFF', // Label color
                            fontSize: 16,    // Label font size
                        },
                    },
                },
                defaultEdge: {
                    color: '#FFA07A', // Edge color
                    style: {
                        endArrow: true, // Enable arrow at the end of edges
                        icon: true, // Enable edge icons
                        lineWidth: 10, // Edge line width
                        label: true, // Enable edge labels
                    },
                },
            });
        
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
                    const paddingPercent = 10; // Padding percentage
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
                    
                    chart.data(data); // Set the graph data
                    chart.render(); // Render the graph
                };
            } catch {
                console.log("Error adding data"); // Log error if adding data fails
            }
        }
    }

    useEffect(() => {
        if (props.selectedGraph === 'Traffic Map') {
            TrafficMap(); // Render the traffic map if selected
        } 
        return () => {
            if (chart) {
                chart.destroy(); // Destroy the chart instance on cleanup
            }
        };
    // eslint-disable-next-line
    }, [nodeGraphRef, props.expandedCollection, props.selectedGraph]);

    return ( 
    <div id="charts" ref={nodeGraphRef} style={{ width: props.dimensions.graphWidth, height: props.dimensions.graphHeight }}>        
    </div>
    );
}

function assignIcons(nodes) {
    // Assign icons to nodes (currently using node id as the icon)
    nodes.forEach((node, index) => {
        node.icon = node.id;
    });
}

export default Summary;
