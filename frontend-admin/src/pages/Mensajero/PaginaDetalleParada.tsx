// frontend-admin/src/pages/Mensajero/PaginaDetalleParada.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import DetalleParada from '../../features/mensajero/DetalleParada';

const PaginaDetalleParada: React.FC = () => {
  return (
    <div className="space-y-4">
      <Link to="/app-mensajero" className="inline-block px-4 py-2 text-sm text-white rounded-md bg-ser hover:bg-darkser">
        &larr; Volver a Mi Ruta
      </Link>
      <main>
        <DetalleParada />
      </main>
    </div>
  );
};

export default PaginaDetalleParada;