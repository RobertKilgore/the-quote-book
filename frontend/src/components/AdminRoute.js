import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";

function AdminRoute({ children }) {
  const { user, loading } = useUser();
  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isSuperuser) {
    return <div className="text-center text-red-600 mt-6"> Access Denied. Admins only.</div>;
  }

  return children;
}

export default AdminRoute;
