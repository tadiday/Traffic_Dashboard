
import React, { useRef, useEffect } from 'react';
import { Chart } from '@antv/g2';

function Charts() {
    const chartRef1 = useRef(null);
    const chartRef2 = useRef(null);
    const chartRef3 = useRef(null);
    const chartRef4 = useRef(null);
    
  useEffect(() => {
    console.log(chartRef1.current);
    //-------------------------------------------------------------------bar------------------------------------------------------------------------
    if (chartRef1.current) {
    const chart = new Chart({
        container: chartRef1.current, // Attach to the DOM element
        autoFit: true,
        height: 450,
        width: 450,
    });

    chart
        .interval()
        .data([
        { genre: 'Sports', sold: 275 },
        { genre: 'Strategy', sold: 115 },
        { genre: 'Action', sold: 120 },
        { genre: 'Shooter', sold: 350 },
        { genre: 'Other', sold: 150 },
        ])
        .encode('x', 'genre')
        .encode('y', 'sold')
        .encode('color', 'genre');

    chart.render();
    }
  
    //----------------------------------------------------------------------rose--------------------------------------------------------------------
    if (chartRef2.current) {
      const polarChart = new Chart({
        container: chartRef2.current,
        width: 500,
        height: 500,
      });
  
      polarChart.coordinate({ type: 'polar', outerRadius: 0.85 });
  
      polarChart
        .interval()
        .transform({ type: 'groupX', y: 'sum' })
        .data({
          type: 'fetch',
          value: 'https://gw.alipayobjects.com/os/bmw-prod/87b2ff47-2a33-4509-869c-dae4cdd81163.csv',
        })
        .encode('x', 'year')
        .encode('color', 'year')
        .encode('y', 'people')
        .scale('y', { type: 'sqrt' })
        .scale('x', { padding: 0 })
        .axis(false)
        .label({
          text: 'people',
          position: 'outside',
          formatter: '~s',
          transform: [{ type: 'overlapDodgeY' }],
        })
        .legend({ color: { length: 400, layout: { justifyContent: 'center' } } })
        .animate('enter', { type: 'waveIn' })
        .tooltip({ channel: 'y', valueFormatter: '~s' });
  
      polarChart.render();
    }
  
    //----------------------------------------------------------------------line--------------------------------------------------------------------
    if (chartRef3.current) {
      const chart = new Chart({
        container: chartRef3.current,
        autoFit: true,
        insetRight: 10,
      });
      
      chart
        .line()
        .data({
          type: 'fetch',
          value: 'https://assets.antv.antgroup.com/g2/indices.json',
        })
        .transform({ type: 'normalizeY', basis: 'first', groupBy: 'color' })
        .encode('x', (d) => new Date(d.Date))
        .encode('y', 'Close')
        .encode('color', 'Symbol')
        .scale('y', { type: 'log' })
        .axis('y', { title: '↑ Change in price (%)' })
        .label({
          text: 'Symbol',
          selector: 'last',
          fontSize: 10,
        })
        .tooltip({ channel: 'y', valueFormatter: '.1f' });
      
      chart.render();
    }

    //----------------------------------------------------------------------scatter-----------------------------------------------------------------
    if (chartRef4.current) {
      const chart = new Chart({
        container: chartRef4.current,
        autoFit: true,
      });
      
      chart
        .point()
        .data({
          type: 'fetch',
          value:
            'https://gw.alipayobjects.com/os/bmw-prod/56b6b137-e04e-4757-8af5-d75bafaef886.csv',
        })
        .encode('x', 'date')
        .encode('y', 'value')
        .encode('color', 'value')
        .encode('shape', 'point')
        .scale('color', {
          palette: 'rdBu',
          offset: (t) => 1 - t,
        })
        .style('stroke', '#000')
        .style('strokeOpacity', 0.2)
        .tooltip([
          { channel: 'x', name: 'year', valueFormatter: (d) => d.getFullYear() },
          { channel: 'y' },
        ]);
      
      chart.lineY().data([0]).style('stroke', '#000').style('strokeOpacity', 0.2);
      
      chart.render();
    }
  }, [chartRef1,chartRef2,chartRef3,chartRef4]);

    return (
        <div id="charts">
        <table>
            <tr height="500" width="1000">
            <td>
                <div ref={chartRef1} style={{ width: '100%', height: '300px' }}></div>
                <button>Bar Chart</button>
            </td>
            <td>
                <div ref={chartRef2} style={{ width: '100%', height: '300px' }}></div>
                <button>Rose</button>
            </td>
            </tr>
            <tr height="500" width="1000">
            <td>
                <div ref={chartRef3} style={{ width: '100%', height: '300px' }}></div>
                <button>Line</button>
            </td>
            <td>
                <div ref={chartRef4} style={{ width: '100%', height: '300px' }}></div>
                <button>Line</button>
            </td>
            </tr>
            <tr>
            </tr>
        </table>
        </div>
    );
}

export default Charts;