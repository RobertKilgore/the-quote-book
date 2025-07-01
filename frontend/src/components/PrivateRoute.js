// src/components/PrivateRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

function PrivateRoute({ user, loading, children }) {
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
}

export default PrivateRoute;
