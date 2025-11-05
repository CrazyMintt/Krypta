from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated

from .. import schemas, models
from ..database import get_db
from ..exceptions import (
    DataNotFoundError,
)
from ..services import service_compartilhamento
from .dependencies import get_current_user
import base64

router = APIRouter(prefix="/share")


@router.post(
    "/shares",
    response_model=schemas.ShareCreateResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Compartilhamento"],
)
def create_new_share(
    share_data: schemas.ShareDataCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """
    Cria um novo link de compartilhamento para um Dado existente.
    O frontend deve enviar o dado JÁ RE-CRIPTOGRAFADO (como Base64).
    """
    try:
        new_share = service_compartilhamento.create_share_link(
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao criar compartilhamento.",
        )


@router.get(
    "/shares/{token_acesso}",
    response_model=schemas.SharedDataViewResponse,
    tags=["Compartilhamento"],
)
def get_shared_data(token_acesso: str, db: Annotated[Session, Depends(get_db)]):
    """
    Endpoint PÚBLICO para um destinatário buscar os dados de um
    compartilhamento usando o token de acesso.
    """
    try:
        shared_data_obj = service_compartilhamento.get_shared_data_by_token(
            db, token_acesso=token_acesso
        )

        # O frontend espera a string Base64, não bytes
        encrypted_base64 = base64.b64encode(shared_data_obj.dado_criptografado).decode(
            "utf-8"
        )

        return schemas.SharedDataViewResponse(
            dado_criptografado=encrypted_base64,
            meta=shared_data_obj.meta,
            data_expiracao=shared_data_obj.compartilhamento.data_expiracao,
        )

    except DataNotFoundError as e:
        # Erros de "Expirado", "Limite atingido" ou "Inválido"
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar dados.",
        )
