# backend/app/db.py
import os
from sqlmodel import create_engine, Session, SQLModel

# Usamos la variable de entorno que definimos en docker-compose.yml
DATABASE_URL = os.environ.get("DATABASE_URL")

# El engine es el punto de entrada a nuestra base de datos
engine = create_engine(DATABASE_URL, echo=True) # echo=True muestra las consultas SQL en la terminal

def get_session():
    """
    Función de dependencia para obtener una sesión de base de datos por petición.
    """
    with Session(engine) as session:
        yield session

def create_db_and_tables():
    """
    Función para crear todas las tablas definidas en los modelos.
    """
    print("Creando tablas en la base de datos...")
    SQLModel.metadata.create_all(engine)
    print("Tablas creadas exitosamente.")