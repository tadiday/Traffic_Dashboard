import React, { useEffect, useState } from 'react';
import axios from 'axios';

function LinkFlow({ dimensions, selectedGraph, expandedCollection }) {
    const [linkFlow, setLinkFlow] = useState([]);

    useEffect(() => {
        const fetchEdgeData = async () => {
            const token = sessionStorage.getItem('token');
            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file10-linkflow?sim=${expandedCollection}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                console.log('Fetched file 10 linkflow data:', response.data);
                setLinkFlow(response.data.data || []);
            } catch (error) {
                console.error('Error fetching edge data:', error);
            }
        };

        fetchEdgeData();
    }, [expandedCollection]);

    if (!linkFlow.length) return <div>Loading...</div>;

    const avgRow = linkFlow.find(row => row.link_id === linkFlow.length);
    const linkRows = linkFlow.filter(row => row.link_id !== linkFlow.length);

    return (
        <div style={{ width: dimensions.graphWidth, height: dimensions.graphHeight, padding: '1rem' }}>
            <h2>Link-Specific Metrics</h2>
            <div
                style={{
                    overflowX: 'auto',
                    overflowY: 'auto',
                    border: '1px solid #ccc',
                    maxHeight: '100%',
                    maxWidth: '100%',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        position: 'sticky',
                        top: 0,
                        background: '#fff',
                        zIndex: 1,
                        borderBottom: '1px solid #ccc',
                        padding: '0.5rem',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        color: '#888',
                    }}
                >
                    Scroll right & down to view more →
                </div>
                <table border="1" cellPadding="5" style={{ width: '1500px', borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif' }}>
                    <thead style={{ backgroundColor: '#f2f2f2', textAlign: 'center' }}>
                        <tr>
                            <th>Link ID</th>
                            <th>Start Node</th>
                            <th>End Node</th>
                            <th>Speed (km/h)</th>
                            <th>Saturation (vph)</th>
                            <th>Lane Num</th>
                            <th>Length (km)</th>
                            <th>Flow (vehicles)</th>
                            <th>Green Time (%)</th>
                            <th>Total Travel Time (min)</th>
                            <th>Average Speed (km/h)</th>
                            <th>Average Travel Time (min)</th>
                            <th>Max Observed Vehicles</th>
                            <th>Max Possible Vehicles</th>
                            <th>Free Travel Time (min)</th>
                            <th>Current Observed Vehicles</th>
                            <th>Volume Capacity Ratio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {linkRows.map((row) => (
                            <tr key={row.link_id} style={{ textAlign: 'center' }}>
                                <td>{row.link_id}</td>
                                <td>{row.start_node}</td>
                                <td>{row.end_node}</td>
                                <td>{row.speed_kmh}</td>
                                <td>{row.saturation}</td>
                                <td>{row.lane_num}</td>
                                <td>{row.link_length}</td>
                                <td>{row.link_flow}</td>
                                <td>{row.green_time_percentage}</td>
                                <td>{row.total_travel_time}</td>
                                <td>{row.average_speed}</td>
                                <td>{row.average_travel_time}</td>
                                <td>{row.max_observed_vehicles}</td>
                                <td>{row.max_possible_vehicles}</td>
                                <td>{row.free_travel_time}</td>
                                <td>{row.current_observed_vehicles}</td>
                                <td>{row.volume_capacity_ration}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default LinkFlow;
