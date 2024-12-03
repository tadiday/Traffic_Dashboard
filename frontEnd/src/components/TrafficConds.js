// @ts-check
import React, { useRef, useEffect, useState } from 'react';
import { Chart } from '@antv/g2';
import axios from 'axios';

const AveTrafficConds = (props) => {
  const nodeGraphRef = useRef(null);
  let chart;

  const [selectedMetric, setSelectedMetric] = useState('totalFlow');

  const aggregateTrafficData = (edges) => {
    let aggregatedData = {
      totalFlow: 0,
      freeSpeedTime: 0,
      totalAverageTime: 0,
      averageVehicles: 0,
      averageQueue: 0,
      averageStops: 0,
      fuel: 0,
      CO2: 0,
      expectedCrashes: 0,
      expectedTopInjurt: 0,
      fatelCrashes: 0,
      crashLowDamage: 0,
      crashMedDamage: 0,
      crashHighDamage: 0,
    };

    edges.forEach((edge) => {
      if (edge && edge.totalFlow !== undefined) {
        aggregatedData.totalFlow += edge.totalFlow;
        aggregatedData.freeSpeedTime += edge.freeSpeedTime;
        aggregatedData.totalAverageTime += edge.totalAverageTime;
        aggregatedData.averageVehicles += edge.averageVehicles;
        aggregatedData.averageQueue += edge.averageQueue;
        aggregatedData.averageStops += edge.averageStops;
        aggregatedData.fuel += edge.fuel;
        aggregatedData.CO2 += edge.CO2;
        aggregatedData.expectedCrashes += edge.expectedCrashes;
        aggregatedData.expectedTopInjurt += edge.expectedTopInjurt;
        aggregatedData.fatelCrashes += edge.fatelCrashes;
        aggregatedData.crashLowDamage += edge.crashLowDamage;
        aggregatedData.crashMedDamage += edge.crashMedDamage;
        aggregatedData.crashHighDamage += edge.crashHighDamage;
      }
    });

    return aggregatedData;
  };

  // Function to fetch and process traffic data
  const bar = async () => {
    if (!props.expandedCollection) return null;

    const data = [];
    const token = sessionStorage.getItem('token');
    
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-conds?sim=${props.expandedCollection}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      response.data.periods.forEach((period) => {
        if (Array.isArray(period.edges)) {
          const aggregatedData = aggregateTrafficData(period.edges);


          data.push({
            period: period.time,
            ...aggregatedData, 
          });
        }
      });
    } catch (error) {
      console.error('Error fetching bar info:', error);
      return null;
    }

    if (nodeGraphRef.current) {
      chart = new Chart({
        container: nodeGraphRef.current,
        height: props.dimensions.graphHeight,
        width: props.dimensions.graphWidth,
        autoFit: true,
        title: 'Traffic Data',
      });

      chart.interval().data(data)
      .encode('x', 'period')
      .encode('y', selectedMetric);
      chart.render();
    }
  };

  const handleMetricChange = (event) => {
    setSelectedMetric(event.target.value);
  };

  useEffect(() => {
    if (props.selectedGraph === 'Traffic in Series') {
      bar();
    }

    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  }, [nodeGraphRef, props.expandedCollection, props.selectedGraph, selectedMetric]);

  return (
    <div>
      <select onChange={handleMetricChange} value={selectedMetric}>
      <option value="totalFlow">Total Flow</option>
        <option value="CO2">CO2</option>
        <option value="fuel">Fuel</option>
        <option value="expectedCrashes">Expected Crashes</option>
        <option value="averageVehicles">Average Vehicles</option>
        <option value="averageQueue">Average Queue</option>
        <option value="averageStops">Average Stops</option>
        <option value="freeSpeedTime">Free Speed Time</option>
        <option value="totalAverageTime">Total Average Time</option>
        <option value="fatelCrashes">Fatal Crashes</option>
        <option value="crashLowDamage">Crash Low Damage</option>
        <option value="crashMedDamage">Crash Medium Damage</option>
        <option value="crashHighDamage">Crash High Damage</option>
      </select>

      <div
        id="charts"
        ref={nodeGraphRef}
        style={{ width: props.dimensions.graphWidth, height: props.dimensions.graphHeight }}
      ></div>
    </div>
  );
};

export default AveTrafficConds;
