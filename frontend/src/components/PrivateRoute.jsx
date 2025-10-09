import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function PrivateRoute({ roles = [], children }) {
  const { token, rol } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (roles.length && !roles.includes(rol)) return <Navigate to="/" replace />;
  return children;
}
