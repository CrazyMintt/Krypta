from . import models, schemas
from .core import get_password_hash
from sqlalchemy.orm import Session


def create_user(db: Session, user_data: schemas.UserCreate) -> models.Usuario:
    hashed_password = get_password_hash(user_data.senha_mestre)
    db_user = models.Usuario(email=user_data.email,
                             nome=user_data.nome,
                             senha_mestre=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
