import React from 'react';
import PanelConciliacion from '../../features/cierre/PanelConciliacion';

const ConciliacionPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Conciliación de Rutas</h1>
        <p className="mt-1 text-sm text-gray-600">Revisa las rutas finalizadas y concilia los valores recaudados.</p>
      </header>
      <main>
        <PanelConciliacion />
      </main>
    </div>
  );
};

export default ConciliacionPage;