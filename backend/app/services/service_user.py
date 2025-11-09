import logging
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session
from .. import models, schemas, core, services
from ..exceptions import EmailAlreadyExistsError, AuthenticationError
from ..repository import repository_user, repository_data

logger = logging.getLogger(__name__)


# AUTH
def authenticate_and_login_user(
    db: Session,
    email: str,
    password: str,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
) -> schemas.LoginResponse | None:
    user = repository_user.get_user_by_email(db, email)
    if not user or not core.verify_password(password, user.senha_mestre):
        if user:  # Se o usuário existe mas a senha está errada
            try:
                services.log_and_notify(
                    db, user, schemas.LogTipo.LOGIN_FALHO, log_context, tasks
                )
                db.commit()  # Commita o log/evento
            except Exception as e:
                db.rollback()
                logger.error(f"Erro ao logar falha de login: {e}")
        return None
    access_token = core.create_access_token(data={"sub": str(user.id)})
    try:
        services.log_and_notify(
            db, user, schemas.LogTipo.LOGIN_SUCESSO, log_context, tasks
        )
        db.commit()  # Commita o log/evento
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao logar sucesso de login: {e}")

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
        raise EmailAlreadyExistsError(f"O email {user_data.email} já está registrado.")

    # Cria o hash da senha
    hashed_password = core.get_password_hash(user_data.senha_mestre)
    salt = core.generate_crypto_salt()

    new_user = models.Usuario(
        email=user_data.email,
        nome=user_data.nome,
        senha_mestre=hashed_password,
        saltKDF=salt,
    )

    try:
        user = repository_user.create_user(db, db_user=new_user)
        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        db.rollback()
        raise e


# EDIT
def edit_user(
    db: Session,
    user: models.Usuario,
    update_data: schemas.UserUpdate,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
) -> models.Usuario:
    """
    Edita um usuário e loga as atividades de forma atômica.
    """
    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        raise ValueError("Pelo menos um campo deve ser fornecido para atualização.")

    # Validação e Verificação
    email_changed = "email" in update_dict and update_data.email != user.email
    nome_changed = "nome" in update_dict and update_data.nome != user.nome

    if email_changed and update_data.email:
        existing_user = repository_user.get_user_by_email(db, email=update_data.email)
        if existing_user:
            raise EmailAlreadyExistsError(
                f"O email {update_data.email} já está em uso."
            )

    try:
        # Aplica a mudança (sem commit)
        updated_user = repository_user.update_user(
            db=db, db_user=user, update_data=update_data
        )

        if email_changed:
            services.log_and_notify(
                db, user, schemas.LogTipo.EMAIL_ALTERADO, log_context, tasks
            )
        if nome_changed:
            services.log_and_notify(
                db, user, schemas.LogTipo.NOME_ALTERADO, log_context, tasks
            )

        # Commita a atualização do usuário e os logs
        db.commit()

        db.refresh(updated_user)
        return updated_user

    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao editar usuário {user.id}: {e}", exc_info=True)
        raise e


# DELETE
def clear_all_user_data(
    db: Session,
    user: models.Usuario,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
) -> None:
    """
    Limpa todos os dados de um usuário (sem apagar a conta).
    """
    try:
        services.clear_all_user_data_logic(db=db, user_id=user.id)
        services.log_and_notify(
            db,
            user,
            schemas.LogTipo.DADOS_LIMPOS,
            log_context,
            tasks,
        )
        db.commit()
    except Exception as e:
        db.rollback()
        raise e


def delete_user(db: Session, user_id: int) -> None:
    """
    Deleta conta de um usuário.
    """
    try:
        services.clear_all_user_data_logic(db=db, user_id=user_id)
        repository_user.delete_user_by_id(db=db, user_id=user_id)
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
