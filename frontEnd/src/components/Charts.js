// @ts-check
import React, { useRef, useEffect } from 'react';
import { Chart } from '@antv/g2';
// import G6 from '@antv/g6';
import { Graph } from '@antv/g6';
//import * as G6 from '@antv/g6';
import axios from 'axios';


function Charts(props) {
    const nodeGraphRef = useRef(null);
    
    var chart;
    const graphWidth = 1000;
    const graphHeight = 600;

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
            //console.log("Fetched Nodes:", response.data); 
            edges = response.data.edges.map(obj => ({
                source: String(obj.start),
                target: String(obj.end)
            }));;  // Update the edges
        } catch (error) {
            console.error('Error fetching nodes:', error);
            return null;
        }

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
                    type: 'circle',
                    size: [50],
                    color: '#660000',
                    style: {
                        icon: true,
                        iconText: (d) => d.id,
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
                height: graphHeight,
                width: graphWidth,
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

    useEffect(() => {
        // For now render the node graph
        node();
  
        return () => {
            if (chart) {
                chart.destroy();
            } 
        };
    }, [nodeGraphRef, props.expandedCollection]);

    

    return (
        <div id="charts" ref={nodeGraphRef} style={{ width: 1000, height: 1000 }}></div>
    );
}

export default Charts;
