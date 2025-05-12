// pages/dashboard/resources.js
// This code includes HTTP data fetching, WebSocket real-time updates,
// and filters to INCLUDE only Water Level and Solar Volt sensors for this page.
// Corrected to fix SyntaxError and ReferenceError during SSR.

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

import DashboardLayout from '../../components/DashboardLayout'; // Adjust path if necessary

// Helper function to get the unit based on sensor type code
// Reused from environments.js
function getSensorUnit(sensorType) {
     switch (sensorType) {
         case 'TEMP': return '°C';
         case 'AIR_HUM': return '% RH';
         case 'CO2': return ' ppm';
         case 'LIGHT': return ' Lux';
         case 'SOIL_MOIST': return '% VWC';
         case 'SOIL_TEMP': return '°C';
         case 'WATER_LVL': return ' L';
         case 'SOLAR_VOLT': return ' V';
         default: return '';
     }
 }

// Dedicated component to render just the sensor value and unit for potentially smoother updates
// Reused from environments.js
// Wrapped with memo for performance optimization
// eslint-disable-next-line react/display-name -- Suppress display-name rule for memoized component
const SensorValueDisplay = React.memo(({ latestReading, sensorType }) => {
    if (!latestReading) {
        return <span className="text-sm text-gray-500">No data yet</span>;
    }
    const value = latestReading.value;
    const unit = getSensorUnit(sensorType);
    // Keep styling rule, though maybe less relevant for these types, or adjust if needed
    const valueClassName = `text-sm font-semibold ${value > 1000 && sensorType === 'CO2' ? 'text-red-600' : 'text-green-600'}`;
    return (
        <span className={valueClassName}>
            {value} {unit}
        </span>
    );
});


function ResourcesPage() {
    const router = useRouter();
    // Get greenhouse ID from router query (if navigating via link with ID)
    const { greenhouse_id: queryGreenhouseId } = router.query;

    // Determine the greenhouse_id to use. Prioritize query parameter, then localStorage.
    // Use typeof window !== 'undefined' to ensure localStorage is accessed only in the browser.
    const greenhouse_id = typeof queryGreenhouseId === 'string' ? queryGreenhouseId : (typeof window !== 'undefined' ? localStorage.getItem('selectedGreenhouseId') : undefined);


    const [greenhouse, setGreenhouse] = useState(null);
    // State will hold ONLY the relevant sensors for THIS page (Water Level, Solar Volt)
    const [sensors, setSensors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Define sensor types to INCLUDE on this page
    const INCLUDED_SENSOR_TYPES = ['WATER_LVL', 'SOLAR_VOLT'];


    // --- Effect for Initial Data Fetch and WebSocket Setup ---
    // This effect runs on mount and when the determined greenhouse_id or router readiness changes.
    // It handles fetching initial data and setting up/tearing down the WebSocket.
    // Dependencies ensure the effect re-runs if the selected greenhouse changes or on initial load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        let websocket = null; // Use a local variable for the WebSocket instance within the effect

        // Use the determined greenhouse_id locally within the effect - no need for a separate 'id' variable here
        // const id = greenhouse_id; // Removed this line to avoid confusion


        const fetchInitialData = async (id) => { // Accept id as a parameter to use within the async function
            console.log('Resources Page: Starting initial data fetch.');
            // Use id parameter within this function
            if (!id) {
                 console.log('Resources Page: No greenhouse ID available for fetching.');
                setLoading(false); setGreenhouse(null); setSensors([]); setError('No Greenhouse selected. Please select a greenhouse from the dashboard.');
                return;
            }

            setLoading(true); setError('');
            const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            if (!accessToken) {
                // If no token, redirect to login. Use router.push within useEffect.
                router.push('/login');
                return; // Stop execution
            }

            try {
                 // Fetch greenhouse details (optional but good for display)
                 // Use id parameter
                 const greenhouseResponse = await axios.get(`http://localhost:8000/api/greenhouses/${id}/`, {
                   headers: { Authorization: `Bearer ${accessToken}` },
                 });
                 setGreenhouse(greenhouseResponse.data);
                 console.log('Resources Page: Initial Greenhouse details fetched:', greenhouseResponse.data);


                // Fetch all sensors for this greenhouse using the existing API endpoint
                // Use id parameter
                const sensorsResponse = await axios.get(`http://localhost:8000/api/greenhouses/${id}/sensors/`, {
                    headers: { Authorization: `Bearer ${accessToken}`, },
                });
                // Filter the received sensors to INCLUDE only the required sensor types before setting state
                const filteredSensors = sensorsResponse.data.filter(sensor =>
                    INCLUDED_SENSOR_TYPES.includes(sensor.type)
                );
                setSensors(filteredSensors);
                console.log('Resources Page: Initial Sensors data fetched and filtered.');

            } catch (error) {
                console.error('Resources Page: Error fetching initial data:', error);
                 // Set specific error message based on response or error type
                if (error.response) {
                    if (error.response.status === 401 || error.response.status === 403) {
                         // If unauthorized/forbidden, redirect to login (token expired or invalid)
                         router.push('/login');
                         return; // Stop execution
                    }
                    if (error.response.status === 404) {
                        setError('Greenhouse or sensors not found.');
                    } else {
                        setError(`Failed to load data: Server error ${error.response.status}.`);
                    }
                } else if (error.request) {
                    // The request was made but no response was received
                    setError('Failed to load data: No response from server.');
                } else {
                    // Something else happened in setting up the request
                    setError(`Failed to load data: ${error.message}`);
                }
                setGreenhouse(null); setSensors([]); // Clear previous state on error
            } finally {
                setLoading(false); console.log('Resources Page: Initial fetch finished.');
            }
        };

        const setupWebSocket = (id) => { // Accept id as a parameter to use within the function
            console.log('Resources Page: Starting WebSocket setup.');
            // Only attempt WebSocket setup if we have a greenhouse ID
            // Use id parameter within this function
            if (!id) {
                 console.log('Resources Page: No greenhouse ID, skipping WebSocket setup.');
                return;
            }

            // Determine WebSocket URL scheme (ws or wss)
            const wsScheme = typeof window !== 'undefined' ? (window.location.protocol === 'https:' ? 'wss' : 'ws') : 'ws';
            // Construct the WebSocket URL to match your backend routing
             // Adjust port if needed (assuming Django Channels is on port 8000)
            // Use id parameter
            const wsUrl = `${wsScheme}://${typeof window !== 'undefined' ? window.location.host.split(':')[0] : 'localhost'}:8000/ws/greenhouses/${id}/data/`;

            console.log(`Resources Page: Attempting to connect WebSocket to: ${wsUrl}`);

             // Ensure WebSocket connection is attempted only in the browser environment
            if (typeof window !== 'undefined') {
                websocket = new WebSocket(wsUrl); // Create the WebSocket instance

                // WebSocket Event Handlers
                websocket.onopen = () => {
                    console.log('Resources Page: WebSocket connection opened.');
                     setError(''); // Clear any previous connection error message on successful open
                    // You could send an initial message here if needed for subscription confirmation
                    // e.g., websocket.send(JSON.stringify({ 'command': 'subscribe', 'greenhouse_id': id }));
                };

                websocket.onmessage = (event) => {
                    console.log('Resources Page: WebSocket message received:', event.data);
                    try {
                        // Parse the incoming message data (expected to be JSON)
                        const data = JSON.parse(event.data);
                        console.log('Resources Page: Parsed WebSocket data:', data); // Use console.log

                        // Check if the received data has the expected structure for a sensor update
                        // and if the sensor type is one we care about for THIS page.
                        if (data && data.sensor_id !== undefined && data.latest_reading && data.sensor_type) {
                            const updatedSensorId = data.sensor_id;
                            const newLatestReading = data.latest_reading;
                            const updatedSensorType = data.sensor_type; // Get sensor type from WS message

                            // Only process updates for sensor types INCLUDED on this page (Water Level, Solar Volt)
                            const isRelevant = INCLUDED_SENSOR_TYPES.includes(updatedSensorType);

                            if (isRelevant) {
                                 console.log(`Resources Page: WebSocket update for sensor ID ${updatedSensorId} (Type: ${updatedSensorType}) is RELEVANT.`);
                                 // Update the state for the specific sensor that changed
                                 setSensors(currentSensors => {
                                     // Create a new array by mapping over the current sensors
                                     const updatedSensors = currentSensors.map(sensor => {
                                         // If this sensor matches the one from the message
                                         if (sensor.id === updatedSensorId) {
                                             console.log(`Updating state for sensor ID ${updatedSensorId} with received reading.`);
                                             // Create a NEW object for this sensor with the updated latest_reading
                                             return {
                                                 ...sensor, // Copy existing properties
                                                 latest_reading: newLatestReading // Update latest_reading
                                             };
                                         }
                                         // Return other sensors unchanged
                                         return sensor;
                                     });
                                     // Return the new updatedSensors array to set state
                                     // This will trigger a re-render if any sensor's object reference changed
                                     return updatedSensors;
                                 });

                            } else {
                                 console.log(`Resources Page: WebSocket update for sensor ID ${updatedSensorId} (Type: ${updatedSensorType}) is NOT RELEVANT for this page.`);
                            }


                        } else {
                            console.warn("Resources Page: WebSocket: Received message with unexpected data structure or missing data:", data);
                        }

                    } catch (e) {
                        console.error('Resources Page: Error parsing message data:', e);
                         setError('Error processing real-time data.'); // Display parsing error on UI
                    }
                };

                websocket.onerror = (error) => {
                    console.error('Resources Page: WebSocket error:', error);
                     // Set an error state for UI display, but don't immediately stop trying to reconnect
                    setError('WebSocket connection error. Attempting to reconnect...');
                    // The 'onclose' handler will typically be called after an error, potentially triggering reconnection logic
                };

                websocket.onclose = (event) => {
                    console.log('Resources Page: WebSocket connection closed:', event);
                    setError(`WebSocket connection closed (Code: ${event.code}). Attempting to reconnect...`); // Display closure status/error on UI

                    // Attempt to reconnect after a delay if the closure was not clean (e.g., server restart, network issue)
                    // Clean closures (code 1000) usually happen on purpose (e.g., component unmount or manual close)
                    // Only attempt reconnect if the closure was not clean AND we still have a valid greenhouse ID
                    if (!event.wasClean && id) { // Use the 'id' parameter passed to setupWebSocket
                       console.log('Resources Page: WebSocket died unexpectedly, attempting to reconnect...');
                       // Implement a reconnection strategy (e.g., exponential backoff is better than fixed delay)
                       setTimeout(() => setupWebSocket(id), 1000); // Pass id back to setup function
                    } else if (event.wasClean) {
                        console.log('Resources Page: WebSocket closed cleanly, not attempting to reconnect.');
                         setError('WebSocket connection closed.'); // Clear error or show clean closed status
                    } else if (!id) { // Use the 'id' parameter passed to setupWebSocket
                        console.log('Resources Page: WebSocket died, but no greenhouse ID available. Not attempting reconnect.');
                    }
                };
             } // End if (typeof window !== 'undefined')

        }; // End setupWebSocket function

        // --- Effect Logic: Run on Mount and dependencies change ---
        // This section calls the fetch and setup functions.
        // Depend on the 'greenhouse_id' from the component's outer scope and router.isReady.
        // This ensures the effect re-runs to fetch data and set up WS
        // when the selected greenhouse changes (if ID comes from query/context) or on initial load.
        // Pass greenhouse_id as a parameter to the fetch and setup functions to use within their async/sync scopes.
        if (router.isReady && greenhouse_id) { // Start fetch/WS only if router is ready AND greenhouse_id is available
             console.log('Resources Page: Router ready and greenhouse ID available. Starting initial data fetch and WebSocket setup.');
             fetchInitialData(greenhouse_id); // Pass greenhouse_id
             setupWebSocket(greenhouse_id); // Pass greenhouse_id
        } else if (router.isReady && !greenhouse_id) {
            console.log('Resources Page: Router ready, but no greenhouse ID.');
            setLoading(false); // Not loading if no ID
            setError('No Greenhouse selected. Please select a greenhouse from the dashboard.');
        }


        // --- Cleanup Function: Runs on Unmount or Dependencies Change ---
        // This is crucial to close the WebSocket connection properly when the component unmounts
        // or when the effect re-runs due to dependencies changing (e.g., selected greenhouse changes).
        return () => {
            console.log('Resources Page: Cleanup function running. Closing WebSocket if open.');
            // Check if the WebSocket instance exists and is currently open before attempting to close.
            // 'websocket' is the local variable from the outer scope of the effect.
            if (websocket && websocket.readyState === WebSocket.OPEN) {
                console.log('Resources Page: Closing active WebSocket connection.');
                websocket.close(); // Close the connection cleanly
            } else if (websocket) {
                 // Log if WebSocket exists but is not open (e.g., already closed, closing, or connecting)
                 console.log(`Resources Page: WebSocket exists but not open (State: ${websocket.readyState}). No close needed.`);
            } else {
                 // Log if the WebSocket instance was never created in this effect run
                 console.log('Resources Page: No WebSocket instance to close.');
            }
             // If you implemented reconnection timeouts, you would need to clear them here too.
        };

    }, [greenhouse_id, router.isReady]); // <-- DEPENDENCIES: Depend on 'greenhouse_id' and router readiness


    return (
        <DashboardLayout>
            <div>
                {/* Display selected greenhouse name if available. Fallback to a generic message. */}
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Resource Levels for {greenhouse ? greenhouse.name : 'Selected Greenhouse'}
                </h2>

                {/* Conditional rendering based on loading, error, or availability of greenhouse_id */}
                {loading ? (
                    <p className="text-gray-600">Loading resource data...</p>
                ) : error ? (
                     <p className="text-red-500">Error: {error}</p>
                ) : !greenhouse_id ? ( // Check if greenhouse_id is available to show the "No Greenhouse selected" message
                    // Render message if no greenhouse is selected
                     <p className="text-gray-600">No Greenhouse selected. Please select a greenhouse from the dashboard.</p>
                ) : ( // This 'else' block renders when the page is not loading, has no error, and greenhouse_id is available
                    <div className="bg-white shadow rounded-md p-6 mb-6">
                         {/* Title for the displayed sensors */}
                         <h3 className="text-lg font-semibold text-gray-700 mb-4">Resource Sensors (Water Level, Solar Volt)</h3>
                         {/* Conditional rendering based on whether the filtered sensors array is not empty */}
                         {Array.isArray(sensors) && sensors.length > 0 ? (
                             <ul>
                                 {/* Map over the 'sensors' state array, which contains only the filtered resource sensors */}
                                 {sensors.map(sensor => (
                                     <li key={sensor.id} className="mb-4 p-4 border rounded-md bg-gray-50">
                                         <div className="flex justify-between items-center mb-2">
                                             {/* Display sensor name or type */}
                                             <strong className="text-gray-800">{sensor.name || sensor.type}:</strong>
                                             {/* Use the dedicated component for value display */}
                                             <SensorValueDisplay
                                                 latestReading={sensor.latest_reading}
                                                 sensorType={sensor.type}
                                             />
                                         </div>
                                         {/* Display sensor description */}
                                         <p className="text-sm text-gray-600">{sensor.description || 'No description'}</p>
                                         {sensor.latest_reading && (
                                             <p className="text-xs text-gray-500 mt-1">
                                                 Last updated: {new Date(sensor.latest_reading.timestamp).toLocaleString()}
                                             </p>
                                         )}
                                     </li>
                                 ))}
                             </ul>
                         ) : (
                             // Message to display if no resource sensors are found for this greenhouse
                             <p className="text-gray-600">No resource sensors found for this greenhouse.</p> // This is the line where the previous syntax error occurred
                         )}
                    </div>
                )}

                 {/* Placeholder for other content in the Resources page, displayed below the sensor section */}
                 <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Useful Resources</h3>
                    <ul>
                        <li><a href="#" className="text-blue-600 hover:underline">Link to Greenhouse Guide 1</a></li>
                        <li><a href="#" className="text-blue-600 hover:underline">Link to Hardware Documentation</a></li>
                        {/* Add more links here */}
                    </ul>
                 </div>
            </div>
        </DashboardLayout>
    );
}

export default ResourcesPage;