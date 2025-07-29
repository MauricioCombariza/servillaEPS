// frontend-admin/src/pages/Logistica/EmpaquePage.tsx
import React from 'react';
import GestionEmpaque from '../../features/logistica/GestionEmpaque';

const EmpaquePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Empaque y Verificación</h1>
        <p className="mt-1 text-sm text-gray-600">
          Verifica los items de cada pedido y finaliza el empaque para crear el paquete de envío.
        </p>
      </header>
      <main>
        <GestionEmpaque />
      </main>
    </div>
  );
};

export default EmpaquePage;