import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Annotated, List

from .. import schemas, models, services
from ..database import get_db
from ..exceptions import DataNotFoundError, SeparatorNameTakenError
from .dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/separators")


@router.post(
    "/folders",
    response_model=schemas.SeparatorResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Pastas"],
)
def create_folder(
    folder_data: schemas.FolderCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    request: Request,
    tasks: BackgroundTasks,
):
    """Cria uma nova pasta."""
    ip = request.client.host if request.client else "desconhecido"
    dispositivo = request.headers.get("User-Agent", "desconhecido")
    log_context = schemas.LogContext(ip=ip, dispositivo=dispositivo)
    try:
        created_folder = services.create_folder(
            db=db,
            user=current_user,
            folder_data=folder_data,
            log_context=log_context,
            tasks=tasks,
        )
        return created_folder
    except SeparatorNameTakenError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except (DataNotFoundError, ValueError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(
            f"Erro ao criar pasta do usuário {current_user.id}: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar pasta.",
        )


@router.post(
    "/tags",
    response_model=schemas.SeparatorResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Tags"],
)
def create_tag(
    tag_data: schemas.TagCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    request: Request,
    tasks: BackgroundTasks,
):
    """Cria uma nova tag."""
    ip = request.client.host if request.client else "desconhecido"
    dispositivo = request.headers.get("User-Agent", "desconhecido")
    log_context = schemas.LogContext(ip=ip, dispositivo=dispositivo)

    try:
        created_tag = services.create_tag(
            db=db,
            user=current_user,
            tag_data=tag_data,
            log_context=log_context,
            tasks=tasks,
        )
        return created_tag
    except SeparatorNameTakenError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.error(
            f"Erro ao criar tag do usuário {current_user.id}: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao criar tag.",
        )


@router.get("/tags", response_model=List[schemas.SeparatorResponse], tags=["Tags"])
def get_all_user_tags(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """Busca a lista plana de todas as Tags do usuário logado."""
    try:
        tags = services.get_tags_by_user(db, user_id=current_user.id)
        return tags
    except Exception as e:
        logger.error(
            f"Erro ao buscar tags do usuário {current_user.id}: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar tags",
        )


@router.get(
    "/folders/root", response_model=List[schemas.SeparatorResponse], tags=["Pastas"]
)
def get_root_level_folders(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """Busca a lista de Pastas que estão no nível raiz."""
    try:
        folders = services.get_root_folders(db, user_id=current_user.id)
        return folders
    except Exception as e:
        logger.error(
            f"Erro ao buscar pastas na raiz do usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao buscar pastas raiz.",
        )


@router.get(
    "/folders/{folder_id}/children",
    response_model=List[schemas.SeparatorResponse],
    tags=["Pastas"],
)
def get_subfolders(
    folder_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """Busca a lista de Subpastas de uma 'folder_id' específica."""
    try:
        subfolders = services.get_child_folders(
            db, user_id=current_user.id, parent_folder_id=folder_id
        )
        return subfolders
    except DataNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(
            f"Erro ao listar pastas filhas da pasta {folder_id} do usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao buscar subpastas.",
        )


@router.patch(
    "/folders/{folder_id}", response_model=schemas.SeparatorResponse, tags=["Pastas"]
)
def update_folder(
    folder_id: int,
    update_data: schemas.FolderUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    request: Request,
    tasks: BackgroundTasks,
):
    """Atualiza uma pasta (muda nome e/ou pasta pai)."""
    ip = request.client.host if request.client else "desconhecido"
    dispositivo = request.headers.get("User-Agent", "desconhecido")
    log_context = schemas.LogContext(ip=ip, dispositivo=dispositivo)

    try:
        updated_folder = services.edit_folder(
            db,
            user=current_user,
            folder_id=folder_id,
            update_data=update_data,
            log_context=log_context,
            tasks=tasks,
        )
        return updated_folder
    except SeparatorNameTakenError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except DataNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(
            f"Erro ao editar pasta {folder_id} do usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao editar pasta.",
        )


@router.patch("/tags/{tag_id}", response_model=schemas.SeparatorResponse, tags=["Tags"])
def update_tag(
    tag_id: int,
    update_data: schemas.TagUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    request: Request,
    tasks: BackgroundTasks,
):
    """Atualiza uma tag (muda nome e/ou cor)."""
    ip = request.client.host if request.client else "desconhecido"
    dispositivo = request.headers.get("User-Agent", "desconhecido")
    log_context = schemas.LogContext(ip=ip, dispositivo=dispositivo)
    try:
        updated_tag = services.edit_tag(
            db,
            user=current_user,
            tag_id=tag_id,
            update_data=update_data,
            log_context=log_context,
            tasks=tasks,
        )
        return updated_tag
    except SeparatorNameTakenError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except DataNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(
            f"Erro ao editar tag {tag_id} do usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao editar tag.",
        )


@router.delete("/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Tags"])
def delete_tag(
    tag_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    request: Request,
    tasks: BackgroundTasks,
):
    """Apaga uma Tag específica."""
    ip = request.client.host if request.client else "desconhecido"
    dispositivo = request.headers.get("User-Agent", "desconhecido")
    log_context = schemas.LogContext(ip=ip, dispositivo=dispositivo)
    try:
        services.delete_tag_by_id(
            db, user=current_user, tag_id=tag_id, log_context=log_context, tasks=tasks
        )
        return None
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except DataNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(
            f"Erro ao apagar tag {tag_id} do usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao deletar tag.",
        )


@router.delete(
    "/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Pastas"]
)
def delete_folder(
    folder_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    request: Request,
    tasks: BackgroundTasks,
):
    """Apaga uma Pasta e TODO o seu conteúdo recursivamente."""
    ip = request.client.host if request.client else "desconhecido"
    dispositivo = request.headers.get("User-Agent", "desconhecido")
    log_context = schemas.LogContext(ip=ip, dispositivo=dispositivo)
    try:
        services.delete_folder_recursively(
            db,
            user=current_user,
            folder_id=folder_id,
            log_context=log_context,
            tasks=tasks,
        )
        return None

    except DataNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(
            f"Erro ao apagar pasta {folder_id} do usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao deletar pasta.",
        )
