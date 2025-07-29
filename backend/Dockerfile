# 1. Usar una imagen base oficial de Python
FROM python:3.11-slim

# 1.5. Instalar dependencias del sistema operativo, incluyendo postgresql-client
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# 2. Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiar solo el archivo de dependencias primero para aprovechar el caché
COPY ./requirements.txt .

# 4. Instalar las dependencias de Python
RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY ./requirements-dev.txt /app/requirements-dev.txt
RUN pip install --no-cache-dir --upgrade -r /app/requirements-dev.txt

# 5. Copiar TODO el resto del código de la aplicación (incluyendo la carpeta 'scripts')
COPY . .

# 6. Dar permisos de ejecución al script, que ahora está en /app/scripts/
RUN chmod +x /app/scripts/wait-for-postgres.sh

# 7. Exponer el puerto
EXPOSE 8000