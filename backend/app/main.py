# =================================================================
# ==                         IMPORTACIONES                       ==
# =================================================================
from fastapi import FastAPI, Depends, HTTPException, status, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from contextlib import asynccontextmanager
from sqlmodel import Session, select, delete
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime
import shutil
from pathlib import Path
import json
from collections import defaultdict
from geoalchemy2.functions import ST_Contains, ST_MakePoint
from geoalchemy2.shape import to_shape
from . import routing_service

# Importaciones de módulos locales
from . import models
from . import schemas
from . import notifications
from .db import create_db_and_tables, get_session
from .security import get_password_hash, verify_password, create_access_token, get_current_user
from . import zonificacion
from . import routing

# =================================================================
# ==                  LIFESPAN DE LA APLICACIÓN                  ==
# =================================================================

async def lifespan(app: FastAPI):
    """
    Función que se ejecuta al inicio y fin de la aplicación.
    Aquí creamos las tablas de la base de datos al arrancar.
    """
    print("Iniciando aplicación...")
    create_db_and_tables()
    yield
    print("Apagando aplicación...")

app = FastAPI(
    lifespan=lifespan,
    title="API de Farmacia a Domicilio",
    description="Sistema para gestionar el proceso de entrega de medicamentos.",
    version="0.1.0"
)

# --- Configuración de CORS ---
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =================================================================
# ==                  CONFIGURACIÓN DE CORS MIDDLEWARE           ==
# =================================================================

# Lista de orígenes que tienen permitido hacer peticiones a nuestra API
origins = [
    "http://localhost:5173", # El origen de nuestro frontend de React en desarrollo
    "http://localhost:3000", # Otro puerto común para desarrollo de React
    # A futuro, aquí añadirías la URL de tu aplicación en producción
    # "https://tu-dominio-de-produccion.com", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Permite los orígenes especificados
    allow_credentials=True, # Permite cookies (importante para algunos flujos de auth)
    allow_methods=["*"], # Permite todos los métodos (GET, POST, etc.)
    allow_headers=["*"], # Permite todas las cabeceras
)


# =================================================================
# ==                  ENDPOINT DE AUTENTICACIÓN                  ==
# =================================================================

@app.post("/token", tags=["Autenticación"])
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
):
    user_query = select(models.Usuario).where(models.Usuario.email == form_data.username).options(
        selectinload(models.Usuario.rol)
    )
    user = session.exec(user_query).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.email, "rol": user.rol.nombre if user.rol else None}
    )
    return {"access_token": access_token, "token_type": "bearer"}

# =================================================================
# ==             ENDPOINTS DE GESTIÓN DE USUARIOS (PROTEGIDOS)   ==
# =================================================================

@app.get("/users/me", response_model=schemas.UsuarioReadWithRol, tags=["Usuarios"])
def read_users_me(current_user: models.Usuario = Depends(get_current_user)):
    return current_user


@app.get("/admin/dashboard", tags=["Admin"])
def read_admin_dashboard(current_user: models.Usuario = Depends(get_current_user)):
    if not current_user.rol or current_user.rol.nombre != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para acceder a este recurso.")
    return {"message": f"Bienvenido al panel de admin, {current_user.email}!"}


# =================================================================
# ==               ENDPOINTS DE GESTIÓN DE PEDIDOS               ==
# =================================================================

@app.post("/pedidos/", response_model=schemas.PedidoRead, status_code=status.HTTP_201_CREATED, tags=["Pedidos"])
def create_pedido(
    session: Session = Depends(get_session),
    # Recibimos los datos como campos de un formulario multipart,
    # ya que necesitamos manejar la subida de archivos.
    cliente_data: str = Form(description="Un string JSON con los datos del cliente."),
    pedido_data: str = Form(description="Un string JSON con los datos del pedido (dirección, médico, fecha)."),
    items_data: str = Form(description="Un string JSON con la lista de items del pedido."),
    foto_receta: UploadFile = File(description="El archivo de imagen de la receta médica.")
):
    """
    Crea un nuevo pedido a partir de datos de formulario, incluyendo la subida de archivos.
    Además, asigna automáticamente una zona basada en la dirección de entrega.
    """
    
    # 1. PARSEO DE DATOS JSON
    # Convertimos los strings recibidos del formulario a objetos Python.
    try:
        cliente_dict = json.loads(cliente_data)
        pedido_dict = json.loads(pedido_data)
        items_list = json.loads(items_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Formato JSON inválido en los datos del formulario.")

    # 2. MANEJO DE LA SUBIDA DE ARCHIVOS
    UPLOAD_DIRECTORY = Path("/app/uploads")
    UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)

    try:
        # Creamos un nombre de archivo único para evitar colisiones
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        file_location = UPLOAD_DIRECTORY / f"receta_{timestamp}_{foto_receta.filename}"
        
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(foto_receta.file, file_object)
        
        # Guardamos la ruta relativa para almacenarla en la base de datos
        foto_receta_url = str(file_location.relative_to(Path("/app")))
    finally:
        foto_receta.file.close()

    # 3. LÓGICA DE ZONIFICACIÓN
    direccion_para_zonificar = pedido_dict.get('direccion_entrega', '')
    zona_asignada = zonificacion.asignar_zona_por_direccion(direccion_para_zonificar)
    print(f"Dirección '{direccion_para_zonificar}' asignada a la zona: {zona_asignada}")

    # 4. VERIFICACIÓN Y OBTENCIÓN DE ENTIDADES RELACIONADAS
    # Asignamos al primer centro de operación disponible para simplificar el MVP
    centro_op_db = session.exec(select(models.CentroOperacion)).first()
    if not centro_op_db:
        raise HTTPException(status_code=404, detail="No hay Centros de Operación configurados en el sistema.")
    
    # Buscamos al cliente por su documento; si no existe, lo creamos.
    cliente_db = session.exec(select(models.Cliente).where(models.Cliente.numero_documento == cliente_dict['numero_documento'])).first()
    if not cliente_db:
        cliente_db = models.Cliente(**cliente_dict)
        session.add(cliente_db)
        session.commit()
        session.refresh(cliente_db)

    # 5. CREACIÓN DE LAS ENTIDADES EN LA BASE DE DATOS
    # Creamos el objeto Pedido principal
    pedido_db = models.Pedido(
        **pedido_dict,
        cliente_id=cliente_db.id,
        centro_operacion_id=centro_op_db.id,
        foto_receta_url=foto_receta_url,
        zona=zona_asignada  # <-- Asignamos la zona calculada
    )
    session.add(pedido_db)
    session.commit()
    session.refresh(pedido_db) # Obtenemos el ID del pedido recién creado

    # Creamos los Items del Pedido, ahora que tenemos el ID del pedido
    for item_data in items_list:
        item_db = models.ItemPedido(**item_data, pedido_id=pedido_db.id)
        session.add(item_db)
    
    session.commit()
    
    # 6. Refrescamos el objeto Pedido para cargar sus relaciones (items, cliente)
    # y devolver una respuesta completa.
    session.refresh(pedido_db)
    
    return pedido_db




@app.get("/pedidos/en_validacion", response_model=List[schemas.PedidoRead], tags=["Pedidos"])
def get_pedidos_en_validacion(
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    if not current_user.rol or current_user.rol.nombre not in ["operador", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado.")
    query = select(models.Pedido).where(models.Pedido.estado == "en_validacion").options(
        selectinload(models.Pedido.items), 
        selectinload(models.Pedido.cliente)
    )
    pedidos = session.exec(query).all()
    return pedidos



@app.patch("/pedidos/{pedido_id}/aprobar", response_model=schemas.PedidoRead, tags=["Pedidos"])
def aprobar_pedido(
    pedido_id: int,
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    if not current_user.rol or current_user.rol.nombre not in ["operador", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado.")
    
    pedido_db = session.get(models.Pedido, pedido_id)
    if not pedido_db:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
    pedido_db.estado = "aprobado"
    session.add(pedido_db)
    session.commit()
    session.refresh(pedido_db)
    
    session.refresh(pedido_db.cliente)
    for item in pedido_db.items:
        session.refresh(item)
    
    return pedido_db


# =================================================================
# ==                  ENDPOINT DE DATOS DE PRUEBA                ==
# =================================================================

# ... (asegúrate de tener 'from sqlmodel import delete' al principio del archivo) ...

@app.post("/create_test_data", status_code=status.HTTP_201_CREATED, tags=["Testing"])
def create_test_data(session: Session = Depends(get_session)):
    """
    Limpia la base de datos y crea un conjunto completo y consistente de datos iniciales.
    """
    
    print("Limpiando datos de prueba anteriores...")
    # Orden de eliminación correcto y completo
    session.exec(delete(models.TransaccionFinanciera))
    session.exec(delete(models.LoteMedicamento))
    session.exec(delete(models.ItemPedido))
    session.exec(delete(models.Paquete))
    session.exec(delete(models.HojaDeRuta))
    session.exec(delete(models.Pedido))
    session.exec(delete(models.Cliente))
    session.exec(delete(models.AgenteEntrega))
    session.exec(delete(models.Usuario))
    session.exec(delete(models.CentroOperacion))
    session.exec(delete(models.Ciudad))
    session.exec(delete(models.Medicamento))
    session.exec(delete(models.Rol))
    session.commit()
    print("Datos limpiados.")

    # Usamos una única transacción para toda la creación de datos.
    # Si algo falla, se hace rollback de todo.
    try:
        # 1. Crear entidades sin dependencias
        print("Creando entidades base (Roles, Ciudades, Medicamentos)...")
        rol_operador = models.Rol(nombre="operador", descripcion="Operador de Ingreso de Pedidos")
        rol_admin = models.Rol(nombre="admin", descripcion="Administrador del Sistema")
        ciudad_bogota = models.Ciudad(nombre="Bogotá")
        medicamento_acetaminofen = models.Medicamento(nombre_generico="Acetaminofén 500mg")
        
        session.add_all([rol_operador, rol_admin, ciudad_bogota, medicamento_acetaminofen])
        # Usamos flush para que la BD asigne IDs, pero sin terminar la transacción.
        session.flush()

        # 2. Crear entidades dependientes de nivel 1
        print("Creando Centro de Operación y Usuarios...")
        centro_principal = models.CentroOperacion(
            nombre="Bodega Principal Fontibón", direccion="Calle 13 # 45-67", ciudad_id=ciudad_bogota.id
        )
        hashed_password = get_password_hash("password123")
        usuario_operador = models.Usuario(
            email="operador@farmacia.com", hashed_password=hashed_password, rol_id=rol_operador.id
        )
        usuario_admin = models.Usuario(
            email="admin@farmacia.com", hashed_password=hashed_password, rol_id=rol_admin.id
        )
        session.add_all([centro_principal, usuario_operador, usuario_admin])
        session.flush()

        # 3. Crear entidades dependientes de nivel 2
        print("Creando Agente de Entrega...")
        agente_juan = models.AgenteEntrega(
            nombre_agente="Juan Pérez (Operador/Mensajero)",
            tipo_agente="INDIVIDUAL_INTERNO",
            usuario_id=usuario_operador.id,
            ciudad_id=ciudad_bogota.id
        )
        session.add(agente_juan)
        
        # 4. Commit final de toda la transacción.
        session.commit()
        print("Datos de prueba creados exitosamente.")

    except Exception as e:
        print(f"Error durante la creación de datos de prueba. Realizando rollback... Error: {e}")
        session.rollback()
        raise HTTPException(status_code=500, detail="Error al inicializar la base de datos.")

    return {"status": "ok", "message": "Datos de prueba creados exitosamente."}
# =================================================================
# ==            ENDPOINTS DE LOGÍSTICA INTERNA                   ==
# =================================================================

@app.post("/logistica/recepcion_lote/", response_model=schemas.LoteMedicamentoRead, tags=["Logística"])
def recibir_lote_medicamento(
    lote_data: schemas.LoteMedicamentoCreate,
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user) # Endpoint protegido
):
    """
    Registra la recepción de un nuevo lote de medicamentos en la bodega.
    """
    # Verificación de rol (a futuro se puede hacer con una dependencia)
    # Asumimos que un 'operador' o 'admin' pueden hacer esto.
    if not current_user.rol or current_user.rol.nombre not in ["operador", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado."
        )

    # Verificamos que el medicamento exista
    medicamento_db = session.get(models.Medicamento, lote_data.medicamento_id)
    if not medicamento_db:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")

    # Creamos el nuevo lote
    lote_db = models.LoteMedicamento(
        numero_lote_proveedor=lote_data.numero_lote_proveedor,
        cantidad_recibida=lote_data.cantidad_recibida,
        cantidad_actual=lote_data.cantidad_recibida, # Al recibir, la cantidad actual es la total
        medicamento_id=lote_data.medicamento_id
    )
    
    session.add(lote_db)
    session.commit()
    session.refresh(lote_db)
    session.refresh(lote_db.medicamento) # Cargamos la relación para la respuesta

    return lote_db


# =================================================================
# ==            ENDPOINTS DE LISTA DE MEDICAMENTOS              ==
# =================================================================


@app.get("/catalogo/medicamentos", response_model=List[schemas.MedicamentoRead], tags=["Catálogo"])
def get_medicamentos(
    session: Session = Depends(get_session),
    # Protegido, solo usuarios internos pueden ver el catálogo
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Devuelve una lista de todos los medicamentos en el catálogo.
    """
    medicamentos = session.exec(select(models.Medicamento)).all()
    return medicamentos



# =================================================================
# ==            ENDPOINTS DE BODEGA              ==
# =================================================================

@app.post("/logistica/crear_ola_picking", response_model=schemas.OlaPickingRead, tags=["Logística"])
def crear_ola_picking(
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Toma todos los pedidos en estado 'aprobado', los agrupa en una nueva
    'ola de picking', calcula el total de medicamentos necesarios y actualiza
    el estado de los pedidos a 'en_alistamiento'.
    """
    if not current_user.rol or current_user.rol.nombre not in ["operador", "admin"]:
        raise HTTPException(status_code=403, detail="Acceso denegado.")

    # 1. Encontrar todos los pedidos aprobados
    pedidos_aprobados_query = select(models.Pedido).where(
        models.Pedido.estado == "aprobado"
    ).options(selectinload(models.Pedido.items))
    pedidos_para_ola = session.exec(pedidos_aprobados_query).all()

    if not pedidos_para_ola:
        raise HTTPException(status_code=404, detail="No hay pedidos aprobados para procesar.")

    # 2. Calcular los medicamentos requeridos y agrupar IDs de pedidos
    medicamentos_a_recoger = defaultdict(int)
    pedidos_ids_en_ola = []
    
    for pedido in pedidos_para_ola:
        pedidos_ids_en_ola.append(pedido.id)
        for item in pedido.items:
            # Asumimos que podemos encontrar el medicamento por su nombre solicitado
            # A futuro, esto debería usar un ID de medicamento
            medicamentos_a_recoger[item.nombre_medicamento_solicitado] += item.cantidad_solicitada
        
        # 3. Actualizar el estado del pedido
        pedido.estado = "en_alistamiento"
        session.add(pedido)
    
    # 4. Construir la respuesta
    # (En un sistema real, guardaríamos esta ola en una tabla `OlaPicking`)
    id_ola_generada = int(datetime.utcnow().timestamp())
    
    # Buscamos los medicamentos en el catálogo para obtener sus IDs y nombres
    medicamentos_requeridos_response = []
    for nombre, cantidad in medicamentos_a_recoger.items():
        medicamento_db = session.exec(
            select(models.Medicamento).where(models.Medicamento.nombre_generico == nombre)
        ).first()
        medicamentos_requeridos_response.append(
            schemas.MedicamentoRequerido(
                medicamento_id=medicamento_db.id if medicamento_db else 0, # 0 si no está en catálogo
                nombre_generico=nombre,
                cantidad_total_requerida=cantidad
            )
        )

    # Confirmamos los cambios en la base de datos
    session.commit()

    return schemas.OlaPickingRead(
        id_ola=id_ola_generada,
        numero_pedidos=len(pedidos_para_ola),
        medicamentos_requeridos=medicamentos_requeridos_response,
        pedidos_ids=pedidos_ids_en_ola
    )

@app.get("/logistica/guia_alistamiento_ola", response_model=schemas.GuiaAlistamiento, tags=["Logística"])
def get_guia_alistamiento_ola(
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Devuelve la lista COMPLETA de tareas de alistamiento para la ola actual.
    """
    if not current_user.rol or current_user.rol.nombre not in ["operador", "admin"]:
        raise HTTPException(status_code=403, detail="Acceso denegado.")
    
    # 1. Encontrar todos los items de pedidos que están en alistamiento
    query = select(models.ItemPedido).join(models.Pedido).where(
        models.Pedido.estado == "en_alistamiento"
    )
    items_a_alistar = session.exec(query).all()

    # 2. Calcular los medicamentos requeridos
    medicamentos_requeridos = defaultdict(int)
    for item in items_a_alistar:
        medicamentos_requeridos[item.nombre_medicamento_solicitado] += item.cantidad_solicitada

    if not medicamentos_requeridos:
        return schemas.GuiaAlistamiento(tareas=[], tareas_pendientes=0, mensaje="No hay tareas de alistamiento pendientes.")

    # 3. Construir la lista de tareas
    lista_de_tareas = []
    for nombre, cantidad in medicamentos_requeridos.items():
        medicamento_db = session.exec(
            select(models.Medicamento).where(models.Medicamento.nombre_generico == nombre)
            .options(selectinload(models.Medicamento.lotes))
        ).first()
        
        if medicamento_db:
            lista_de_tareas.append(
                schemas.TareaAlistamiento(
                    medicamento_a_recoger=medicamento_db,
                    cantidad_total=cantidad,
                    lotes_disponibles=medicamento_db.lotes
                )
            )

    return schemas.GuiaAlistamiento(
        tareas=lista_de_tareas,
        tareas_pendientes=len(lista_de_tareas),
        mensaje="Lista de tareas para la ola actual."
    )

@app.get("/logistica/siguiente_pedido_para_empacar", response_model=schemas.TareaEmpaque, tags=["Logística"])
def get_siguiente_para_empacar(
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Busca el próximo pedido en estado 'en_alistamiento' y lo presenta
    al empacador para iniciar la verificación y empaque.
    """
    if not current_user.rol or current_user.rol.nombre not in ["operador", "admin"]: # Asumimos que un operador también puede empacar
        raise HTTPException(status_code=403, detail="Acceso denegado.")

    # Contamos cuántos hay en cola
    pedidos_en_cola_query = select(models.Pedido).where(models.Pedido.estado == "en_alistamiento")
    pedidos_en_cola = session.exec(pedidos_en_cola_query).all()
    
    # Tomamos el primero de la lista
    pedido_a_empacar = pedidos_en_cola[0] if pedidos_en_cola else None

    if not pedido_a_empacar:
        return schemas.TareaEmpaque(siguiente_pedido=None, pedidos_en_cola=0)
    
    # Cargamos las relaciones para la respuesta
    session.refresh(pedido_a_empacar.cliente)
    for item in pedido_a_empacar.items:
        session.refresh(item)
    
    # Actualizamos el estado para que otro empacador no lo tome
    pedido_a_empacar.estado = "en_empaque"
    session.add(pedido_a_empacar)
    session.commit()
    session.refresh(pedido_a_empacar)

    return schemas.TareaEmpaque(
        siguiente_pedido=pedido_a_empacar,
        pedidos_en_cola=len(pedidos_en_cola) - 1
    )

@app.post("/logistica/finalizar_empaque/{pedido_id}", response_model=schemas.PedidoRead, tags=["Logística"])
def finalizar_empaque(
    pedido_id: int,
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Marca un pedido como 'listo_para_despacho' y crea la entidad Paquete asociada.
    """
    if not current_user.rol or current_user.rol.nombre not in ["operador", "admin"]:
        raise HTTPException(status_code=403, detail="Acceso denegado.")

    pedido_db = session.get(models.Pedido, pedido_id)
    if not pedido_db:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    if pedido_db.estado != "en_empaque":
        raise HTTPException(status_code=400, detail=f"El pedido no está en estado 'en_empaque', está en '{pedido_db.estado}'")

    # 1. Crear el paquete asociado al pedido
    nuevo_paquete = models.Paquete(
        pedido_id=pedido_db.id,
        estado_entrega="en_bodega" # Estado inicial del paquete
    )
    session.add(nuevo_paquete)

    # 2. Actualizar el estado del pedido
    pedido_db.estado = "listo_para_despacho"
    session.add(pedido_db)
    
    session.commit()
    session.refresh(pedido_db)

    return pedido_db

@app.post("/logistica/crear_hoja_de_ruta", response_model=schemas.HojaDeRutaRead, tags=["Logística"])
def crear_hoja_de_ruta(
    ruta_data: schemas.HojaDeRutaCreate, # El esquema ahora espera 'zona' y 'agente_entrega_id'
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Crea una nueva hoja de ruta para una ZONA específica.
    1. Encuentra todos los paquetes listos para despacho en esa zona.
    2. Calcula una ruta optimizada con OpenRouteService.
    3. Asigna los paquetes a un agente de entrega en el orden óptimo.
    """
    # Verificación de permisos
    if not current_user.rol or current_user.rol.nombre not in ["admin", "operador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado.")

    # 1. Verificar que el agente de entrega (mensajero) exista
    agente = session.get(models.AgenteEntrega, ruta_data.agente_entrega_id)
    if not agente:
        raise HTTPException(status_code=status.HTTP_404, detail="Agente de entrega no encontrado.")

    # 2. Encontrar todos los paquetes que están listos EN LA ZONA ESPECIFICADA
    print(f"Buscando paquetes listos en la zona: {ruta_data.zona}...")
    # Hacemos un JOIN con la tabla Pedido para poder filtrar por Pedido.zona
    paquetes_query = select(models.Paquete).join(models.Pedido).where(
        models.Paquete.estado_entrega == "en_bodega",
        models.Pedido.zona == ruta_data.zona # <-- ¡El filtro clave!
    )
    paquetes_a_asignar = session.exec(paquetes_query).all()

    if not paquetes_a_asignar:
        raise HTTPException(status_code=404, detail=f"No hay paquetes listos para despachar en la zona '{ruta_data.zona}'.")

    # 3. Preparar coordenadas y llamar al servicio de optimización
    bodega_coords = (-74.0721, 4.7110) # Coordenadas de Bogotá (long, lat)
    coordenadas = [bodega_coords]
    paquetes_por_indice = {} # Mapea el índice (1, 2, ...) al objeto Paquete
    
    print(f"Preparando {len(paquetes_a_asignar)} paquetes para optimización de ruta...")
    for i, paquete in enumerate(paquetes_a_asignar):
        # NOTA: Usamos coordenadas falsas. A futuro, aquí se geocodificaría
        # la dirección `paquete.pedido.direccion_entrega`.
        coord_falsa = (
            bodega_coords[0] + (i * 0.05 - 0.1), 
            bodega_coords[1] + (i * 0.03 - 0.05)
        )
        coordenadas.append(coord_falsa)
        paquetes_por_indice[i + 1] = paquete
    
    orden_optimizado_indices = routing.obtener_ruta_optimizada(coordenadas)
    
    # 4. Crear la entidad HojaDeRuta en la base de datos
    nueva_hoja_de_ruta = models.HojaDeRuta(
        agente_entrega_id=agente.id,
        zona=ruta_data.zona, # <-- A futuro, podríamos añadir una columna 'zona' a la HojaDeRuta
        tipo_ruta=ruta_data.tipo_ruta,
        estado="planificada"
    )
    session.add(nueva_hoja_de_ruta)
    session.commit()
    session.refresh(nueva_hoja_de_ruta)

    # 5. Asignar los paquetes a la nueva hoja de ruta en el ORDEN OPTIMIZADO
    print(f"Asignando paquetes en el orden: {orden_optimizado_indices}")
    for parada_num, indice_paquete in enumerate(orden_optimizado_indices, start=1):
        paquete_a_actualizar = paquetes_por_indice[indice_paquete]
        
        paquete_a_actualizar.hoja_de_ruta_id = nueva_hoja_de_ruta.id
        paquete_a_actualizar.estado_entrega = "asignado_a_ruta"
        paquete_a_actualizar.numero_parada = parada_num
        
        session.add(paquete_a_actualizar)
    
    session.commit()
    
    # 6. Recargar la hoja de ruta con todas sus relaciones para la respuesta
    ruta_final_query = select(models.HojaDeRuta).where(models.HojaDeRuta.id == nueva_hoja_de_ruta.id).options(
        selectinload(models.HojaDeRuta.agente_entrega),
        selectinload(models.HojaDeRuta.paquetes).selectinload(models.Paquete.pedido).selectinload(models.Pedido.cliente),
        selectinload(models.HojaDeRuta.paquetes).selectinload(models.Paquete.pedido).selectinload(models.Pedido.items)
    )
    ruta_final = session.exec(ruta_final_query).one()

    # Ordenamos los paquetes en la respuesta para consistencia
    if ruta_final.paquetes:
        ruta_final.paquetes.sort(key=lambda p: p.numero_parada or 0)

    return ruta_final


@app.get("/logistica/mi_ruta_activa", response_model=schemas.HojaDeRutaRead, tags=["App Mensajero"])
def get_mi_ruta_activa(
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Endpoint para la App Móvil. Devuelve la hoja de ruta activa
    (en estado 'planificada' o 'en_curso') para el mensajero autenticado.
    """
    if not current_user.agente_entrega:
        raise HTTPException(status_code=404, detail="Este usuario no es un agente de entrega.")

    agente_id = current_user.agente_entrega.id
    
    # Buscamos la ruta que no esté 'finalizada' para este agente
    ruta_query = select(models.HojaDeRuta).where(
        models.HojaDeRuta.agente_entrega_id == agente_id,
        models.HojaDeRuta.estado != "finalizada"
    ).options(
        selectinload(models.HojaDeRuta.paquetes).selectinload(models.Paquete.pedido).selectinload(models.Pedido.cliente),
        selectinload(models.HojaDeRuta.paquetes).selectinload(models.Paquete.pedido).selectinload(models.Pedido.items)
    )
    
    ruta_activa = session.exec(ruta_query).first()

    if not ruta_activa:
        raise HTTPException(status_code=404, detail="No tienes una ruta activa asignada.")

    # (Opcional) Actualizar el estado a 'en_curso' la primera vez que se consulta
    if ruta_activa.estado == "planificada":
        ruta_activa.estado = "en_curso"
        session.add(ruta_activa)
        session.commit()
        session.refresh(ruta_activa)

    return ruta_activa

@app.patch("/logistica/paquetes/{paquete_id}/entregado", response_model=schemas.PaqueteRead, tags=["App Mensajero"])
def marcar_paquete_entregado(
    paquete_id: int,
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Marca un paquete como 'entregado'.
    """
    # 1. Obtenemos el paquete Y su hoja de ruta asociada en una sola consulta
    paquete_query = select(models.Paquete).where(models.Paquete.id == paquete_id).options(
        selectinload(models.Paquete.hoja_de_ruta)
    )
    paquete_db = session.exec(paquete_query).first()
    
    if not paquete_db:
        raise HTTPException(status_code=404, detail="Paquete no encontrado.")
    
    # 2. Verificamos que el paquete tenga una hoja de ruta asignada
    if not paquete_db.hoja_de_ruta:
        raise HTTPException(status_code=400, detail="El paquete no está asignado a ninguna hoja de ruta.")

    # 3. Verificación de seguridad: ¿este paquete pertenece a la ruta del mensajero?
    if not current_user.agente_entrega or paquete_db.hoja_de_ruta.agente_entrega_id != current_user.agente_entrega.id:
         raise HTTPException(status_code=403, detail="No tienes permiso sobre este paquete.")

    paquete_db.estado_entrega = "entregado"
    session.add(paquete_db)
    session.commit()
    session.refresh(paquete_db)
    
    # Recargamos la relación del pedido para una respuesta completa
    session.refresh(paquete_db.pedido)
    
    return paquete_db


@app.patch("/logistica/paquetes/{paquete_id}/fallido", response_model=schemas.PaqueteRead, tags=["App Mensajero"])
def marcar_paquete_fallido(
    paquete_id: int,
    fallo_data: schemas.RegistroEntregaFallida,
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    print(f"\n--- INICIANDO PROCESO DE ENTREGA FALLIDA PARA PAQUETE ID: {paquete_id} ---")

    # 1. Obtenemos el paquete y TODAS las relaciones anidadas que necesitaremos
    paquete_db = session.get(models.Paquete, paquete_id)
    if not paquete_db:
        raise HTTPException(status_code=404, detail="Paquete no encontrado.")
    
    # --- LOGS DE DEPURACIÓN ---
    print(f"Paquete encontrado: ID={paquete_db.id}, Pedido ID={paquete_db.pedido_id}, Hoja de Ruta ID={paquete_db.hoja_de_ruta_id}")

    # Forzamos la carga explícita si la relación no está cargada (esto es redundante pero seguro)
    if not hasattr(paquete_db, 'hoja_de_ruta') or not paquete_db.hoja_de_ruta:
        session.refresh(paquete_db, attribute_names=['hoja_de_ruta'])
    if not hasattr(paquete_db, 'pedido') or not paquete_db.pedido:
        session.refresh(paquete_db, attribute_names=['pedido'])
        if paquete_db.pedido and (not hasattr(paquete_db.pedido, 'cliente') or not paquete_db.pedido.cliente):
             session.refresh(paquete_db.pedido, attribute_names=['cliente'])
    
    # --- MÁS LOGS DE DEPURACIÓN ---
    print(f"Hoja de Ruta cargada: {paquete_db.hoja_de_ruta is not None}")
    print(f"Pedido cargado: {paquete_db.pedido is not None}")
    if paquete_db.pedido:
        print(f"Cliente cargado: {paquete_db.pedido.cliente is not None}")
        if paquete_db.pedido.cliente:
            print(f"Celular del cliente: {paquete_db.pedido.cliente.celular}")

    # --- VERIFICACIONES DE SEGURIDAD Y LÓGICA ---
    if not paquete_db.hoja_de_ruta:
        raise HTTPException(status_code=400, detail="El paquete no está asignado a ninguna hoja de ruta.")

    if not current_user.agente_entrega or paquete_db.hoja_de_ruta.agente_entrega_id != current_user.agente_entrega.id:
         raise HTTPException(status_code=403, detail="No tienes permiso sobre este paquete.")

    paquete_db.estado_entrega = "no_entregado"
    paquete_db.motivo_fallo = fallo_data.motivo_fallo
    session.add(paquete_db)
    session.commit()
    session.refresh(paquete_db)

    # --- LÓGICA DE NOTIFICACIÓN ---
    if paquete_db.pedido and paquete_db.pedido.cliente:
        print("Condición para notificación CUMPLIDA. Llamando a send_whatsapp_message...")
        cliente_celular = paquete_db.pedido.cliente.celular
        mensaje = f"Hola {paquete_db.pedido.cliente.nombre_completo}, intentamos entregar tu pedido #{paquete_db.pedido.id} pero no fue posible. Motivo: {fallo_data.motivo_fallo}."
        
        if not cliente_celular.startswith('+'):
             cliente_celular = f"+57{cliente_celular}"
        
        notifications.send_whatsapp_message(to=cliente_celular, body=mensaje)
    else:
        print("ADVERTENCIA: Condición para notificación NO CUMPLIDA.")

    print("--- FIN DEL PROCESO DE ENTREGA FALLIDA ---")
    return paquete_db


@app.patch("/logistica/mi_ruta_activa/finalizar", response_model=schemas.HojaDeRutaRead, tags=["App Mensajero", "Cierre"])
def finalizar_mi_ruta(
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Endpoint para la App Móvil. El mensajero marca su ruta como 'finalizada'.
    """
    if not current_user.agente_entrega:
        raise HTTPException(status_code=404, detail="Este usuario no es un agente de entrega.")

    # Busca la ruta en curso del mensajero
    ruta_en_curso = session.exec(select(models.HojaDeRuta).where(
        models.HojaDeRuta.agente_entrega_id == current_user.agente_entrega.id,
        models.HojaDeRuta.estado == "en_curso"
    )).first()

    if not ruta_en_curso:
        raise HTTPException(status_code=404, detail="No tienes una ruta en curso para finalizar.")
    
    ruta_en_curso.estado = "finalizada"
    session.add(ruta_en_curso)
    session.commit()
    session.refresh(ruta_en_curso)

    return ruta_en_curso


@app.post("/cierre/paquetes/{paquete_id}/registrar_pago", status_code=status.HTTP_201_CREATED, tags=["Cierre"])
def registrar_pago_copago(
    paquete_id: int,
    transaccion_data: schemas.TransaccionCreate,
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Registra una transacción financiera (copago) para un paquete entregado.
    Endpoint para el administrador.
    """
    if not current_user.rol or current_user.rol.nombre != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado.")

    paquete = session.get(models.Paquete, paquete_id)
    if not paquete:
        raise HTTPException(status_code=404, detail="Paquete no encontrado.")
    
    if paquete.estado_entrega != "entregado":
        raise HTTPException(status_code=400, detail="Solo se puede registrar pago para paquetes entregados.")

    transaccion = models.TransaccionFinanciera(
        **transaccion_data.model_dump(),
        paquete_id=paquete_id
    )
    session.add(transaccion)
    session.commit()
    
    return {"status": "ok", "message": f"Pago de {transaccion_data.monto_cobrado} registrado para el paquete {paquete_id}."}


@app.get("/cierre/hoja_de_ruta/{ruta_id}/resumen", tags=["Cierre"])
def get_resumen_ruta(
    ruta_id: int,
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Devuelve un resumen de una hoja de ruta para la conciliación.
    """
    if not current_user.rol or current_user.rol.nombre != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado.")

    ruta = session.get(models.HojaDeRuta, ruta_id)
    if not ruta:
        raise HTTPException(status_code=404, detail="Hoja de ruta no encontrada.")

    # Contamos los paquetes por estado
    paquetes_entregados = [p for p in ruta.paquetes if p.estado_entrega == "entregado"]
    paquetes_no_entregados = [p for p in ruta.paquetes if p.estado_entrega == "no_entregado"]
    
    # Calculamos el total recaudado (o que se debería haber recaudado)
    # A futuro, el valor del copago debería estar en la tabla Pedido
    total_recaudado_esperado = len(paquetes_entregados) * 5.00 # Asumimos un copago fijo de 5.00

    return {
        "ruta_id": ruta.id,
        "agente": ruta.agente_entrega.nombre_agente,
        "estado_ruta": ruta.estado,
        "resumen_paquetes": {
            "total": len(ruta.paquetes),
            "entregados": len(paquetes_entregados),
            "no_entregados": len(paquetes_no_entregados),
        },
        "resumen_financiero": {
            "total_recaudado_esperado": total_recaudado_esperado
        },
        "detalle_no_entregados": [
            {"paquete_id": p.id, "motivo": p.motivo_fallo} for p in paquetes_no_entregados
        ]
    }

@app.get("/logistica/lotes/", response_model=List[schemas.LoteMedicamentoRead], tags=["Logística"])
def get_lotes(
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Devuelve una lista de todos los lotes de medicamentos registrados.
    """
    query = select(models.LoteMedicamento).options(selectinload(models.LoteMedicamento.medicamento))
    lotes = session.exec(query).all()
    return lotes

@app.get("/logistica/pedidos_aprobados_resumen", response_model=schemas.ResumenPedidosAprobados, tags=["Logística"])
def get_pedidos_aprobados_resumen(
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Devuelve un resumen de los pedidos listos para ser incluidos en una ola.
    """
    if not current_user.rol or current_user.rol.nombre not in ["operador", "admin"]:
        raise HTTPException(status_code=403, detail="Acceso denegado.")

    query = select(models.Pedido).where(models.Pedido.estado == "aprobado").options(
        selectinload(models.Pedido.cliente) # Cargamos el cliente para mostrar info
    )
    pedidos_aprobados = session.exec(query).all()

    return schemas.ResumenPedidosAprobados(
        total_pedidos_aprobados=len(pedidos_aprobados),
        pedidos=pedidos_aprobados # Devolvemos todos para la UI, podríamos limitar a futuro
    )

@app.get("/catalogo/centros_operacion", response_model=List[schemas.CentroOperacionRead], tags=["Catálogo"])
def get_centros_operacion(
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    centros = session.exec(select(models.CentroOperacion)).all()
    return centros

@app.get("/logistica/paquetes/listos", response_model=List[schemas.PaqueteRead], tags=["Logística"])
def get_paquetes_listos_para_despacho(
    zona: str, # <-- Recibimos la zona como query parameter
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    """Devuelve todos los paquetes en estado 'en_bodega' para una zona específica."""
    query = select(models.Paquete).join(models.Pedido).where(
        models.Paquete.estado_entrega == "en_bodega",
        models.Pedido.zona == zona # <-- Filtramos por la zona
    ).options(
        selectinload(models.Paquete.pedido).selectinload(models.Pedido.cliente)
    )
    paquetes = session.exec(query).all()
    return paquetes


@app.get("/catalogo/agentes_entrega", response_model=List[schemas.AgenteEntregaRead], tags=["Catálogo"])
def get_agentes_entrega(
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    """Devuelve una lista de todos los agentes de entrega."""
    agentes = session.exec(select(models.AgenteEntrega)).all()
    return agentes


@app.get("/logistica/mi_ruta_activa", response_model=schemas.HojaDeRutaRead, tags=["App Mensajero"])
def get_mi_ruta_activa(
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Endpoint para la App Móvil. Devuelve la hoja de ruta activa (en estado
    'planificada' o 'en_curso') para el mensajero actualmente autenticado.

    Si la ruta está 'planificada', la primera vez que se consulta, su estado
    se actualiza a 'en_curso'.
    """
    
    # 1. Verificar que el usuario actual es un agente de entrega
    # La relación 'agente_entrega' se carga perezosamente aquí.
    if not current_user.agente_entrega:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Este usuario no está registrado como un agente de entrega."
        )

    # Obtenemos el ID del agente de entrega asociado al usuario
    agente_id = current_user.agente_entrega.id
    
    # 2. Construir la consulta para encontrar la ruta activa
    # Una ruta activa es aquella que no está en estado 'finalizada'
    ruta_query = select(models.HojaDeRuta).where(
        models.HojaDeRuta.agente_entrega_id == agente_id,
        models.HojaDeRuta.estado != "finalizada"
    ).options(
        # Usamos 'selectinload' anidado para cargar eficientemente todas las relaciones
        # que necesitamos para mostrar los detalles completos en la app.
        selectinload(models.HojaDeRuta.paquetes)
        .selectinload(models.Paquete.pedido)
        .selectinload(models.Pedido.cliente),
        
        selectinload(models.HojaDeRuta.paquetes)
        .selectinload(models.Paquete.pedido)
        .selectinload(models.Pedido.items)
    )
    
    # 3. Ejecutar la consulta
    ruta_activa = session.exec(ruta_query).first()

    # 4. Manejar el caso de que no se encuentre una ruta
    if not ruta_activa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No tienes una ruta activa asignada en este momento."
        )

    # 5. Lógica de negocio: cambiar estado a 'en_curso'
    # Si la ruta estaba 'planificada', significa que el mensajero la está viendo
    # por primera vez, así que la marcamos como 'en_curso'.
    if ruta_activa.estado == "planificada":
        print(f"La ruta {ruta_activa.id} está cambiando de 'planificada' a 'en_curso'.")
        ruta_activa.estado = "en_curso"
        session.add(ruta_activa)
        session.commit()
        session.refresh(ruta_activa) # Refrescamos para que la respuesta incluya el nuevo estado

    # 6. Devolver la ruta
    return ruta_activa

@app.get("/logistica/rutas_activas", response_model=List[schemas.HojaDeRutaRead], tags=["Logística"])
def get_rutas_activas(
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Devuelve una lista de todas las hojas de ruta que están activas,
    es decir, en estado 'planificada' o 'en_curso'.
    """
    if not current_user.rol or current_user.rol.nombre not in ["admin", "operador"]:
        raise HTTPException(status_code=403, detail="Acceso denegado.")

    # Corregimos la consulta para que incluya ambos estados
    query = select(models.HojaDeRuta).where(
        models.HojaDeRuta.estado.in_(["planificada", "en_curso"])
    ).options(
        selectinload(models.HojaDeRuta.agente_entrega),
        selectinload(models.HojaDeRuta.paquetes)
    )
    rutas = session.exec(query).all()
    return rutas

@app.get("/cierre/rutas_finalizadas", response_model=List[schemas.HojaDeRutaRead], tags=["Cierre"])
def get_rutas_finalizadas(
    session: Session = Depends(get_session),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Devuelve una lista de todas las hojas de ruta que están en estado 'finalizada'.
    """
    if not current_user.rol or current_user.rol.nombre != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Se requiere rol de administrador.")

    query = select(models.HojaDeRuta).where(models.HojaDeRuta.estado == "finalizada").options(
        selectinload(models.HojaDeRuta.agente_entrega)
    )
    rutas = session.exec(query).all()
    return rutas

@app.get("/", tags=["Root"])
def read_root():
    """
    Endpoint raíz para verificar que la API está en funcionamiento.
    """
    return {"status": "ok", "message": "Bienvenido a la API de Farmacia"}

@app.post("/zonas/", response_model=schemas.ZonaRead, tags=["Zonas"])
def create_zona(
    zona_data: schemas.ZonaCreate,
    session: Session = Depends(get_session)
):
    """
    Crea una nueva zona (geocerca) a partir de su nombre y su
    geometría en formato WKT (Well-Known Text).
    """
    # GeoAlchemy2 convierte automáticamente el string WKT al formato de PostGIS
    zona_db = models.Zona(nombre=zona_data.nombre, geom=zona_data.geom_wkt)
    session.add(zona_db)
    session.commit()
    session.refresh(zona_db)
    return zona_db

@app.get("/zonas/", response_model=List[schemas.ZonaRead], tags=["Zonas"])
def get_zonas(session: Session = Depends(get_session)):
    """
    Devuelve una lista de todas las zonas configuradas.
    """
    zonas = session.exec(select(models.Zona)).all()
    return zonas