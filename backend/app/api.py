from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import repository

from . import schemas, services
from .database import get_db

router = APIRouter()


@router.post(
    "/users/",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Users"],
)
def create_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Endpoint para criar um novo usuário.
    """
    # Delega a criação para a camada de serviço
    return services.register_user(db=db, user_data=user_data)


@router.post("/login", response_model=schemas.LoginResponse, tags=["Authentication"])
def login(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Autentica um usuário e retorna um token JWT junto com o salt para criptografia.

    - **username**: O email do usuário.
    - **password**: A senha mestra do usuário (em texto plano, protegida por HTTPS).
    """
    # Delega toda a lógica de autenticação para a camada de serviço
    login_response = services.authenticate_and_login_user(
        db=db, email=form_data.username, password=form_data.password
    )
    # endpoint só se preocupa com a resposta HTTP
    if not login_response:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return login_response


@router.get(
    "/users/{user_id}",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_200_OK,
    tags=["Users"],
)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)) -> schemas.UserResponse:
    return repository.get_user(db, user_id)
