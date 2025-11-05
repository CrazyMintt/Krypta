from typing import List
from datetime import datetime
from sqlalchemy.orm import Session
from .. import models, schemas
from ..repository import repository_share, repository_data
from ..exceptions import DataNotFoundError
from .service_utils import decode_base64_file
import secrets


def create_share_link(
    db: Session, user_id: int, share_data: schemas.ShareDataCreate
) -> models.Compartilhamento:
    """
    Serviço para criar um novo compartilhamento.
    """

    origin_ids = [item.dado_origem_id for item in share_data.itens]
    # Verificar se o Dado original existe e pertence ao usuário
    db_dados_origem = repository_data.get_dados_by_ids_and_user_id(
        db, dado_ids=origin_ids, user_id=user_id
    )
    if len(db_dados_origem) != len(set(origin_ids)):
        raise DataNotFoundError(
            "Um ou mais dados de origem não foram encontrados ou não pertencem a este usuário."
        )

    # Decodificar o blob criptografado
    db_dados_list: List[models.DadosCompartilhados] = []
    for item in share_data.itens:
        encrypted_bytes = decode_base64_file(item.dado_criptografado)

        db_dados_list.append(
            models.DadosCompartilhados(
                dado_origem_id=item.dado_origem_id,
                dado_criptografado=encrypted_bytes,
                meta=item.meta,
            )
        )

    # Gerar o token de acesso seguro
    token = secrets.token_urlsafe(32)  # Gera um token de 32 bytes

    # Criar os objetos de modelo
    db_compartilhamento = models.Compartilhamento(
        owner_usuario_id=user_id,
        token_acesso=token,  # Armazena o token
        n_acessos_total=share_data.n_acessos_total,
        data_expiracao=share_data.data_expiracao,
        n_acessos_atual=0,
    )

    return repository_share.create_share(
        db, db_compartilhamento=db_compartilhamento, db_dados_list=db_dados_list
    )


def get_shared_data_by_token(db: Session, token_acesso: str) -> models.Compartilhamento:
    """
    Serviço para que um destinatário acesse dados compartilhados.
    Verifica as regras de acesso e retorna o 'envelope' completo.
    """
    db_share = repository_share.get_share_by_token(db, token_acesso=token_acesso)

    if not db_share:
        raise DataNotFoundError("Link de compartilhamento inválido ou expirado.")

    if db_share.data_expiracao and db_share.data_expiracao < datetime.now():
        raise DataNotFoundError("Este link de compartilhamento expirou.")

    if db_share.n_acessos_atual >= db_share.n_acessos_total:
        raise DataNotFoundError(
            "Este link de compartilhamento atingiu o número máximo de acessos."
        )

    if not db_share.dados_compartilhados:
        raise DataNotFoundError("O item original deste compartilhamento foi removido.")

    repository_share.increment_share_access_count(db, db_share)

    return db_share
