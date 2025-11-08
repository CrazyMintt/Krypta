import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated, List

from .. import schemas, models
from ..database import get_db
from ..exceptions import DataNotFoundError, SeparatorNameTakenError
from ..services import service_separador
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
):
    """Cria uma nova pasta."""
    try:
        created_folder = service_separador.create_folder(
            db=db, user_id=current_user.id, folder_data=folder_data
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
):
    """Cria uma nova tag."""
    try:
        created_tag = service_separador.create_tag(
            db=db, user_id=current_user.id, tag_data=tag_data
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
        tags = service_separador.get_tags_by_user(db, user_id=current_user.id)
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
        folders = service_separador.get_root_folders(db, user_id=current_user.id)
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
        subfolders = service_separador.get_child_folders(
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
):
    """Atualiza uma pasta (muda nome e/ou pasta pai)."""
    try:
        updated_folder = service_separador.edit_folder(
            db, user_id=current_user.id, folder_id=folder_id, update_data=update_data
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
):
    """Atualiza uma tag (muda nome e/ou cor)."""
    try:
        updated_tag = service_separador.edit_tag(
            db, user_id=current_user.id, tag_id=tag_id, update_data=update_data
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
):
    """Apaga uma Tag específica."""
    try:
        service_separador.delete_tag_by_id(db, user_id=current_user.id, tag_id=tag_id)
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
):
    """Apaga uma Pasta e TODO o seu conteúdo recursivamente."""
    try:
        service_separador.delete_folder_recursively(
            db, user_id=current_user.id, folder_id=folder_id
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
