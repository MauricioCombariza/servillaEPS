# backend/app/models.py
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel, Column
from datetime import datetime
from decimal import Decimal
from geoalchemy2.types import Geometry

# =================================================================
# ==              ENTIDADES DE AUTENTICACIÓN Y GESTIÓN           ==
# =================================================================

class Rol(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(unique=True, index=True)
    descripcion: str
    
    usuarios: List["Usuario"] = Relationship(back_populates="rol")

class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    is_active: bool = Field(default=True)
    
    rol_id: Optional[int] = Field(default=None, foreign_key="rol.id")
    rol: Optional[Rol] = Relationship(back_populates="usuarios")

    # Si este usuario es un agente de entrega, aquí estará el enlace
    agente_entrega: Optional["AgenteEntrega"] = Relationship(back_populates="usuario")


# =================================================================
# ==               ENTIDADES DE ESCALABILIDAD LOGÍSTICA          ==
# =================================================================

class Ciudad(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(index=True)
    
    centros_operacion: List["CentroOperacion"] = Relationship(back_populates="ciudad")
    agentes_entrega: List["AgenteEntrega"] = Relationship(back_populates="ciudad")

class CentroOperacion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    direccion: str
    
    ciudad_id: int = Field(foreign_key="ciudad.id")
    ciudad: Ciudad = Relationship(back_populates="centros_operacion")
    
    pedidos: List["Pedido"] = Relationship(back_populates="centro_operacion")

class AgenteEntrega(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre_agente: str
    tipo_agente: str  # e.g., "INDIVIDUAL_INTERNO", "ENLACE_INTERNO", "PARTNER_EXTERNO"
    
    usuario_id: Optional[int] = Field(default=None, foreign_key="usuario.id")
    usuario: Optional[Usuario] = Relationship(back_populates="agente_entrega")
    
    ciudad_id: Optional[int] = Field(default=None, foreign_key="ciudad.id")
    ciudad: Optional[Ciudad] = Relationship(back_populates="agentes_entrega")
    
    hojas_de_ruta: List["HojaDeRuta"] = Relationship(back_populates="agente_entrega")


# =================================================================
# ==            ENTIDADES DEL NÚCLEO DEL PROCESO DE PEDIDOS      ==
# =================================================================

class Cliente(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre_completo: str
    numero_documento: str = Field(unique=True, index=True)
    celular: str
    direccion: str
    barrio: Optional[str] = None
    
    pedidos: List["Pedido"] = Relationship(back_populates="cliente")

class Pedido(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    estado: str = Field(default="en_validacion", index=True)
    fecha_creacion: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    
    # Datos de la receta y entrega
    direccion_entrega: str # Puede ser diferente a la del cliente
    nombre_medico: str
    fecha_receta: datetime
    foto_receta_url: Optional[str] = None
    zona: Optional[str] = Field(default=None, index=True)
    
    # Relaciones
    cliente_id: int = Field(foreign_key="cliente.id")
    cliente: Cliente = Relationship(back_populates="pedidos")
    
    centro_operacion_id: int = Field(foreign_key="centrooperacion.id")
    centro_operacion: CentroOperacion = Relationship(back_populates="pedidos")
    
    items: List["ItemPedido"] = Relationship(back_populates="pedido")
    paquete: Optional["Paquete"] = Relationship(back_populates="pedido")

class ItemPedido(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre_medicamento_solicitado: str
    cantidad_solicitada: int
    estado_item: str = Field(default="pendiente")  # pendiente, disponible, no_disponible
    
    pedido_id: int = Field(foreign_key="pedido.id")
    pedido: Pedido = Relationship(back_populates="items")

class HojaDeRuta(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    fecha_asignacion: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    tipo_ruta: str  # e.g., ENTREGA_FINAL, TRANSFERENCIA
    estado: str = Field(default="planificada", index=True) # planificada, en_curso, finalizada
    
    agente_entrega_id: int = Field(foreign_key="agenteentrega.id")
    agente_entrega: AgenteEntrega = Relationship(back_populates="hojas_de_ruta")
    
    paquetes: List["Paquete"] = Relationship(back_populates="hoja_de_ruta")

class Paquete(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    estado_entrega: str = Field(default="en_bodega", index=True)
    numero_parada: Optional[int] = None
    foto_entrega_url: Optional[str] = None
    motivo_fallo: Optional[str] = None
    
    pedido_id: int = Field(unique=True, foreign_key="pedido.id")
    pedido: Pedido = Relationship(back_populates="paquete")
    
    hoja_de_ruta_id: Optional[int] = Field(default=None, foreign_key="hojaderuta.id")
    hoja_de_ruta: Optional[HojaDeRuta] = Relationship(back_populates="paquetes")

class Medicamento(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre_generico: str = Field(unique=True, index=True)
    requiere_refrigeracion: bool = Field(default=False)
    lotes: List["LoteMedicamento"] = Relationship(back_populates="medicamento")

class LoteMedicamento(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    numero_lote_proveedor: str # El código que viene del dispensario
    cantidad_recibida: int
    cantidad_actual: int
    fecha_recepcion: datetime = Field(default_factory=datetime.utcnow)
    
    medicamento_id: int = Field(foreign_key="medicamento.id")
    medicamento: Medicamento = Relationship(back_populates="lotes")

class TransaccionFinanciera(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    monto_cobrado: Decimal = Field(max_digits=10, decimal_places=2)
    metodo_pago: str # "Efectivo", "Transferencia"
    estado_pago: str = Field(default="recibido") # recibido, confirmado
    fecha_pago: datetime = Field(default_factory=datetime.utcnow)
    
    paquete_id: int = Field(foreign_key="paquete.id")
    # No necesitamos un back_populates aquí si no vamos a navegar de Paquete a Transacción


class Zona(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    # Definimos la columna con el tipo de GeoAlchemy
    geom: bytes = Field(sa_column=Column(Geometry('POLYGON', srid=4326)))