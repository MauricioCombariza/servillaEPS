// frontend-admin/src/pages/Logistica/RecepcionPage.tsx
import React from 'react';
import RecepcionLoteForm from '../../features/logistica/RecepcionLoteForm';
import LotesRecientesTable from '../../features/logistica/LotesRecientesTable'; // 1. Importar la nueva tabla

const RecepcionPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Recepción de Mercancía</h1>
        <p className="mt-1 text-sm text-gray-600">
          Registra los lotes de medicamentos que llegan del dispensario.
        </p>
      </header>
      
      <main className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* El formulario ocupará una columna */}
        <div className="lg:col-span-1">
          <RecepcionLoteForm />
        </div>
        
        {/* La tabla de lotes recientes ocupará dos columnas */}
        <div className="lg:col-span-2">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="mb-4 text-lg font-medium">Lotes Registrados Recientemente</h3>
            {/* 2. Renderizar la tabla aquí */}
            <LotesRecientesTable />
          </div>
        </div>
      </main>
    </div>
  );
};

export default RecepcionPage;