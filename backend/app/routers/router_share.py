import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated, List

from .. import schemas, models
from ..database import get_db
from ..exceptions import (
    DataNotFoundError,
)
from ..services import service_share
from .dependencies import get_current_user
import base64

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/shares",
    tags=["Compartilhamento"],
)


@router.post(
    "/",
    response_model=schemas.ShareCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_share(
    share_data: schemas.ShareDataCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """
    Cria um novo link de compartilhamento para um ou mais Dados.
    O frontend deve enviar os dados JÁ RE-CRIPTOGRAFADOS (como Base64).

    **Atenção ao Testar Datas (Timezone):**
    O backend opera 100% em UTC. Ao testar pela UI do FastAPI,
    o campo 'data_expiracao' deve estar em formato ISO 8601
    com o fuso horário (ex: "2025-11-05T21:45:00-03:00" para Brasília).

    """
    try:
        new_share = service_share.create_share_link(
            db=db, user_id=current_user.id, share_data=share_data
        )

        # TODO: A URL base deve vir de
        # uma variável de ambiente, não estar hardcoded.
        base_url = "https://localhost:1420/share/"

        return schemas.ShareCreateResponse(
            share_link=f"{base_url}/{new_share.token_acesso}",
            token_acesso=new_share.token_acesso,
        )

    except (DataNotFoundError, ValueError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(
            f"Erro ao criar compartilhamento do usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao criar compartilhamento.",
        )


@router.get(
    "/{token_acesso}",
    response_model=schemas.SharedDataViewResponse,
)
def get_shared_data(token_acesso: str, db: Annotated[Session, Depends(get_db)]):
    """
    Endpoint PÚBLICO para um destinatário buscar os dados de um
    compartilhamento usando o token de acesso.
    """
    try:
        db_share = service_share.get_shared_data_by_token(db, token_acesso=token_acesso)

        # Constrói a lista de itens para a resposta
        itens_view = [
            schemas.SharedItemView(
                dado_criptografado=base64.b64encode(item.dado_criptografado).decode(
                    "utf-8"
                ),
                meta=item.meta,
            )
            for item in db_share.dados_compartilhados
        ]

        return schemas.SharedDataViewResponse(
            itens=itens_view, data_expiracao=db_share.data_expiracao
        )

    except DataNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(
            f"Erro ao buscar dados do compartilhamento com token {token_acesso}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar dados.",
        )


@router.get("/", response_model=List[schemas.CompartilhamentoResponse])
def get_my_shares(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """
    Busca a lista completa de todos os links de compartilhamento
    criados pelo usuário logado.
    """
    try:
        shares = service_share.get_shares_by_user_id(db, user_id=current_user.id)
        return shares
    except Exception as e:
        logger.error(
            f"Erro ao buscar compartilhamentos do usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar compartilhamentos.",
        )


@router.patch("/{share_id}", response_model=schemas.CompartilhamentoResponse)
def update_share_rules(
    share_id: int,
    update_data: schemas.ShareRulesUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """
    Atualiza as regras (limite de acesso, data de expiração)
    de um compartilhamento existente.

    **Atenção ao Testar Datas (Timezone):**
    O backend opera 100% em UTC. Ao testar pela UI do FastAPI,
    o campo 'data_expiracao' deve estar em formato ISO 8601
    com o fuso horário (ex: "2025-11-05T21:45:00-03:00" para Brasília).

    """
    try:
        updated_share = service_share.edit_share_rules(
            db, user_id=current_user.id, share_id=share_id, update_data=update_data
        )
        return updated_share
    except DataNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(
            f"Erro ao atualizar compartilhamento {share_id} do usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao editar compartilhamento.",
        )


@router.delete(
    "/{share_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_share(
    share_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """
    Apaga um link de compartilhamento existente.
    """
    try:
        # Chama o serviço para fazer a validação e a exclusão
        service_share.delete_share_by_id(db, user_id=current_user.id, share_id=share_id)
        return None  # Retorna 204 No Content (sucesso)

    except DataNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(
            f"Erro ao apagar compartilhamento {share_id} do usuário {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao deletar compartilhamento.",
        )
