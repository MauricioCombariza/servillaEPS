# backend/app/routing_service.py
import os
import httpx
from typing import List, Dict, Optional

# =================================================================
# ==                  CONFIGURACIÓN DEL SERVICIO                 ==
# =================================================================

# Leemos la clave de API desde las variables de entorno
ORS_API_KEY = os.environ.get("OPENROUTESERVICE_API_KEY")

# URLs base para los endpoints de la API de ORS
ORS_GEOCODE_URL = "https://api.openrouteservice.org/geocode/search"
ORS_DIRECTIONS_URL = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"


# =================================================================
# ==                  FUNCIÓN DE GEOCODIFICACIÓN                 ==
# =================================================================

async def geocode_address(address: str, city: str, country: str = "Colombia") -> Optional[Dict[str, str]]:
    """
    Convierte una dirección de texto en coordenadas geográficas (latitud y longitud).
    Devuelve un diccionario {'lat': '...', 'lon': '...'} o None si no se encuentra.
    """
    if not ORS_API_KEY:
        print("ADVERTENCIA: Geocodificación deshabilitada. Falta la clave de API de OpenRouteService.")
        # Devolvemos coordenadas de prueba para que el desarrollo pueda continuar sin una clave real
        return {'lon': '-74.08175', 'lat': '4.60971'}

    # Parámetros para la petición GET a la API de geocodificación
    params = {
        "api_key": ORS_API_KEY,
        "text": f"{address}, {city}, {country}",
        "size": 1  # Solo nos interesa el resultado más probable
    }

    async with httpx.AsyncClient() as client:
        try:
            print(f"Geocodificando dirección: {params['text']}")
            response = await client.get(ORS_GEOCODE_URL, params=params, timeout=10.0)
            response.raise_for_status()  # Lanza un error para respuestas 4xx/5xx
            data = response.json()
            
            # Verificamos si la respuesta contiene resultados
            if data and data.get('features'):
                # Las coordenadas están en formato [longitud, latitud]
                coords = data['features'][0]['geometry']['coordinates']
                lon, lat = str(coords[0]), str(coords[1])
                print(f"Dirección geocodificada exitosamente: Lon={lon}, Lat={lat}")
                return {'lon': lon, 'lat': lat}
            
            print(f"No se encontraron resultados de geocodificación para: {address}")
            return None
        except httpx.HTTPStatusError as e:
            print(f"Error HTTP durante la geocodificación de '{address}': {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            print(f"Error inesperado durante la geocodificación: {e}")
            return None


# =================================================================
# ==               FUNCIÓN DE OPTIMIZACIÓN DE RUTA               ==
# =================================================================

async def get_optimized_route(coordinates: List[List[float]]) -> Optional[List[int]]:
    """
    Toma una lista de coordenadas [longitud, latitud], llama a la API de
    direcciones de ORS y devuelve el orden optimizado de los índices.
    
    El primer elemento de la lista de coordenadas se asume como el punto de inicio/fin.
    """
    if not ORS_API_KEY:
        print("ADVERTENCIA: Optimización de ruta deshabilitada. Falta la clave de API de OpenRouteService.")
        # Devolvemos un orden secuencial simple como fallback
        return list(range(len(coordinates)))

    if len(coordinates) < 2:
        return list(range(len(coordinates)))

    headers = {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
    }
    
    # El cuerpo de la petición. 'optimize_waypoints=true' es la clave para la optimización.
    body = {
        "coordinates": coordinates,
        "options": {
            "round_trip": False # No es necesario que la ruta termine en el punto de inicio
        },
        "instructions": False,
        "preference": "fastest", # Optimizar por tiempo
        "optimize_waypoints": True # ¡La opción mágica!
    }

    async with httpx.AsyncClient() as client:
        try:
            print("Enviando petición de optimización de ruta a OpenRouteService...")
            response = await client.post(ORS_DIRECTIONS_URL, json=body, headers=headers, timeout=20.0)
            response.raise_for_status()
            data = response.json()
            
            # El orden optimizado se encuentra en los 'waypoints' de la primera ruta devuelta
            if data and data.get('routes'):
                # El orden de los waypoints en la respuesta es el orden optimizado.
                # 'waypoint_index' se refiere al índice en la lista de coordenadas original.
                optimized_order = [waypoint['waypoint_index'] for waypoint in data['routes'][0]['summary']['waypoints']]
                print(f"Ruta optimizada recibida de ORS: {optimized_order}")
                return optimized_order
            
            print("La respuesta de ORS no contenía una ruta optimizada.")
            return None
            
        except httpx.HTTPStatusError as e:
            print(f"Error HTTP al optimizar la ruta: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            print(f"Error inesperado durante la optimización de ruta: {e}")
            return None