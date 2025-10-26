from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt
from pydantic_settings import BaseSettings
import secrets
from zoneinfo import ZoneInfo

# Configurações do JWT


class Settings(BaseSettings):
    SECRET_KEY: str = "uma_chave_secreta_muito_longa_e_dificil_de_adivinhar"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30


settings = Settings()

# Hashing de Senhas
pwd_context = CryptContext(schemes=["argon2"])


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha fornecida corresponde ao hash armazenado."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Gera o hash de uma senha."""
    return pwd_context.hash(password)


def generate_crypto_salt(num_bytes: int = 16) -> str:
    """
    Gera um salt criptograficamente seguro e o retorna como uma string hexadecimal.

    :param num_bytes: O número de bytes de aleatoriedade (16 é o padrão).
    :return: Uma string hexadecimal representando o salt.
    """
    # Gera 16 bytes aleatórios e seguros
    salt_bytes = secrets.token_bytes(num_bytes)

    # Converte os bytes para uma string hexadecimal para armazenamento fácil no banco de dados.
    # 16 bytes se tornam 32 caracteres hexadecimais (0-9, a-f).
    return salt_bytes.hex()


# Token JWT


def create_access_token(data: dict) -> str:
    """Cria um novo token de acesso JWT."""
    to_encode = data.copy()
    expire = datetime.now(ZoneInfo("America/Sao_Paulo")) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, settings.ALGORITHM)
