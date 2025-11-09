import logging
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import Annotated, List

from .. import schemas, models
from ..database import get_db
from ..exceptions import (
    DataNotFoundError,
    DuplicateDataError,
    StorageLimitExceededError,
)
from .. import services
from .dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/data")


@router.post(
    "/credentials",
    response_model=schemas.DataResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Credenciais"],
)
def create_credential(
    credential_data: schemas.DataCreateCredential,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    requests: Request,
    tasks: BackgroundTasks,
):
    """Cria uma nova credential para o usuário logado."""
    ip = requests.client.host if requests.client else "desconhecido"
    dispositivo = requests.headers.get("User-Agent", "desconhecido")
    log_context = schemas.LogContext(ip=ip, dispositivo=dispositivo)
    try:
        created_data = services.create_credential(
            db=db,
            user=current_user,
            credential_data=credential_data,
            log_context=log_context,
            tasks=tasks,
        )
        return created_data
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except DuplicateDataError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except DataNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(
            f"Falha ao criar credencial do usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao criar credencial.",
        )


@router.post(
    "/files",
    status_code=status.HTTP_201_CREATED,
    response_model=schemas.DataResponse,
    tags=["Arquivos"],
)
def create_file(
    file_data: schemas.DataCreateFile,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    requests: Request,
    tasks: BackgroundTasks,
):
    """Cria um novo arquivo (enviado como Base64)."""
    ip = requests.client.host if requests.client else "desconhecido"
    dispositivo = requests.headers.get("User-Agent", "desconhecido")
    log_context = schemas.LogContext(ip=ip, dispositivo=dispositivo)
    try:
        created_file = services.create_file(
            db=db,
            user=current_user,
            file_data=file_data,
            log_context=log_context,
            tasks=tasks,
        )
        return created_file
    except DataNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except DuplicateDataError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except StorageLimitExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(e)
        )
    except Exception as e:
        logger.error(
            f"Falha ao criar arquivo do usuário {current_user.id}: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao salvar o arquivo.",
        )


@router.get("/{data_id}", response_model=schemas.DataResponse, tags=["Dados"])
def get_single_data_entry(
    data_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    requests: Request,
    tasks: BackgroundTasks,
):
    """Busca e retorna um Dado específico (arquivo ou credencial)."""
    ip = requests.client.host if requests.client else "desconhecido"
    dispositivo = requests.headers.get("User-Agent", "desconhecido")
    log_context = schemas.LogContext(ip=ip, dispositivo=dispositivo)
    try:
        db_dado = services.get_specific_data(
            db=db,
            user=current_user,
            data_id=data_id,
            log_context=log_context,
            tasks=tasks,
        )
        return db_dado
    except DataNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(
            f"Falha ao buscar dado com id {data_id} do usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar o dado.",
        )


@router.patch(
    "/credentials/{data_id}", response_model=schemas.DataResponse, tags=["Credenciais"]
)
def update_credential_entry(
    data_id: int,
    update_data: schemas.DataUpdateCredential,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    requests: Request,
    tasks: BackgroundTasks,
):
    """Atualiza um Dado existente do tipo Senha."""
    ip = requests.client.host if requests.client else "desconhecido"
    dispositivo = requests.headers.get("User-Agent", "desconhecido")
    log_context = schemas.LogContext(ip=ip, dispositivo=dispositivo)
    try:
        updated_dado = services.edit_credential_data(
            db=db,
            user=current_user,
            data_id=data_id,
            update_data=update_data,
            log_context=log_context,
            tasks=tasks,
        )
        return updated_dado
    except DataNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except DuplicateDataError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    except Exception as e:
        logger.error(
            f"Falha ao atualizar credencial {data_id} do usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao atualizar a credencial.",
        )


@router.patch(
    "/files/{data_id}", response_model=schemas.DataResponse, tags=["Arquivos"]
)
def update_file_entry(
    data_id: int,
    update_data: schemas.DataUpdateFile,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    requests: Request,
    tasks: BackgroundTasks,
):
    """Atualiza um Dado existente do tipo Arquivo."""
    ip = requests.client.host if requests.client else "desconhecido"
    dispositivo = requests.headers.get("User-Agent", "desconhecido")
    log_context = schemas.LogContext(ip=ip, dispositivo=dispositivo)
    try:
        updated_dado = services.edit_file_data(
            db=db,
            user=current_user,
            data_id=data_id,
            update_data=update_data,
            log_context=log_context,
            tasks=tasks,
        )
        return updated_dado
    except DuplicateDataError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except DataNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except StorageLimitExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(e)
        )
    except Exception as e:
        logger.error(
            f"Falha ao atualizar arquivo {data_id} do usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao atualizar o arquivo.",
        )


@router.delete("/{data_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Dados"])
def delete_data(
    data_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    requests: Request,
    tasks: BackgroundTasks,
):
    """Apaga um Dado específico (credencial ou arquivo)."""
    ip = requests.client.host if requests.client else "desconhecido"
    dispositivo = requests.headers.get("User-Agent", "desconhecido")
    log_context = schemas.LogContext(ip=ip, dispositivo=dispositivo)
    try:
        services.delete_data_by_id(
            db=db,
            user=current_user,
            dado_id=data_id,
            log_context=log_context,
            tasks=tasks,
        )
        return None
    except DataNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(
            f"Falha ao apagar dado {data_id} do usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao apagar o dado.",
        )


@router.post("/search", response_model=List[schemas.DataResponse], tags=["Dados"])
def search_data_paginated(
    payload: schemas.FilterPageConfig,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """Busca paginada de dados."""
    try:
        data = services.get_data_paginated_filtered(db, current_user, payload)
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Falha ao buscar dados paginados do usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar dados.",
        )
