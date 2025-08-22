import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// 1. Definimos la "forma" de los datos que nuestro formulario manejará.
type FormValues = {
  cliente: {
    nombre_completo: string;
    numero_documento: string;
    celular: string;
    direccion: string;
    barrio: string;
  };
  pedido: {
    direccion_entrega: string;
    nombre_medico: string;
    fecha_receta: string;
  };
  items: {
    nombre_medicamento_solicitado: string;
    cantidad_solicitada: number;
  }[];
  foto_receta: FileList;
};

const NuevoPedidoForm: React.FC = () => {
  const { 
    register, 
    handleSubmit, 
    control,
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      items: [{ nombre_medicamento_solicitado: '', cantidad_solicitada: 1 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  // --- MUTACIÓN ACTUALIZADA PARA USAR 'fetch' ---
  const createPedidoMutation = useMutation<unknown, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_BASE_URL}/pedidos/`, {
        method: 'POST',
        body: formData,
        // No se establece la cabecera 'Content-Type', el navegador lo hace automáticamente.
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido en la respuesta del servidor.' }));
        // Extraemos el 'detail' que envía FastAPI
        const detail = errorData.detail || `Error ${response.status}: ${response.statusText}`;
        // Convertimos el detalle (que puede ser un objeto o un array) a string para mostrarlo
        const errorMessage = Array.isArray(detail) 
          ? detail.map(e => `${e.loc.join(' -> ')}: ${e.msg}`).join('; ')
          : String(detail);
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("¡Pedido creado con éxito! Pronto será validado.", { duration: 5000 });
      reset();
    },
    onError: (error) => {
      toast.error(`Error al crear el pedido: ${error.message}`, { duration: 8000 });
    }
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    const finalFormData = new FormData();
    
    finalFormData.append('cliente_data', JSON.stringify(data.cliente));
    finalFormData.append('pedido_data', JSON.stringify({
      ...data.pedido,
      fecha_receta: new Date(data.pedido.fecha_receta).toISOString(),
    }));
    finalFormData.append('items_data', JSON.stringify(data.items));

    if (data.foto_receta && data.foto_receta[0]) {
      finalFormData.append('foto_receta', data.foto_receta[0]);
    } else {
      toast.error("Por favor, adjunta la foto de la receta.");
      return;
    }

    // Log de depuración
    console.log("--- Contenido del FormData que se enviará con fetch ---");
    for (let [key, value] of finalFormData.entries()) { 
      console.log(key, value);
    }
    console.log("-----------------------------------------------------");
    
    createPedidoMutation.mutate(finalFormData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-8 bg-white rounded-lg shadow-xl space-y-8">
      
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2 text-darkser">1. Datos del Paciente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input {...register("cliente.nombre_completo", { required: "El nombre es obligatorio" })} placeholder="Nombre Completo" className="input-style" />
          <input {...register("cliente.numero_documento", { required: true })} placeholder="Número de Documento" className="input-style" />
          <input {...register("cliente.celular", { required: true })} placeholder="Número de Celular" className="input-style" />
          <input {...register("cliente.direccion", { required: true })} placeholder="Dirección de Residencia" className="input-style" />
          <input {...register("cliente.barrio")} placeholder="Barrio" className="input-style" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2 text-darkser">2. Datos de la Receta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input {...register("pedido.direccion_entrega", { required: true })} placeholder="Dirección de Entrega" className="input-style" />
          <input {...register("pedido.nombre_medico", { required: true })} placeholder="Nombre del Médico" className="input-style" />
          <div className="flex flex-col">
            <label htmlFor="fecha_receta" className="text-sm text-gray-500 mb-1">Fecha de la Receta</label>
            <input {...register("pedido.fecha_receta", { required: true })} id="fecha_receta" type="date" className="input-style" />
          </div>
        </div>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2 text-darkser">3. Medicamentos Solicitados</h2>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <input 
              {...register(`items.${index}.nombre_medicamento_solicitado` as const, { required: true })}
              placeholder="Nombre del Medicamento" 
              className="input-style flex-grow" 
            />
            <input 
              {...register(`items.${index}.cantidad_solicitada` as const, { required: true, valueAsNumber: true, min: 1 })}
              type="number"
              defaultValue={1}
              className="input-style w-24 text-center" 
            />
            <button type="button" onClick={() => (fields.length > 1 ? remove(index) : toast.error('Debe haber al menos un medicamento'))} className="px-3 py-1 text-2xl font-bold text-red-500 rounded-full hover:bg-red-100 hover:text-red-700">&times;</button>
          </div>
        ))}
        <button type="button" onClick={() => append({ nombre_medicamento_solicitado: '', cantidad_solicitada: 1 })} className="text-sm font-medium text-ser hover:text-darkser">+ Añadir otro medicamento</button>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2 text-darkser">4. Adjuntar Receta</h2>
        <div>
          <label htmlFor="foto_receta" className="block text-sm font-medium text-gray-700">Foto de la Receta Médica (Obligatorio)</label>
          <input {...register("foto_receta", { required: true })} type="file" id="foto_receta" accept="image/*" className="mt-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-lightser file:text-ser hover:file:bg-ser hover:file:text-white" />
        </div>
      </section>
      
      <button type="submit" disabled={createPedidoMutation.isPending} className="w-full px-4 py-3 font-bold text-white transition-colors duration-150 rounded-md bg-ser hover:bg-darkser focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ser disabled:bg-gray-400">
        {createPedidoMutation.isPending ? 'Enviando Pedido...' : 'Enviar Pedido'}
      </button>
    </form>
  );
};

// --- ESTILOS ---
const inputStyle = `
  .input-style {
    appearance: none;
    border: 1px solid #D1D5DB;
    border-radius: 0.375rem;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    width: 100%;
    transition: border-color 0.2s;
  }
  .input-style:focus {
    outline: none;
    border-color: #009300;
    box-shadow: 0 0 0 2px rgba(0, 147, 0, 0.3);
  }
`;

if (!document.getElementById('form-input-styles')) {
  const styleSheet = document.createElement("style");
  styleSheet.id = 'form-input-styles';
  styleSheet.innerText = inputStyle;
  document.head.appendChild(styleSheet);
}

export default NuevoPedidoForm;