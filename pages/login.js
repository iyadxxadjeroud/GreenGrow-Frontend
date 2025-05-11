import React, { useState } from 'react';
 import Link from 'next/link';
 import { useRouter } from 'next/router'; // Import the useRouter hook
 import axios from 'axios'; // Import axios for making API requests

 function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter(); // Initialize the useRouter hook

  const handleSubmit = async (event) => {
   event.preventDefault();
   setError(''); // Clear any previous errors

   try {
    const response = await axios.post('http://localhost:8000/api/token/', {
     username,
     password,
    });

    const { access, refresh } = response.data;

    // Store tokens (you might want to use a more secure method like cookies in production)
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    // Decode the access token to get user roles (you might need a library like 'jwt-decode')
    const decodedToken = JSON.parse(atob(access.split('.')[1])); // Basic decoding - consider a library
    const userRole = decodedToken.role; // Assuming your token has a 'role' claim

    if (userRole === 'ADMIN') {
     window.location.href = 'http://127.0.0.1:8000/admin/'; // Redirect to Django admin (full page reload)
    } else {
     router.push('/dashboard'); // Redirect to the dashboard (client-side navigation)
    }
   } catch (error) {
    setError('Invalid username or password');
    console.error('Login error:', error);
   }
  };

  return (
   <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
    <div className="relative py-3 sm:max-w-md sm:mx-auto">
     <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 shadow-lg transform -skew-y-6 sm:skew-x-6 sm:-rotate-6 sm:rounded-3xl"></div>
     <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
      <h1 className="text-center text-2xl font-bold text-gray-900 mb-8">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
       <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
         Username
        </label>
        <input
         id="username"
         type="text"
         className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
         value={username}
         onChange={(e) => setUsername(e.target.value)}
         required
        />
       </div>

       <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
         Password
        </label>
        <input
         id="password"
         type="password"
         className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
         value={password}
         onChange={(e) => setPassword(e.target.value)}
         required
        />
       </div>

       <div>
        <button
         type="submit"
         className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
         Sign in
        </button>
       </div>

       {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
       <Link href="/" className="text-blue-500 hover:underline">
        Back to Home
       </Link>
      </p>
     </div>
    </div>
   </div>
  );
 }

 export default Login;