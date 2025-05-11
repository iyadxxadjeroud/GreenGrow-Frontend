// components/DashboardLayout.js

 import React, { useEffect, useState } from 'react';
 import { useRouter } from 'next/router';
 import Link from 'next/link';
 import axios from 'axios'; // Keep axios

 // The DashboardLayout component will wrap all dashboard pages
 function DashboardLayout({ children }) { // No type annotation for children in JS
  const router = useRouter();
  const [user, setUser] = useState(null); // No type annotation
  const [greenhouses, setGreenhouses] = useState([]); // No type annotation
  const [selectedGreenhouse, setSelectedGreenhouse] = useState(''); // No type annotation
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // No type annotation

  // --- Data Fetching and Auth Check (Moved from dashboard/index.js) ---
  useEffect(() => {
   console.log('DashboardLayout: Initial useEffect (Auth & Fetch Greenhouses) running...'); // Debug log
   const accessToken = localStorage.getItem('access_token');

   if (!accessToken) {
    console.log('DashboardLayout: No access token found, redirecting to login.'); // Debug log
    router.push('/login');
    return;
   }

   // No type annotation for token parameter
   const fetchUserData = async (token) => {
    console.log('DashboardLayout: Fetching user data...'); // Debug log
    try {
     // Use the alternative decoding method (already in JS)
     const decodedToken = JSON.parse(atob(token.split('.')[1])); // No type assertion needed
     setUser(decodedToken);
     console.log('DashboardLayout: User data set:', decodedToken); // Debug log
    } catch (error) { // Error caught as unknown in JS
     console.error('DashboardLayout: Error decoding token or fetching user data:', error); // Debug log
     // Standard JS error handling
     localStorage.removeItem('access_token');
     localStorage.removeItem('refresh_token');
     router.push('/login'); // Redirect on error
    }
   };

   // No type annotation for token parameter or return type
   const fetchGreenhouses = async (token) => {
    console.log('DashboardLayout: Fetching greenhouses list...'); // Debug log
    try {
     const response = await axios.get('http://localhost:8000/api/greenhouses/', { // No type parameter for axios.get
      headers: {
       Authorization: `Bearer ${token}`,
      },
     });
     console.log('DashboardLayout: Greenhouses list fetched successfully:', response.data); // Debug log
     setGreenhouses(response.data);
     return response.data; // Return the fetched data
    } catch (error) { // Error caught as unknown in JS
     console.error('DashboardLayout: Error fetching greenhouses list:', error); // Debug log
     // Standard JS error handling
     setGreenhouses([]); // Clear greenhouses on error
     return []; // Return empty array on error
    }
   };

   // --- Logic that runs when this effect triggers ---
   fetchUserData(accessToken);

   // Call fetchGreenhouses and then handle setting the initial selected greenhouse
   fetchGreenhouses(accessToken).then(fetchedGreenhouses => {
       console.log('DashboardLayout: .then callback for fetchGreenhouses triggered.'); // Debug log
       // Set initial selection only if greenhouses are loaded and no greenhouse is already selected
       if (fetchedGreenhouses.length > 0 && selectedGreenhouse === '') {
           // Check if the first greenhouse object has an id property (JS check)
           if (fetchedGreenhouses[0] && fetchedGreenhouses[0].id !== undefined) {
               setSelectedGreenhouse(String(fetchedGreenhouses[0].id)); // Ensure it's a string for select value
               console.log('DashboardLayout: Setting initial selected greenhouse after fetch:', fetchedGreenhouses[0].id); // Debug log
           }
       } else {
           console.log('DashboardLayout: Did not set initial selected greenhouse. Fetched count:', fetchedGreenhouses.length, 'Current selected:', selectedGreenhouse); // Debug log
       }
   });


  }, [router]); // Dependency array includes router.

  // --- Sidebar Toggle Logic ---
  const toggleSidebar = () => {
    console.log('Toggling sidebar'); // Debug log
    setIsSidebarOpen(!isSidebarOpen);
  };

  // No type annotation for event parameter
  const handleGreenhouseChange = (event) => {
    console.log('DashboardLayout: Greenhouse dropdown changed. New value:', event.target.value); // Debug log
    const newGreenhouseId = event.target.value;
    setSelectedGreenhouse(newGreenhouseId);
    // Optionally navigate to the overview page of the newly selected greenhouse
    // router.push(`/dashboard?greenhouse_id=${newGreenhouseId}`);
    // Or, if you want the *current* page to update with the new greenhouse:
    const currentPath = router.pathname;
    router.push({
      pathname: currentPath,
      query: { ...router.query, greenhouse_id: newGreenhouseId },
    });

  };


  if (!user) {
    // Still show a loading state or redirect if user is not loaded/authenticated
    return <div>Loading user or redirecting...</div>;
  }

  return (
   <div className="min-h-screen bg-gray-100 flex">
    {/* Sidebar */}
    {/* Conditional classes based on isSidebarOpen */}
    <aside className={`bg-gray-200 p-6 flex-shrink-0 ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
     {/* Sidebar Content */}
     <div className={`${isSidebarOpen ? 'block' : 'hidden'}`}> {/* Hide content when sidebar is closed */}
       {/* Logo */}
       <div className="mb-8">
         <div className="text-2xl font-bold text-green-500">🌱 GreenGrow</div>
       </div>
       {/* Navigation Links */}
       <nav>
         <h3 className="font-semibold text-gray-700 mb-2">Sections</h3>
         {/* Ensure links maintain the selected_greenhouse query parameter */}
         {/* Use router.query to preserve other potential query params */}
         <Link href={{ pathname: '/dashboard', query: { ...router.query, greenhouse_id: selectedGreenhouse } }} className={`block py-2 text-gray-600 hover:text-green-500 ${!selectedGreenhouse ? 'pointer-events-none opacity-50' : ''}`}>
          Overview
         </Link>
         <Link href={{ pathname: '/dashboard/environments', query: { ...router.query, greenhouse_id: selectedGreenhouse } }} className={`block py-2 text-gray-600 hover:text-green-500 ${!selectedGreenhouse ? 'pointer-events-none opacity-50' : ''}`}>
          Environments
         </Link>
         <Link href={{ pathname: '/dashboard/resources', query: { ...router.query, greenhouse_id: selectedGreenhouse } }} className={`block py-2 text-gray-600 hover:text-green-500 ${!selectedGreenhouse ? 'pointer-events-none opacity-50' : ''}`}>
          Resources
         </Link>
         <Link href={{ pathname: '/dashboard/security', query: { ...router.query, greenhouse_id: selectedGreenhouse } }} className={`block py-2 text-gray-600 hover:text-green-500 ${!selectedGreenhouse ? 'pointer-events-none opacity-50' : ''}`}>
          Security
         </Link>
         <Link href={{ pathname: '/dashboard/support', query: { ...router.query, greenhouse_id: selectedGreenhouse } }} className={`block py-2 text-gray-600 hover:text-gray-600 ${!selectedGreenhouse ? 'pointer-events-none opacity-50' : ''}`}> {/* Adjusted hover color to gray */}
          Support
         </Link>


         <div className="mt-8">
          <h3 className="font-semibold text-gray-700 mb-2">Greenhouses</h3>
          <div>
           {/* Use the selectedGreenhouse state and handler from the layout */}
           <select
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={selectedGreenhouse}
            onChange={handleGreenhouseChange}
           >
            <option value="">Select Greenhouse</option> {/* Added an empty value option */}
            {/* Check if greenhouses is an array and has elements before mapping */}
            {Array.isArray(greenhouses) && greenhouses.map((greenhouse) => (
             <option key={greenhouse.id} value={greenhouse.id}> {/* Use greenhouse.id as key */}
              {greenhouse.name || `Greenhouse ${greenhouse.id}`}
             </option>
            ))}
           </select>
          </div>
         </div>
       </nav>
      </div> {/* End of sidebar content div */}
    </aside>

    {/* Main Content Wrapper */}
    {/* Conditional margin based on isSidebarOpen */}
    <div className={`flex-1 flex flex-col ${isSidebarOpen ? 'ml-0' : 'ml-0'}`}> {/* Adjusted margin, flex-col for header/content */}
       {/* Navbar */}
       <header className="bg-white shadow-md p-4 flex justify-between items-center flex-shrink-0"> {/* flex-shrink-0 to prevent shrinking */}
         {/* Sidebar Toggle Button */}
         <button onClick={toggleSidebar} className="text-gray-600 hover:text-gray-800 focus:outline-none">
             {isSidebarOpen ? (
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg> // Close icon
             ) : (
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg> // Menu icon
             )}
         </button>

         {/* Logo or Page Title can go here in the middle */}
         {/* <div>Page Title or Logo</div> */}
         <div></div> {/* Placeholder div */}


         {/* Profile Entry on the right */}
         <div>
          {/* Profile Entry */}
          <div className="relative">
           {/* Placeholder for Profile Image/Icon */}
           <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold">
            {/* Ensure user and user.username exist before accessing */}
            {user && user.username ? user.username.charAt(0).toUpperCase() : 'U'}
           </div>
           {/* Profile dropdown can go here */}
          </div>
         </div>
       </header>

       {/* Page Specific Content Area */}
       <main className="flex-1 p-6 overflow-y-auto"> {/* flex-1 to take remaining space, overflow for scrolling */}
           {/* Render the content of the specific page */}
           {children}
       </main>
    </div>
   </div>
  );
 }

 export default DashboardLayout;