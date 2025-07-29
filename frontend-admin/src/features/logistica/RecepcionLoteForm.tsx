// frontend-admin/src/features/logistica/RecepcionLoteForm.tsx
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast'; // 1. Importar toast

import { getCatalogoMedicamentos, crearLoteMedicamento } from '../../api/logistica';
import type { LoteMedicamentoCreate } from '../../api/logistica';

const RecepcionLoteForm: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: medicamentos, isLoading: isLoadingMeds } = useQuery({
    queryKey: ['catalogoMedicamentos'],
    queryFn: getCatalogoMedicamentos,
  });

  const crearLoteMutation = useMutation({
    mutationFn: crearLoteMedicamento,
    onSuccess: (data) => {
      // 2. Reemplazar alert() con toast.success()
      toast.success(`Lote #${data.numero_lote_proveedor} para ${data.medicamento.nombre_generico} creado con éxito.`);
      queryClient.invalidateQueries({ queryKey: ['lotesRecientes'] });
    },
    onError: (error) => {
      // 3. Reemplazar alert() con toast.error()
      toast.error(`Error al crear el lote: ${error.message}`);
    }
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    // Validamos que se haya seleccionado un medicamento
    const medicamentoId = formData.get('medicamento_id');
    if (!medicamentoId) {
      toast.error("Por favor, selecciona un medicamento.");
      return;
    }

    const data: LoteMedicamentoCreate = {
      medicamento_id: parseInt(medicamentoId as string, 10),
      numero_lote_proveedor: formData.get('numero_lote_proveedor') as string,
      cantidad_recibida: parseInt(formData.get('cantidad_recibida') as string, 10),
    };

    crearLoteMutation.mutate(data, {
      onSuccess: () => {
        form.reset(); // Limpia el formulario solo si la mutación es exitosa
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium">Registrar Nuevo Lote</h3>
      <div>
        <label htmlFor="medicamento_id" className="block text-sm font-medium text-gray-700">Medicamento</label>
        <select
          id="medicamento_id"
          name="medicamento_id"
          required
          className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-ser focus:border-ser sm:text-sm"
          disabled={isLoadingMeds}
        >
          <option value="" disabled>-- Selecciona un medicamento --</option>
          {isLoadingMeds ? (
            <option>Cargando...</option>
          ) : (
            medicamentos?.map((med) => (
              <option key={med.id} value={med.id}>{med.nombre_generico}</option>
            ))
          )}
        </select>
      </div>

      <div>
        <label htmlFor="numero_lote_proveedor" className="block text-sm font-medium text-gray-700">Número de Lote (Proveedor)</label>
        <input type="text" name="numero_lote_proveedor" id="numero_lote_proveedor" required className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-ser focus:border-ser sm:text-sm" />
      </div>

      <div>
        <label htmlFor="cantidad_recibida" className="block text-sm font-medium text-gray-700">Cantidad Recibida</label>
        <input type="number" name="cantidad_recibida" id="cantidad_recibida" required min="1" className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-ser focus:border-ser sm:text-sm" />
      </div>
      
      <button
        type="submit"
        disabled={crearLoteMutation.isPending}
        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-ser hover:bg-darkser focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ser disabled:bg-gray-400"
      >
        {crearLoteMutation.isPending ? 'Registrando...' : 'Registrar Lote'}
      </button>
    </form>
  );
};

export default RecepcionLoteForm;