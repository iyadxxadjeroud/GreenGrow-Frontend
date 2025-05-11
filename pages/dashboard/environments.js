// pages/dashboard/environments.js

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

// Import the DashboardLayout component
import DashboardLayout from '../../components/DashboardLayout';

// Helper function to get the unit based on sensor type code
function getSensorUnit(sensorType) {
    switch (sensorType) {
        case 'TEMP':
            return '°C';
        case 'AIR_HUM':
            return '% RH';
        case 'CO2':
            return ' ppm'; // Added space for better readability
        case 'LIGHT':
            return ' Lux'; // Added space
        case 'SOIL_MOIST':
            return '% VWC'; // Added space
        case 'SOIL_TEMP':
            return '°C';
        case 'WATER_LVL':
            return ' L'; // Added space
        case 'SOLAR_VOLT':
            return ' V'; // Added space
        default:
            return ''; // Return empty string if unit is unknown
    }
}


function EnvironmentsPage() {
    const router = useRouter();
    const { greenhouse_id } = router.query; // greenhouse_id can be string or undefined

    const [greenhouse, setGreenhouse] = useState(null);
    const [sensors, setSensors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- Polling Interval ---
    const POLLING_INTERVAL = 5000; // Poll every 5 seconds (adjust as needed)

    // Disable the ESLint rule for this specific useEffect because we are
    // intentionally controlling its dependencies based on router state.
    // Variables like 'loading', 'greenhouse', and 'router' are used internally
    // but adding them as dependencies would lead to incorrect re-render triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        let intervalId = null; // Variable to store the interval ID

        const fetchEnvironmentData = async () => {
            const id = typeof greenhouse_id === 'string' ? greenhouse_id : undefined;

            if (!id) {
                setLoading(false);
                setGreenhouse(null);
                setSensors([]);
                setError('');
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
                return;
            }

            // Set loading only for the *initial* fetch, not subsequent polls
            if (loading === true) {
                setLoading(true);
            }
            setError('');
            const accessToken = localStorage.getItem('access_token');

            if (!accessToken) {
                router.push('/login');
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
                return;
            }

            try {
                // Fetch greenhouse details (only needed initially, could optimize this)
                if (!greenhouse) {
                    const greenhouseResponse = await axios.get(`http://localhost:8000/api/greenhouses/${id}/`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    });
                    setGreenhouse(greenhouseResponse.data);
                    console.log('Environments Page: Greenhouse details fetched:', greenhouseResponse.data);
                }

                // Fetch sensors for this greenhouse - this will be polled
                const sensorsResponse = await axios.get(`http://localhost:8000/api/greenhouses/${id}/sensors/`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                const incomingSensors = sensorsResponse.data;

                // Optimize state update: Only update sensor objects in state if their latest reading has changed.
                // This helps React minimize DOM updates and provides a smoother visual update.
                setSensors(currentSensors => {
                    // If currentSensors is empty or not an array, or if the number of sensors changed
                    // (e.g., sensor added/removed), fallback to setting the entire incoming array.
                    if (!Array.isArray(currentSensors) || currentSensors.length === 0 || currentSensors.length !== incomingSensors.length) {
                        console.log('Environments Page: Initial fetch or sensor list structure changed. Setting entire incoming array.');
                        return incomingSensors;
                    }

                    // Map over the *current* sensors to create a new array.
                    // We will only create a new object for a sensor if its latest reading has changed.
                    const updatedSensors = currentSensors.map(currentSensor => {
                        // Find the corresponding incoming sensor by its ID
                        const incomingSensor = incomingSensors.find(s => s.id === currentSensor.id);

                        // If the sensor exists in the incoming data AND its latest reading is different
                        // (Compare based on existence, value, and timestamp)
                        const currentLatest = currentSensor.latest_reading;
                        const incomingLatest = incomingSensor?.latest_reading; // Use optional chaining for safety

                        // Check if the latest reading data has changed
                        const latestReadingChanged = (
                            currentLatest !== incomingLatest || // Handles cases where one is null and the other isn't
                            (currentLatest && incomingLatest && ( // If both exist, compare value and timestamp
                                currentLatest.value !== incomingLatest.value ||
                                currentLatest.timestamp !== incomingLatest.timestamp
                            ))
                        );

                        if (incomingSensor && latestReadingChanged) {
                            console.log(`Environments Page: Sensor ID ${currentSensor.id}: Latest reading changed. Updating state.`);
                            // Return a *new* object for this sensor with the updated latest_reading.
                            // This signals React that this specific item has changed.
                            return {
                                ...currentSensor, // Copy existing sensor properties (name, type, description, etc.)
                                latest_reading: incomingLatest // Use the new latest_reading object from incoming data
                            };
                        } else {
                            // If no change in latest reading (or sensor not found - though less likely with stable list)
                            // return the *current* sensor object reference.
                            // This tells React this object hasn't changed, which helps optimize rendering.
                            return currentSensor;
                        }
                    });

                    // After creating the updated array, check if any sensor object reference within
                    // the 'updatedSensors' array is different from the original 'currentSensors' array
                    // at the same position. This indicates that at least one sensor's data changed.
                    const hasChanges = updatedSensors.some((sensor, index) => sensor !== currentSensors[index]);

                    if (hasChanges) {
                        console.log('Environments Page: State update applied - some sensors had data changes.');
                        return updatedSensors; // Return the new array only if there were changes
                    } else {
                        console.log('Environments Page: State update attempted - no data changes detected in sensors.');
                        return currentSensors; // Return the original array reference if no data changes were found
                    }
                });

            } catch (error) {
                console.error('Environments Page: Error fetching environment data during polling:', error);
                // Keep the previous data but show an error message.
                if (error.response && error.response.status) {
                    if (error.response.status === 404) {
                        setError('Greenhouse or sensors not found.');
                    } else {
                        setError(`Failed to load environment data: ${error.response.status}`);
                    }
                } else if (error instanceof Error) {
                    setError(`Failed to load environment data: ${error.message}`);
                } else {
                    setError('Failed to load environment data.');
                }
            } finally {
                if (loading === true) {
                    setLoading(false);
                    console.log('Environments Page: Initial fetch finished, loading set to false.');
                }
            }
        };


        if (router.isReady && greenhouse_id) {
            console.log('Environments Page: Router ready and greenhouse_id present. Starting initial fetch and polling setup.');
            fetchEnvironmentData(); // Perform initial fetch immediately

            // Start Polling after the initial fetch attempt begins
            intervalId = setInterval(fetchEnvironmentData, POLLING_INTERVAL);
            console.log(`Environments Page: Started polling every ${POLLING_INTERVAL}ms.`);
        } else if (router.isReady && !greenhouse_id) {
            console.log('Environments Page: Router ready but no greenhouse_id. Clearing data and stopping polling.');
            setLoading(false);
            setGreenhouse(null);
            setSensors([]);
            setError('');
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }


        // Cleanup function: Runs when the component unmounts or dependencies change
        return () => {
            console.log('Environments Page: Cleanup function running.');
            if (intervalId) {
                console.log('Environments Page: Clearing polling interval.');
                clearInterval(intervalId);
            }
        };

    }, [greenhouse_id, router.isReady]); // Dependencies: Re-run/restart polling when greenhouse_id or router readiness changes


    return (
        <DashboardLayout>
            <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Environment Overview for {greenhouse ? greenhouse.name : 'Selected Greenhouse'}
                </h2>

                {loading ? (
                    <p className="text-gray-600">Loading environment data...</p>
                ) : error ? (
                    <p className="text-red-500">Error: {error}</p>
                ) : !greenhouse_id ? (
                    <p className="text-gray-600">No Greenhouse selected. Please select a greenhouse from the dashboard.</p>
                ) : (
                    <div className="bg-white shadow rounded-md p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Sensors</h3>
                        {Array.isArray(sensors) && sensors.length > 0 ? (
                            <ul>
                                {/* Use sensor.id as key for efficient list rendering */}
                                {sensors.map(sensor => (
                                    <li key={sensor.id} className="mb-4 p-4 border rounded-md bg-gray-50">
                                        <div className="flex justify-between items-center mb-2">
                                            {/* Use sensor.type for display if name is missing */}
                                            <strong className="text-gray-800">{sensor.name || sensor.type}:</strong>
                                            {/* Display latest reading and unit if available */}
                                            {sensor.latest_reading ? (
                                                // Conditional styling based on value and type (example for CO2)
                                                <span className={`text-sm font-semibold ${sensor.latest_reading.value > 1000 && sensor.type === 'CO2' ? 'text-red-600' : 'text-green-600'}`}>
                                                    {sensor.latest_reading.value} {getSensorUnit(sensor.type)}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-500">No data yet</span>
                                            )}
                                        </div>
                                        {/* Ensure description exists or provide a default */}
                                        <p className="text-sm text-gray-600">{sensor.description || 'No description'}</p>
                                        {/* Display last updated timestamp if latest_reading exists */}
                                        {sensor.latest_reading && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Last updated: {new Date(sensor.latest_reading.timestamp).toLocaleString()}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600">No sensors found for this greenhouse.</p>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default EnvironmentsPage;