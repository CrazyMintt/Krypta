from sqlalchemy.orm import Session
from .. import models, schemas, core
from . import service_utils
from ..exceptions import EmailAlreadyExistsError
from ..repository import repository_user, repository_data


# AUTH
def authenticate_and_login_user(
    db: Session, email: str, password: str
) -> schemas.LoginResponse | None:
    user = repository_user.get_user_by_email(db, email)
    if not user or not core.verify_password(password, user.senha_mestre):
        return None

    access_token = core.create_access_token(data={"sub": str(user.id)})
    return schemas.LoginResponse(
        nome=user.nome,
        id=user.id,
        created_at=user.created_at,
        email=user.email,
        access_token=access_token,
        saltKDF=user.saltKDF,
    )


# GET
def get_dashboard_stats(db: Session, user: models.Usuario) -> schemas.DashboardResponse:
    """
    Orquestra a busca de dados para o dashboard do usuário.
    """

    total_storage = user.armazenamento_total

    # Armazenamento Usado
    used_storage = repository_data.get_total_storage_used_by_user(db, user_id=user.id)

    # Armazenamento por Tipo
    raw_storage_by_type = repository_data.get_storage_used_by_file_type(
        db, user_id=user.id
    )

    # Formata a resposta
    storage_by_type_list = [
        schemas.StorageByTypeResponse(
            extensao=row.extensao if row.extensao else "outros",
            bytes_usados=row.bytes_usados,
        )
        for row in raw_storage_by_type
    ]

    return schemas.DashboardResponse(
        armazenamento_total_bytes=total_storage,
        armazenamento_usado_bytes=used_storage,
        armazenamento_por_tipo=storage_by_type_list,
    )


# CREATE
def register_user(db: Session, user_data: schemas.UserCreate) -> models.Usuario | None:
    existing_user = repository_user.get_user_by_email(db=db, email=user_data.email)
    if existing_user:
        return None

    hashed_password = core.get_password_hash(user_data.senha_mestre)
    salt = core.generate_crypto_salt()
    new_user = models.Usuario(
        email=user_data.email,
        nome=user_data.nome,
        senha_mestre=hashed_password,
        saltKDF=salt,
    )
    return repository_user.create_user(db, user_data=new_user)


# EDIT
def edit_user(
    db: Session, user: models.Usuario, update_data: schemas.UserUpdate
) -> models.Usuario:
    if update_data.email and update_data.email != user.email:
        existing_user = repository_user.get_user_by_email(db, email=update_data.email)
        if existing_user:
            raise EmailAlreadyExistsError(
                f"O email {update_data.email} já está em uso."
            )
    return repository_user.update_user(db=db, db_user=user, update_data=update_data)


# DELETE
def clear_all_user_data(db: Session, user_id: int) -> bool:
    try:
        # Chama a lógica do helper
        service_utils.clear_all_user_data_logic(db=db, user_id=user_id)
        db.commit()
        return True
    except Exception:
        db.rollback()
        return False


def delete_user(db: Session, user_id: int) -> bool:
    try:
        # Chama a lógica do helper
        service_utils.clear_all_user_data_logic(db=db, user_id=user_id)
        repository_user.delete_user_by_id(db=db, user_id=user_id)
        db.commit()
        return True
    except Exception:
        db.rollback()
        return False
