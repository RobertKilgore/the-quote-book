import React from 'react';
import { Navigate } from 'react-router-dom';

function RequireAdminRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isSuperuser) {
    return <div className="text-center text-red-600 mt-6">❌ Access Denied. Admins only.</div>;
  }

  return children;
}

export default RequireAdminRoute;
