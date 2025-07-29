# backend/app/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select

from . import models
from .db import get_session

# --- Configuración de Seguridad ---
# Clave secreta para firmar los tokens JWT. En una app real, esto debe
# venir de una variable de entorno y ser mucho más complejo.
SECRET_KEY = "una-clave-secreta-muy-dificil-de-adivinar"
ALGORITHM = "HS256"  # Algoritmo de firma
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Duración del token

# Contexto de Passlib para el hashing de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Esquema OAuth2 ---
# Le dice a FastAPI en qué URL debe buscar el token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# --- Funciones de Hashing de Contraseñas ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña en texto plano contra su hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Genera el hash de una contraseña."""
    return pwd_context.hash(password)


# --- Funciones de Tokens JWT ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un nuevo token de acceso JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    session: Session = Depends(get_session)
) -> models.Usuario:
    """
    Decodifica el token, valida las credenciales y devuelve el usuario.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decodifica el token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Busca al usuario en la base de datos
    user = session.exec(select(models.Usuario).where(models.Usuario.email == email)).first()
    if user is None:
        raise credentials_exception
    
    return user
