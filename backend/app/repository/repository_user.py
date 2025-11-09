from sqlalchemy.orm import Session
from sqlalchemy import select
from .. import models, schemas

# --- Funções de Busca ---


def get_user_by_email(db: Session, email: str) -> models.Usuario | None:
    """Busca um usuário pelo seu email."""
    stmt = select(models.Usuario).filter(models.Usuario.email == email)
    return db.execute(stmt).scalar_one_or_none()


def get_user_by_id(db: Session, user_id: int) -> models.Usuario | None:
    """Busca um usuário pelo seu ID."""
    stmt = select(models.Usuario).filter(models.Usuario.id == user_id)
    return db.execute(stmt).scalar_one_or_none()


# --- Funções de Criação ---


def create_user(db: Session, db_user: models.Usuario) -> models.Usuario:
    """Adiciona um novo usuário à sessão."""
    db.add(db_user)
    return db_user


# --- Funções de Atualização ---


def update_user(
    db: Session, db_user: models.Usuario, update_data: schemas.UserUpdate
) -> models.Usuario:
    update_data_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_data_dict.items():
        setattr(db_user, key, value)

    db.add(db_user)
    return db_user


# --- Funções de Exclusão ---


def delete_user_by_id(db: Session, user_id: int):
    db.query(models.Usuario).filter(models.Usuario.id == user_id).delete(
        synchronize_session=False
    )
