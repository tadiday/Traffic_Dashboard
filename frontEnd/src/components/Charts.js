// @ts-check
import React, { useRef, useEffect } from 'react';
import { Chart } from '@antv/g2';
// import G6 from '@antv/g6';
import { Graph } from '@antv/g6';
//import * as G6 from '@antv/g6';
import axios from 'axios';


function Charts(props) {
    const nodeGraphRef = useRef(null);
    

    useEffect(() => {
        let chart;
        
        // Render the bar chart
        // eslint-disable-next-line
        const bar = () => {
            if (nodeGraphRef.current) {
                chart = new Chart({
                    container: nodeGraphRef.current,
                    autoFit: true,
                    height: 450,
                    width: 450,
                });
    
                chart
                    .interval()
                    .data([
                        { genre: 'Sports', sold: 275 },
                        { genre: 'Strategy', sold: 115 },
                        { genre: 'Action', sold: 120 },
                        { genre: 'Shooter', sold: 350 },
                        { genre: 'Other', sold: 150 },
                    ])
                    .encode('x', 'genre')
                    .encode('y', 'sold')
                    .encode('color', 'genre');
    
                chart.render();
            }    
        }
        
        // Renders the rose chart
        // eslint-disable-next-line
        const rose = () => {    
            if (nodeGraphRef.current) {
                chart = new Chart({
                    container: nodeGraphRef.current,
                    width: 500,
                    height: 500,
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
                    x: obj.x * 300,
                    y: obj.y * 300,
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
                    width: 1000,
                    height: 1000,
                    
                    // layout: {
                    //     type: 'dagre',
                    //     rankdir: 'LR', // Direction of the layout: TB (top-bottom), LR (left-right)
                    // },
                    // edge: {
                    //     style: {
                    //         endArrow: true
                    //     },
                    // },
                    // node: {
                    //     style: {
                    //         icon: true,
                    //         iconText: (d) => d.id,
                    //         fill: '#FFA07A',
                    //     },
                    
                    // },
                    // behaviors: ['drag-canvas',],

                    modes: {
                        default: ['drag-canvas', 'drag-node'],
                    },
                    defaultNode: {
                        type: 'circle',
                        size: [50],
                        color: '#5B8FF9',
                        style: {
                            icon: true,
                            iconText: (d) => d.id,
                            fill: '#FFA07A',
                        },
                        labelCfg: {
                            style: {
                                fill: '#FFFFFF', // Label color
                                fontSize: 16,    // Label font size
                            },
                        },
                    },
                    defaultEdge: {
                        style: {
                            endArrow: true,
                        },
                    },
                });

                // Get node and edge data from an API endpoint
                const data = await getNodeGraphData();

                // Add the edges and render the graph
                try {  
                    if(chart && data){
                        console.log(data.nodes);
                        console.log(data.edges);
                        chart.data(data);
                        // Create the graph data structure
                        chart.render();
                    };
                } catch {
                    console.log("Error adding data");
                }
            }

        }

        // For now render the node graph
        node();
  
        return () => {
            if (chart) {
                chart.destroy();
            } 
        };
    }, [nodeGraphRef, props.expandedCollection]);

    

    return (
        <div id="charts" ref={nodeGraphRef}>
        </div>
    );
}

export default Charts;
