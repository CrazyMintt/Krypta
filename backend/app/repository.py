from . import models
from sqlalchemy.orm import Session


def create_user(db: Session, user_data: models.Usuario) -> models.Usuario:
    db_user = models.Usuario(
        email=user_data.email,
        nome=user_data.nome,
        senha_mestre=user_data.senha_mestre,
        saltKDF=user_data.saltKDF,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_email(db: Session, email: str) -> models.Usuario | None:
    """Busca um usuário pelo seu email."""
    return db.query(models.Usuario).filter(models.Usuario.email == email).first()


def get_user(db: Session, user_id: int) -> models.Usuario | None:
    """Busca um usuário pelo seu ID."""
    return db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
