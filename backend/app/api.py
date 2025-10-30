from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Annotated
from jose import ExpiredSignatureError, JWTError

from . import schemas, services, repository, core, models
from .database import get_db
from .exceptions import UserNotFoundError, EmailAlreadyExistsError, DataNotFoundError

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# Dependência de Autenticação


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)],
) -> models.Usuario:
    """
    Dependência do FastAPI para decodificar o token e retornar o usuário logado.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as Credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = core.decode_access_token(token)
        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user_id = int(user_id)

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token Expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (JWTError, ValueError):  # Pega erros de decodificação ou falha no int()
        raise credentials_exception

    user = repository.get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception
    return user


# Endpoints de Usuário e Autenticação


@router.post(
    "/users/",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Usuário"],
)
def create_user(user_data: schemas.UserCreate, db: Annotated[Session, Depends(get_db)]):
    """Endpoint para registrar um novo usuário."""
    db_user = services.register_user(db=db, user_data=user_data)

    # A API traduz a falha do serviço (None) para um erro HTTP
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email já registrado."
        )
    return db_user


@router.post("/login", response_model=schemas.LoginResponse, tags=["Autenticação"])
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
):
    """Endpoint para autenticar um usuário."""
    login_response = services.authenticate_and_login_user(
        db=db, email=form_data.username, password=form_data.password
    )
    if not login_response:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return login_response


@router.get("/users/me", response_model=schemas.UserResponse, tags=["Usuário"])
def get_user_me(current_user: Annotated[models.Usuario, Depends(get_current_user)]):
    """
    Retorna os dados do usuário logado atualmente.
    """
    return current_user


@router.patch("/users/me", response_model=schemas.UserResponse, tags=["Usuário"])
def update_user_me(
    update_data: schemas.UserUpdate,
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """
    Atualiza os dados (nome ou email) do usuário logado.
    """
    try:
        updated_user = services.edit_user(
            db=db, user=current_user, update_data=update_data
        )
        return updated_user
    except UserNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except EmailAlreadyExistsError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao atualizar usuário.",
        )


@router.delete(
    "/users/me/data", status_code=status.HTTP_204_NO_CONTENT, tags=["Usuário"]
)
def delete_user_data(
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Apaga todos os dados do usuário logado, mantendo a conta"""
    success = services.clear_all_user_data(db=db, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Não foi possível apagar os dados do usuário.",
        )
    return None


@router.delete("/users/me", status_code=status.HTTP_204_NO_CONTENT, tags=["Usuário"])
def delete_user_me(
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Apaga a conta do usuário logado"""
    success = services.delete_user(db=db, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Não foi possível apagar a conta do usuário.",
        )
    return None


# Endpoints de Dados (Credenciais e Arquivos)


@router.post(
    "/data/credentials",
    response_model=schemas.DataResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Dados"],
)
def create_credential(
    credential_data: schemas.DataCreateCredential,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """
    Cria uma nova credential para o usuário logado.
    - `email` e `host_url` são opcionais (definidos no schema).
    - Retorna o objeto Dado criado.
    """
    try:
        # chame o serviço responsável por criar a credential
        created_data = services.create_credential(
            db=db, user=current_user, credential_data=credential_data
        )

        return created_data

    except ValueError as e:
        # erro de validação simples vindo do serviço
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao criar credencial.",
        )


@router.post(
    "/data/files",
    status_code=status.HTTP_201_CREATED,
    response_model=schemas.DataResponse,
    tags=["Dados"],
)
def create_file(
    file_data: schemas.DataCreateFile,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """
    Cria um novo arquivo.
    O frontend deve enviar a informação 'arquivo.arquivo_data'
    como uma string codificada em Base64.
    """
    try:
        created_file = services.create_file(
            db=db, user_id=current_user.id, file_data=file_data
        )
        return created_file
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao salvar o arquivo.",
        )


@router.get(
    "/data/{data_id}",
    response_model=schemas.DataResponse,
    tags=["Dados"],
)
def get_single_data_entry(
    data_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """
    Busca e retorna um Dado específico (arquivo ou credencial)
    pertencente ao usuário logado.
    """
    try:
        db_dado = services.get_specific_data(
            db=db, user_id=current_user.id, data_id=data_id
        )
        return db_dado
    except DataNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar o dado.",
        )


@router.patch(
    "/data/credentials/{data_id}",
    response_model=schemas.DataResponse,
    tags=["Dados"],
)
def update_credential_entry(
    data_id: int,
    update_data: schemas.DataUpdateCredential,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """
    Atualiza um Dado existente do tipo Senha pertencente ao usuário logado.
    """
    try:
        updated_dado = services.edit_credential_data(
            db=db, user_id=current_user.id, data_id=data_id, update_data=update_data
        )
        return updated_dado
    except DataNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao atualizar a credencial.",
        )


@router.patch(
    "/data/files/{data_id}",
    response_model=schemas.DataResponse,
    tags=["Dados"],
)
def update_file_entry(
    data_id: int,
    update_data: schemas.DataUpdateFile,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """
    Atualiza um Dado existente do tipo Arquivo pertencente ao usuário logado.
    """
    try:
        updated_dado = services.edit_file_data(
            db=db, user_id=current_user.id, data_id=data_id, update_data=update_data
        )
        return updated_dado
    # Traduz erros de negócio do serviço para erros HTTP
    except DataNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao atualizar o arquivo.",
        )


@router.delete(
    "/data/{data_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Dados"],
)
def delete_data(
    data_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """
    Apaga um Dado específico (credencial ou arquivo) pertencente ao usuário logado.
    """
    try:
        services.delete_data_by_id(db=db, user_id=current_user.id, dado_id=data_id)
        # Se o serviço não levantar exceção, a exclusão foi bem-sucedida.
        return None
    except DataNotFoundError as e:
        # Traduz o erro de negócio para HTTP 404
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao apagar o dado.",
        )


@router.post("/data/search", response_model=list[schemas.DataResponse], tags=["Dados"])
def search_data_paginated(
    payload: schemas.FilterPageConfig,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """
    Busca paginada de dados.
    """
    try:
        data = services.get_data_paginated_filtered(db, current_user, payload)
        return data
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar dados.",
        )
