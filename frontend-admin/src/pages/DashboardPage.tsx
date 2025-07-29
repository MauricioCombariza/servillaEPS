// frontend-admin/src/pages/DashboardPage.tsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button 
          onClick={logout} 
          className="px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
        >
          Cerrar Sesión
        </button>
      </div>
      
      {user ? (
        <div className="p-4 mt-6 bg-green-100 border-l-4 border-green-500">
          <p className="font-bold text-green-800">¡Bienvenido!</p>
          <p className="text-green-700">Email: {user.sub}</p>
          <p className="text-green-700">Rol: {user.rol}</p>
        </div>
      ) : (
        <p>Cargando datos del usuario...</p>
      )}
    </div>
  );
};

export default DashboardPage;