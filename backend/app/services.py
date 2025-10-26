from sqlalchemy.orm import Session
from . import models, schemas, repository, core
from .exceptions import UserNotFoundError, EmailAlreadyExistsError


def register_user(db: Session, user_data: schemas.UserCreate) -> models.Usuario | None:
    """
    Serviço para registrar um novo usuário.
    Contém a lógica de negócio para verificar se o email já existe.
    """
    # Verificar se já existe um usuário com este email
    existing_user = repository.get_user_by_email(db=db, email=user_data.email)
    if existing_user:
        return None
    # Cria o hash da senha
    hashed_password = core.get_password_hash(user_data.senha_mestre)
    salt = core.generate_crypto_salt()

    new_user = models.Usuario(
        email=user_data.email,
        nome=user_data.nome,
        senha_mestre=hashed_password,
        saltKDF=salt,
    )

    return repository.create_user(db, user_data=new_user)


def authenticate_and_login_user(
    db: Session, email: str, password: str
) -> schemas.LoginResponse | None:
    """
    Serviço para autenticar um usuário.
    Contém a lógica de negócio completa para o processo de login.
    """
    user = repository.get_user_by_email(db, email)

    if not user or not core.verify_password(password, user.senha_mestre):
        return None

    access_token = core.create_access_token(
        data={"sub": str(user.id)}
    )  # tem que ser string

    return schemas.LoginResponse(
        nome=user.nome,
        id=user.id,
        created_at=user.created_at,
        email=user.email,
        access_token=access_token,
        saltKDF=user.saltKDF,
    )


def edit_user(
    db: Session, user: models.Usuario, update_data: schemas.UserBase
) -> models.Usuario:

    # verificar se o email já não está em uso por outro usuario
    if update_data.email and update_data.email != user.email:
        existing_user = repository.get_user_by_email(db, email=update_data.email)
        if existing_user:
            raise EmailAlreadyExistsError(
                f"O email {update_data.email} já está em uso."
            )

    return repository.update_user(db=db, db_user=user, update_data=update_data)


def clear_all_user_data(db: Session, user_id: int) -> bool:
    """
    Orquestra a exclusão de todos os dados de um usuário, mantendo a conta.

    A ordem é importante para respeitar as restrições de chave estrangeira:
    1. Logs (referenciam Usuário e Dado)
    2. Eventos (referenciam Usuário)
    3. Compartilhamentos (referenciam Usuário)
    4. Dados (referenciam Usuário)
    """
    try:
        # Busca os IDs dos dados
        dado_ids = repository.get_dado_ids_by_user(db, user_id=user_id)

        # Deleta os logs
        if dado_ids:
            repository.delete_logs_by_user_and_dados(
                db, user_id=user_id, dado_ids=dado_ids
            )

        # Deleta o restante
        repository.delete_eventos_by_user(db, user_id=user_id)
        repository.delete_compartilhamentos_by_user(db, user_id=user_id)
        repository.delete_dados_by_user(db, user_id=user_id)

        db.commit()
        return True

    except Exception as e:
        # Se qualquer passo falhar, desfaz tudo
        db.rollback()
        print(f"Erro ao limpar dados do usuário {user_id}: {e}")
        return False
