import React from 'react';
import RutasActivas from '../../features/logistica/RutasActivas';

const RutasActivasPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Monitor de Rutas Activas</h1>
        <p className="mt-1 text-sm text-gray-600">Supervisa en tiempo real las rutas que están en la calle.</p>
      </header>
      <main>
        <RutasActivas />
      </main>
    </div>
  );
};

export default RutasActivasPage;