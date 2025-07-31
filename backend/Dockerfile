# 1. Usar una imagen base oficial de Python
FROM python:3.11-slim

# 1.5. Instalar dependencias del sistema operativo (sin cambios)
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# 2. Establecer el directorio de trabajo
WORKDIR /app

# 3. Copiar e instalar dependencias de producción
#    Asegúrate de que 'gunicorn' esté en requirements.txt
COPY ./requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# 4. Copiar el código de la aplicación
COPY ./app /app/app
# Copiamos los otros archivos necesarios, como el de zonificación
COPY ./app/zonificacion.py /app/app/zonificacion.py
COPY ./app/routing.py /app/app/routing.py

# 5. Exponer el puerto
EXPOSE 8000 
# Render usará este puerto, pero internamente lo mapea a 443 (HTTPS)

# --- ¡INSTRUCCIÓN CLAVE PARA RENDER! ---
# 6. Definir el comando para iniciar la aplicación en producción
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app"]