import os
import openrouteservice
from typing import List, Tuple
from openrouteservice.optimization import Job, Vehicle

ORS_API_KEY = os.environ.get("ORS_API_KEY")

def obtener_ruta_optimizada(
    coordenadas: List[Tuple[float, float]]
) -> List[int]:
    if not ORS_API_KEY:
        print("ADVERTENCIA: No se encontró la clave de API de OpenRouteService. Se devolverá un orden secuencial.")
        return list(range(1, len(coordenadas)))
    if len(coordenadas) < 2:
        return []

    client = openrouteservice.Client(key=ORS_API_KEY)

    try:
        # El primer elemento de 'coordenadas' es siempre la bodega (inicio y fin)
        bodega_coords = coordenadas[0]

        # Los 'jobs' son solo las paradas de entrega, no incluimos la bodega aquí
        jobs = [Job(id=i, location=coord) for i, coord in enumerate(coordenadas[1:], start=1)]

        # --- LA CORRECCIÓN CLAVE ESTÁ AQUÍ ---
        # Usamos 'start' y 'end' con las coordenadas, no 'start_index'
        vehicle = Vehicle(
            id=1, 
            profile="driving-car", 
            start=bodega_coords, # Coordenadas del punto de inicio
            end=bodega_coords    # Coordenadas del punto de fin
        )
        
        print(f"Enviando {len(jobs)} trabajos y 1 vehículo a la API de OpenRouteService...")
        optimized_route = client.optimization(
            jobs=jobs,
            vehicles=[vehicle],
            geometry=False,
        )
        
        # El orden de las paradas viene en la propiedad 'steps' del vehículo
        # Y ahora el 'id' corresponde directamente al id que le dimos al Job
        paradas_ordenadas = [step['id'] for step in optimized_route['routes'][0]['steps']]

        print(f"Orden de ruta optimizado por ORS: {paradas_ordenadas}")
        return paradas_ordenadas

    except openrouteservice.exceptions.ApiError as e:
        print(f"Error al llamar a la API de OpenRouteService: {e}")
        return list(range(1, len(coordenadas)))
    except Exception as e:
        print(f"Error inesperado durante la optimización de ruta: {e}")
        return list(range(1, len(coordenadas)))