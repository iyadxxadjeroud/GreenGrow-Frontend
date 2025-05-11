import React from 'react';
 import Link from 'next/link';

 function Home() {
  return (
   <div className="min-h-screen bg-gray-100 flex flex-col">
    {/* Navigation Bar (Top - Extreme Left Logo) */}
    <nav className="bg-white shadow-md py-4">
     <div className="container mx-auto flex justify-between items-center">
      <div className="text-2xl font-bold text-gray-900">🌱 GreenGrow</div>
      <div className="space-x-4">
       <Link href="/login" className="px-4 py-2 text-green-600 border border-green-600 rounded hover:bg-green-600 hover:text-white">
        Login
       </Link>
       <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75">
        Start with us
       </button>
      </div>
     </div>
    </nav>

    {/* Main Content (Full Page with Background Gradient and Left-Aligned Text) */}
    <main className="flex-grow bg-gradient-to-r from-green-400 to-blue-500 flex flex-col items-start p-8 sm:p-20">
     <div className="max-w-2xl">
      {/* Title (Top Left, Below Navbar) */}
      <h1 className="text-4xl font-bold text-white mb-38">🌱 GreenGrow – The Future of Autonomous Farming</h1>

      {/* Description (Left, More Spacing, Moved Down) */}
      <p className="text-xl text-white mb-12 leading-relaxed">
       At GreenGrow, we are transforming agriculture with intelligent, energy-autonomous vertical greenhouses tailored for isolated and resource-scarce regions.
       Our fully automated, humanless system leverages advanced monitoring and smart control to manage every aspect of crop production — from environmental conditions to resource usage — without the need for constant human intervention.
       Accessible, scalable, and sustainable, GreenGrow empowers a new era of agriculture driven by innovation and efficiency.
      </p>

      {/* Start with us Button (After Description, Left) */}
      <button className="bg-white text-blue-500 font-bold py-3 px-6 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75">
       Start with us
      </button>
     </div>
    </main>

    {/* Footer (Bottom) */}
    <footer className="bg-gray-200 py-4 text-center text-gray-500">
     <p>&copy; 2025 GreenGrow</p>
    </footer>
   </div>
  );
 }

 export default Home;