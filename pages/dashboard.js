import React from 'react';
 import { useRouter } from 'next/router';
 import { useEffect, useState } from 'react';
 import Link from 'next/link';
 import axios from 'axios';
 // Assuming you have jwt-decode installed - UNCOMMENT this line if you installed it
 // import jwt_decode from 'jwt-decode'; // <--- REMOVE or COMMENT OUT this line entirely

 function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [greenhouses, setGreenhouses] = useState([]);
  const [selectedGreenhouse, setSelectedGreenhouse] = useState('');
  const [overviewData, setOverviewData] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState('');

  // This useEffect handles initial authentication check and fetching greenhouses
  useEffect(() => {
   console.log('Initial useEffect (Auth & Fetch Greenhouses) running...'); // Debug log
   const accessToken = localStorage.getItem('access_token');

   if (!accessToken) {
    console.log('No access token found, redirecting to login.'); // Debug log
    router.push('/login');
    return;
   }

   const fetchUserData = async (token) => {
    console.log('Fetching user data...'); // Debug log
    try {
     // Use the alternative decoding method:
     // const decodedToken = jwt_decode.default(token); // <-- Make sure this is commented out
     const decodedToken = JSON.parse(atob(token.split('.')[1])); // <-- UNCOMMENT this line

     setUser(decodedToken);
     console.log('User data set:', decodedToken); // Debug log
    } catch (error) {
     console.error('Error decoding token or fetching user data:', error); // Debug log
     localStorage.removeItem('access_token');
     localStorage.removeItem('refresh_token');
     router.push('/login'); // Redirect on error
    }
   };


   const fetchGreenhouses = async (token) => {
    console.log('Fetching greenhouses list...'); // Debug log
    try {
     const response = await axios.get('http://localhost:8000/api/greenhouses/', {
      headers: {
       Authorization: `Bearer ${token}`,
      },
     });
     console.log('Greenhouses list fetched successfully:', response.data); // Debug log
     setGreenhouses(response.data);
     return response.data; // Return the fetched data
    } catch (error) {
     console.error('Error fetching greenhouses list:', error); // Debug log
     // Handle error appropriately (e.g., display a message to the user)
     setGreenhouses([]); // Clear greenhouses on error
     return []; // Return empty array on error
    }
   };


   {/* --- Logic that runs when this effect triggers --- */}
   fetchUserData(accessToken);

   fetchGreenhouses(accessToken).then(fetchedGreenhouses => {
       console.log('.then callback for fetchGreenhouses triggered.'); // Debug log
       if (fetchedGreenhouses.length > 0 && selectedGreenhouse === '') {
           setSelectedGreenhouse(fetchedGreenhouses[0].id);
           console.log('Setting initial selected greenhouse after fetch:', fetchedGreenhouses[0].id); // Debug log
       } else {
           console.log('Did not set initial selected greenhouse. Fetched count:', fetchedGreenhouses.length, 'Current selected:', selectedGreenhouse); // Debug log
       }
   });


  }, [router, selectedGreenhouse]); {/* <-- Include selectedGreenhouse here */}


  {/* This useEffect runs when selectedGreenhouse changes to fetch overview data */}
  useEffect(() => {
      console.log('selectedGreenhouse state changed:', selectedGreenhouse); // Debug log
      const accessToken = localStorage.getItem('access_token');
      if (accessToken && selectedGreenhouse !== '') {
          console.log('Calling fetchOverviewData...'); // Debug log
          fetchOverviewData(accessToken, selectedGreenhouse);
      } else {
           console.log('Not calling fetchOverviewData. Access token exists:', !!accessToken, 'selectedGreenhouse value:', selectedGreenhouse); // Debug log
           setOverviewData(null); {/* Clear overview data if no greenhouse is selected */}
           setOverviewError('');
      }
  }, [selectedGreenhouse]); {/* Dependency array includes selectedGreenhouse */}


   const fetchOverviewData = async (token, greenhouseId) => {
    console.log('Inside fetchOverviewData. Token exists:', !!token, 'Greenhouse ID:', greenhouseId); // Debug log
    if (!greenhouseId || greenhouseId === '') { {/* Also handle empty string case */}
        console.log('fetchOverviewData: No valid greenhouseId provided. Value:', greenhouseId); // Debug log
        setOverviewData(null); {/* Clear previous overview data */}
        return;
    }

    setLoadingOverview(true);
    setOverviewError('');

    try {
     console.log(`Attempting to fetch overview: http://localhost:8000/api/greenhouses/${greenhouseId}/overview/`); // Debug log
     const response = await axios.get(`http://localhost:8000/api/greenhouses/${greenhouseId}/overview/`, {
      headers: {
       Authorization: `Bearer ${token}`,
      },
     });
     console.log('Overview data fetched successfully:', response.data); // Debug log
     setOverviewData(response.data);
    } catch (error) {
     console.error('Error fetching overview data:', error); // Debug log
     setOverviewError('Failed to load overview data.');
     setOverviewData(null); {/* Clear previous overview data on error */}
    } finally {
     setLoadingOverview(false);
     console.log('fetchOverviewData finished.'); // Debug log
    }
   };


  const handleGreenhouseChange = (event) => {
   console.log('Greenhouse dropdown changed. New value:', event.target.value); // Debug log
   setSelectedGreenhouse(event.target.value);
   {/* This state change will automatically trigger the second useEffect */}
  };

  if (!user) {
   return <div>Loading user...</div>; {/* Or a spinner */}
  }

  return (
   <div className="min-h-screen bg-gray-100 flex">
    {/* Sidebar */}
    <aside className="bg-gray-200 w-64 p-6">
     {/* Logo */}
     <div className="mb-8">
       <div className="text-2xl font-bold text-green-500">🌱 GreenGrow</div>
     </div>
     {/* Navigation Links */}
     <nav>
       <h3 className="font-semibold text-gray-700 mb-2">Sections</h3>
       {/* Pass selectedGreenhouse as query parameter for sections if they depend on it */}
       {/* Add conditional check to only link if a greenhouse is selected */}
       <Link href={`/dashboard/environments${selectedGreenhouse ? `?greenhouse_id=${selectedGreenhouse}` : ''}`} className={`block py-2 text-gray-600 hover:text-green-500 ${!selectedGreenhouse ? 'pointer-events-none opacity-50' : ''}`}>
        Environments
       </Link>
       <Link href={`/dashboard/resources${selectedGreenhouse ? `?greenhouse_id=${selectedGreenhouse}` : ''}`} className={`block py-2 text-gray-600 hover:text-green-500 ${!selectedGreenhouse ? 'pointer-events-none opacity-50' : ''}`}>
        Resources
       </Link>
       <Link href={`/dashboard/security${selectedGreenhouse ? `?greenhouse_id=${selectedGreenhouse}` : ''}`} className={`block py-2 text-gray-600 hover:text-green-500 ${!selectedGreenhouse ? 'pointer-events-none opacity-50' : ''}`}>
        Security
       </Link>
       <Link href={`/dashboard/support${selectedGreenhouse ? `?greenhouse_id=${selectedGreenhouse}` : ''}`} className={`block py-2 text-gray-600 hover:text-green-500 ${!selectedGreenhouse ? 'pointer-events-none opacity-50' : ''}`}>
        Support
       </Link>


       <div className="mt-8">
        <h3 className="font-semibold text-gray-700 mb-2">Greenhouses</h3>
        <div>
         <select
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          value={selectedGreenhouse}
          onChange={handleGreenhouseChange}
         >
          <option value="">Select Greenhouse</option> {/* Added an empty value option */}
          {greenhouses.map((greenhouse) => (
           <option key={greenhouse.id} value={greenhouse.id}>
            {greenhouse.name || `Greenhouse ${greenhouse.id}`}
           </option>
          ))}
         </select>
        </div>
       </div>
     </nav>
    </aside>

    {/* Main Content */}
    <div className="flex-1 p-6">
     {/* Navbar (for logo and profile on the right) */}
     <header className="bg-white shadow-md p-4 flex justify-between items-center mb-6">
      {/* Logo can go here again if needed */}
       <div></div> {/* Placeholder div */}
      <div>
       {/* Profile Entry */}
       <div className="relative">
        {/* Placeholder for Profile Image/Icon */}
        <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold">
         {user && user.username ? user.username.charAt(0).toUpperCase() : 'U'}
        </div>
        {/* Profile dropdown can go here */}
       </div>
      </div>
     </header>

     {/* Main Page Content */}
     <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Dashboard Overview</h2>
      {loadingOverview && <p className="text-gray-600">Loading overview data...</p>}
      {overviewError && <p className="text-red-500">{overviewError}</p>}

      {/* Display overview data if available */}
      {overviewData ? ( /* Check if overviewData is truthy */
       <div className="space-y-6"> {/* Added space between cards */}

         {/* Greenhouse Info Card */}
         <div className="bg-white shadow rounded-md p-6">
           <h3 className="text-lg font-semibold text-gray-700 mb-2">Greenhouse: {overviewData.name || 'Unnamed'}</h3>
           <p className="text-gray-600">Location: {overviewData.location}</p>
         </div>

         {/* Actuators Card */}
         <div className="bg-white shadow rounded-md p-6">
           <h3 className="text-lg font-semibold text-gray-700 mb-4">Actuators Status</h3>
           {/* Added Array.isArray check for robustness */}
           {Array.isArray(overviewData.actuators) && overviewData.actuators.length > 0 ? (
               <ul>
                   {overviewData.actuators.map(actuator => (
                       <li key={actuator.id} className="mb-2 text-gray-700 flex items-center justify-between"> {/* Added flex classes */}
                             <span className="font-semibold">{actuator.name || actuator.actuator_type}:</span>
                             <span className="flex items-center">
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
               <p className="text-gray-600">No actuators found for this greenhouse.</p>
           )}
         </div>

         {/* Alerts Card */}
         {/* Added Array.isArray check for robustness */}
         {Array.isArray(overviewData.alerts) && overviewData.alerts.length > 0 && (
           <div className="bg-white shadow rounded-md p-6 border border-red-400"> {/* Added red border for alerts */}
               <h3 className="text-lg font-semibold text-red-700 mb-4">Active Alerts</h3> {/* Changed heading color */}
               <ul>
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
           {selectedGreenhouse ? 'No overview data available for the selected greenhouse (API Error or No Data).' : 'Please select a greenhouse to view the overview.'}
       </p>
      )}

     </div>
    </div>
   </div>
  );
 }

 export default Dashboard;