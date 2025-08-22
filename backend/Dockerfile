# Dockerfile para ENTORNO DE PRODUCCIÓN

FROM python:3.11-slim

WORKDIR /app

# Instalar solo las dependencias de producción
COPY ./requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copiar todo el código de la aplicación
COPY ./app /app/app

# Exponer el puerto
EXPOSE 8000

# Comando para iniciar el servidor de producción
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app"]