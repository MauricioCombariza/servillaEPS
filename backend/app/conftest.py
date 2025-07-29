# backend/app/conftest.py
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from app.main import app, get_session

# URL de una base de datos de prueba en memoria (SQLite) para velocidad
# O podríamos configurar una base de datos PostgreSQL de prueba separada
DATABASE_URL_TEST = "sqlite:///./test.db"
engine = create_engine(DATABASE_URL_TEST, connect_args={"check_same_thread": False})

@pytest.fixture(scope="session", autouse=True)
def db_session() -> Generator[Session, None, None]:
    """
    Fixture que gestiona la base de datos de pruebas para toda la sesión.
    """
    # Crea las tablas antes de que empiecen las pruebas
    SQLModel.metadata.create_all(engine)
    yield
    # Borra las tablas después de que terminen las pruebas
    SQLModel.metadata.drop_all(engine)

@pytest.fixture(scope="function")
def session(db_session: Session) -> Generator[Session, None, None]:
    """

    Fixture que proporciona una sesión de base de datos limpia para cada prueba.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(session: Session) -> Generator[TestClient, None, None]:
    """
    Fixture que crea un cliente de pruebas para la API, sobreescribiendo
    la dependencia de la base de datos para usar la base de datos de prueba.
    """
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    yield TestClient(app)
    app.dependency_overrides.clear()