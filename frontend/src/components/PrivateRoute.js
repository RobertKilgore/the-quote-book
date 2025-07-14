// src/components/PrivateRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import useAppContext from "../context/useAppContext";

function PrivateRoute({ loading, children }) {
  const { user, setUser, setError, setSuccess } = useAppContext();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
}

export default PrivateRoute;
