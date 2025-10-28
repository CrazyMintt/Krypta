from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Annotated
from jose import ExpiredSignatureError, JWTError
from starlette.status import HTTP_204_NO_CONTENT, HTTP_500_INTERNAL_SERVER_ERROR
from fastapi import Body
from . import schemas, services, repository, core, models
from .database import get_db
from .exceptions import UserNotFoundError, EmailAlreadyExistsError

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")



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
        id = payload.get("sub")
        if id is None:
            raise credentials_exception
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token Expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise credentials_exception
    user = repository.get_user_by_id(db, int(id))
    if user is None:
        raise credentials_exception
    return user


@router.post(
    "/users/",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Users"],
)
def create_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Endpoint para registrar um novo usuário."""
    db_user = services.register_user(db=db, user_data=user_data)

    # A API traduz a falha do serviço (None) para um erro HTTP
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email já registrado."
        )
    return db_user


@router.post("/login", response_model=schemas.LoginResponse, tags=["Authentication"])
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
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


@router.get("/users/me", response_model=schemas.UserResponse, tags=["Users"])
def get_user_me(current_user: Annotated[models.Usuario, Depends(get_current_user)]):
    """
    Retorna os dados do usuário logado atualmente.
    """
    return current_user


@router.patch("/users/me", response_model=schemas.UserResponse, tags=["Users"])
def update_user_me(
    update_data: schemas.UserBase,
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    db=Depends(get_db),
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


@router.delete("/users/me/data", status_code=HTTP_204_NO_CONTENT, tags=["Users"])
def delete_user_data(
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    db=Depends(get_db),
):
    """Apaga todos os dados do usuário logado, mantendo a conta"""
    success = services.clear_all_user_data(db=db, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Não foi possível apagar os dados do usuário.",
        )
    return current_user


@router.delete("/users/me", status_code=HTTP_204_NO_CONTENT, tags=["Users"])
def delete_user_me(
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
    db=Depends(get_db),
):
    """Apaga a conta do usuário logado"""
    success = services.delete_user(db=db, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Não foi possível apagar os dados do usuário.",
        )
    return current_user



@router.post(
    "/data/credentials",
    status_code=status.HTTP_201_CREATED,
    tags=["credentials"],
)
def create_credential(
    credential_data: Annotated[schemas.CredentialBase, Body(...)] ,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """
    Cria uma nova credential para o usuário logado.
    - `email` e `host_url` são opcionais (definidos no schema).
    - Retorna o objeto criado.
    """
    try:
        # chame o serviço responsável por criar a credential
        created = services.create_credential(db=db, user=current_user, credential_data=credential_data)

        # Se o serviço retornar None ou False, convertemos para erro HTTP apropriado
        if not created:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não foi possível criar a credential."
            )

        return {"message": "credencial criado com sucesso!","id":created}

    except HTTPException:
        # re-levanta HTTPExceptions sem modificar (ex: validações de serviço)
        raise
    except ValueError as e:
        # erro de validação simples vindo do serviço
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # Log opcional aqui (print ou logger)
        # print(f"Erro ao criar credential: {e}")
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao criar credential."
        )

@router.post("/data/search", tags=["data"])
def search_data_paginated(
    payload: Annotated[schemas.FilterPageConfig, Body(...)],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.Usuario, Depends(get_current_user)],
):
    """
    Busca paginada de dados.
    Body esperado:
    {
      "pageSize": <int>,
      "pageNumber": <int>,
      "idSeparators": [<int>, ...]   // opcional
    }

    Retorna:
    {
      "pageNumber": int,
      "pageSize": int,
      "items": [ ... ]
    }
    """
    try:
        data = services.get_data_paginated_filtered(db,current_user,payload)
        return data
    except HTTPException:
        raise
    except Exception as e:
        # log opcional: print(f"Erro em busca paginada: {e}")
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{e}"
        )
