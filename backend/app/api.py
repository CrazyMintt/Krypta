from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from typing import Annotated

from . import schemas, services
from .database import get_db

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


@router.post(
    "/users/",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Users"],
)
def create_user(user_data: schemas.UserCreate, db=Depends(get_db)):
    """
    Endpoint para criar um novo usuário.
    """
    # Delega a criação para a camada de serviço
    return services.register_user(db, user_data=user_data)


@router.post("/login", response_model=schemas.LoginResponse, tags=["Authentication"])
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db=Depends(get_db)
):
    """
    Autentica um usuário e retorna um token JWT junto com o salt para criptografia.

    - **username**: O email do usuário.
    - **password**: A senha mestra do usuário (em texto plano, protegida por HTTPS).
    """
    # Delega toda a lógica de autenticação para a camada de serviço
    login_response = services.authenticate_and_login_user(db, 
        email=form_data.username, password=form_data.password
    )

    return login_response


@router.get(
    "/users/",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_200_OK,
    tags=["Users"],
)
def get_current_user(
    current_user: Annotated[schemas.UserResponse, Depends(services.get_current_user)],
):
    return current_user
