// frontEnd/src/components/Main.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../components/Main.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { Chart } from '@antv/g2';


function Main(props) {
    const [username, setUsername] = useState('')
    const [file, setFile] = useState(null);
    const [fileType, setFileType] = useState('summary');
    const [items, setItems] = useState([]);
    const navigate = useNavigate()
    
    const chartRef1 = useRef(null);
    const chartRef2 = useRef(null);
    const chartRef3 = useRef(null);
    const chartRef4 = useRef(null);
    // Get items and username
    useEffect(() => {
        const token = sessionStorage.getItem('token')
        if (!token) {
            navigate('/')
        }
        try {
            const decodedToken = jwtDecode(token); // Decode the JWT
            setUsername(decodedToken.username);
        } catch (error) {
            console.error('Invalid token', error);
        }
        // verify login via token
        fetchItems();  
    }, [navigate])


    function handleFileTypeChange (e) {
        setFileType(e.target.value);
    }
      
    function handleFileChange (e) {
        setFile(e.target.files[0]);
    }

    // Upload function
    const upload = async () => {
        if (!file) {
            alert("Please select a file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        console.log("File Type: ", fileType);
        formData.append('fileType', fileType);

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}:3000/api/upload`, formData, {
                headers: {
                'Content-Type': 'multipart/form-data'
                }
            });
            console.log('File uploaded successfully:', response.data);
            // Update the items
            fetchItems();
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    // Fetch items
    const fetchItems = async () => {
        const token = sessionStorage.getItem('token');
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}:3000/api/select-uploads`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
            });
            setItems(response.data);
        } catch (error) {
            console.error('Error fetching entries:', error);
        }
        console.log("Got items");
    };

    // Handle logout
    const handleLogout = () => {
        // delete token redirect to login
        sessionStorage.removeItem('token')
        navigate('/')
    };

    // Remove item
    const removeItem = async (index) => {
        // Remove the item from the DB
        let fileName = items[index];

        console.log("Removing item:", fileName);
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}:3000/api/delete-upload`, { fileName });
        } catch (error) {
            console.error('Error removing item:', error);
        }
        // Get the updated items
        fetchItems();
    };

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
  }, []);
  
    return (
        <div className="app-container">
          <Navbar username={username} onLogout={handleLogout} />
          <div className="content">
            <Sidebar 
              file={file} 
              fileType={fileType} 
              handleUpload={upload} 
              items={items} 
              removeItem={removeItem}
              handleFileChange={handleFileChange}
              handleFileTypeChange={handleFileTypeChange}
            />
            <div className="main-content">
              <h2>Welcome, {username}!</h2>
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
            </div>
          </div>
        </div>
    );
}


export default Main