// frontEnd/src/components/Main.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Main.css'; // Ensure Main.css is imported for styling
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';  // Correct the import for jwtDecode
import Charts from '../components/Charts';
import RightSidebar from '../components/RightSidebar';

function Main(props) {
    const [expandedCollection, setExpandedCollection] = useState(null);
    const [username, setUsername] = useState('');
    const [file, setFile] = useState(null); // File to be uploaded
    const [collectionName, setCollectionName] = useState('');
    const [items, setItems] = useState([]);
    const [selectedGraph, setSelectedGraph] = useState('node'); // Add selectedGraph state

    // Help information for different tabs
    const helpInformation = {
        "Time Optimizations": (
            <>
                <p>
                    The <strong>Time Optimizations Tab</strong> provides insights into how traffic flow can be optimized by adjusting signal timings, lane priorities, and other time-based parameters.
                </p>
                <h4>Features:</h4>
                <ul>
                    <li>When you hover over any of the Nodes, you can see information like "Node ID", "Node X", "Node Y", "Source of Edge", and "Target of Edge".</li>
                    <li>When you hover over any of the Edges, you can see information like "Edge ID", "Edge Length", "Edge Source", and "Edge Target".</li>
                    <li>When you click on any of the Edges, you can see an automated traffic flow path from the source to the target node. This view can also show you the "Total Flow" and "CO2 Emissions".</li>
                </ul>
                <h4>Relative Edges Information:</h4>
                <p>
                    When you scroll down on the Simulation Details page, you can see a slider where you can slide to whichever 5-minute interval you want to see the traffic flow for. As you move the slider, you can see the values changing at the bottom of the page under the "Relative Edges Information" section. Currently, for the three edges that are shown, you can see a variety of information like PH level, Saturation Flow, Offset time, etc.
                </p>
            </>
        ),
        "Traffic Map": (
            <>
                <p>
                    The <strong>Traffic Map Tab</strong> provides a visual representation of average traffic conditions across the selected area. This tab is designed to help users analyze traffic density, flow, and congestion patterns over time.
                </p>
                <h4>Features:</h4>  
                <ul>
                    <li>In the top left there is a "Select Property" dropdown where you can configure the graph based on the 
                        selection you choose. The legend is present on the right side of the dropdown and 
                        will change accordingly.</li>
                    <li>When you click on each edge in the graph, you will be able to see the average statistics in a color coded fashion. Generally, the lower the drop down selection's value, 
                        the more green in color it is going to appear. And vice versa, the closer the value is to the higher range for that particular selection,
                         the more red the edge is going to appear.</li>
                    <li>When you click on each edge, there is a number of metrics you will be presented with, such as total flow and CO2 emmision.</li>
                </ul>
            </>
        ),
        "Avg Crashes": (
            <>
                <strong>Currently when you use the dropdown to pick a property, regardless of which property you pick, the graph will show the same exact data.</strong>
                <p>
                    The <strong>Average Crashes Tab</strong> provides insights into the average number of crashes across the selected area. This tab is designed to help users analyze crash patterns and identify high-risk areas.
                </p>
                <h4>Features:</h4> 
                <ul>
                    <li>For each total flow value, you are able to see a color coded visual on the average crash numbers. Out of the average crash numbers per total flow, purple indicates the percentage number of crashes allocated to "expected crashes", light blue is associated with expected top or worst injury, red is fatal crashes, light light blue is low crashes, light orange is medium crashes, and dark orange is high crashes.  </li>
                    <li>As you hover over each of the bars and each section from the legend, you are able to see the actual mean of value for that specific total flow value. </li>
                </ul>

            </>
        ),
        "Avg CO2": (
            <>
                <strong>Currently, the spiral chart will provide the same information regardless of whichever property the user picks.</strong>
                <p>
                    The <strong>Avg CO2 Tab</strong> provides insights into the average CO2 emissions across the selected area. This tab is designed to help users analyze emission patterns and identify areas with high environmental impact.
                </p>
                <h4>Features:</h4>
                <ul>
                    <li>Above the actual spiral graph, there is a slider where the user can select the amount of fuel used. As the 
                        user slides the slider to a specific spot, they will start to notice the spiral graph changing. The graph will 
                        change based on the amount of fuel used and the average CO2 emissions.</li>
                    <li>When the user hovers over any "slice" of the pie chart, they are able to see the mean
                        CO2 emmision for that specific fuel amount used.</li>
                    <li>
                        <strong>Similar to the previous sections, the more fuel is consumed, the more red in color the pie slice will get. Vice versa, the less fuel consumed, the more blue in color the pie slice will get.</strong>
                    </li>
                </ul>
            </>
        ),
        "Custom Summary Chart": (
           <>
               <p>
                   The <strong>Custom Summary Chart </strong> provides a summary chart of the values of the total metrics and the average metrics.
               </p>
               <h4>Features:</h4>
               <ul>
                   <li><strong>Dropdown Button:</strong> Allows the selection between total metrics or the average metrics to view. </li>
                   <li><strong>Chart:</strong> Contains two different columns where the left column lists all the metrics in each columns and the right column lists the corresponding values. </li>
               </ul>
               <h4>How to Use:</h4>
               <ul>
                   <li>Use the dropdown button to select the type of data to display.</li>
                   <li>When the Total data type is selected, the total value of the each metrics will be displayed. </li>
                   <li>When the Average data type is selected, the avarage value of the each metrics will be displayed.</li>
               </ul>
               <ul>


               </ul>
               <h4>Insights You Can Gain:</h4>
               <ul>
                   <li>Analyze average and total values of each individual metrics.</li>
               </ul>
           </>
       ),
       "Car Information Filter": (
           <>
               <p>
                   The<strong> Car Information Filter </strong> provides a visual representation of all the metrics and their values.
               </p>
               <h4>Features:</h4>
               <ul>
                   <li><strong>Select Metrics:</strong> Allows selection of the metric to be displayed. </li>
                   <li><strong>Vehicle Class:</strong> A dropdown button that chooses the vehicle class from 1 to 5. Also has an option to choose all the vehicles. </li>
                   <li><strong>Max Entries:</strong> Enables input of the maximum number of entries.</li>
                   <li><strong>Results Returned:</strong> Reflects the maximum number of entries entered.</li>
                   <li><strong>Results Used:</strong> Reflects the number of results used.</li>
                   <li><strong>Skip DB Entries:</strong> Enables input of the number of skip DB entries.</li>
                   <li><strong>Dynamic Query Builder:</strong> Allows selection of parameters through dropdowns and input boxes to display a visualization accordingly. </li>
               </ul>
               <h4>How to Use the Select Metrics Dropdown:</h4>
               <ul>
                   <li><strong>To view a visualization for an individual metric:</strong> choose a metric, vehicle class, set the maximum number of entries and set the skip DB entries fields.</li>
                   <li><strong>To view visualization for all the metrics:</strong> select All in the select metric drop down. </li>
               </ul>
               <h4>How to Use the Dynamic Query Builder:</h4>
               <ul>
                   <li>Use the first dropdown to select a specific metric. </li>
                   <li>Use the second dropdown to select either one of the comparison symbols.</li>
                   <li>Use the third input box to enter a number. </li>
                   <li>Press the Add Query button to add the query to the list.</li>
                   <li>When the queries are built, it will appear in the box below and the visualization will appear accordingly. </li>
                   <li>To clear the queries, press Clear All button.</li>
               </ul>
               <h4>Insights You can Gain:</h4>
               <ul>
                   <li>Allows filtering and customization of multiple data combinations.</li>
                   <li>Enables for custom querying and interactive query building.</li>
               </ul>
           </>
       ),
       "Traffic in Series": (
            <>
                <p>The <strong>Traffic in Series</strong> tab will allow the users to see the average data for whichever selection they pick from the dropdown. The graph will present the data in intervals of 600 seconds or 10 minutes, totaling to 2 hours for entire graph</p>
                <h4>Features:</h4>
                <ul>
                    <li>Whenever the user picks a certain selection, the graph will change accordingly.</li>
                    <li>Based on the selection, the axis values will also change. When the user hovers over any specific bar in the graph, they will be able to see the average for that time range. </li>
                </ul>
            </>
        ),
        "Minimum Path Trees": (
            <>
                <p>The <strong>Minimum Path Trees </strong> tab provides a visualization of the shortest paths from a selected source node to all other nodes in the traffic network. This tab is designed to help users analyze optimal routing and traffic flow efficiency.</p>
                <h4>Features:</h4>
                <ul>
                    <li>When you hover over any of the Nodes, you can see information like "Node ID", "Node X", "Node Y", "Source of Edge", and "Target of Edge".</li>
                    <li>When you hover over any of the Edges, you can see information like "Edge ID", "Edge Length", "Edge Source", and "Edge Target".</li>

                    <li>There is a search bar at the top of the page and the user has the ability to enter any edge number. This will allow the user to see the minimum path tree by its root which will dynamically be changed on the graph. </li>
                    <li>There are two additional text boxes underneath the search bar where the user can indicate whether or not they want the graph to display the searched root information and the origins of the edge they entered. </li>
                </ul>
            </>
        ),

    };

    const navigate = useNavigate();
    const [files, setFiles] = useState([]); // Store files for the expanded collection
    const [file_type, setFile_Type] = useState(null);

    const [showSpinner, setShowSpinner] = useState(false);

    const [isHelpOpen, setIsHelpOpen] = useState(false);

    // Get items and username
    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            navigate('/');
        }
        try {
            const decodedToken = jwtDecode(token); // Decode the JWT
            setUsername(decodedToken.username);
        } catch (error) {
            console.error('Invalid token', error);
        }
        // Fetch collections after verifying token
        fetchItems();
    }, [navigate]);

    function handleNameChange(e) {
        setCollectionName(e.target.value);
    }

    function handleFileChange(e) {
        setFile(e.target.files[0]);
    }

    // Upload Function
    const upload = async () => {
        const token = sessionStorage.getItem('token');
        if (!file) {
            alert("Please select a zip file to upload.");
            return;
        }
        if (collectionName === '') {
            alert("Please enter a collection name.");
            return;
        }

        if (file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed') {
            alert("Please select a valid zip file.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('collectionName', collectionName);

        try {
            // Show the spinner
            setShowSpinner(true);

            const response = await axios.post(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Collection uploaded successfully:', response.data);
            // Hide the spinner after completion
            setShowSpinner(false);
            // Refetch collections after successful upload
            fetchItems();
        } catch (error) {
            console.error('Error uploading file:', error);
            setShowSpinner(false);
            if (error.response && error.response.data) {
                alert(error.response.data);
            } else {
                alert("An error occurred uploading the file.");
            }
        }
    };

    // Fetch collections
    const fetchItems = async () => {
        const token = sessionStorage.getItem('token');

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/get-collections`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            console.log("Fetched collections:", response.data);
            setItems(response.data);  // Update the collections
        } catch (error) {
            console.error('Error fetching entries:', error);
        }
    };

    // Handle logout
    const handleLogout = () => {
        sessionStorage.removeItem('token');  // Remove token
        navigate('/');  // Redirect to login
    };

    // Remove collection function
    const removeCollection = async (collectionName) => {
        const token = sessionStorage.getItem('token');

        try {
            console.log("Removing collection:", collectionName);
            await axios.post(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/api/delete-collection`, null, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    collection_name: collectionName  // Pass collection name
                }
            });
            // Fetch updated collections after deletion
            fetchItems();
        } catch (error) {
            console.error('Error removing collection:', error);
        }
    };

    return (
        <div className="app-container">
            <Navbar username={username} onLogout={handleLogout} />
            <div className="content">
                <Sidebar
                    file={file} // File to be uploaded
                    files={files} // Files within the selected collection
                    setFiles={setFiles}
                    file_type={file_type} // The type of file whose visualizations can be chosen
                    setFile_Type={setFile_Type}
                    collectionName={collectionName}
                    handleUpload={upload}
                    items={items}
                    removeCollection={removeCollection}
                    handleFileChange={handleFileChange}
                    handleNameChange={handleNameChange}
                    expandedCollection={expandedCollection}
                    setExpandedCollection={setExpandedCollection}
                    setSelectedGraph={setSelectedGraph} // Pass setSelectedGraph to Sidebar
                />
                <div className="main-content">
                    <div className="header-container">
                        <h2>Welcome, {username}!</h2>
                        <button className="help-button" onClick={() => setIsHelpOpen(true)}>Help</button>
                    </div>

                    {isHelpOpen && (
                        <div className="help-overlay">
                            <div className="help-box">
                                <h3>Need Help?</h3>
                                {helpInformation[selectedGraph] || <p>No help information available for this section.</p>}
                                <button onClick={() => setIsHelpOpen(false)}>Close</button>
                            </div>
                        </div>
                    )}

                    <Charts
                        expandedCollection={expandedCollection}
                        selectedGraph={selectedGraph} // Pass selectedGraph to Charts
                        file_type={file_type}
                        setFile_Type={setFile_Type}
                    />
                </div>
                <RightSidebar
                    setSelectedGraph={setSelectedGraph}
                    expandedCollection={expandedCollection}
                    files={files} // Files within the selected collection
                    file_type={file_type}
                    setFile_Type={setFile_Type}
                />
            </div>
            {showSpinner && (
                <div className="spinner-overlay">
                    <div className="spinner-container">
                        <button className="close-button" onClick={() => setShowSpinner(false)}>×</button>
                        <div className="spinner-message">
                            <p>Uploading and processing file, please wait...</p>
                            <div className="spinner"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Main;
