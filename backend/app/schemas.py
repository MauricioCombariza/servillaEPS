# backend/app/schemas.py
from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import datetime
from pydantic import condecimal
from decimal import Decimal

# =================================================================
# ==                  ESQUEMAS DE AUTENTICACIÓN Y GESTIÓN        ==
# =================================================================

# --- ROL ---
class RolBase(SQLModel):
    nombre: str
    descripcion: str

class RolRead(RolBase):
    id: int

# --- USUARIO ---
class UsuarioBase(SQLModel):
    email: str
    is_active: bool = True

class UsuarioRead(UsuarioBase):
    id: int

class UsuarioReadWithRol(UsuarioRead):
    rol: Optional[RolRead] = None


# =================================================================
# ==               ESQUEMAS DE LOGÍSTICA (CATÁLOGO)              ==
# =================================================================

# --- CIUDAD Y CENTRO DE OPERACIÓN ---
class CentroOperacionRead(SQLModel):
    id: int
    nombre: str
    direccion: str
    ciudad_id: int

# --- AGENTE DE ENTREGA ---
class AgenteEntregaRead(SQLModel):
    id: int
    nombre_agente: str
    tipo_agente: str

# --- MEDICAMENTO Y LOTES ---
class MedicamentoBase(SQLModel):
    nombre_generico: str
    requiere_refrigeracion: bool = False

class MedicamentoRead(MedicamentoBase):
    id: int

class LoteMedicamentoCreate(SQLModel):
    numero_lote_proveedor: str
    cantidad_recibida: int
    medicamento_id: int

class LoteMedicamentoRead(SQLModel):
    id: int
    numero_lote_proveedor: str
    cantidad_actual: int
    fecha_recepcion: datetime
    medicamento: MedicamentoRead

class RegistroEntregaFallida(SQLModel):
    motivo_fallo: str

class HojaDeRutaCreate(SQLModel):
    agente_entrega_id: int
    tipo_ruta: str = "ENTREGA_FINAL"


# =================================================================
# ==          ESQUEMAS DEL NÚCLEO DEL PROCESO DE PEDIDOS         ==
# =================================================================

# --- CLIENTE ---
class ClienteBase(SQLModel):
    nombre_completo: str
    numero_documento: str
    celular: str
    direccion: str
    barrio: Optional[str] = None

class ClienteRead(ClienteBase):
    id: int

# --- ITEM PEDIDO ---
class ItemPedidoBase(SQLModel):
    nombre_medicamento_solicitado: str
    cantidad_solicitada: int

class ItemPedidoCreate(ItemPedidoBase):
    pass

class ItemPedidoRead(ItemPedidoBase):
    id: int

# --- PEDIDO ---
class PedidoCreate(SQLModel):
    cliente: ClienteBase
    direccion_entrega: str
    nombre_medico: str
    fecha_receta: datetime
    items: List[ItemPedidoCreate]
    centro_operacion_id: Optional[int] = None # Hacemos opcional para pruebas

class PedidoRead(SQLModel):
    id: int
    estado: str
    direccion_entrega: str
    fecha_creacion: datetime
    zona: Optional[str] = None # <-- AÑADE ESTE CAMPO
    items: List[ItemPedidoRead] = []
    cliente: ClienteRead

# =================================================================
# ==          ESQUEMAS DE LOGÍSTICA (OPERACIÓN)                  ==
# =================================================================

# --- OLA DE PICKING ---
class MedicamentoRequerido(SQLModel):
    medicamento_id: int
    nombre_generico: str
    cantidad_total_requerida: int

class OlaPickingRead(SQLModel):
    id_ola: int
    numero_pedidos: int
    medicamentos_requeridos: List[MedicamentoRequerido]
    pedidos_ids: List[int]

# --- GUÍA DE ALISTAMIENTO ---
class TareaAlistamiento(SQLModel):
    medicamento_a_recoger: MedicamentoRead
    cantidad_total: int
    lotes_disponibles: List[LoteMedicamentoRead]

class GuiaAlistamiento(SQLModel):
    tareas: List[TareaAlistamiento]
    tareas_pendientes: int
    mensaje: str

# --- EMPAQUE ---
class TareaEmpaque(SQLModel):
    siguiente_pedido: Optional[PedidoRead] = None
    pedidos_en_cola: int

# --- HOJA DE RUTA Y PAQUETE ---
class PaqueteRead(SQLModel):
    id: int
    estado_entrega: str
    numero_parada: Optional[int] = None
    pedido: PedidoRead

class HojaDeRutaCreate(SQLModel):
    agente_entrega_id: int
    zona: str
    tipo_ruta: str = "ENTREGA_FINAL"

class HojaDeRutaRead(SQLModel):
    id: int
    estado: str
    tipo_ruta: str
    fecha_asignacion: datetime
    
    # YA NO NECESITAMOS EL ID, TENDREMOS EL OBJETO COMPLETO
    # agente_entrega_id: int 
    
    # AÑADIMOS EL OBJETO ANIDADO
    agente_entrega: "AgenteEntregaRead" 

    paquetes: List["PaqueteRead"] = []




# =================================================================
# ==                ESQUEMAS DE CIERRE Y FINANZAS                ==
# =================================================================

# --- TRANSACCIÓN ---
class TransaccionCreate(SQLModel):
    monto_cobrado: Decimal = Field(..., max_digits=10, decimal_places=2)
    metodo_pago: str

# --- RESUMEN DE RUTA ---
class ResumenPedidosAprobados(SQLModel):
    total_pedidos_aprobados: int
    pedidos: List[PedidoRead]

class ZonaBase(SQLModel):
    nombre: str
    
# Esquema para crear una zona. Recibimos la geometría como un string en formato WKT.
class ZonaCreate(ZonaBase):
    # Well-Known Text (WKT) es un formato de texto estándar para representar geometrías.
    # Ejemplo: "POLYGON((lon1 lat1, lon2 lat2, lon3 lat3, lon1 lat1))"
    geom_wkt: str 

class ZonaRead(ZonaBase):
    id: int
    # Podríamos devolver la geometría aquí si el frontend la necesita para dibujarla


HojaDeRutaRead.model_rebuild()
PaqueteRead.model_rebuild()