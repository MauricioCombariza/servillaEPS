// frontend-admin/src/components/layout/MobileLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';

// Importaremos los componentes Header y Footer que crearemos a continuación
import MobileHeader from './MobileHeader';
import MobileFooter from './MobileFooter';

const MobileLayout: React.FC = () => {
  return (
    // Usamos un layout de flexbox vertical que ocupa toda la pantalla
    <div className="flex flex-col h-screen bg-gray-100">
      
      {/* 1. Cabecera Fija en la Parte Superior */}
      <MobileHeader />
      
      {/* 2. Área de Contenido Principal */}
      {/*    'flex-grow' hace que ocupe todo el espacio disponible. */}
      {/*    'overflow-y-auto' permite hacer scroll si el contenido es muy largo. */}
      <main className="flex-grow overflow-y-auto">
        <div className="p-4">
          {/* <Outlet /> renderizará el componente de la página actual */}
          {/* (ej. PaginaRutaMensajero, PaginaEscaner, etc.) */}
          <Outlet />
        </div>
      </main>
      
      {/* 3. Pie de Página / Barra de Navegación Fija en la Parte Inferior */}
      <MobileFooter />

    </div>
  );
};

export default MobileLayout;