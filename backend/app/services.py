from . import schemas, models, repository
from sqlalchemy.orm import Session

def register_user(db: Session, user_data: schemas.UserCreate) -> models.Usuario:
    return repository.create_user(db, user_data)