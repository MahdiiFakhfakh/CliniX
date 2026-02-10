import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
