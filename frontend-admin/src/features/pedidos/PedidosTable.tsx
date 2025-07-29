// frontend-admin/src/features/pedidos/PedidosTable.tsx
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Importamos las funciones y tipos de nuestra capa de API
import { getPedidosEnValidacion, aprobarPedido } from '../../api/pedidos';
import type { PedidoRead } from '../../api/pedidos';

// Importamos el componente de UI de la tabla y su tipo de columna
import { Table } from '../../components/ui/Table';
import type { TableColumn } from '../../components/ui/Table';

const PedidosTable: React.FC = () => {
  const queryClient = useQueryClient();

  // 1. OBTENCIÓN DE DATOS con React Query
  const { 
    data: pedidos, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['pedidosEnValidacion'],
    queryFn: getPedidosEnValidacion,
  });

  // 2. MANEJO DE ACCIONES con React Query
  const aprobarPedidoMutation = useMutation({
    mutationFn: aprobarPedido,
    onSuccess: (data) => {
      toast.success(`Pedido #${data.id} aprobado con éxito.`);
      queryClient.invalidateQueries({ queryKey: ['pedidosEnValidacion'] });
    },
    onError: (error) => {
      toast.error(`Error al aprobar el pedido: ${error.message}`);
    }
  });

  // 3. RENDERIZADO CONDICIONAL para el estado de error
  if (isError) {
    return <div className="p-4 text-red-700 bg-red-100 rounded-md">Error al cargar los pedidos: {error.message}</div>;
  }

  // 4. DEFINICIÓN DE COLUMNAS DE LA TABLA (con la nueva columna 'Zona')
  const columns: TableColumn<PedidoRead>[] = [
    { 
      accessor: 'id', 
      header: 'ID' 
    },
    { 
      accessor: 'cliente', 
      header: 'Cliente', 
      render: (p: PedidoRead) => p.cliente.nombre_completo 
    },
    { 
      accessor: 'zona', 
      header: 'Zona',
      render: (pedido: PedidoRead) => (
        <span className="px-2 py-1 text-xs font-semibold text-gray-700 uppercase bg-whiteser rounded-full">
          {pedido.zona || 'N/A'}
        </span>
      )
    },
    { 
      accessor: 'fecha_creacion', 
      header: 'Fecha', 
      render: (p: PedidoRead) => format(new Date(p.fecha_creacion), 'dd/MM/yyyy HH:mm') 
    },
    { 
      accessor: 'estado', 
      header: 'Estado', 
      render: (p: PedidoRead) => (
        <span className="px-2 py-1 text-xs font-semibold text-white bg-orange-500 rounded-full">
            {p.estado.replace('_', ' ').toUpperCase()}
        </span>
      ) 
    },
    {
      accessor: 'acciones',
      header: 'Acciones',
      render: (pedido: PedidoRead) => (
        <button
          onClick={() => aprobarPedidoMutation.mutate(pedido.id)}
          disabled={aprobarPedidoMutation.isPending && aprobarPedidoMutation.variables === pedido.id}
          className="px-3 py-1 text-sm font-medium text-white transition-colors duration-150 rounded-md bg-ser hover:bg-darkser focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ser disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {aprobarPedidoMutation.isPending && aprobarPedidoMutation.variables === pedido.id 
            ? 'Aprobando...' 
            : 'Aprobar'}
        </button>
      )
    }
  ];

  // 5. RENDERIZADO FINAL del componente
  return <Table columns={columns} data={pedidos || []} isLoading={isLoading} />;
};

export default PedidosTable;