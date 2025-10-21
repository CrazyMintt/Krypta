from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from . import models, schemas, repository, core


def register_user(db: Session, user_data: schemas.UserCreate) -> models.Usuario:
    """
    Serviço para registrar um novo usuário.
    Contém a lógica de negócio para verificar se o email já existe.
    """
    # Verificar se já existe um usuário com este email.
    existing_user = repository.get_user_by_email(db, email=user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um usuário cadastrado com este email.",
        )

    # Cria o hash da senha antes de salvar
    hashed_password = core.get_password_hash(user_data.senha_mestre)
    salt = core.generate_crypto_salt()
    # Cria o novo objeto de usuário
    new_user = models.Usuario(
        email=user_data.email,
        nome=user_data.nome,
        senha_mestre=hashed_password,
        saltKDF = salt
    )

    # Usa o repositório para salvar o usuário no banco de dados
    return repository.create_user(db=db, user_data=new_user)


def authenticate_and_login_user(db: Session, email: str, password: str):
    """
    Serviço para autenticar um usuário.
    Contém a lógica de negócio completa para o processo de login.
    """
    user = repository.get_user_by_email(db, email=email)

    if not user or not core.verify_password(password, user.senha_mestre):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = core.create_access_token(data={"sub": user.email})

    crypto_salt = user.saltKDF
    if not crypto_salt:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Não foi possível processar as credenciais de segurança.",
        )

    return schemas.LoginResponse(access_token=access_token, crypto_salt=crypto_salt)
