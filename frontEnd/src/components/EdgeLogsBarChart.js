// EdgeLogsBarChart.js

import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function EdgeLogsBarChart({ dimensions, selectedGraph, expandedCollection }) {
  const [edgeData, setEdgeData] = useState([]);
  useEffect(() => {
    const fetchEdgeData = async () => {
      if (!expandedCollection) return;
      const token = sessionStorage.getItem('token');
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-edgeprobes`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              sim: expandedCollection,
            },
          }
        );
        // console.log('Fetched edge data:', response.data.edges);
        console.log('Fetched file 16 data:', response.data);
        setEdgeData(response.data || []);
      } catch (error) {
        console.error('Error fetching edge data:', error);
      }
    };
    fetchEdgeData();
  }, [expandedCollection]);

  if (edgeData.length === 0) {
    return <div>Loading Edge Data...</div>;
  }

  // Prepare data for the chart
  // const sortedEdges = edgeData.sort((a, b) => b.numOfLogs - a.numOfLogs);
  // const topEdges = sortedEdges.slice(0, 20); // Display top 20 edges

  // const data = {
  //   labels: topEdges.map((edge) => `Edge ${edge.edgeID}`),
  //   datasets: [
  //     {
  //       label: 'Number of Logs',
  //       data: topEdges.map((edge) => edge.numOfLogs),
  //       backgroundColor: 'rgba(75,192,192,0.6)',
  //       borderColor: 'rgba(75,192,192,1)',
  //       borderWidth: 1,
  //     },
  //   ],
  // };

  // const options = {
  //   indexAxis: 'y',
  //   scales: {
  //     x: {
  //       beginAtZero: true,
  //       title: {
  //         display: true,
  //         text: 'Number of Logs',
  //       },
  //     },
  //     y: {
  //       title: {
  //         display: true,
  //         text: 'Edge ID',
  //       },
  //     },
  //   },
  //   plugins: {
  //     legend: {
  //       display: false,
  //     },
  //   },
  //   maintainAspectRatio: false,
  // };

  return (
    <div style={{ width: dimensions.graphWidth, height: dimensions.graphHeight }}>
      <h3>Top 20 Edges by Number of Logs</h3>
      <div>{JSON.stringify(edgeData.data[0])}</div>
      <div>hi</div>
      {/* <Bar data={data} options={options} /> */}
    </div>
  );
}

export default EdgeLogsBarChart;