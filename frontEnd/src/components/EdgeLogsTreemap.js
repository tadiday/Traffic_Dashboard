// EdgeLogsTreemap.js

import React, { useEffect, useState } from 'react';
import { Treemap, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

function EdgeLogsTreemap({ dimensions, selectedGraph, expandedCollection }) {
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
        setEdgeData(response.data.edges || []);
      } catch (error) {
        console.error('Error fetching edge data:', error);
      }
    };
    fetchEdgeData();
  }, [expandedCollection]);

  if (edgeData.length === 0) {
    return <div>Loading Edge Data...</div>;
  }

  // Prepare data for the treemap
  const treemapData = edgeData.map((edge) => ({
    name: `Edge ${edge.edgeID}`,
    size: edge.numOfLogs,
  }));

  return (
    <div style={{ width: dimensions.graphWidth, height: dimensions.graphHeight }}>
      <h3>Edge Logs Treemap</h3>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={treemapData}
          dataKey="size"
          nameKey="name"
          ratio={4 / 3}
          stroke="#fff"
          fill="#8884d8"
        >
          <Tooltip />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}

export default EdgeLogsTreemap;