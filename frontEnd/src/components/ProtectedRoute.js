
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

function ProtectedRoute({ children }) {
    const [isLoading, setIsLoading] = useState(true); // To handle loading state
    const [isValidToken, setIsValidToken] = useState(null); // To track token validity
    const token = sessionStorage.getItem('token');
  
    useEffect(() => {
      const verifyToken = async () => {
        if (!token) {
          setIsLoading(false);
          setIsValidToken(false);
          return;
        }
  
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}:3000/api/verify-token`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
  
          console.log('Response:', response.data);
          setIsValidToken(true); // Token is valid
        } catch (error) {
          console.error('Error:', error);
          sessionStorage.removeItem('token'); // Remove invalid token
          setIsValidToken(false); // Token is invalid
        } finally {
          setIsLoading(false); // End loading state
        }
      };
  
      verifyToken();
    }, [token]); // Run this effect when the token changes
  
    if (isLoading) {
      return <div>Loading...</div>; // Show a loading state while verifying
    }
  
    if (!isValidToken) {
      return <Navigate to="/" />; // Redirect to login if token is invalid or not present
    }
  
    return children; // Render the protected children if the token is valid
  }

export default ProtectedRoute;
