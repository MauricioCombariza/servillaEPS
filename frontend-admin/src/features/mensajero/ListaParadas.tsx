// frontend-admin/src/features/mensajero/ListaParadas.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMiRutaActiva } from '../../api/logistica';
import type { PaqueteRead } from '../../api/pedidos';

// Componente para una sola tarjeta de parada
const TarjetaParada: React.FC<{ paquete: PaqueteRead }> = ({ paquete }) => {
  // Determinamos el estilo de la tarjeta basado en el estado del paquete
  let statusColorClass = 'bg-gray-400'; // Pendiente (asignado_a_ruta)
  if (paquete.estado_entrega === 'entregado') statusColorClass = 'bg-green-500';
  if (paquete.estado_entrega === 'no_entregado') statusColorClass = 'bg-red-500';

  return (
    <Link 
      to={`/app-mensajero/parada/${paquete.id}`}
      className="block p-3 bg-white rounded-lg shadow hover:bg-lightser transition-colors duration-150"
    >
      <div className="flex items-center">
        {/* Indicador de Estado */}
        <div className={`w-3 h-16 rounded-l-lg mr-3 ${statusColorClass}`}></div>
        
        {/* Número de Parada */}
        <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-xl font-bold text-white rounded-full bg-ser">
          {paquete.numero_parada}
        </div>
        
        {/* Información de la Parada */}
        <div className="ml-4 flex-grow min-w-0">
          <p className="font-bold text-gray-800 truncate">{paquete.pedido.cliente.nombre_completo}</p>
          <p className="text-sm text-gray-600 truncate">{paquete.pedido.direccion_entrega}</p>
          <p className="text-xs font-mono text-gray-500 mt-1">Paquete ID: {paquete.id}</p>
        </div>
        
        {/* Icono de flecha */}
        <div className="ml-2 flex-shrink-0">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
};

// Componente principal que obtiene y muestra la lista
const ListaParadas: React.FC = () => {
  // Usamos useQuery para obtener la ruta activa del mensajero autenticado
  const { data: ruta, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['mi_ruta_activa'],
    queryFn: getMiRutaActiva,
  });

  if (isLoading) {
    return <p className="text-center text-gray-500">Cargando tu ruta...</p>;
  }

  if (isError) {
    // Si el error es 404, significa que no hay ruta asignada.
    if ((error as any)?.response?.status === 404) {
      return (
        <div className="p-6 text-center bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold text-darkser">¡Todo listo por hoy!</h2>
          <p className="mt-2 text-gray-600">No tienes ninguna ruta activa asignada en este momento.</p>
          <button onClick={() => refetch()} className="mt-4 px-4 py-2 text-sm font-medium text-white rounded-md bg-ser hover:bg-darkser">
            Volver a buscar ruta
          </button>
        </div>
      );
    }
    // Para otros errores
    return <p className="p-4 text-red-700 bg-red-100 rounded-md">Error al cargar la ruta: {error.message}</p>;
  }

  const paquetes = ruta?.paquetes || [];

  return (
    <div className="space-y-3">
      {paquetes.length > 0 ? (
        paquetes.map(paquete => (
          <TarjetaParada key={paquete.id} paquete={paquete} />
        ))
      ) : (
        <div className="p-6 text-center bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold text-ser">¡Ruta completada!</h2>
          <p className="mt-2 text-gray-600">Has gestionado todos los paquetes de tu ruta.</p>
        </div>
      )}
    </div>
  );
};

export default ListaParadas;