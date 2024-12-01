// frontEnd/src/components/CustomSummaryChart.js
import React, { useState, useEffect } from 'react';
import { Chart } from '@antv/g2';
import axios from 'axios';
import './CustomSummaryChart.css'; // Create a CSS file for styling
function CustomSummaryChart(props) {
  const [chartInstance, setChartInstance] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [dataType, setDataType] = useState('total'); // 'total' or 'average'
  // Fetch Summary Data
  useEffect(() => {
    const fetchSummaryData = async () => {
      if (!props.expandedCollection) return;
      const token = sessionStorage.getItem('token');
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-summary?sim=${props.expandedCollection}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSummaryData(response.data);
      } catch (error) {
        console.error('Error fetching summary data:', error);
      }
    };
    fetchSummaryData();
  }, [props.expandedCollection]);
  // Initialize Chart
  useEffect(() => {
    if (!summaryData || !props.dimensions) return;
    // Destroy previous chart instance if exists
    if (chartInstance) {
      chartInstance.destroy();
    }
    const chart = new Chart({
      container: 'custom-summary-chart-container',
      autoFit: true,
      height: props.dimensions.graphHeight,
      width: props.dimensions.graphWidth,
    });
    setChartInstance(chart);
    // eslint-disable-next-line
  }, [summaryData, props.dimensions]);
  // Update Chart when selected metrics change
  useEffect(() => {
    if (!chartInstance || !summaryData || selectedMetrics.length === 0) return;
    // Prepare data
    const data = selectedMetrics.map((metric) => ({
      Metric: metric,
      Value: summaryData[dataType][metric][5], // Using index 5 as per your data structure
    }));
    // Clear previous chart content
    chartInstance.clear();
    // Configure the chart
    chartInstance
      .interval()
      .data(data)
      .encode('x', 'Metric')
      .encode('y', 'Value')
      .encode('color', 'Metric');
    // Render the chart
    chartInstance.render();
  }, [chartInstance, selectedMetrics, dataType, summaryData]);
  // Handle metric selection
  const handleMetricChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (const option of options) {
      if (option.selected) {
        selected.push(option.value);
      }
    }
    setSelectedMetrics(selected);
  };
  // Handle data type change
  const handleDataTypeChange = (e) => {
    setDataType(e.target.value);
  };
  // Get all available metrics
  const getAvailableMetrics = () => {
    if (!summaryData) return [];
    return Object.keys(summaryData.total);
  };
  return (
    <div className="custom-summary-chart">
      <div className="controls">
        <label>
          Data Type:
          <select value={dataType} onChange={handleDataTypeChange}>
            <option value="total">Total</option>
            <option value="average">Average</option>
          </select>
        </label>
        <label>
          Select Metrics:
          <select multiple onChange={handleMetricChange}>
            {getAvailableMetrics().map((metric) => (
              <option key={metric} value={metric}>
                {metric}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        id="custom-summary-chart-container"
        style={{
          width: props.dimensions.graphWidth,
          height: props.dimensions.graphHeight,
        }}
      ></div>
    </div>
  );
}
export default CustomSummaryChart;