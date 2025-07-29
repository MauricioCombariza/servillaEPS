// frontend-admin/src/pages/Logistica/AlistamientoPage.tsx
import React from 'react';
import GuiaAlistamiento from '../../features/logistica/GuiaAlistamiento';

const AlistamientoPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Guía de Alistamiento (Picking)</h1>
        <p className="mt-1 text-sm text-gray-600">
          Sigue las instrucciones para recoger los medicamentos de los pedidos en la ola actual.
        </p>
      </header>
      <main>
        <GuiaAlistamiento />
      </main>
    </div>
  );
};

export default AlistamientoPage;