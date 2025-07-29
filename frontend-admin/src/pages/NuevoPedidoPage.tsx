// frontend-admin/src/pages/NuevoPedidoPage.tsx
import React from 'react';
import NuevoPedidoForm from '../features/pedidos/NuevoPedidoForm'; // Crearemos este componente

const NuevoPedidoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-lightser py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-darkser">Crear Nuevo Pedido</h1>
          <p className="mt-2 text-lg text-gray-600">Completa el formulario para enviar tu receta.</p>
        </header>
        <main className="mt-8">
          <NuevoPedidoForm />
        </main>
      </div>
    </div>
  );
};

export default NuevoPedidoPage;