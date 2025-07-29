from fastapi.testclient import TestClient

def test_read_docs(client: TestClient):
    """
    Prueba que la documentación generada automáticamente (/docs) se cargue correctamente.
    Esta es una buena "prueba de salud" para una API de FastAPI.
    """
    response = client.get("/docs")
    assert response.status_code == 200
    # Verificamos que el HTML contenga el título de Swagger UI
    assert "Swagger UI" in response.text

def test_login_sin_usuario_existente(client: TestClient):
    """
    Prueba que el endpoint de login devuelve un 401 Unauthorized
    cuando se intenta iniciar sesión con un usuario que no existe en la
    base de datos de prueba (que está vacía para esta prueba).
    """
    response = client.post("/token", data={"username": "noexiste@test.com", "password": "pw"})
    assert response.status_code == 401
    assert "WWW-Authenticate" in response.headers