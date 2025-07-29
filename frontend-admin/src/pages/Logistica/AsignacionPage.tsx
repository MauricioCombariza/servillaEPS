// frontend-admin/src/pages/Logistica/AsignacionPage.tsx
import React from 'react';
import AsignacionRutas from '../../features/logistica/AsignacionRutas';

const AsignacionPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Despacho y Asignación de Rutas</h1>
        <p className="mt-1 text-sm text-gray-600">Asigna los paquetes listos a los mensajeros disponibles.</p>
      </header>
      <main>
        <AsignacionRutas />
      </main>
    </div>
  );
};

export default AsignacionPage;