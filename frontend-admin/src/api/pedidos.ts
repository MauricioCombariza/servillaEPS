// frontend-admin/src/api/pedidos.ts
import apiClient from './apiClient';

// =================================================================
// ==                      DEFINICIONES DE TIPOS (INTERFACES)     ==
// =================================================================

export type ItemPedidoRead = {
  id: number;
  nombre_medicamento_solicitado: string;
  cantidad_solicitada: number;
};

export type ClienteRead = {
  id: number;
  nombre_completo: string;
  numero_documento: string;
  celular: string;
  direccion: string;
  barrio: string | null;
};

export type PedidoRead = {
  id: number;
  estado: string;
  direccion_entrega: string;
  fecha_creacion: string;
  zona: string | null;
  items: ItemPedidoRead[];
  cliente: ClienteRead;
};

// PaqueteRead depende de PedidoRead, así que lo definimos aquí.
export type PaqueteRead = {
    id: number;
    estado_entrega: string;
    numero_parada: number | null;
    pedido: PedidoRead;
};


// =================================================================
// ==                      FUNCIONES DE LA API                    ==
// =================================================================

/**
 * Obtiene una lista de todos los pedidos que están en estado "en_validacion".
 */
export const getPedidosEnValidacion = async (): Promise<PedidoRead[]> => {
  try {
    const response = await apiClient.get<PedidoRead[]>('/pedidos/en_validacion');
    return response.data;
  } catch (error) {
    console.error("Error al obtener pedidos en validación:", error);
    throw error;
  }
};

/**
 * Llama al endpoint para aprobar un pedido específico.
 */
export const aprobarPedido = async (pedidoId: number): Promise<PedidoRead> => {
  try {
    const response = await apiClient.patch<PedidoRead>(`/pedidos/${pedidoId}/aprobar`);
    return response.data;
  } catch (error) {
    console.error(`Error al aprobar el pedido ${pedidoId}:`, error);
    throw error;
  }
};