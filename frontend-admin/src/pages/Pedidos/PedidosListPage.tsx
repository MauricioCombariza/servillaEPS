// frontend-admin/src/pages/Pedidos/PedidosListPage.tsx
import React from 'react';

// Importamos nuestro componente "inteligente" que contiene toda la lógica.
import PedidosTable from '../../features/pedidos/PedidosTable';

const PedidosListPage: React.FC = () => {
  return (
    // Usamos clases de Tailwind para dar espaciado y estructura.
    <div className="space-y-6">
      
      <header>
        <h1 className="text-3xl font-bold text-gray-900">
          Pedidos en Validación
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Lista de pedidos que requieren revisión y aprobación por parte de un operador.
        </p>
      </header>
      
      <main className="p-4 bg-white rounded-lg shadow">
        {/* Aquí renderizamos el componente que hace todo el trabajo pesado. */}
        <PedidosTable />
      </main>

    </div>
  );
};

export default PedidosListPage;