// frontend-admin/src/features/logistica/DetalleRuta.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getDetalleHojaDeRuta } from '../../api/logistica';
import type { PaqueteRead } from '../../api/pedidos';

const PaqueteCard: React.FC<{ paquete: PaqueteRead }> = ({ paquete }) => (
  <div className="p-3 border rounded-md bg-gray-50">
    <p className="font-bold">Parada #{paquete.numero_parada} - Paquete #{paquete.id}</p>
    <p><strong>Cliente:</strong> {paquete.pedido.cliente.nombre_completo}</p>
    <p><strong>Dirección:</strong> {paquete.pedido.direccion_entrega}</p>
    <p><strong>Estado:</strong> <span className="font-semibold">{paquete.estado_entrega.replace('_', ' ')}</span></p>
  </div>
);

const DetalleRuta: React.FC = () => {
  const { rutaId } = useParams<{ rutaId: string }>();
  const numericRutaId = Number(rutaId);

  const { data: ruta, isLoading } = useQuery({
    queryKey: ['detalleRuta', numericRutaId],
    queryFn: () => getDetalleHojaDeRuta(numericRutaId),
    enabled: !!numericRutaId,
  });

  if (isLoading) return <p>Cargando detalles de la ruta...</p>;
  if (!ruta) return <p>No se encontró la ruta.</p>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">Detalle de Ruta #{ruta.id}</h2>
      <p><strong>Mensajero:</strong> {ruta.agente_entrega.nombre_agente}</p>
      <p><strong>Estado:</strong> {ruta.estado}</p>
      <h3 className="mt-6 font-semibold">Paquetes en esta Ruta:</h3>
      <div className="mt-2 space-y-3">
        {ruta.paquetes.map(p => <PaqueteCard key={p.id} paquete={p} />)}
      </div>
    </div>
  );
};

export default DetalleRuta;