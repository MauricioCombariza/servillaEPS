# backend/app/zonificacion.py

def asignar_zona_por_direccion(direccion: str) -> str:
    """
    Asigna una zona a un pedido basado en palabras clave en la dirección.
    Esta es una implementación simple para el MVP.
    """
    direccion_lower = direccion.lower()

    # Definimos nuestras reglas de zonificación basadas en palabras clave
    if "norte" in direccion_lower or "usaquén" in direccion_lower or "calle 170" in direccion_lower:
        return "NORTE"
    elif "sur" in direccion_lower or "usme" in direccion_lower or "bosa" in direccion_lower:
        return "SUR"
    elif "chapinero" in direccion_lower or "teusaquillo" in direccion_lower or "calle 85" in direccion_lower:
        return "CHAPINERO"
    elif "engativá" in direccion_lower or "fontibón" in direccion_lower or "calle 26" in direccion_lower:
        return "OCCIDENTE"
    else:
        return "CENTRO" # Zona por defecto si no hay coincidencias