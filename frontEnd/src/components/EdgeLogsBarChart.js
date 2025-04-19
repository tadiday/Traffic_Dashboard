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
import Select from 'react-select';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function EdgeLogsBarChart({ dimensions, selectedGraph, expandedCollection }) {
  const [edgeData, setEdgeData] = useState([]);
  const [dropdownData, setDropDownData] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    const fetchEdgeData = async () => {
      if (!expandedCollection) return;
      const token = sessionStorage.getItem('token');
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-vehicle-dropdown`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { sim: expandedCollection },
          }
        );
        console.log('Fetched Distinct Vehicle IDs:', response.data);
        setDropDownData(response.data || []);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-edgeprobes`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { sim: expandedCollection },
          }
        );
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

  const vehicleOptions =
    dropdownData?.data?.map((item) => ({
      value: item.vehicle_id,
      label: item.vehicle_id.toString(),
    })) || [];

  return (
    <div style={{ width: dimensions.graphWidth, height: dimensions.graphHeight }}>
      <h3>Top 20 Edges by Number of Logs</h3>
      <Select
        options={vehicleOptions}
        onChange={(selectedOption) => {
          console.log('Selected Vehicle ID:', selectedOption.value);
          setSelectedVehicle(selectedOption.value);
        }}
        placeholder="Search vehicle ID..."
        isSearchable
        styles={{
          container: (provided) => ({
            ...provided,
            marginBottom: '10px',
            width: '300px',
          }),
        }}
      />
      <div>Selected Vehicle ID: {selectedVehicle || 'None'}</div>
      <div>{JSON.stringify(edgeData.data[0])}</div>
      {/* You can enable this once you want to plot the graph */}
      {/* <Bar data={data} options={options} /> */}
    </div>
  );
}

export default EdgeLogsBarChart;
