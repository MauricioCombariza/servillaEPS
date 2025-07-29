// frontend-admin/src/features/logistica/LotesRecientesTable.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

// Importamos la función de la API y los tipos
import { getLotesRecientes } from '../../api/logistica';
import type { LoteMedicamentoRead } from '../../api/logistica';

// Importamos el componente de tabla y su tipo
import { Table } from '../../components/ui/Table';
import type { TableColumn } from '../../components/ui/Table';

const LotesRecientesTable: React.FC = () => {
  // Usamos useQuery para obtener los lotes. La clave 'lotesRecientes' es
  // la misma que invalidamos en el formulario, lo que asegura la sincronización.
  const { data: lotes, isLoading, isError, error } = useQuery({
    queryKey: ['lotesRecientes'],
    queryFn: getLotesRecientes,
  });

  // Manejamos el estado de error
  if (isError) {
    return <div className="p-4 text-sm text-red-700 bg-red-100 rounded-md">Error al cargar los lotes: {error.message}</div>;
  }

  // Definimos las columnas para nuestra tabla de lotes
  const columns: TableColumn<LoteMedicamentoRead>[] = [
    {
      accessor: 'id',
      header: 'ID Lote',
    },
    {
      accessor: 'medicamento',
      header: 'Medicamento',
      render: (lote) => lote.medicamento.nombre_generico,
    },
    {
      accessor: 'numero_lote_proveedor',
      header: 'Lote Proveedor',
    },
    {
      accessor: 'cantidad_actual',
      header: 'Cantidad Actual',
    },
    {
      accessor: 'fecha_recepcion',
      header: 'Fecha Recepción',
      render: (lote) => format(new Date(lote.fecha_recepcion), 'dd/MM/yyyy HH:mm'),
    },
  ];

  return <Table columns={columns} data={lotes || []} isLoading={isLoading} />;
};

export default LotesRecientesTable;