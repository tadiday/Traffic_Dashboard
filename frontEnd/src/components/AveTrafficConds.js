// @ts-check
import React, { useRef, useEffect, useState } from 'react';
import { Chart } from '@antv/g2';
import { Graph, registerEdge, registerNode } from '@antv/g6';
import axios from 'axios';
import Popup from './Popup';

// eslint-disable-next-line
interface EdgeInfo {
  source: string;
  target: string;
  totalFlow: string;
  co2Emission: string;
  totalAverageTime: string;
  averageTime: string;
  averageVehicles: string;
  averageQueue: string;
  averageStops: string;
  fuel: string;
  expectedCrashes: string;
  expectedTopInjurt: string;
  fatelCrashes: string;
  crashLowDamage: string;
  crashMedDamage: string;
  crashHighDamage: string;
}

// Custom edge and node registrations
registerEdge(
  'icon-edge',
  {
    draw(cfg, group) {
      const { startPoint, endPoint } = cfg;
      const lineShape = group.addShape('line', {
        attrs: {
          x1: startPoint.x,
          y1: startPoint.y,
          x2: endPoint.x,
          y2: endPoint.y,
          stroke: '#A0A0A0',
          lineWidth: 2,
        },
        name: 'edge-line',
      });

      const imageSrc = cfg.icon || './icons/road.png';
      const iconX = (startPoint.x + endPoint.x) / 2;
      const iconY = (startPoint.y + endPoint.y) / 2;

      group.addShape('image', {
        attrs: {
          x: iconX - 15,
          y: iconY - 15,
          width: 30,
          height: 30,
          img: imageSrc,
        },
        name: 'edge-icon',
      });

      return lineShape;
    },
  },
  'line'
);

registerEdge(
  'circle-running',
  {
    afterDraw(cfg, group) {
      const shape = group.get('children')[0];
      const startPoint = shape.getPoint(0);
      const circle = group.addShape('circle', {
        attrs: {
          x: startPoint.x,
          y: startPoint.y,
          fill: '#1890ff',
          r: 3,
        },
        name: 'circle-shape',
      });
      circle.animate(
        (ratio) => {
          const tmpPoint = shape.getPoint(ratio);
          return {
            x: tmpPoint.x,
            y: tmpPoint.y,
          };
        },
        {
          repeat: true,
          duration: 3000,
        }
      );
    },
  },
  'cubic'
);

registerNode(
  'icon-node',
  {
    draw(cfg, group) {
      const keyShape = group.addShape('circle', {
        attrs: {
          x: 0,
          y: 0,
          r: 22,
          fill: '#f6e397',
          stroke: '#4b4941',
          lineWidth: 2,
        },
        name: 'main-circle',
      });

      group.addShape('text', {
        attrs: {
          x: 0,
          y: 1,
          textAlign: 'center',
          textBaseline: 'middle',
          text: cfg.icon || '🚦',
          fontSize: 26,
          fill: '#FFFFFF',
        },
        name: 'icon-text',
      });

      if (cfg.label) {
        group.addShape('text', {
          attrs: {
            x: 0,
            y: 35,
            textAlign: 'center',
            textBaseline: 'middle',
            text: cfg.label,
            fontSize: 14,
            fill: '#000000',
          },
          name: 'node-label',
        });
      }

      return keyShape;
    },
  },
  'single-node'
);

const AveTrafficConds = (props) => {
  const nodeGraphRef = useRef(null);
  const popUpAnimationRef = useRef(null);
  const [edgePopup, setEdgePopup] = useState(false);
  const [selectedEdgeInfo, setSelectedEdgeInfo] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState('totalFlow');
  const [errorMessage, setErrorMessage] = useState('');
  const [minProperty, setMinProperty] = useState(null);
  const [maxProperty, setMaxProperty] = useState(null);

  var chart;
  var popChart;
  let selectedEdge = null;

  // Popup Animation
  const animation = async () => {
    const edgeInfo = selectedEdgeInfo;
    if (!edgeInfo) return;
    var data;
    try {
      data = {
        nodes: [
          { id: edgeInfo.source, x: 100, y: 100, label: edgeInfo.source },
          { id: edgeInfo.target, x: 300, y: 200, label: edgeInfo.target },
        ],
        edges: [{ source: edgeInfo.source, target: edgeInfo.target }],
      };
    } catch (error) {
      console.error('Error popAnimation:', error);
      return null;
    }
    if (popUpAnimationRef.current) {
      popChart = new Graph({
        container: popUpAnimationRef.current,
        height: 300,
        width: 500,
        defaultEdge: {
          type: 'circle-running',
          style: {
            lineWidth: 3,
            stroke: '#bae7ff',
          },
        },
        defaultNode: {
          type: 'circle',
          size: [35],
          color: '#660000',
          style: {
            icon: true,
            fill: '#660000',
          },
          labelCfg: {
            style: {
              fill: '#FFFFFF',
              fontSize: 16,
            },
          },
        },
      });
      popChart.data(data);
      popChart.render();
    }
  };

  // Fetch Node and Edge Data
  const getNodeGraphData = async () => {
    if (!props.expandedCollection) {
      return null;
    }

    var nodes = [];
    var edges = [];

    const token = sessionStorage.getItem('token');

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-nodes?sim=${props.expandedCollection}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      nodes = response.data.nodes.map((obj) => ({
        id: String(obj.id),
        x: obj.x,
        y: obj.y,
        label: String(obj.id),
      }));
    } catch (error) {
      console.error('Error fetching nodes:', error);
      return null;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-edges?sim=${props.expandedCollection}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const response2 = await axios.get(
        `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-avgconds?sim=${props.expandedCollection}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      edges = response.data.edges.map((obj) => {
        const condition = response2.data.conditions.find((cond) => cond.edgeID === obj.id);
        return {
          edgeId: String(obj.id),
          source: String(obj.start),
          target: String(obj.end),
          totalFlow: condition ? parseFloat(condition.totalFlow) : null,
          co2Emission: condition ? parseFloat(condition.CO2) : null,
          totalAverageTime: condition ? parseFloat(condition.totalAverageTime) : null,
          averageTime: condition ? parseFloat(condition.averageTime) : null,
          averageVehicles: condition ? parseFloat(condition.averageVehicles) : null,
          averageQueue: condition ? parseFloat(condition.averageQueue) : null,
          averageStops: condition ? parseFloat(condition.averageStops) : null,
          fuel: condition ? parseFloat(condition.fuel) : null,
          expectedCrashes: condition ? parseFloat(condition.expectedCrashes) : null,
          expectedTopInjurt: condition ? parseFloat(condition.expectedTopInjurt) : null,
          fatelCrashes: condition ? parseFloat(condition.fatelCrashes) : null,
          crashLowDamage: condition ? parseFloat(condition.crashLowDamage) : null,
          crashMedDamage: condition ? parseFloat(condition.crashMedDamage) : null,
          crashHighDamage: condition ? parseFloat(condition.crashHighDamage) : null,
        };
      });
    } catch (error) {
      console.error('Error fetching edges and conditions:', error);
      return null;
    }

    assignIcons(nodes);

    return { nodes: nodes, edges: edges };
  };

  // Render the node graph
  const node = async () => {
    if (nodeGraphRef.current) {
      chart = new Graph({
        container: nodeGraphRef.current,
        width: props.dimensions.graphWidth,
        height: props.dimensions.graphHeight,

        modes: {
          default: ['drag-canvas', 'drag-node', 'zoom-canvas'],
        },
        defaultNode: {
          size: [50],
          color: '#660000',
          type: 'icon-node',
          style: {
            fill: '#4b4941',
          },
          labelCfg: {
            style: {
              fill: '#FFFFFF',
              fontSize: 16,
            },
          },
        },
        defaultEdge: {
          color: '#FFA07A',
          style: {
            endArrow: true,
            icon: true,
            lineWidth: 10,
            label: true,
          },
        },
      });

      // Get node and edge data from an API endpoint
      const data = await getNodeGraphData();

      if (!data) return;

      // Check for missing or undefined values
      const propertyValues = data.edges.map((edge) => edge[selectedProperty]);
      const hasInvalidValues = propertyValues.some((value) => value == null || isNaN(value));

      if (hasInvalidValues) {
        setErrorMessage(`Some edges have missing or invalid values for ${selectedProperty}.`);
      } else {
        setErrorMessage('');
      }

      // Calculate the bounding box of the nodes
      const minX = Math.min(...data.nodes.map((node) => node.x));
      const maxX = Math.max(...data.nodes.map((node) => node.x));
      const minY = Math.min(...data.nodes.map((node) => node.y));
      const maxY = Math.max(...data.nodes.map((node) => node.y));
      const paddingPercent = 10;
      // Calculate scaling factors with padding of %
      const scaleX =
        (props.dimensions.graphWidth - props.dimensions.graphWidth / paddingPercent) /
        (maxX - minX);
      const scaleY =
        (props.dimensions.graphHeight - props.dimensions.graphHeight / paddingPercent) /
        (maxY - minY);

      // Choose the smaller scale to maintain aspect ratio
      const scale = Math.min(scaleX, scaleY);

      // Apply scaling and translation to center the graph
      const scaledNodes = data.nodes.map((node) => ({
        ...node,
        // Add the % padding
        x: (node.x - minX) * scale + props.dimensions.graphWidth / paddingPercent / 2,
        y: (node.y - minY) * scale + props.dimensions.graphHeight / paddingPercent / 2,
      }));
      data.nodes = scaledNodes;

      // Compute min and max values for the selected property
      const validValues = propertyValues.filter((value) => value != null && !isNaN(value));
      const minPropValue = Math.min(...validValues);
      const maxPropValue = Math.max(...validValues);

      // Update state for legend
      setMinProperty(minPropValue);
      setMaxProperty(maxPropValue);

      // Apply the gradient color to edges
      data.edges.forEach((edge) => {
        const value = edge[selectedProperty];
        if (value == null || isNaN(value)) {
          edge.style = {
            stroke: '#000000', // Black color for invalid values
            lineWidth: 10,
          };
        } else {
          edge.style = {
            stroke: getEdgeColor(value, minPropValue, maxPropValue),
            lineWidth: 10,
          };
        }
      });

      try {
        if (chart && data) {
          chart.data(data);
          chart.render();

          // Edge hover event handlers
          chart.on('edge:mouseenter', (evt) => {
            const edge = evt.item;
            if (!edge) {
              console.warn('hover item is null');
              return;
            }
            if (edge !== selectedEdge) {
              edge.setState('hover', true);
              const edgeData = edge.getModel();
              const value = edgeData[selectedProperty];
              let hoverColor = '#000000';
              if (value != null && !isNaN(value)) {
                hoverColor = darkenColor(
                  getEdgeColor(value, minPropValue, maxPropValue),
                  0.2
                );
              }
              chart.updateItem(edge, {
                style: {
                  stroke: hoverColor,
                  lineWidth: 14,
                },
              });
            }
          });

          chart.on('edge:mouseleave', (evt) => {
            const edge = evt.item;
            if (!edge) {
              console.warn('hover item is null');
              return;
            }
            const edgeData = edge.getModel();
            if (edge !== selectedEdge) {
              chart.clearItemStates(edge);
              const value = edgeData[selectedProperty];
              let color = '#000000';
              if (value != null && !isNaN(value)) {
                color = getEdgeColor(value, minPropValue, maxPropValue);
              }
              chart.updateItem(edge, {
                style: {
                  stroke: color,
                  lineWidth: 10,
                },
              });
            }
          });

          chart.on('edge:click', (evt) => {
            const edge = evt.item;
            if (!edge) {
              console.warn('clicked item is null');
              return;
            }
            const edgeData = edge.getModel();
            if (selectedEdge && selectedEdge !== edge) {
              chart.clearItemStates(selectedEdge);
              // Clear previously highlighted color
              const prevValue = selectedEdge.getModel()[selectedProperty];
              let prevColor = '#000000';
              if (prevValue != null && !isNaN(prevValue)) {
                prevColor = getEdgeColor(prevValue, minPropValue, maxPropValue);
              }
              chart.updateItem(selectedEdge, {
                style: {
                  stroke: prevColor,
                  lineWidth: 10,
                },
              });
            }
            selectedEdge = edge;
            edge.setState('selected', true);
            const edgeInfo = { ...edgeData };
            setSelectedEdgeInfo(edgeInfo);
            setEdgePopup(true);
          });
        }
      } catch {
        console.log('Error adding data');
      }
    }
  };

  // Render the bar chart (if needed)
  const pie = async () => {
    if (!props.expandedCollection) {
      return null;
    }
    var data = [];
    const token = sessionStorage.getItem('token');
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/file-avgconds?sim=${props.expandedCollection}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      response.data.conditions.forEach((elem) => {
        if (elem.totalFlow !== 0 && typeof elem.totalFlow !== 'undefined') {
          data.push(
            { totalFlow: elem.totalFlow, category: 'Expected Crashes', value: elem.expectedCrashes },
            { totalFlow: elem.totalFlow, category: 'Expected Top Injury', value: elem.expectedTopInjurt },
            { totalFlow: elem.totalFlow, category: 'Fatal Crashes', value: elem.fatelCrashes },
            { totalFlow: elem.totalFlow, category: 'Low Crashes', value: elem.crashLowDamage },
            { totalFlow: elem.totalFlow, category: 'Med Crashes', value: elem.crashMedDamage },
            { totalFlow: elem.totalFlow, category: 'High Crashes', value: elem.crashHighDamage }
          );
        }
      });
      data.sort((a, b) => a.totalFlow - b.totalFlow);
    } catch (error) {
      console.error('Error fetching bar info:', error);
      return null;
    }

    if (nodeGraphRef.current) {
      chart = new Chart({
        container: nodeGraphRef.current,
        height: props.dimensions.graphHeight,
        width: props.dimensions.graphWidth,
        title: 'Average Crashes',
      });

      chart
        .interval()
        .data(data)
        .transform({ type: 'groupX', y: 'mean', groupBy: ['category', 'totalFlow'] })
        .transform({ type: 'stackY', reverse: true, orderBy: 'category' })
        .encode('x', 'totalFlow')
        .encode('y', 'value')
        .encode('color', 'category')
        .scale('color', {
          domain: [
            'Expected Crashes',
            'Expected Top Injury',
            'Fatal Crashes',
            'Low Crashes',
            'Med Crashes',
            'High Crashes',
          ],
          range: ['#baaeea', '#84c2ea', '#ff0000', '#a6ea84', '#ead084', '#ea9a84'],
        })
        .axis('y', { title: 'Average Crash' })
        .axis('x', { title: 'Total Flow' });

      chart.render();
    }
  };

  useEffect(() => {
    if (selectedEdgeInfo) {
      animation();
    }
    return () => {
      if (popChart) {
        popChart.destroy();
      }
    };
    // eslint-disable-next-line
  }, [selectedEdgeInfo]);

  useEffect(() => {
    if (props.selectedGraph === 'Traffic Map') {
      node();
    } else if (props.selectedGraph === 'Avg Crashes') {
      pie();
    }

    return () => {
      if (chart) {
        chart.destroy();
      }
    };
    // eslint-disable-next-line
  }, [nodeGraphRef, props.expandedCollection, props.selectedGraph, selectedProperty]);

  return (
    <div>
      {/* Dropdown Menu and Legend */}
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
        <label htmlFor="property-select" style={{ marginRight: '10px' }}>
          Select Property:
        </label>
        <select
          id="property-select"
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
        >
          <option value="totalFlow">Total Flow</option>
          <option value="co2Emission">CO2 Emission</option>
          <option value="totalAverageTime">Total Average Time</option>
          <option value="averageTime">Average Time</option>
          <option value="averageVehicles">Average Vehicles</option>
          <option value="averageQueue">Average Queue</option>
          <option value="averageStops">Average Stops</option>
          <option value="fuel">Fuel</option>
          <option value="expectedCrashes">Expected Crashes</option>
          <option value="expectedTopInjurt">Expected Top Injury</option>
          <option value="fatelCrashes">Fatal Crashes</option>
          <option value="crashLowDamage">Crash Low Damage</option>
          <option value="crashMedDamage">Crash Med Damage</option>
          <option value="crashHighDamage">Crash High Damage</option>
        </select>

        {/* Legend */}
        {minProperty != null && maxProperty != null && (
          <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
            <div style={{ marginRight: '10px' }}>Legend:</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ textAlign: 'right', marginRight: '5px' }}>
                {minProperty.toFixed(2)}
              </div>
              <div
                style={{
                  width: '100px',
                  height: '10px',
                  background: `linear-gradient(to right, ${rgbToHex(
                    GREEN
                  )}, ${rgbToHex(YELLOW)}, ${rgbToHex(ORANGE)}, ${rgbToHex(RED)})`,
                  margin: '0 5px',
                }}
              ></div>
              <div style={{ textAlign: 'left', marginLeft: '5px' }}>
                {maxProperty.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div style={{ color: 'red', marginBottom: '10px' }}>{errorMessage}</div>
      )}

      <div
        id="charts"
        ref={nodeGraphRef}
        style={{ width: props.dimensions.graphWidth, height: props.dimensions.graphHeight }}
      ></div>

      <Popup trigger={edgePopup} setTrigger={setEdgePopup}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Selected Edge Information</h2>
        <div
          id="animation"
          ref={popUpAnimationRef}
          style={{ width: 100, height: 250, marginTop: '-60px', marginLeft: '190px' }}
        ></div>
        <div style={{ display: 'flex' }}>
          {/* Left Section: Animation on top, Information below */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginRight: '20px',
            }}
          >
            <div>
              {selectedEdgeInfo && (
                <div>
                  <p>
                    <strong>Total Flow:</strong> {selectedEdgeInfo.totalFlow?.toFixed(3)}
                  </p>
                  <p>
                    <strong>CO<sub>2</sub> Emission:</strong> {selectedEdgeInfo.co2Emission?.toFixed(3)}
                  </p>
                  <p>
                    <strong>Total Average Time:</strong> {selectedEdgeInfo.totalAverageTime?.toFixed(3)}
                  </p>
                  <p>
                    <strong>Average Vehicles:</strong> {selectedEdgeInfo.averageVehicles?.toFixed(3)}
                  </p>
                  <p>
                    <strong>Average Queue:</strong> {selectedEdgeInfo.averageQueue?.toFixed(3)}
                  </p>
                  <p>
                    <strong>Average Stops:</strong> {selectedEdgeInfo.averageStops?.toFixed(3)}
                  </p>
                  <p>
                    <strong>Fuel:</strong> {selectedEdgeInfo.fuel?.toFixed(3)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Section: Additional Information */}
          <div style={{ marginLeft: '150px' }}>
            {selectedEdgeInfo && (
              <div>
                <p>
                  <strong>Expected Crashes:</strong> {selectedEdgeInfo.expectedCrashes?.toFixed(3)}
                </p>
                <p>
                  <strong>Expected Top Injury:</strong> {selectedEdgeInfo.expectedTopInjurt?.toFixed(3)}
                </p>
                <p>
                  <strong>Fatal Crashes:</strong> {selectedEdgeInfo.fatelCrashes?.toFixed(3)}
                </p>
                <p>
                  <strong>Crash Low Damage:</strong> {selectedEdgeInfo.crashLowDamage?.toFixed(3)}
                </p>
                <p>
                  <strong>Crash Med Damage:</strong> {selectedEdgeInfo.crashMedDamage?.toFixed(3)}
                </p>
                <p>
                  <strong>Crash High Damage:</strong> {selectedEdgeInfo.crashHighDamage?.toFixed(3)}
                </p>
              </div>
            )}
          </div>
        </div>
      </Popup>
    </div>
  );
};

// Utility function to assign icons to nodes
function assignIcons(nodes) {
  const icons = ['🚦', '🛑', '⛔', '⛖', '➡️'];
  nodes.forEach((node, index) => {
    node.icon = icons[Math.floor(index / 6)];
  });
}

// Define the RGB values for the colors
const GREEN = { r: 21, g: 147, b: 31 };     // Hex: #15931F
const YELLOW = { r: 255, g: 255, b: 1 };    // Hex: #FFFF01
const ORANGE = { r: 255, g: 159, b: 1 };    // Hex: #FF9F01
const RED = { r: 255, g: 9, b: 1 };         // Hex: #FF0901

// Function to interpolate between two colors
function interpolateColor(color1, color2, factor) {
  const r = Math.round(color1.r + factor * (color2.r - color1.r));
  const g = Math.round(color1.g + factor * (color2.g - color1.g));
  const b = Math.round(color1.b + factor * (color2.b - color1.b));
  return { r, g, b };
}

// Function to convert RGB to Hex
function rgbToHex({ r, g, b }) {
  const toHex = (value) => {
    const hex = value.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return '#' + toHex(r) + toHex(g) + toHex(b);
}

// Function to convert Hex to RGB
function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

// Function to darken a color
function darkenColor(hexColor, amount) {
  let { r, g, b } = hexToRgb(hexColor);
  r = Math.max(0, Math.min(255, r * (1 - amount)));
  g = Math.max(0, Math.min(255, g * (1 - amount)));
  b = Math.max(0, Math.min(255, b * (1 - amount)));
  return rgbToHex({ r: Math.round(r), g: Math.round(g), b: Math.round(b) });
}

// Updated getEdgeColor function with dynamic gradient
function getEdgeColor(value, minValue, maxValue) {
  if (value <= minValue) {
    return rgbToHex(GREEN);
  } else if (value >= maxValue) {
    return rgbToHex(RED);
  } else {
    let factor;
    let color;

    const range = maxValue - minValue;
    const oneThird = range / 3;
    const twoThirds = (2 * range) / 3;

    if (value <= minValue + oneThird) {
      factor = (value - minValue) / oneThird;
      color = interpolateColor(GREEN, YELLOW, factor);
    } else if (value <= minValue + twoThirds) {
      factor = (value - (minValue + oneThird)) / oneThird;
      color = interpolateColor(YELLOW, ORANGE, factor);
    } else {
      factor = (value - (minValue + twoThirds)) / oneThird;
      color = interpolateColor(ORANGE, RED, factor);
    }

    return rgbToHex(color);
  }
}

export default AveTrafficConds;
