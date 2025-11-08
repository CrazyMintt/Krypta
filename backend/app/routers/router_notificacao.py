from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Annotated, List
import logging

from .. import schemas, services, models, services
from ..database import get_db
from .dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["Notificações"])


@router.get("/", response_model=List[schemas.EventoResponse])
def get_my_notifications(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    page_number: int = Query(1, gt=0, description="Número da página"),
    page_size: int = Query(
        20, gt=0, le=100, description="Tamanho da página (Máx: 100)"
    ),
):
    """
    Busca a lista paginada de notificações (Eventos) para o
    "sininho" do usuário logado.
    """
    try:
        eventos = services.get_user_notifications(
            db, user_id=current_user.id, page_size=page_size, page_number=page_number
        )
        return eventos
    except Exception as e:
        logger.error(
            f"Erro ao buscar notificações para usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar notificações.",
        )
