// frontEnd/src/components/CustomSummaryChart.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CustomSummaryChart.css'; // Ensure this file contains the necessary styles

function CustomSummaryChart(props) {
  const [summaryData, setSummaryData] = useState(null);
  const [dataType, setDataType] = useState('total'); // 'total' or 'average'

  // Fetch Summary Data
  useEffect(() => {
    const fetchSummaryData = async () => {
      if (!props.expandedCollection) return;
      const token = sessionStorage.getItem('token');
      console.log(`token: ${token}`);
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
          Select Data Type
          <select value={dataType} onChange={handleDataTypeChange}>
            <option value="total">Total Metrics</option>
            <option value="average">Average Metrics</option>
          </select>
        </label>
      </div>
      <div className="table-container">
        {summaryData ? (
          <>
            <h3>{dataType === 'total' ? 'Total Metrics Summary' : 'Average Metrics Summary'}</h3>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Metric Name</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {getAvailableMetrics().map((metric) => (
                  <tr key={metric}>
                    <td>
                      {['total delay', 'stopped delay', 'accel/decel delay'].includes(metric)
                        ? `${metric} (seconds)`
                        : metric}
                    </td>
                    <td>{Number(summaryData[dataType][metric][5]).toFixed(2)}</td> {/* Using index 5 as per your data structure */}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
            Loading data...
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomSummaryChart;