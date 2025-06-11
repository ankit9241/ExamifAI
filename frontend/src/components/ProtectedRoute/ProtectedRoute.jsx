import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../../services/api';

const ProtectedRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    let timeoutId;
    const checkAuth = async () => {
      try {
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const response = await authService.verifyToken();
        if (!response) {
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        if (!userInfo) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Check if token is about to expire (within 1 hour)
        const tokenExpiry = userInfo.tokenExpiry;
        if (tokenExpiry) {
          const expiryDate = new Date(tokenExpiry);
          const now = new Date();
          const timeLeft = expiryDate.getTime() - now.getTime();
          
          // If token will expire in less than 1 hour, show warning
          if (timeLeft < 3600000) {
            console.warn('Token will expire soon:', Math.floor(timeLeft / 60000), 'minutes remaining');
          }
        }

        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce implementation
    const debouncedCheckAuth = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkAuth, 1000); // 1 second delay
    };

    debouncedCheckAuth();
    
    // Cleanup function to cancel pending timeout
    return () => {
      clearTimeout(timeoutId);
    };
  }, [location]); // Re-check auth when location changes, with debounce

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

 