// pages/dashboard/index.js

 import React, { useEffect, useState } from 'react'; // Keep React, useEffect, useState
 import { useRouter } from 'next/router'; // Keep useRouter
 // Remove Link import - not needed in the page content
 // import Link from 'next/link';
 import axios from 'axios'; // Keep axios for fetching overview data

 // Import the DashboardLayout component
 import DashboardLayout from '../../components/DashboardLayout';

 // Remove jwt-decode import - it's in the layout
 // import jwt_decode from 'jwt-decode';


 // Dashboard component - focuses only on the overview content
 function Dashboard() {
  const router = useRouter();
  // greenhouse_id from query can be string or undefined in JS
  const { greenhouse_id } = router.query;

  // State specific to the overview data display
  const [overviewData, setOverviewData] = useState(null); // No type annotation
  const [loadingOverview, setLoadingOverview] = useState(false); // No type annotation
  const [overviewError, setOverviewError] = useState(''); // No type annotation

  // Fetch overview data when greenhouse_id changes or router is ready
   useEffect(() => {
       console.log('Dashboard Page: Effect triggered for greenhouse_id:', greenhouse_id); // Debug log
       const accessToken = localStorage.getItem('access_token');

       // Function to fetch overview data (no type annotations)
       const fetchOverviewData = async (token, id) => {
        console.log('Dashboard Page: Inside fetchOverviewData. Token exists:', !!token, 'Greenhouse ID:', id); // Debug log
        if (!id) {
            console.log('Dashboard Page: fetchOverviewData: No valid greenhouseId provided. Value:', id); // Debug log
            setOverviewData(null);
            return;
        }

        setLoadingOverview(true);
        setOverviewError('');

        try {
         const response = await axios.get(`http://localhost:8000/api/greenhouses/${id}/overview/`, { // No type parameter for axios.get
          headers: { Authorization: `Bearer ${token}` },
         });
         console.log('Dashboard Page: Overview data fetched successfully:', response.data); // Debug log
         setOverviewData(response.data);
        } catch (error) { // Error caught as unknown in JS
         console.error('Dashboard Page: Error fetching overview data:', error); // Debug log
         // Standard JS error handling
         if (error.response && error.response.status === 404) {
              setOverviewError('Greenhouse not found or you do not own it.');
         } else {
              setOverviewError('Failed to load overview data.');
         }
         setOverviewData(null);
        } finally {
         setLoadingOverview(false);
         console.log('Dashboard Page: fetchOverviewData finished.'); // Debug log
        }
       };


       // Only fetch if there's a token and a greenhouse_id is available and router is ready
       // Check if greenhouse_id is not undefined or null before calling fetch
       if (accessToken && greenhouse_id && router.isReady) {
           console.log('Dashboard Page: Calling fetchOverviewData...'); // Debug log
           // Pass greenhouse_id directly, as its type is handled by router.query
           fetchOverviewData(accessToken, greenhouse_id);
       } else if (!greenhouse_id && router.isReady) {
           // If router is ready but no greenhouse_id, clear previous data
            console.log('Dashboard Page: No greenhouse_id in query, clearing overview data.'); // Debug log
            setOverviewData(null);
            setOverviewError('');
       } else {
            console.log('Dashboard Page: Not calling fetchOverviewData. Access token exists:', !!accessToken, 'greenhouse_id value:', greenhouse_id, 'router.isReady:', router.isReady); // Debug log
       }
   }, [greenhouse_id, router.isReady]); // Dependency array includes greenhouse_id and router.isReady


  // Return only the page's content, wrapped by the layout
  return (
   <DashboardLayout> {/* Wrap the page content with the layout */}
    {/* Main Page Content for the Overview */}
    <div>
     <h2 className="text-xl font-semibold text-gray-800 mb-4">Dashboard Overview</h2>
     {loadingOverview && <p className="text-gray-600">Loading overview data...</p>}
     {overviewError && <p className="text-red-500">{overviewError}</p>}

     {/* Display overview data if available */}
     {overviewData ? ( /* Check if overviewData is truthy */
      <div className="space-y-6"> {/* Added space between cards */}

        {/* Greenhouse Info Card */}
        {/* Check if overviewData is not null before accessing properties */}
        {overviewData && (
          <div className="bg-white shadow rounded-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Greenhouse: {overviewData.name || 'Unnamed'}</h3>
            <p className="text-gray-600">Location: {overviewData.location}</p>
          </div>
        )}


        {/* Actuators Card */}
        <div className="bg-white shadow rounded-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Actuators Status</h3>
          {/* Check if overviewData exists and actuators is an array and not empty */}
          {overviewData && Array.isArray(overviewData.actuators) && overviewData.actuators.length > 0 ? (
              <ul>
                  {/* No type annotation for actuator parameter in map */}
                  {overviewData.actuators.map(actuator => (
                      <li key={actuator.id} className="mb-2 text-gray-700 flex items-center justify-between"> {/* Added flex classes */}
                          <span className="font-semibold">{actuator.name || actuator.actuator_type}:</span>
                          <span className="flex items-center">
                              {/* Check if latest_status exists before accessing */}
                              {actuator.latest_status ? (
                                  <> {/* Use a Fragment to group elements */}
                                      {/* Conditional rendering based on status_value */}
                                      {actuator.latest_status.status_value.toLowerCase() === 'on' ? (
                                          <span className="ml-2 px-3 py-1 bg-green-500 text-white text-sm rounded-full">On</span>
                                      ) : actuator.latest_status.status_value.toLowerCase() === 'off' ? (
                                          <span className="ml-2 px-3 py-1 bg-gray-400 text-white text-sm rounded-full">Off</span>
                                      ) : (
                                          // For other status values (like percentages), just display the text
                                          <span className="ml-2 text-gray-800 text-sm">{actuator.latest_status.status_value}</span>
                                      )}
                                      {/* Optional: Timestamp display */}
                                      {/* {actuator.latest_status && <small className="text-gray-500 ml-2"> ({new Date(actuator.latest_status.timestamp).toLocaleString()})</small>} */}
                                  </>
                              ) : (
                                  <span className="ml-2 text-gray-600 text-sm">No status yet</span>
                              )}
                          </span>
                      </li>
                  ))}
              </ul>
          ) : (
               // Message when no actuators found or overviewData is null/actuators is not array
              <p className="text-gray-600">{overviewData ? 'No actuators found for this greenhouse.' : 'Loading...'}</p>
          )}
        </div>

         {/* Alerts Card */}
         {/* Check if overviewData exists and alerts is an array and not empty */}
         {overviewData && Array.isArray(overviewData.alerts) && overviewData.alerts.length > 0 && (
           <div className="bg-white shadow rounded-md p-6 border border-red-400"> {/* Added red border for alerts */}
               <h3 className="text-lg font-semibold text-red-700 mb-4">Active Alerts</h3> {/* Changed heading color */}
               <ul>
                   {/* No type annotation for alert or index parameter in map */}
                   {overviewData.alerts.map((alert, index) => (
                       <li key={index} className="mb-2 text-red-700"> {/* Added margin-bottom */}
                           ⚠️ {alert} {/* Display alerts with warning emoji */}
                       </li>
                   ))}
               </ul>
           </div>
         )}

         {/* You could add other cards here for Sensors, Summary Stats, etc. */}

       </div>
      ) : ( /* If no overviewData, show a message */
       <p className="text-gray-600">
           {/* Adjusted message based on loading and greenhouse_id state */}
           {loadingOverview ? 'Loading overview data...' : (greenhouse_id ? 'No overview data available for the selected greenhouse.' : 'Please select a greenhouse to view the overview.')}
       </p>
      )}

     </div>
   </DashboardLayout> // Closing layout tag
  );
 }

 export default Dashboard;