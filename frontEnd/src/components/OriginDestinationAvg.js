import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Select from 'react-select';
import './OriginDestinationAvg.css';

function OriginDestinationAverages({ dimensions, selectedGraph, expandedCollection }) {
    const [originOptions, setOriginOptions] = useState([]);
    const [destinationOptions, setDestinationOptions] = useState([]);
    const [selectedOrigin, setSelectedOrigin] = useState(null);
    const [selectedDestination, setSelectedDestination] = useState(null);
    const [averageData, setAverageData] = useState(null);
    const [viewMode, setViewMode] = useState('average'); // 'average' or 'total'

    useEffect(() => {
        const token = sessionStorage.getItem('token');

        const fetchDropdownData = async () => {
            try {
                const originRes = await axios.get(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-origin-zone-dropdown?sim=${expandedCollection}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setOriginOptions(originRes.data.data.map(o => ({ value: o.origin_node, label: o.origin_node })));

                const destRes = await axios.get(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-destination-zone-dropdown?sim=${expandedCollection}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setDestinationOptions(destRes.data.data.map(d => ({ value: d.destination_node, label: d.destination_node })));
            } catch (err) {
                console.error('Error fetching dropdown options:', err);
            }
        };

        if (expandedCollection) {
            fetchDropdownData();
        }
    }, [expandedCollection]);

    useEffect(() => {
        const fetchAverages = async () => {
            if (!selectedOrigin || !selectedDestination) {
                setAverageData(null);
                return;
            }
            const token = sessionStorage.getItem('token');
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-tripprobes?sim=${expandedCollection}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = res.data?.data || [];
                const filtered = data.filter(d => d.origin_node === selectedOrigin.value && d.destination_node === selectedDestination.value);

                if (filtered.length === 0) {
                    setAverageData(null);
                    return;
                }

                const fieldsToAverage = [
                    'trip_duration',
                    'total_delay',
                    'stopped_delay',
                    'number_of_stops',
                    'distance_covered',
                    'average_speed',
                    'fuel_used_liters',
                    'hydrocarbon_produced',
                    'carbon_monoxide_produced',
                    'nitrous_oxide_produced',
                    'co2_produced',
                    'pm_produced',
                    'expected_crashes',
                    'injury_highest_level',
                    'expected_fatal_crash',
                    'total_toll_paid',
                    'total_acceleration_noise'
                ];

                const units = {
                    'trip_duration': 's',
                    'total_delay': 's',
                    'stopped_delay': 's',
                    'number_of_stops': '',
                    'distance_covered': 'km',
                    'average_speed': 'km/h',
                    'fuel_used_liters': 'L',
                    'hydrocarbon_produced': 'g',
                    'carbon_monoxide_produced': 'g',
                    'nitrous_oxide_produced': 'g',
                    'co2_produced': 'g',
                    'pm_produced': 'g',
                    'expected_crashes': '',
                    'injury_highest_level': '',
                    'expected_fatal_crash': '',
                    'total_toll_paid': '$',
                    'total_acceleration_noise': 'm/s²'
                };

                const metrics = {};
                fieldsToAverage.forEach(field => {
                    const validValues = filtered.map(d => Number(d[field])).filter(val => !isNaN(val));
                    const sum = validValues.reduce((a, b) => a + b, 0);
                    
                    if (viewMode === 'average') {
                        const avg = (sum / validValues.length).toFixed(2);
                        metrics[field] = units[field] ? `${avg} ${units[field]}` : avg;
                    } else {
                        const total = sum.toFixed(2);
                        metrics[field] = units[field] ? `${total} ${units[field]}` : total;
                    }
                });

                setAverageData(metrics);
            } catch (err) {
                console.error('Error fetching trip data:', err);
            }
        };

        fetchAverages();
    }, [selectedOrigin, selectedDestination, expandedCollection, viewMode]);

    return (
        <div className="origin-destination-averages">
            <h2 className="text-lg font-semibold mb-4">Origin-Destination Averages</h2>
            <div className="flex gap-4 mb-6">
                <div className="w-1/2">
                    <label className="block mb-1">Origin Node</label>
                    <Select
                        options={originOptions}
                        value={selectedOrigin}
                        onChange={setSelectedOrigin}
                        placeholder="Select Origin Node"
                        isClearable
                    />
                </div>
                <div className="w-1/2">
                    <label className="block mb-1">Destination Node</label>
                    <Select
                        options={destinationOptions}
                        value={selectedDestination}
                        onChange={setSelectedDestination}
                        placeholder="Select Destination Node"
                        isClearable
                    />
                </div>
            </div>

            <div className="view-mode-toggle">
                <div className="filter-buttons">
                    <button 
                        onClick={() => setViewMode('average')} 
                        className={viewMode === 'average' ? 'active' : ''}
                    >
                        Average Values
                    </button>
                    <button 
                        onClick={() => setViewMode('total')} 
                        className={viewMode === 'total' ? 'active' : ''}
                    >
                        Total Values
                    </button>
                </div>
            </div>

            {selectedOrigin && selectedDestination ? (
                averageData ? (
                    <div className="table-container">
                        <table className="averages-table">
                            <thead>
                                <tr>
                                    <th>Metric</th>
                                    <th>{viewMode === 'average' ? 'Average' : 'Total'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(averageData).map(([key, val]) => (
                                    <tr key={key}>
                                        <td>{key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</td>
                                        <td>{val}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500">No data available for the selected origin-destination pair.</p>
                )
            ) : (
                <p className="text-yellow-600 font-medium">Please select both an origin and a destination to view average data.</p>
            )}
        </div>
    );
}

export default OriginDestinationAverages;
