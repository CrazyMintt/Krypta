import secrets
from fastapi import BackgroundTasks
from typing import List
from datetime import datetime, UTC
from sqlalchemy.orm import Session

from app.services import service_notificacao

from .. import models, schemas, services
from ..repository import repository_share, repository_data
from ..exceptions import DataNotFoundError
from .service_utils import decode_base64_file


# CREATE
def create_share_link(
    db: Session,
    user: models.Usuario,
    share_data: schemas.ShareDataCreate,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
) -> models.Compartilhamento:
    """
    Serviço para criar um novo compartilhamento.
    """

    origin_ids = [item.dado_origem_id for item in share_data.itens]
    # Verificar se o Dado original existe e pertence ao usuário
    db_dados_origem = repository_data.get_dados_by_ids_and_user_id(
        db, dado_ids=origin_ids, user_id=user.id
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
        owner_usuario_id=user.id,
        token_acesso=token,  # Armazena o token
        n_acessos_total=share_data.n_acessos_total,
        data_expiracao=share_data.data_expiracao,
        n_acessos_atual=0,
    )

    try:
        db_compartilhamento = repository_share.create_share(
            db, db_compartilhamento=db_compartilhamento, db_dados_list=db_dados_list
        )
        services.log_and_notify(
            db, user, schemas.LogTipo.COMPARTILHAMENTO_CRIADO, log_context, tasks
        )
        db.commit()
        return db_compartilhamento
    except Exception as e:
        db.rollback()
        raise e


# GET


def get_shared_data_by_token(
    db: Session,
    token_acesso: str,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
) -> models.Compartilhamento:
    """
    Serviço para que um destinatário acesse dados compartilhados.
    Verifica as regras de acesso e retorna o 'envelope' completo.
    """
    db_share = repository_share.get_share_by_token(db, token_acesso=token_acesso)

    if not db_share:
        raise DataNotFoundError("Link de compartilhamento inválido ou expirado.")

    if db_share.data_expiracao and db_share.data_expiracao < datetime.now(UTC).replace(
        tzinfo=None
    ):
        raise DataNotFoundError("Este link de compartilhamento expirou.")

    if db_share.n_acessos_atual >= db_share.n_acessos_total:
        raise DataNotFoundError(
            "Este link de compartilhamento atingiu o número máximo de acessos."
        )

    if not db_share.dados_compartilhados:
        raise DataNotFoundError("O item original deste compartilhamento foi removido.")

    try:
        repository_share.increment_share_access_count(db, db_share)
        user = db_share.owner_usuario
        service_notificacao.log_and_notify(
            db, user, schemas.LogTipo.COMPARTILHAMENTO_ACESSADO, log_context, tasks
        )
        db.commit()
        db.refresh(db_share)
        return db_share
    except Exception as e:
        db.rollback()
        raise e


def get_shares_by_user_id(db: Session, user_id: int) -> List[models.Compartilhamento]:
    """
    Busca TODOS os compartilhamentos para um usuário.
    """
    return repository_share.get_all_shares_by_user_id(db, user_id=user_id)


# UPDATE
def edit_share_rules(
    db: Session,
    user: models.Usuario,
    share_id: int,
    update_data: schemas.ShareRulesUpdate,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
) -> models.Compartilhamento:
    """
    Serviço para editar as regras (expiração, acessos) de um compartilhamento.
    """
    db_share = repository_share.get_share_by_id_and_user(
        db, share_id=share_id, user_id=user.id
    )
    if not db_share:
        raise DataNotFoundError(
            "Compartilhamento não encontrado ou não pertence a este usuário."
        )

    try:
        db_share = repository_share.update_share_rules(
            db=db, db_share=db_share, update_data=update_data
        )
        services.log_and_notify(
            db, user, schemas.LogTipo.COMPARTILHAMENTO_EDITADO, log_context, tasks
        )
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    return db_share


# DELETE
def delete_share_by_id(
    db: Session,
    user: models.Usuario,
    share_id: int,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
):
    """
    Deleta (revoga) um Compartilhamento.
    Verifica se o link existe e pertence ao usuário.
    """
    db_share = repository_share.get_share_by_id_and_user(
        db, share_id=share_id, user_id=user.id
    )

    if not db_share:
        raise DataNotFoundError(
            f"Compartilhamento com id {share_id} não encontrado ou não pertence a este usuário."
        )

    try:
        repository_share.delete_share_obj(db, db_share=db_share)
        services.log_and_notify(
            db, user, schemas.LogTipo.COMPARTILHAMENTO_REVOGADO, log_context, tasks
        )

        # O ON DELETE CASCADE em 'dados_compartilhados' é executado pelo banco aqui.
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Erro ao deletar compartilhamento {share_id}: {e}")
        raise e
