// frontend-admin/src/api/logistica.ts
import apiClient from './apiClient';
// Reutilizamos tipos de 'pedidos.ts' para mantener la consistencia
import type { PedidoRead, PaqueteRead } from './pedidos';

// =================================================================
// ==                      DEFINICIONES DE TIPOS (INTERFACES)     ==
// =================================================================

export type MedicamentoRead = {
  id: number;
  nombre_generico: string;
  requiere_refrigeracion: boolean;
};

export type LoteMedicamentoRead = {
  id: number;
  numero_lote_proveedor: string;
  cantidad_actual: number;
  fecha_recepcion: string;
  medicamento: MedicamentoRead;
};

export type LoteMedicamentoCreate = {
  numero_lote_proveedor: string;
  cantidad_recibida: number;
  medicamento_id: number;
};

export type MedicamentoRequerido = {
  medicamento_id: number;
  nombre_generico: string;
  cantidad_total_requerida: number;
};

export type OlaPickingRead = {
  id_ola: number;
  numero_pedidos: number;
  medicamentos_requeridos: MedicamentoRequerido[];
  pedidos_ids: number[];
};

export type ResumenPedidosAprobados = {
  total_pedidos_aprobados: number;
  pedidos: PedidoRead[]; 
};

export type TareaAlistamiento = {
  medicamento_a_recoger: MedicamentoRead;
  cantidad_total: number;
  lotes_disponibles: LoteMedicamentoRead[];
};

export type GuiaAlistamiento = {
  tareas: TareaAlistamiento[];
  tareas_pendientes: number;
  mensaje: string;
};

export type TareaEmpaque = {
  siguiente_pedido: PedidoRead | null;
  pedidos_en_cola: number;
};

export type AgenteEntregaRead = {
  id: number;
  nombre_agente: string;
  tipo_agente: string;
};

export type HojaDeRutaRead = {
  id: number;
  estado: string;
  tipo_ruta: string;
  fecha_asignacion: string;
  agente_entrega: AgenteEntregaRead;
  paquetes: PaqueteRead[];
};

export type HojaDeRutaCreate = {
    agente_entrega_id: number;
    tipo_ruta: string;
    zona: string;
};


// =================================================================
// ==                      FUNCIONES DE LA API                    ==
// =================================================================

// --- CATÁLOGO ---
export const getCatalogoMedicamentos = async (): Promise<MedicamentoRead[]> => {
  const response = await apiClient.get<MedicamentoRead[]>('/catalogo/medicamentos');
  return response.data;
};

export const getAgentesEntrega = async (): Promise<AgenteEntregaRead[]> => {
  const response = await apiClient.get<AgenteEntregaRead[]>('/catalogo/agentes_entrega');
  return response.data;
};


// --- RECEPCIÓN ---
export const crearLoteMedicamento = async (loteData: LoteMedicamentoCreate): Promise<LoteMedicamentoRead> => {
  const response = await apiClient.post<LoteMedicamentoRead>('/logistica/recepcion_lote/', loteData);
  return response.data;
};

export const getLotesRecientes = async (): Promise<LoteMedicamentoRead[]> => {
  const response = await apiClient.get<LoteMedicamentoRead[]>('/logistica/lotes/');
  return response.data;
};


// --- PICKING ---
export const getResumenPedidosAprobados = async (): Promise<ResumenPedidosAprobados> => {
  const response = await apiClient.get<ResumenPedidosAprobados>('/logistica/pedidos_aprobados_resumen');
  return response.data;
};

export const crearOlaPicking = async (): Promise<OlaPickingRead> => {
  const response = await apiClient.post<OlaPickingRead>('/logistica/crear_ola_picking');
  return response.data;
};

export const getGuiaAlistamientoOla = async (): Promise<GuiaAlistamiento> => {
  const response = await apiClient.get<GuiaAlistamiento>('/logistica/guia_alistamiento_ola');
  return response.data;
};


// --- PACKING ---
export const getSiguientePedidoParaEmpacar = async (): Promise<TareaEmpaque> => {
  const response = await apiClient.get<TareaEmpaque>('/logistica/siguiente_pedido_para_empacar');
  return response.data;
};

export const finalizarEmpaque = async (pedidoId: number): Promise<PedidoRead> => {
  const response = await apiClient.post<PedidoRead>(`/logistica/finalizar_empaque/${pedidoId}`);
  return response.data;
};


// --- DESPACHO ---
export const getPaquetesListos = async (zona: string): Promise<PaqueteRead[]> => {
  // Añadimos una guarda: si no se ha seleccionado zona, devolvemos un array vacío
  // para evitar una llamada innecesaria a la API.
  if (!zona) {
    return [];
  }

  try {
    // Pasamos la zona como un query parameter en la URL.
    // Axios lo convertirá en /logistica/paquetes/listos?zona=NORTE
    const response = await apiClient.get<PaqueteRead[]>('/logistica/paquetes/listos', {
      params: { zona }
    });
    return response.data;
  } catch (error) {
    console.error(`Error al obtener paquetes listos para la zona ${zona}:`, error);
    throw error;
  }
};

export const crearHojaDeRuta = async (data: HojaDeRutaCreate): Promise<HojaDeRutaRead> => {
    const response = await apiClient.post<HojaDeRutaRead>('/logistica/crear_hoja_de_ruta', data);
    return response.data;
}

export const getRutasActivas = async (): Promise<HojaDeRutaRead[]> => {
  const response = await apiClient.get<HojaDeRutaRead[]>('/logistica/rutas_activas');
  return response.data;
};

export const getRutasFinalizadas = async (): Promise<HojaDeRutaRead[]> => {
  const response = await apiClient.get<HojaDeRutaRead[]>('/cierre/rutas_finalizadas');
  return response.data;
};