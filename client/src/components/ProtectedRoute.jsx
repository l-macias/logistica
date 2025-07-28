import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // Si todavía estamos cargando la info de auth, no renderizamos nada aún
  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si no está autenticado, lo mandamos al login.
  // El 'replace' evita que pueda volver atrás en el historial del navegador.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
