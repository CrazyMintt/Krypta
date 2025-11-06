from typing import List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, desc
from .. import models, schemas


# CREATE
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


# GET
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

    return db.execute(stmt).unique().scalar_one_or_none()


def get_share_by_id_and_user(
    db: Session, share_id: int, user_id: int
) -> models.Compartilhamento | None:
    """Busca um Compartilhamento pelo seu ID e o ID do dono."""
    stmt = select(models.Compartilhamento).filter(
        models.Compartilhamento.id == share_id,
        models.Compartilhamento.owner_usuario_id == user_id,
    )
    return db.execute(stmt).scalar_one_or_none()


def get_all_shares_by_user_id(
    db: Session, user_id: int
) -> List[models.Compartilhamento]:
    """
    Busca TODOS os Compartilhamentos criados por um usuário.
    Ordena pelos mais recentes primeiro.
    """
    stmt = (
        select(models.Compartilhamento)
        .filter(models.Compartilhamento.owner_usuario_id == user_id)
        .order_by(desc(models.Compartilhamento.criado_em))  # Mais recentes primeiro
    )

    results = db.execute(stmt).scalars().all()
    return list(results)


# UPDATE
def update_share_rules(
    db: Session,
    db_share: models.Compartilhamento,
    update_data: schemas.ShareRulesUpdate,
) -> models.Compartilhamento:
    """Atualiza um Compartilhamento (regras) e commita."""
    try:
        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(db_share, key, value)

        db.commit()
        db.refresh(db_share)
        return db_share
    except Exception as e:
        db.rollback()
        raise e


# DELETE
def delete_share_obj(db: Session, db_share: models.Compartilhamento):
    """
    Marca um objeto Compartilhamento para exclusão.
    """
    db.delete(db_share)


# Incrementa a contagem do acesso
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
