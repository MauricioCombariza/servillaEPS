// frontend-admin/src/features/cierre/PanelConciliacion.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRutasFinalizadas } from '../../api/logistica';
import type { HojaDeRutaRead } from '../../api/logistica';

// Un componente para mostrar el detalle de una ruta
const DetalleRutaConciliacion: React.FC<{ ruta: HojaDeRutaRead }> = ({ ruta }) => {
  // En una app real, aquí haríamos otra llamada a la API para obtener el resumen
  // Por ahora, lo simulamos
  const paquetesEntregados = ruta.paquetes.filter(p => p.estado_entrega === 'entregado').length;
  const paquetesNoEntregados = ruta.paquetes.length - paquetesEntregados;
  const valorEsperado = paquetesEntregados * 5.00; // Asumiendo copago de 5.00

  return (
    <div className="p-4 mt-4 border rounded-lg bg-gray-50">
      <h4 className="font-bold text-ser">Resumen de Ruta #{ruta.id}</h4>
      <p><strong>Mensajero:</strong> {ruta.agente_entrega.nombre_agente}</p>
      <div className="mt-2 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium">Paquetes Entregados:</p>
          <p className="text-2xl font-bold">{paquetesEntregados}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Paquetes No Entregados:</p>
          <p className="text-2xl font-bold">{paquetesNoEntregados}</p>
        </div>
        <div className="col-span-2">
          <p className="text-sm font-medium">Valor Esperado a Recaudar:</p>
          <p className="text-2xl font-bold text-green-600">${valorEsperado.toFixed(2)}</p>
        </div>
      </div>
       {/* Aquí iría la lógica para registrar los pagos */}
    </div>
  )
}

const PanelConciliacion: React.FC = () => {
  const [selectedRutaId, setSelectedRutaId] = useState<number | null>(null);

  const { data: rutas, isLoading } = useQuery({
    queryKey: ['rutasFinalizadas'],
    queryFn: getRutasFinalizadas,
  });

  const selectedRuta = rutas?.find(r => r.id === selectedRutaId);

  if (isLoading) return <p>Cargando rutas para conciliar...</p>;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Columna de la lista de rutas */}
      <div className="md:col-span-1">
        <h3 className="text-lg font-medium">Rutas Finalizadas</h3>
        <ul className="mt-2 space-y-2">
          {rutas && rutas.length > 0 ? (
            rutas.map(ruta => (
              <li key={ruta.id}>
                <button
                  onClick={() => setSelectedRutaId(ruta.id)}
                  className={`w-full p-3 text-left border rounded-md ${selectedRutaId === ruta.id ? 'bg-lightser border-ser' : 'bg-white hover:bg-gray-50'}`}
                >
                  <p className="font-semibold">Ruta #{ruta.id}</p>
                  <p className="text-sm text-gray-600">{ruta.agente_entrega.nombre_agente}</p>
                </button>
              </li>
            ))
          ) : (
            <p className="text-sm text-gray-500">No hay rutas pendientes de conciliación.</p>
          )}
        </ul>
      </div>

      {/* Columna del detalle */}
      <div className="md:col-span-2">
        {selectedRuta ? (
          <DetalleRutaConciliacion ruta={selectedRuta} />
        ) : (
          <div className="flex items-center justify-center h-full p-8 border-2 border-dashed rounded-lg border-whiteser">
            <p className="text-gray-500">Selecciona una ruta para ver su resumen.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelConciliacion;