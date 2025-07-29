# backend/app/routing.py
import os
from typing import List, Tuple

# Importamos el cliente principal y las clases necesarias para la optimización
import openrouteservice
from openrouteservice.optimization import Job, Vehicle

# Leemos la clave de la API desde las variables de entorno
ORS_API_KEY = os.environ.get("ORS_API_KEY")

def obtener_ruta_optimizada(
    coordenadas: List[Tuple[float, float]]
) -> List[int]:
    """
    Toma una lista de coordenadas [longitud, latitud] y devuelve el orden
    optimizado de los índices de las paradas usando la API de OpenRouteService.

    Se asume que la primera coordenada (índice 0) es el punto de inicio/fin 
    (la bodega o centro de operación).
    
    :param coordenadas: Una lista de tuplas, donde cada tupla es (longitud, latitud).
    :return: Una lista de enteros que representa el orden de visita de los 
             índices de las paradas (ej. [3, 1, 2]).
    """
    
    # --- Verificaciones Iniciales ---

    # Si no hay clave de API, devolvemos un orden secuencial como fallback
    if not ORS_API_KEY:
        print("ADVERTENCIA: No se encontró la clave de API de OpenRouteService. "
              "Se devolverá un orden secuencial por defecto.")
        # Devolvemos los índices 1, 2, 3... ya que el 0 es la bodega.
        return list(range(1, len(coordenadas)))

    # Si hay menos de 2 coordenadas (solo la bodega), no hay nada que optimizar
    if len(coordenadas) < 2:
        return []

    # --- Construcción de la Petición para ORS ---
    
    try:
        # Inicializamos el cliente de la API con nuestra clave
        client = openrouteservice.Client(key=ORS_API_KEY)

        # 1. Creamos los "Jobs": cada coordenada es un trabajo (parada) a realizar.
        #    Usamos la clase `Job` que espera la librería.
        jobs = [Job(id=i, location=coord) for i, coord in enumerate(coordenadas)]

        # 2. Creamos el "Vehicle": representa a nuestro mensajero.
        #    En este caso, solo tenemos un vehículo.
        vehicle = Vehicle(
            id=1, 
            profile="driving-car",      # Perfil de ruta (coche, bicicleta, a pie, etc.)
            start_index=0,              # El vehículo empieza en el índice 0 de la lista de jobs (la bodega)
            end_index=0                 # Y debe terminar en el índice 0 también (volver a la bodega)
        )
        
        # 3. Llamamos al endpoint de optimización (TSP - Problema del Viajante)
        print(f"Enviando {len(jobs)} trabajos a la API de OpenRouteService para optimización...")
        optimized_route = client.optimization(
            jobs=jobs,                  # Pasamos la lista de objetos Job
            vehicles=[vehicle],         # Pasamos una lista con nuestro objeto Vehicle
            geometry=False,             # No necesitamos el dibujo de la ruta, solo el orden
        )
        
        # 4. Procesamos la respuesta para extraer el orden
        # La respuesta contiene una lista de 'routes', una por vehículo.
        # Dentro de cada ruta, 'steps' nos da el orden de las paradas.
        order_with_start_end = [step['job'] for step in optimized_route['routes'][0]['steps']]
        
        # El orden que devuelve ORS incluye el inicio (0) y el fin (0).
        # Los filtramos para quedarnos solo con las paradas de entrega.
        paradas_ordenadas = [idx for idx in order_with_start_end if idx != 0]

        print(f"Orden de ruta optimizado por ORS: {paradas_ordenadas}")
        return paradas_ordenadas

    except openrouteservice.exceptions.ApiError as e:
        # Manejamos errores específicos de la API de ORS (clave inválida, demasiadas peticiones, etc.)
        print(f"Error al llamar a la API de OpenRouteService: {e}")
        # Como fallback, devolvemos un orden secuencial para que la operación no falle.
        return list(range(1, len(coordenadas)))
        
    except Exception as e:
        # Manejamos cualquier otro error inesperado
        print(f"Error inesperado durante la optimización de ruta: {e}")
        return list(range(1, len(coordenadas)))