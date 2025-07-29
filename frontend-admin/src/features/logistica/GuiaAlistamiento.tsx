// frontend-admin/src/features/logistica/GuiaAlistamiento.tsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGuiaAlistamientoOla } from '../../api/logistica';

const GuiaAlistamiento: React.FC = () => {
  // Estado local para llevar la cuenta de la tarea actual
  const [indiceTareaActual, setIndiceTareaActual] = useState(0);

  // Obtenemos la lista COMPLETA de tareas una sola vez
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['guiaAlistamientoOla'],
    queryFn: getGuiaAlistamientoOla,
  });

  // Efecto para reiniciar el índice si los datos cambian (e.g., se crea una nueva ola)
  useEffect(() => {
    setIndiceTareaActual(0);
  }, [data]);

  const handleNextTask = () => {
    // Simplemente incrementamos el índice localmente
    setIndiceTareaActual(prevIndice => prevIndice + 1);
  };

  if (isLoading) return <p className="text-center text-gray-500">Buscando tareas de la ola...</p>;
  if (isError) return <p className="p-4 text-red-700 bg-red-100 rounded-md">Error: {error.message}</p>;

  const tareas = data?.tareas || [];
  const totalTareas = tareas.length;
  const tareaActual = tareas[indiceTareaActual];

  // Si ya no hay más tareas en la lista, mostramos el mensaje de completado
  if (!tareaActual) {
    return (
      <div className="p-8 text-center bg-green-100 border-2 border-green-300 rounded-lg">
        <h3 className="text-2xl font-bold text-ser">¡Alistamiento Completado!</h3>
        <p className="mt-2 text-gray-700">Todos los medicamentos de esta ola han sido recogidos.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b">
        <h2 className="text-2xl font-bold text-darkser">Tarea de Alistamiento</h2>
        <span className="px-3 py-1 text-sm font-semibold text-white rounded-full bg-ser">
          Tarea {indiceTareaActual + 1} de {totalTareas}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        <div className="p-4 rounded-md bg-lightser">
          <p className="text-sm font-medium text-gray-500">Recoger Medicamento:</p>
          <p className="text-3xl font-bold text-gray-900">{tareaActual.medicamento_a_recoger.nombre_generico}</p>
        </div>
        <div className="p-4 rounded-md bg-lightser">
          <p className="text-sm font-medium text-gray-500">Cantidad Total a Recoger:</p>
          <p className="text-5xl font-extrabold text-ser">{tareaActual.cantidad_total}</p>
        </div>
        <div>
          <h4 className="font-semibold">Lotes Disponibles Sugeridos:</h4>
          <ul className="mt-2 space-y-2">
            {tareaActual.lotes_disponibles.map(lote => (
              <li key={lote.id} className="flex justify-between p-3 border rounded-md bg-gray-50">
                <span>Lote Proveedor: <strong className="font-mono">{lote.numero_lote_proveedor}</strong></span>
                <span>Cantidad Disponible: <strong>{lote.cantidad_actual}</strong></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="pt-6 mt-6 border-t">
        <button
          onClick={handleNextTask}
          className="w-full px-4 py-3 font-bold text-white transition-colors duration-150 rounded-md bg-ser hover:bg-darkser focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ser"
        >
          Tarea Completada, Siguiente →
        </button>
      </div>
    </div>
  );
};

export default GuiaAlistamiento;