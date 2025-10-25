from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Annotated
from jose import ExpiredSignatureError, JWTError

from . import schemas, services, repository, core, models
from .database import get_db
from .exceptions import UserNotFoundError, EmailAlreadyExistsError

router = APIRouter()

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
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token Expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise credentials_exception
    user = repository.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user


@router.post(
    "/users/",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Users"],
)
def create_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Endpoint para registrar um novo usuário."""
    db_user = services.register_user(db=db, user_data=user_data)

    # A API traduz a falha do serviço (None) para um erro HTTP
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email já registrado."
        )
    return db_user


@router.post("/login", response_model=schemas.LoginResponse, tags=["Authentication"])
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
):
    """Endpoint para autenticar um usuário."""
    login_response = services.authenticate_and_login_user(
        db=db, email=form_data.username, password=form_data.password
    )
    if not login_response:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return login_response


@router.get("/users/me", response_model=schemas.UserResponse, tags=["Users"])
def get_user_me(current_user: Annotated[models.Usuario, Depends(get_current_user)]):
    """
    Retorna os dados do usuário logado atualmente.
    """
    return current_user


@router.patch("/users/me", response_model=schemas.UserResponse, tags=["Users"])
def update_user_me(
    update_data: schemas.UserBase,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """
    Atualiza os dados (nome ou email) do usuário logado.
    """
    try:
        updated_user = services.edit_user(
            db=db, user_id=current_user.id, update_data=update_data
        )
        return updated_user
    except UserNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except EmailAlreadyExistsError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
