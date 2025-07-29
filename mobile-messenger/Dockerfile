# 1. Usar una imagen base de Python oficial y limpia
FROM python:3.11-slim

# 2. Establecer el directorio de trabajo
WORKDIR /app

# 3. Copiar solo el archivo de requerimientos para aprovechar el caché
COPY requirements.txt .

# 4. Instalar las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiar el resto de la aplicación (main.py, assets, etc.)
COPY . .

# 6. Exponer el puerto que usará Flet
EXPOSE 8550

# 7. El comando para iniciar la aplicación Flet
#    Usa el host 0.0.0.0 para que sea accesible desde fuera del contenedor
CMD ["flet", "run", "main.py", "-p", "8550", "-w", "--host", "0.0.0.0"]