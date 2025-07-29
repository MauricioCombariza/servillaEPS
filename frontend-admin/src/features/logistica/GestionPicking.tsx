// frontend-admin/src/features/logistica/GestionPicking.tsx
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getResumenPedidosAprobados, crearOlaPicking } from '../../api/logistica';
import toast from 'react-hot-toast';

const GestionPicking: React.FC = () => {
  const queryClient = useQueryClient();

  // Query para obtener el resumen de pedidos
  const { data: resumen, isLoading } = useQuery({
    queryKey: ['resumenPedidosAprobados'],
    queryFn: getResumenPedidosAprobados,
  });

  // Mutación para crear la ola
  
  const crearOlaMutation = useMutation({
  mutationFn: crearOlaPicking,
  onSuccess: (data) => {
    // 2. Reemplazar alert() con toast.success()
    toast.success(`¡Ola de picking #${data.id_ola} creada con éxito!`); 
    queryClient.invalidateQueries({ queryKey: ['resumenPedidosAprobados'] });
  },
  onError: (error) => {
    // 3. Reemplazar alert() con toast.error()
    toast.error(`Error al crear la ola: ${error.message}`);
  }
});

  const totalPedidos = resumen?.total_pedidos_aprobados || 0;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">Gestión de Olas de Picking</h2>
      <p className="mt-2 text-gray-600">
        Agrupa los pedidos aprobados en una "ola" para iniciar el proceso de alistamiento en bodega.
      </p>

      <div className="p-4 mt-6 border-2 border-dashed rounded-lg border-whiteser">
        {isLoading ? (
          <p>Cargando resumen...</p>
        ) : (
          <div className="text-center">
            <p className="text-6xl font-bold text-ser">{totalPedidos}</p>
            <p className="mt-2 font-medium text-gray-700">Pedidos listos para alistar</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={() => crearOlaMutation.mutate()}
          disabled={totalPedidos === 0 || crearOlaMutation.isPending}
          className="w-full px-4 py-3 font-bold text-white transition-colors duration-150 rounded-md bg-ser hover:bg-darkser focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ser disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {crearOlaMutation.isPending ? 'Creando Ola...' : 'Crear Nueva Ola de Picking'}
        </button>
      </div>
    </div>
  );
};

export default GestionPicking;