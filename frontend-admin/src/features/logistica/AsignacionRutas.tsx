import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

// Importamos las funciones de API y los tipos necesarios
import { getPaquetesListos, getAgentesEntrega, crearHojaDeRuta } from '../../api/logistica';
import type { HojaDeRutaCreate } from '../../api/logistica';

// Definimos las zonas disponibles en un solo lugar para fácil mantenimiento
const ZONAS_DISPONIBLES = ["NORTE", "SUR", "CHAPINERO", "OCCIDENTE", "CENTRO"];

const AsignacionRutas: React.FC = () => {
  const queryClient = useQueryClient();

  // Estados locales para los valores seleccionados en los <select>
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  const { data: paquetes, isLoading: isLoadingPaquetes } = useQuery({
    queryKey: ['paquetesListos', selectedZone],
    queryFn: () => getPaquetesListos(selectedZone),
    enabled: !!selectedZone,
  });

  const { data: agentes, isLoading: isLoadingAgentes } = useQuery({
    queryKey: ['agentesEntrega'],
    queryFn: getAgentesEntrega,
  });

  // --- LA CORRECCIÓN ESTÁ AQUÍ ---
  // Tipamos explícitamente el hook useMutation
  const crearRutaMutation = useMutation<unknown, AxiosError<{ detail: string }>, HojaDeRutaCreate>({
    mutationFn: crearHojaDeRuta,
    onSuccess: () => {
      toast.success("¡Hoja de ruta creada y asignada con éxito!");
      queryClient.invalidateQueries({ queryKey: ['paquetesListos', selectedZone] });
      setSelectedAgentId('');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || error.message;
      toast.error(`Error al crear la hoja de ruta: ${errorMessage}`);
    }
  });
  
  const handleAssign = () => {
    if (selectedAgentId && selectedZone) {
      const dataParaEnviar: HojaDeRutaCreate = {
        agente_entrega_id: parseInt(selectedAgentId, 10),
        zona: selectedZone,
        tipo_ruta: 'ENTREGA_FINAL'
      };
      // Ahora esta llamada es válida porque 'mutate' espera un objeto HojaDeRutaCreate
      crearRutaMutation.mutate(dataParaEnviar);
    } else {
      toast.error("Por favor, selecciona una zona y un mensajero.");
    }
  };

  const paquetesListos = paquetes || [];

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">Asignación de Rutas por Zona</h2>
      
      <div className="mt-4">
        <label htmlFor="zona" className="block text-sm font-medium text-gray-700">1. Seleccionar Zona</label>
        <select
          id="zona"
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="mt-1 block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-ser focus:ring-ser sm:text-sm"
        >
          <option value="">-- Elige una zona --</option>
          {ZONAS_DISPONIBLES.map(zona => <option key={zona} value={zona}>{zona}</option>)}
        </select>
      </div>

      {selectedZone && (
        <div className="mt-6 border-t pt-6 animate-fade-in">
          <p className="text-gray-600">
            Hay <span className="font-bold text-ser">{paquetesListos.length}</span> paquetes en la zona <span className="font-bold">{selectedZone}</span>.
          </p>
          
          <div className="mt-4">
            <label htmlFor="agente" className="block text-sm font-medium text-gray-700">2. Seleccionar Mensajero</label>
            <select
              id="agente"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              disabled={isLoadingAgentes}
              className="mt-1 block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-ser focus:ring-ser sm:text-sm"
            >
              <option value="">-- Elige un agente --</option>
              {isLoadingAgentes ? (
                <option>Cargando agentes...</option>
              ) : (
                agentes?.map(agente => <option key={agente.id} value={agente.id}>{agente.nombre_agente}</option>)
              )}
            </select>
          </div>

          <div className="mt-6">
            <button
              onClick={handleAssign}
              disabled={!selectedAgentId || paquetesListos.length === 0 || crearRutaMutation.isPending}
              className="px-4 py-2 font-bold text-white transition-colors duration-150 rounded-md bg-ser hover:bg-darkser disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {crearRutaMutation.isPending ? 'Asignando...' : `Asignar Zona ${selectedZone}`}
            </button>
          </div>
          
          <div className="mt-8">
            <h3 className="font-semibold">Paquetes en Espera para esta Zona:</h3>
            {isLoadingPaquetes ? (
              <p className="text-sm text-gray-500">Cargando paquetes...</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                {paquetesListos.map(p => <li key={p.id}>Paquete #{p.id} para {p.pedido.cliente.nombre_completo}</li>)}
                {paquetesListos.length === 0 && <li className="text-gray-500">No hay paquetes.</li>}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AsignacionRutas;