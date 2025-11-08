import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Annotated

# Imports de dentro do projeto
from .. import schemas, models
from ..database import get_db
from ..exceptions import UserNotFoundError, EmailAlreadyExistsError
from ..services import service_user
from .dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Usuário"])


@router.post(
    "/users",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(user_data: schemas.UserCreate, db: Annotated[Session, Depends(get_db)]):
    """Endpoint para registrar um novo usuário."""
    try:
        db_user = service_user.register_user(db=db, user_data=user_data)
        if db_user is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Email já registrado."
            )
    except Exception as e:
        logger.error(f"Falha ao criar conta: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Não foi possível criar a conta.",
        )

    return db_user


@router.post("/login", response_model=schemas.LoginResponse)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
):
    """Endpoint para autenticar um usuário."""
    try:
        login_response = service_user.authenticate_and_login_user(
            db=db, email=form_data.username, password=form_data.password
        )
        if not login_response:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        logger.error(f"Falha ao autenticar usuário: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao autenticar usuário",
        )
    return login_response


@router.get("/users/me", response_model=schemas.UserResponse)
def get_user_me(current_user: Annotated[models.Usuario, Depends(get_current_user)]):
    """Retorna os dados do usuário logado atualmente."""
    return current_user


@router.patch("/users/me", response_model=schemas.UserResponse)
def update_user_me(
    update_data: schemas.UserUpdate,
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Atualiza os dados (nome ou email) do usuário logado."""
    try:
        updated_user = service_user.edit_user(
            db=db, user=current_user, update_data=update_data
        )
        return updated_user
    except UserNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except EmailAlreadyExistsError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.error(f"Falha ao atualizar usuário: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao atualizar usuário.",
        )


@router.delete("/users/me/data", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_data(
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Apaga todos os dados do usuário logado, mantendo a conta"""
    try:
        service_user.clear_all_user_data(db=db, user_id=current_user.id)
        return None

    except Exception as e:
        logger.error(
            f"Falha ao limpar dados do usuário {current_user.id}: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Não foi possível apagar os dados do usuário.",
        )


@router.delete("/users/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_me(
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Apaga a conta do usuário logado"""
    try:
        service_user.delete_user(db=db, user_id=current_user.id)
        return None

    except Exception as e:
        logger.error(
            f"Falha ao deletar conta do usuário {current_user.id}: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Não foi possível apagar a conta do usuário.",
        )


@router.get(
    "/users/me/dashboard", response_model=schemas.DashboardResponse, tags=["Usuário"]
)
def get_user_dashboard_stats(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """
    Retorna as estatísticas de armazenamento para o dashboard
    do usuário logado.
    """
    try:
        dashboard_data = service_user.get_dashboard_stats(db, user=current_user)
        return dashboard_data
    except Exception as e:
        logger.error(
            f"Falha ao obter dados do dashboard do usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao gerar estatísticas do dashboard.",
        )
