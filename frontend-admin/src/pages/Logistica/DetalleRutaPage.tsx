import React from 'react';
import { Link } from 'react-router-dom';
import DetalleRuta from '../../features/logistica/DetalleRuta';

const DetalleRutaPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <Link to="/logistica/rutas_activas" className="text-sm text-ser hover:underline">
        &larr; Volver a Rutas Activas
      </Link>
      <main>
        <DetalleRuta />
      </main>
    </div>
  );
};

export default DetalleRutaPage;