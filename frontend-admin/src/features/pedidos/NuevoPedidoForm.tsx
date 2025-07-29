// frontend-admin/src/features/pedidos/NuevoPedidoForm.tsx
import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import apiClient from '../../api/apiClient';

// Definimos el tipo para un solo item para reutilizarlo
type PedidoItem = {
  nombre_medicamento_solicitado: string;
  cantidad_solicitada: number;
};

const NuevoPedidoForm: React.FC = () => {
  // Estado para manejar los items del pedido dinámicamente
  const [items, setItems] = useState<PedidoItem[]>([{ nombre_medicamento_solicitado: '', cantidad_solicitada: 1 }]);
  // Referencia al formulario para poder limpiarlo
  const formRef = useRef<HTMLFormElement>(null);

  // Mutación para crear el pedido. Maneja el envío de datos.
  const createPedidoMutation = useMutation({
    mutationFn: (formData: FormData) => apiClient.post('/pedidos/', formData), // No se necesita Content-Type aquí
    onSuccess: () => {
      toast.success("¡Pedido creado con éxito! Pronto será validado.", { duration: 5000 });
      // Limpiamos el formulario y reseteamos los items si el envío es exitoso
      formRef.current?.reset();
      setItems([{ nombre_medicamento_solicitado: '', cantidad_solicitada: 1 }]);
    },
    onError: (error: AxiosError<{ detail: string | any[] }>) => {
      // Manejo de errores de validación de FastAPI (422) y otros errores
      let errorMessage = error.message;
      if (error.response?.data?.detail) {
        // Si el error es un error de validación de FastAPI, puede ser un array
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail.map(e => `${e.loc.join(' -> ')}: ${e.msg}`).join('; ');
        } else {
          errorMessage = detail;
        }
      }
      toast.error(`Error al crear el pedido: ${errorMessage}`);
    }
  });

  // Función para manejar cambios en los campos de los items
  const handleItemChange = (
    index: number, 
    field: keyof PedidoItem,
    value: string | number
  ) => {
    const newItems = [...items];
    // Convertimos la cantidad a número
    const processedValue = field === 'cantidad_solicitada' ? Math.max(1, Number(value)) : value;
    newItems[index][field] = processedValue as never;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { nombre_medicamento_solicitado: '', cantidad_solicitada: 1 }]);

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      toast.error("Debe haber al menos un medicamento en el pedido.");
    }
  };

  // Función principal que se ejecuta al enviar el formulario
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const finalFormData = new FormData();

    // 1. Extraer los datos y convertirlos a strings JSON
    const clienteData = {
      nombre_completo: form.nombre_completo.value,
      numero_documento: form.numero_documento.value,
      celular: form.celular.value,
      direccion: form.direccion.value,
      barrio: form.barrio.value
    };
    const pedidoData = {
      direccion_entrega: form.direccion_entrega.value,
      nombre_medico: form.nombre_medico.value,
      fecha_receta: new Date(form.fecha_receta.value).toISOString(),
    };

    // 2. Añadir los datos como campos de texto al FormData
    finalFormData.append('cliente_data', JSON.stringify(clienteData));
    finalFormData.append('pedido_data', JSON.stringify(pedidoData));
    finalFormData.append('items_data', JSON.stringify(items));
    
    // 3. Añadir el archivo de imagen
    const fotoRecetaFile = (form.elements.namedItem('foto_receta') as HTMLInputElement)?.files?.[0];
    if (fotoRecetaFile) {
      finalFormData.append('foto_receta', fotoRecetaFile);
    } else {
      toast.error("Por favor, adjunta la foto de la receta.");
      return; // Detenemos el envío si no hay archivo
    }
    
    // 4. Ejecutar la mutación
    createPedidoMutation.mutate(finalFormData);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="p-8 bg-white rounded-lg shadow-xl space-y-8">
      
      {/* SECCIÓN DATOS DEL PACIENTE */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2 text-darkser">1. Datos del Paciente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="nombre_completo" type="text" placeholder="Nombre Completo" required className="input-style" />
          <input name="numero_documento" type="text" placeholder="Número de Documento" required className="input-style" />
          <input name="celular" type="tel" placeholder="Número de Celular" required className="input-style" />
          <input name="direccion" type="text" placeholder="Dirección de Residencia" required className="input-style" />
          <input name="barrio" type="text" placeholder="Barrio" className="input-style" />
        </div>
      </section>

      {/* SECCIÓN DATOS DE LA RECETA */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2 text-darkser">2. Datos de la Receta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="direccion_entrega" type="text" placeholder="Dirección de Entrega" required className="input-style" />
          <input name="nombre_medico" type="text" placeholder="Nombre del Médico" required className="input-style" />
          <div className="flex flex-col">
            <label htmlFor="fecha_receta" className="text-sm text-gray-500 mb-1">Fecha de la Receta</label>
            <input name="fecha_receta" id="fecha_receta" type="date" required className="input-style" />
          </div>
        </div>
      </section>
      
      {/* SECCIÓN MEDICAMENTOS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2 text-darkser">3. Medicamentos Solicitados</h2>
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2 animate-fade-in">
            <input 
              type="text" 
              placeholder="Nombre del Medicamento" 
              value={item.nombre_medicamento_solicitado}
              onChange={(e) => handleItemChange(index, 'nombre_medicamento_solicitado', e.target.value)}
              required 
              className="input-style flex-grow" 
            />
            <input 
              type="number" 
              value={item.cantidad_solicitada}
              onChange={(e) => handleItemChange(index, 'cantidad_solicitada', e.target.value)}
              required 
              min="1" 
              className="input-style w-24 text-center" 
            />
            <button type="button" onClick={() => removeItem(index)} className="px-3 py-1 text-2xl font-bold text-red-500 rounded-full hover:bg-red-100 hover:text-red-700">×</button>
          </div>
        ))}
        <button type="button" onClick={addItem} className="text-sm font-medium text-ser hover:text-darkser">+ Añadir otro medicamento</button>
      </section>
      
      {/* SECCIÓN SUBIDA DE ARCHIVOS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2 text-darkser">4. Adjuntar Receta</h2>
        <div>
          <label htmlFor="foto_receta" className="block text-sm font-medium text-gray-700">Foto de la Receta Médica (Obligatorio)</label>
          <input type="file" name="foto_receta" id="foto_receta" required accept="image/*" className="mt-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-lightser file:text-ser hover:file:bg-ser hover:file:text-white" />
        </div>
      </section>
      
      {/* BOTÓN DE ENVÍO */}
      <button type="submit" disabled={createPedidoMutation.isPending} className="w-full px-4 py-3 font-bold text-white transition-colors duration-150 rounded-md bg-ser hover:bg-darkser focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ser disabled:bg-gray-400">
        {createPedidoMutation.isPending ? 'Enviando Pedido...' : 'Enviar Pedido'}
      </button>
    </form>
  );
};

// --- ESTILOS ---
// Para no repetir clases, definimos un estilo base para los inputs.
// Lo inyectamos una sola vez en el documento.

const inputStyle = `
  .input-style {
    appearance: none;
    border: 1px solid #D1D5DB; /* gray-300 */
    border-radius: 0.375rem; /* rounded-md */
    padding: 0.75rem 1rem;
    font-size: 0.875rem; /* text-sm */
    width: 100%;
    transition: border-color 0.2s;
  }
  .input-style:focus {
    outline: none;
    border-color: #009300; /* ser */
    box-shadow: 0 0 0 2px rgba(0, 147, 0, 0.3); /* ring-ser */
  }
`;

// Comprobamos si el estilo ya ha sido inyectado para no duplicarlo.
if (!document.getElementById('form-input-styles')) {
  const styleSheet = document.createElement("style");
  styleSheet.id = 'form-input-styles';
  styleSheet.innerText = inputStyle;
  document.head.appendChild(styleSheet);
}

export default NuevoPedidoForm;