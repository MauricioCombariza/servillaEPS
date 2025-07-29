import flet as ft
import time
import os
from dotenv import load_dotenv

# --- Carga de Variables de Entorno ---
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)
DYNAMSOFT_LICENSE_KEY = os.environ.get("DYNAMSOFT_LICENSE_KEY")

if not DYNAMSOFT_LICENSE_KEY:
    raise ValueError("Error: No se encontró la variable de entorno DYNAMSOFT_LICENSE_KEY.")

def main(page: ft.Page):
    page.title = "Prueba de Escáner (v4 - Estable)"
    page.padding = 20

    # --- Controles ---
    txt_resultado = ft.Text("Presiona 'Iniciar Escáner'", size=16)
    col_historial = ft.Column(scroll=ft.ScrollMode.ADAPTIVE, expand=True)
    video_container = ft.Container(
        uid="video_container_uid", # Usamos UID para referenciarlo
        width=300,
        height=300,
        border=ft.border.all(2, ft.colors.GREY_400),
        border_radius=ft.border_radius.all(10),
    )

    # --- Lógica de la App ---
    def on_barcode_scanned(e):
        codigo_escaneado = e.data
        txt_resultado.value = f"Último escaneo: {codigo_escaneado}"
        col_historial.controls.insert(0, ft.Text(f"{time.strftime('%H:%M:%S')} - {codigo_escaneado}"))
        page.update()

    page.expose(on_barcode_scanned)

    def iniciar_escaner(e):
        # El ID del elemento en el DOM es el UID del control
        video_uid = video_container.uid
        page.invoke_js(
            "startScanner",
            DYNAMSOFT_LICENSE_KEY,
            video_uid,
            "on_barcode_scanned"
        )

    # --- Estructura de la Página ---
    page.add(
        ft.Text("Resultado:", weight=ft.FontWeight.BOLD),
        txt_resultado,
        video_container,
        ft.ElevatedButton("Iniciar Escáner", on_click=iniciar_escaner),
        ft.Divider(),
        ft.Text("Historial:", weight=ft.FontWeight.BOLD),
        col_historial,
    )
    page.update()

# --- Iniciar la App ---
ft.app(
    target=main, 
    assets_dir="assets", 
    web_renderer="html", # Le decimos a Flet que use nuestro index.html
    view=ft.WEB_BROWSER
)