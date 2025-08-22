// frontend-admin/src/pages/Mensajero/PaginaRutaMensajero.tsx
import React from 'react';
import ListaParadas from '../../features/mensajero/ListaParadas';
import { useAuth } from '../../hooks/useAuth';

const PaginaRutaMensajero: React.FC = () => {
  const { user } = useAuth();

  // Extraemos el nombre del email para un saludo más amigable
  const userName = user?.sub?.split('@')[0] || 'Mensajero';
  const capitalizedUserName = userName.charAt(0).toUpperCase() + userName.slice(1);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Mi Ruta Activa</h1>
        <p className="text-gray-600">Bienvenido, {capitalizedUserName}</p>
      </header>
      <main>
        {/* Renderizamos el componente que hace todo el trabajo */}
        <ListaParadas />
      </main>
    </div>
  );
};

export default PaginaRutaMensajero;