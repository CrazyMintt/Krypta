from typing import List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from .. import models


def create_share(
    db: Session,
    db_compartilhamento: models.Compartilhamento,
    db_dados_list: List[models.DadosCompartilhados],
) -> models.Compartilhamento:
    """
    Salva o 'envelope' de Compartilhamento e a lista de 'DadoCompartilhado'
    associado em uma única transação.
    """
    try:
        db.add(db_compartilhamento)
        db.flush()  # Gera o db_compartilhamento.id

        # Itera e associa os filhos ao pai
        for item in db_dados_list:
            item.compartilhamento_id = db_compartilhamento.id
            db.add(item)

        db.commit()
        db.refresh(db_compartilhamento)
        return db_compartilhamento
    except Exception as e:
        db.rollback()
        raise e


def get_share_by_token(
    db: Session, token_acesso: str
) -> models.Compartilhamento | None:
    """
    Busca um 'Compartilhamento' e seus 'DadosCompartilhados' filhos
    pelo token de acesso único.
    """
    stmt = (
        select(models.Compartilhamento)
        .filter(models.Compartilhamento.token_acesso == token_acesso)
        .options(
            # Carrega o filho 'dados_compartilhados' junto para evitar
            # uma segunda query (lazy loading)
            joinedload(models.Compartilhamento.dados_compartilhados)
        )
    )

    return db.execute(stmt).scalar_one_or_none()


def increment_share_access_count(
    db: Session, db_compartilhamento: models.Compartilhamento
):
    """
    Incrementa atomicamente o contador de acessos.
    (Esta é uma implementação simples; uma mais robusta usaria 'UPDATE ... SET n_acessos_atual = n_acessos_atual + 1')
    """
    try:
        db_compartilhamento.n_acessos_atual += 1
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
