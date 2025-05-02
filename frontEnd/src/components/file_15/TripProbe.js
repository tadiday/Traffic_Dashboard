import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './TripProbe.css';

function TripProbe(props) {
    const [summaryStats, setSummaryStats] = useState(null);
    const [view, setView] = useState('totals'); // 'totals', 'averages', 'advanced'

    useEffect(() => {
        const fetchSummaryData = async () => {
            const token = sessionStorage.getItem('token');
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-tripprobes?sim=${props.expandedCollection}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const tripProbeData = response.data?.data || [];

                if (tripProbeData.length === 0) {
                    console.warn('No data received from the API');
                    return;
                }

                const totalVehicles = tripProbeData.length;

                const getAvg = (key) => tripProbeData.reduce((sum, rec) => sum + Number(rec[key] || 0), 0) / totalVehicles;
                const getSum = (key) => tripProbeData.reduce((sum, rec) => sum + Number(rec[key] || 0), 0);
                const getMin = (key) => Math.min(...tripProbeData.map(rec => Number(rec[key] || Infinity)));
                const getMax = (key) => Math.max(...tripProbeData.map(rec => Number(rec[key] || -Infinity)));

                const delayValues = tripProbeData.map(rec => Number(rec.total_delay || 0));
                const meanDelay = getAvg('total_delay');
                const stdDevDelay = Math.sqrt(delayValues.reduce((acc, val) => acc + Math.pow(val - meanDelay, 2), 0) / totalVehicles);

                setSummaryStats({
                    totalVehicles,
                    totals: {
                        totalFuel: getSum('fuel_used_liters'),
                        totalCO2: getSum('co2_produced'),
                        expectedCrashes: getSum('expected_crashes'),
                    },
                    averages: {
                        avgTripDuration: getAvg('trip_duration'),
                        avgDelay: meanDelay,
                        avgSpeed: getAvg('average_speed')
                    },
                    advanced: {
                        stdDevDelay,
                        minDelay: getMin('total_delay'),
                        maxDelay: getMax('total_delay')
                    }
                });

            } catch (error) {
                console.error('Error fetching summary data:', error);
            }
        };

        if (props.selectedGraph === 'Summary of Trip Probes' && props.expandedCollection) {
            fetchSummaryData();
        }
    }, [props.selectedGraph, props.expandedCollection]);

    const renderTableRows = () => {
        if (!summaryStats) return null;
        const rows = [];

        if (view === 'totals') {
            rows.push(<tr><td>Total Vehicles</td><td>{summaryStats.totalVehicles}</td></tr>);
            rows.push(<tr><td>Total Fuel Used</td><td>{summaryStats.totals.totalFuel.toFixed(2)} L</td></tr>);
            rows.push(<tr><td>Total CO₂ Produced</td><td>{summaryStats.totals.totalCO2.toFixed(2)} g</td></tr>);
            rows.push(<tr><td>Expected Crashes</td><td>{summaryStats.totals.expectedCrashes.toFixed(2)}</td></tr>);
        } else if (view === 'averages') {
            rows.push(<tr><td>Avg. Trip Duration</td><td>{summaryStats.averages.avgTripDuration.toFixed(2)} s</td></tr>);
            rows.push(<tr><td>Avg. Delay</td><td>{summaryStats.averages.avgDelay.toFixed(2)} s</td></tr>);
            rows.push(<tr><td>Avg. Speed</td><td>{summaryStats.averages.avgSpeed.toFixed(2)} km/h</td></tr>);
        } else if (view === 'advanced') {
            rows.push(<tr><td>Min Delay</td><td>{summaryStats.advanced.minDelay.toFixed(2)} s</td></tr>);
            rows.push(<tr><td>Max Delay</td><td>{summaryStats.advanced.maxDelay.toFixed(2)} s</td></tr>);
            rows.push(<tr><td>Delay Std Dev</td><td>{summaryStats.advanced.stdDevDelay.toFixed(2)} s</td></tr>);
        }

        return rows;
    };

    return (
        <div className="summary-container" style={{ width: props.dimensions.graphWidth, padding: '1rem' }}>
            {summaryStats ? (
                <>
                    <div className="filter-buttons" style={{ marginBottom: '1rem' }}>
                        <button onClick={() => setView('totals')} className={view === 'totals' ? 'active' : ''}>Total Stats</button>
                        <button onClick={() => setView('averages')} className={view === 'averages' ? 'active' : ''}>Average Stats</button>
                        <button onClick={() => setView('advanced')} className={view === 'advanced' ? 'active' : ''}>Advanced Stats</button>
                    </div>
                    <table className="summary-table">
                        <thead>
                            <tr><th>Statistic</th><th>Value</th></tr>
                        </thead>
                        <tbody>
                            {renderTableRows()}
                        </tbody>
                    </table>
                </>
            ) : (
                <p>Loading summary statistics...</p>
            )}
        </div>
    );
}

export default TripProbe;
