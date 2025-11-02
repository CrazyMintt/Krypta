from typing import Optional, List
from .. import models, schemas
from sqlalchemy.orm import Session
from sqlalchemy import select

# --- Funções de Busca ---


def get_folder_by_id_and_user(
    db: Session, folder_id: int, user_id: int
) -> models.Separador | None:
    """Busca uma Pasta específica pelo ID, garantindo o tipo e o dono."""
    stmt = select(models.Separador).filter(
        models.Separador.id == folder_id,
        models.Separador.usuario_id == user_id,
        models.Separador.tipo == models.TipoSeparador.PASTA,
    )
    return db.execute(stmt).scalar_one_or_none()


def get_tags_by_ids_and_user(
    db: Session, tag_ids: List[int], user_id: int
) -> List[models.Separador]:
    """Busca uma lista de Tags, garantindo o tipo e o dono."""
    stmt = select(models.Separador).filter(
        models.Separador.usuario_id == user_id,
        models.Separador.tipo == models.TipoSeparador.TAG,
        models.Separador.id.in_(tag_ids),
    )
    return list(db.execute(stmt).scalars().all())


def get_separador_by_id_and_user_id(
    db: Session, separador_id: int, user_id: int
) -> models.Separador:
    stmt = select(models.Separador).filter(
        models.Separador.id == separador_id, models.Separador.usuario_id == user_id
    )
    return db.execute(stmt).scalar_one_or_none()


def get_folder_by_name_and_parent(
    db: Session, nome: str, user_id: int, parent_id: Optional[int]
) -> models.Separador | None:
    """Busca uma pasta por nome e ID da pasta pai."""
    stmt = select(models.Separador).filter(
        models.Separador.nome == nome,
        models.Separador.tipo == models.TipoSeparador.PASTA,
        models.Separador.usuario_id == user_id,
        models.Separador.id_pasta_raiz == parent_id,
    )
    return db.execute(stmt).scalar_one_or_none()


def get_tag_by_name_and_user(
    db: Session, nome: str, user_id: int
) -> models.Separador | None:
    """Busca um separador por nome, tipo (TAG) e dono."""
    stmt = select(models.Separador).filter(
        models.Separador.nome == nome,
        models.Separador.tipo == models.TipoSeparador.TAG,
        models.Separador.usuario_id == user_id,
    )
    return db.execute(stmt).scalar_one_or_none()


def get_all_tags_by_user(db: Session, user_id: int) -> List[models.Separador]:
    """Busca todas as Tags (tipo TAG) de um usuário."""
    stmt = (
        select(models.Separador)
        .filter(
            models.Separador.usuario_id == user_id,
            models.Separador.tipo == models.TipoSeparador.TAG,
        )
        .order_by(models.Separador.nome)
    )
    results = db.execute(stmt).scalars().all()
    return list(results)


def get_root_folders_by_user(db: Session, user_id: int) -> List[models.Separador]:
    """Busca todas as Pastas (tipo PASTA) do nível raiz."""
    stmt = (
        select(models.Separador)
        .filter(
            models.Separador.usuario_id == user_id,
            models.Separador.tipo == models.TipoSeparador.PASTA,
            models.Separador.id_pasta_raiz == None,
        )
        .order_by(models.Separador.nome)
    )
    results = db.execute(stmt).scalars().all()
    return list(results)


def get_child_folders_by_parent_id(
    db: Session, user_id: int, parent_folder_id: int
) -> List[models.Separador]:
    """Busca todas as Subpastas (tipo PASTA) de uma pasta pai."""
    stmt = (
        select(models.Separador)
        .filter(
            models.Separador.usuario_id == user_id,
            models.Separador.tipo == models.TipoSeparador.PASTA,
            models.Separador.id_pasta_raiz == parent_folder_id,
        )
        .order_by(models.Separador.nome)
    )
    results = db.execute(stmt).scalars().all()
    return list(results)


def get_folder_and_all_descendants_ids(
    db: Session, folder_id: int, user_id: int
) -> List[int]:
    """Usa uma query recursiva (CTE) para buscar o ID da pasta pai e todos os IDs de suas subpastas descendentes."""
    base_case = (
        select(models.Separador.id)
        .filter(
            models.Separador.id == folder_id,
            models.Separador.usuario_id == user_id,
            models.Separador.tipo == models.TipoSeparador.PASTA,
        )
        .cte(name="folder_tree", recursive=True)
    )
    recursive_step = (
        select(models.Separador.id)
        .join(base_case, models.Separador.id_pasta_raiz == base_case.c.id)
        .filter(
            models.Separador.tipo == models.TipoSeparador.PASTA,
            models.Separador.usuario_id == user_id,
        )
    )
    recursive_cte = base_case.union_all(recursive_step)
    final_stmt = select(recursive_cte.c.id)
    return list(db.execute(final_stmt).scalars().all())


# --- Funções de Criação ---


def create_separador(db: Session, db_separador: models.Separador) -> models.Separador:
    """Cria um objeto Separador (pasta/tag) no banco de dados."""
    try:
        db.add(db_separador)
        db.commit()
        db.refresh(db_separador)
        return db_separador
    except Exception as e:
        db.rollback()
        raise e


# --- Funções de Atualização ---


def update_folder(
    db: Session, db_folder: models.Separador, update_data: schemas.FolderUpdate
) -> models.Separador:
    """Aplica atualizações parciais a uma Pasta e commita no banco."""
    try:
        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(db_folder, key, value)
        db.commit()
        db.refresh(db_folder)
        return db_folder
    except Exception as e:
        db.rollback()
        raise e


def update_tag(
    db: Session, db_tag: models.Separador, update_data: schemas.TagUpdate
) -> models.Separador:
    """Aplica atualizações parciais a uma Tag e commita no banco."""
    try:
        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(db_tag, key, value)
        db.commit()
        db.refresh(db_tag)
        return db_tag
    except Exception as e:
        db.rollback()
        raise e


# --- Funções de Exclusão ---


def delete_separador(db: Session, db_separador: models.Separador):
    db.delete(db_separador)


def delete_separadores_by_ids(db: Session, separador_ids: List[int]):
    """Deleta em lote todos os 'Separadores' (pastas/tags) de uma lista de IDs."""
    if not separador_ids:
        return
    query = db.query(models.Separador).filter(models.Separador.id.in_(separador_ids))
    query.delete(synchronize_session=False)
