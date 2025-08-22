// frontend-admin/src/features/mensajero/DetalleParada.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getDetallePaquete, marcarPaqueteEntregado, marcarPaqueteFallido } from '../../api/logistica';
import EscanerPaquete from './EscanerPaquete';

const DetalleParada: React.FC = () => {
  const { paqueteId } = useParams<{ paqueteId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isScannerVisible, setScannerVisible] = useState(false);
  const [isPackageVerified, setPackageVerified] = useState(false);

  const numericPaqueteId = Number(paqueteId);

  // Query para obtener los detalles del paquete
  const { data: paquete, isLoading } = useQuery({
    queryKey: ['detallePaquete', numericPaqueteId],
    queryFn: () => getDetallePaquete(numericPaqueteId),
    enabled: !!numericPaqueteId,
  });

  // --- MUTACIONES PARA LAS ACCIONES ---
  const handleMutationSuccess = (action: string) => {
    toast.success(`Paquete marcado como ${action} con éxito.`);
    queryClient.invalidateQueries({ queryKey: ['mi_ruta_activa'] }); // Invalida la lista de rutas
    queryClient.invalidateQueries({ queryKey: ['detallePaquete', numericPaqueteId] }); // Invalida este detalle
    navigate('/app-mensajero'); // Vuelve a la lista
  };

  const entregadoMutation = useMutation({
    mutationFn: marcarPaqueteEntregado,
    onSuccess: () => handleMutationSuccess('entregado'),
    onError: (error: any) => toast.error(`Error: ${error.message}`),
  });

  const fallidoMutation = useMutation({
    mutationFn: marcarPaqueteFallido,
    onSuccess: () => handleMutationSuccess('entrega fallida'),
    onError: (error: any) => toast.error(`Error: ${error.message}`),
  });

  // --- MANEJADORES DE EVENTOS ---
  const handleScanSuccess = (codigoEscaneado: string) => {
    setScannerVisible(false);
    if (codigoEscaneado === String(numericPaqueteId)) {
      toast.success("¡Paquete verificado correctamente!");
      setPackageVerified(true);
    } else {
      toast.error(`Código incorrecto. Se escaneó ${codigoEscaneado} pero se esperaba ${numericPaqueteId}.`);
    }
  };
  
  const handleEntregaFallida = () => {
    const motivo = prompt("Por favor, introduce el motivo de la entrega fallida:", "Cliente ausente");
    if (motivo && motivo.trim() !== "") {
      fallidoMutation.mutate({ paqueteId: numericPaqueteId, motivo });
    }
  };

  if (isLoading) return <p className="text-center text-gray-500">Cargando detalles de la parada...</p>;
  if (!paquete) return <p className="text-center text-gray-600">No se encontraron detalles para este paquete.</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Parada #{paquete.numero_parada}</h2>
      
      {/* Detalles del Cliente */}
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-semibold text-gray-800">Información del Cliente</h3>
        <p><strong>Nombre:</strong> {paquete.pedido.cliente.nombre_completo}</p>
        <p><strong>Documento:</strong> {paquete.pedido.cliente.numero_documento}</p>
        <p><strong>Celular:</strong> <a href={`tel:${paquete.pedido.cliente.celular}`} className="text-ser underline">{paquete.pedido.cliente.celular}</a></p>
        <p><strong>Dirección:</strong> {paquete.pedido.direccion_entrega}</p>
      </div>

      {/* Items del Pedido */}
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-semibold text-gray-800">Contenido del Paquete</h3>
        <ul className="list-disc list-inside">
          {paquete.pedido.items.map(item => (
            <li key={item.id}>{item.cantidad_solicitada}x - {item.nombre_medicamento_solicitado}</li>
          ))}
        </ul>
      </div>

      {/* Escáner y Acciones */}
      <div className="p-4 bg-white rounded-lg shadow">
        {isScannerVisible ? (
          <div className="space-y-2">
            <EscanerPaquete onScanSuccess={handleScanSuccess} />
            <button onClick={() => setScannerVisible(false)} className="w-full text-sm text-gray-600">Cancelar</button>
          </div>
        ) : (
          <button 
            onClick={() => setScannerVisible(true)}
            disabled={isPackageVerified} 
            className="w-full px-4 py-3 font-bold text-white rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isPackageVerified ? 'Paquete Verificado ✔' : 'Verificar Paquete (Escanear)'}
          </button>
        )}

        {isPackageVerified && (
          <div className="mt-4 pt-4 border-t space-y-3 animate-fade-in">
            <button 
              onClick={() => entregadoMutation.mutate(numericPaqueteId)}
              disabled={entregadoMutation.isPending || fallidoMutation.isPending}
              className="w-full px-4 py-3 font-bold text-white rounded-md bg-ser disabled:bg-gray-400"
            >
              {entregadoMutation.isPending ? 'Guardando...' : 'Marcar como Entregado'}
            </button>
            <button 
              onClick={handleEntregaFallida}
              disabled={entregadoMutation.isPending || fallidoMutation.isPending}
              className="w-full px-4 py-3 font-bold text-white rounded-md bg-red-500 disabled:bg-gray-400"
            >
              {fallidoMutation.isPending ? 'Guardando...' : 'Marcar como Entrega Fallida'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalleParada;