// frontend-admin/src/routes/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute: React.FC = () => {
  // Verificamos si existe un token en el localStorage.
  // Esta es una forma simple de comprobar la autenticación en el lado del cliente.
  const token = localStorage.getItem('accessToken');

  // Si no hay token, redirigimos al usuario a la página de login.
  // El prop `replace` evita que el usuario pueda volver a la página protegida
  // usando el botón "atrás" del navegador.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si hay un token, renderizamos el contenido de la ruta hija.
  // <Outlet /> es un componente de react-router-dom que renderiza
  // la ruta anidada correspondiente.
  return <Outlet />;
};

export default ProtectedRoute;