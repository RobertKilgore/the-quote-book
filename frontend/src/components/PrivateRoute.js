// src/components/PrivateRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function PrivateRoute({ children }) {
  const { user, loading } = useUser();
    if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-600 text-lg">Loading...</div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
}

export default PrivateRoute;
