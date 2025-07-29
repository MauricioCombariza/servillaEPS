import type { ReactNode } from 'react';

// Exportamos la interfaz para poder importarla en otros archivos
export interface TableColumn<T> {
  // Usamos un 'accessor' en lugar de 'key' para que sea más claro
  // puede ser una clave del objeto T o una cadena única para columnas de acción
  accessor: keyof T | string; 
  header: string;
  // La función render es opcional y recibe el objeto completo de la fila
  render?: (item: T) => ReactNode; 
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
}

export function Table<T extends { id: number | string }>({ columns, data, isLoading }: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Cargando datos...</p>
        {/* Aquí podríamos poner un spinner a futuro */}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-gray-500">No hay datos para mostrar.</div>;
  }

  return (
    <div className="overflow-x-auto border border-gray-200 shadow-sm sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={String(col.accessor)} scope="col" className="px-6 py-3 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
              {columns.map((col) => (
                <td key={`${item.id}-${String(col.accessor)}`} className="px-6 py-4">
                  {/* Lógica de renderizado corregida y más robusta */}
                  {col.render 
                    ? col.render(item) 
                    : (item[col.accessor as keyof T] as ReactNode) || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}