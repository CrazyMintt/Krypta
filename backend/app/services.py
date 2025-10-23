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
        saltKDF=salt,
    )

    # Usa o repositório para salvar o usuário no banco de dados
    return repository.create_user(db=db, user_data=new_user)


def authenticate_and_login_user(
    db: Session, email: str, password: str
) -> schemas.LoginResponse:
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
    user = schemas.UserComplete.model_validate(user)
    access_token = core.create_access_token(data={"sub": user.email})

    return schemas.LoginResponse(
        nome=user.nome,
        id=user.id,
        dados=user.dados,
        created_at=user.created_at,
        email=user.email,
        access_token=access_token,
        saltKDF=user.saltKDF,
    )


def get_current_user(db: Session, token: str) -> schemas.UserResponse:
    try:
        payload = core.decode_access_token(token)
        email = payload.get("sub")
        if not email:
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Não foi possível validar credenciais",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não foi possível validar credenciais",
            headers={"WWW-Authenticate": "Bearer"},
        )
