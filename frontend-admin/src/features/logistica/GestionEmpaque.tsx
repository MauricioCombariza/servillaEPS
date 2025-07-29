// frontend-admin/src/features/logistica/GestionEmpaque.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSiguientePedidoParaEmpacar, finalizarEmpaque } from '../../api/logistica';
import type { ItemPedidoRead } from '../../api/pedidos';

const GestionEmpaque: React.FC = () => {
  const queryClient = useQueryClient();
  // Estado local para llevar la cuenta de los items verificados (escaneados)
  const [verifiedItems, setVerifiedItems] = useState<Set<number>>(new Set());

  // Query para obtener la tarea de empaque actual
  const { data: tarea, isLoading, isError, error } = useQuery({
    queryKey: ['siguientePedidoParaEmpacar'],
    queryFn: getSiguientePedidoParaEmpacar,
    refetchOnWindowFocus: false,
  });
  
  const pedidoActual = tarea?.siguiente_pedido;

  // Efecto para limpiar los items verificados si cambia el pedido
  useEffect(() => {
    setVerifiedItems(new Set());
  }, [pedidoActual]);

  // Mutación para finalizar el empaque
  const finalizarEmpaqueMutation = useMutation({
    mutationFn: finalizarEmpaque,
    onSuccess: () => {
      alert("¡Paquete finalizado y listo para despacho!");
      // Invalidamos la query para que busque automáticamente el siguiente pedido
      queryClient.invalidateQueries({ queryKey: ['siguientePedidoParaEmpacar'] });
    },
    onError: (error) => {
      alert(`Error al finalizar el empaque: ${error.message}`);
    }
  });

  const handleItemVerification = (itemId: number) => {
    setVerifiedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId); // Desmarcar
      } else {
        newSet.add(itemId); // Marcar
      }
      return newSet;
    });
  };

  if (isLoading) return <p className="text-center text-gray-500">Buscando pedidos para empacar...</p>;
  if (isError) return <p className="p-4 text-red-700 bg-red-100 rounded-md">Error: {error.message}</p>;

  if (!pedidoActual) {
    return (
      <div className="p-8 text-center bg-green-100 border-2 border-green-300 rounded-lg">
        <h3 className="text-2xl font-bold text-ser">¡Todo empacado!</h3>
        <p className="mt-2 text-gray-700">No hay más pedidos en la cola de empaque.</p>
      </div>
    );
  }

  const allItemsVerified = verifiedItems.size === pedidoActual.items.length;

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-xl font-bold">Empacar Pedido #{pedidoActual.id}</h2>
      <p className="text-sm text-gray-500">Cliente: {pedidoActual.cliente.nombre_completo}</p>
      
      <div className="mt-6">
        <h3 className="font-semibold">Verificar Items (simulación de escaneo):</h3>
        <ul className="mt-2 space-y-2">
          {pedidoActual.items.map((item: ItemPedidoRead) => (
            <li key={item.id} className="flex items-center p-3 border rounded-md">
              <input
                type="checkbox"
                id={`item-${item.id}`}
                checked={verifiedItems.has(item.id)}
                onChange={() => handleItemVerification(item.id)}
                className="w-5 h-5 rounded text-ser focus:ring-ser"
              />
              <label htmlFor={`item-${item.id}`} className="ml-3">
                <span className="font-bold">{item.cantidad_solicitada}x</span> {item.nombre_medicamento_solicitado}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-6 mt-6 border-t">
        <button
          onClick={() => finalizarEmpaqueMutation.mutate(pedidoActual.id)}
          disabled={!allItemsVerified || finalizarEmpaqueMutation.isPending}
          className="w-full px-4 py-3 font-bold text-white transition-colors duration-150 rounded-md bg-ser hover:bg-darkser focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ser disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {finalizarEmpaqueMutation.isPending ? 'Finalizando...' : 'Finalizar Empaque y Crear Paquete'}
        </button>
        {!allItemsVerified && <p className="mt-2 text-xs text-center text-red-600">Debes verificar todos los items para poder finalizar.</p>}
      </div>
    </div>
  );
};

export default GestionEmpaque;