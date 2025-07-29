# backend/app/notifications.py
import os
from twilio.rest import Client
from typing import Optional

# No inicializamos el cliente aquí. Lo haremos dentro de la función.
twilio_client: Optional[Client] = None
is_twilio_configured = False



def _initialize_twilio():
    """
    Función interna para inicializar el cliente de Twilio una sola vez.
    """
    global twilio_client, is_twilio_configured
    
    # Obtenemos las credenciales AHORA, cuando se necesita.
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    
    # Imprimimos los logs de depuración aquí para ver qué está obteniendo Python
    print("--- Verificando credenciales de Twilio en tiempo de ejecución ---")
    print(f"TWILIO_ACCOUNT_SID: {account_sid}")
    print(f"TWILIO_AUTH_TOKEN: {'******' if auth_token else None}")
    
    if account_sid and auth_token:
        print("Credenciales encontradas. Inicializando cliente de Twilio.")
        twilio_client = Client(account_sid, auth_token)
        is_twilio_configured = True
    else:
        print("ADVERTENCIA: Faltan credenciales de Twilio. El servicio de notificaciones se ejecutará en modo SIMULACIÓN.")
        is_twilio_configured = False

def send_whatsapp_message(to: str, body: str):
    """
    Envía un mensaje de WhatsApp a un número de teléfono.
    """
    # Inicializamos el cliente solo la primera vez que se llama a esta función
    if twilio_client is None and not is_twilio_configured:
        _initialize_twilio()

    # Leemos el número de origen aquí también, en tiempo de ejecución
    from_number = os.environ.get("TWILIO_WHATSAPP_NUMBER")

    if not is_twilio_configured or not from_number:
        print("--- SIMULACIÓN DE NOTIFICACIÓN WHATSAPP (Twilio no configurado) ---")
        print(f"PARA: whatsapp:{to}")
        print(f"MENSAJE: {body}")
        print("---------------------------------------------------------------")
        return
    
    print(f"Intentando enviar mensaje de WhatsApp a través de Twilio...")
    print(f"DE: {from_number}")
    print(f"A: whatsapp:{to}")
    
    try:
        message = twilio_client.messages.create(
            from_=from_number,
            body=body,
            to=f"whatsapp:{to}"
        )
        print("¡ÉXITO! Mensaje de WhatsApp enviado.")
        print(f"SID del mensaje: {message.sid}")
        print(f"Estado del mensaje: {message.status}")
    except Exception as e:
        print("¡ERROR! Fallo al enviar el mensaje de WhatsApp.")
        print(f"Excepción de Twilio: {e}")