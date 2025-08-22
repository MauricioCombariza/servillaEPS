// frontend-admin/src/features/logistica/RutasActivas.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRutasActivas } from '../../api/logistica';
import { Link } from 'react-router-dom';

const RutasActivas: React.FC = () => {
  const { data: rutas, isLoading } = useQuery({
    queryKey: ['rutasActivas'],
    queryFn: getRutasActivas,
    refetchInterval: 10000, // Opcional: refresca los datos cada 10 segundos
  });

  if (isLoading) return <p>Cargando rutas activas...</p>;

   return (
    <div className="space-y-4">
      {rutas && rutas.length > 0 ? (
        rutas.map(ruta => (
          // Envolvemos la tarjeta en un Link
          <Link key={ruta.id} to={`/logistica/rutas_activas/${ruta.id}`}>
            <div className="p-4 bg-white rounded-lg shadow hover:bg-lightser">
              <h3 className="font-bold">Ruta #{ruta.id} - {ruta.agente_entrega.nombre_agente}</h3>
              <p className="text-sm text-gray-500">Estado: <span className="font-semibold text-blue-600">{ruta.estado}</span></p>
              <p className="text-sm">Paquetes: {ruta.paquetes.length}</p>
            </div>
          </Link>
        ))
      ) : ( <p>No hay rutas activas</p> )}
    </div>
  );
};

export default RutasActivas;