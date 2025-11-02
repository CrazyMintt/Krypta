from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Annotated
from jose import ExpiredSignatureError, JWTError

from .. import core, models
from ..database import get_db
from ..repository import repository_user

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)],
) -> models.Usuario:
    """
    Dependência do FastAPI para decodificar o token e retornar o usuário logado.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as Credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = core.decode_access_token(token)
        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user_id = int(user_id)

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token Expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (JWTError, ValueError):  # Pega erros de decodificação ou falha no int()
        raise credentials_exception

    user = repository_user.get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception
    return user
