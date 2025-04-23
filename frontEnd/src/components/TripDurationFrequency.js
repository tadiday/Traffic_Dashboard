import React, { useEffect, useRef } from 'react';
import { Chart } from '@antv/g2';
import axios from 'axios';

function FrequencyChart({ expandedCollection, selectedGraph, dimensions }) {
    const chartRef = useRef(null);

    useEffect(() => {
        const fetchAndRenderChart = async () => {
            const token = sessionStorage.getItem('token');
            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-tripprobes?sim=${expandedCollection}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const tripProbeData = response.data?.data || [];
                if (tripProbeData.length === 0) {
                    console.warn('No data received from the API');
                    return;
                }

                const field = 'trip_duration'; // Change this to other fields like 'total_delay' or 'vehicle_class' as needed

                const binSize = 60; // seconds
                const frequencyMap = new Map();

                tripProbeData.forEach(record => {
                    const value = Number(record[field]);
                    if (!isNaN(value)) {
                        const bin = Math.floor(value / binSize) * binSize;
                        frequencyMap.set(bin, (frequencyMap.get(bin) || 0) + 1);
                    }
                });

                const binnedData = Array.from(frequencyMap.entries())
                    .sort((a, b) => a[0] - b[0])
                    .map(([bin, count]) => ({
                        binLabel: `${bin}-${bin + binSize}`,
                        count,
                    }));

                if (binnedData.length === 0) {
                    console.warn('No valid data for frequency chart');
                    return;
                }

                const chart = new Chart({
                    container: chartRef.current,
                    autoFit: true,
                    height: dimensions.graphHeight,
                    width: dimensions.graphWidth,
                });

                chart
                .interval()
                .data(binnedData)
                .encode('x', 'binLabel')
                .encode('y', 'count')
                .axis('x', { title: 'Trip Duration (seconds)' })
                .axis('y', { title: 'Number of Trips' })
                .tooltip('count')
                .style('fill', '#3b82f6');
            

                chart.render();

                return () => chart.destroy();
            } catch (error) {
                console.error('Error fetching data for frequency chart:', error);
            }
        };

        if (selectedGraph === 'Trip Duration Frequency' && expandedCollection) {
            fetchAndRenderChart();
        }
    }, [selectedGraph, expandedCollection, dimensions]);

    return (
        <div id="frequency-chart-container" style={{ width: dimensions.graphWidth, height: dimensions.graphHeight }}>
            <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
}

export default FrequencyChart;
