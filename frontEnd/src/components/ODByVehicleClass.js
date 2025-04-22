import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './LinkFlow.css';

function OdByVehicleType({ dimensions, selectedGraph, expandedCollection }) {
    const [linkFlow, setLinkFlow] = useState([]);

    useEffect(() => {
        const fetchODStats = async () => {
            const token = sessionStorage.getItem('token');
            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file10-odstat?sim=${expandedCollection}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                console.log('Fetched file10 OD stats data:', response.data);
                setLinkFlow(response.data.data || []);
            } catch (error) {
                console.error('Error fetching OD stats data:', error);
            }
        };

        fetchODStats();
    }, [expandedCollection]);

    if (!linkFlow.length) return <div>Loading...</div>;

    const avgRow = linkFlow.find(row => row.link_id === linkFlow.length);
    const linkRows = linkFlow.filter(row => row.link_id !== linkFlow.length);

    return (
        <div style={{ 
            width: dimensions.graphWidth, 
            height: dimensions.graphHeight, 
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
            <h2 style={{ 
                color: '#333', 
                marginBottom: '1.5rem', 
                fontSize: '1.5rem',
                fontWeight: '600' 
            }}>Origin-Destination Stats</h2>
            <div style={{
                overflowX: 'auto',
                overflowY: 'auto',
                border: '1px solid #eaeaea',
                borderRadius: '6px',
                maxHeight: '100%',
                maxWidth: '100%',
                backgroundColor: 'white'
            }}>
                <div style={{
                    position: 'sticky',
                    top: 0,
                    background: 'white',
                    zIndex: 1,
                    borderBottom: '1px solid #eaeaea',
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    color: '#666'
                }}>
                    Scroll right & down to view more →
                </div>
                <table style={{ 
                    width: '1500px', 
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                    <thead>
                        <tr>
                            {Object.keys(linkRows[0] || {})
                                .filter(key => key !== 'sim_id' && key !== 'id')
                                .map(key => (
                                    <th key={key} style={{
                                        padding: '14px 16px',
                                        backgroundColor: 'white',
                                        color: '#333',
                                        fontWeight: '600',
                                        fontSize: '0.875rem',
                                        textAlign: 'left',
                                        borderBottom: '2px solid #eaeaea',
                                        position: 'sticky',
                                        top: 0,
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                    </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {linkRows.map((row, index) => (
                            <tr key={index} style={{
                                backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc'
                            }}>
                                {Object.entries(row)
                                    .filter(([key]) => key !== 'sim_id' && key !== 'id')
                                    .map(([key, value], cellIndex) => (
                                        <td key={cellIndex} style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid #eaeaea',
                                            fontSize: '0.875rem',
                                            color: '#4a5568'
                                        }}>
                                            {value}
                                        </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default OdByVehicleType;
