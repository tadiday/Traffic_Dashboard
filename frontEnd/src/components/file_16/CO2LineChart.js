// CO2LineChart.js

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import axios from 'axios';
import Select from 'react-select';

function CO2LineChart({ dimensions, selectedGraph, expandedCollection }) {
  const [edgeData, setEdgeData] = useState([]);
  const [dropdownData, setDropDownData] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleLogs, setVehicleLogs] = useState([]);

  useEffect(() => {
    const fetchEdgeData = async () => {
      if (!expandedCollection) return;
      const token = sessionStorage.getItem('token');

      try {
        const vehicleResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-vehicle-dropdown`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { sim: expandedCollection },
          }
        );
        setDropDownData(vehicleResponse.data || []);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }

      try {
        const edgeResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-edgeprobes`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { sim: expandedCollection },
          }
        );
        setEdgeData(edgeResponse.data || []);
      } catch (error) {
        console.error('Error fetching edge data:', error);
      }
    };

    fetchEdgeData();
  }, [expandedCollection]);

  useEffect(() => {
    if (selectedVehicle && edgeData?.data?.length > 0) {
      const filtered = edgeData.data
        .filter((log) => log.vehicle_id === selectedVehicle)
        .map((log) => ({
          second: Math.floor(log.simulation_time_sec),
          co2_grams: log.co2_grams ?? null,
        }))
        .filter((log) => log.co2_grams !== null);

      setVehicleLogs(filtered);
    }
  }, [selectedVehicle, edgeData]);

  const vehicleOptions =
    dropdownData?.data?.map((item) => ({
      value: item.vehicle_id,
      label: item.vehicle_id.toString(),
    })) || [];

  return (
    <div style={{ width: dimensions.graphWidth, height: dimensions.graphHeight, padding: '1rem' }}>
      <h3>CO₂ Emissions Over Time</h3>

      <Select
        options={vehicleOptions}
        onChange={(selectedOption) => setSelectedVehicle(selectedOption.value)}
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

      {selectedVehicle && (
        <>
          <h4>Vehicle ID: {selectedVehicle}</h4>

          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={vehicleLogs}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="second" label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'CO₂ (g)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="co2_grams"
                name="CO₂ Emissions (g)"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

export default CO2LineChart;
