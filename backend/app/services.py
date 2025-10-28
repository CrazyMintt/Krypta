from sqlalchemy.orm import Session
from . import models, schemas, repository, core
from .exceptions import UserNotFoundError, EmailAlreadyExistsError
import logging
import os
import sys
from sqlalchemy import update, text
from fastapi import HTTPException,status
# ==============================
# Função principal
# ==============================

def create_credential(db: Session, user: models.Usuario, credential_data: schemas.CredentialBase) -> bool:
    nome_aplicacao = getattr(credential_data, "nome_aplicacao", None)
    if not nome_aplicacao:
        raise ValueError("Campo 'nome_aplicacao' é obrigatório.")

    descricao = getattr(credential_data, "descricao", None)
    senha_cripto = getattr(credential_data, "senha_cripto", None)
    if not senha_cripto:
        raise ValueError("Campo 'senha_cripto' é obrigatório para tipo 'senha'.")

    email = getattr(credential_data, "email", None)
    host_url = getattr(credential_data, "host_url", None)


    try:
        call_sql = text(
            "CALL create_credential(:p_usuario_id, :p_nome_aplicacao, :p_descricao, "
            ":p_tipo, :p_senha_cripto, :p_email, :p_host_url, @p_dado_id)"
        )

        db.execute(
            call_sql,
            {
                "p_usuario_id": int(user.id),
                "p_nome_aplicacao": nome_aplicacao,
                "p_descricao": descricao,
                "p_tipo": "senha",
                "p_senha_cripto": senha_cripto,
                "p_email": email,
                "p_host_url": host_url,
            },
        )
        db.commit()

        out = db.execute(text("SELECT @p_dado_id")).fetchone()
        novo_dado_id = out[0] if out else None

        if not novo_dado_id:
            raise ValueError("Procedure retornou NULL ou falhou ao criar o dado.")

  
        return novo_dado_id

    except Exception as e:
        try:
            db.rollback()
        except Exception as rb_err:
            pass # colocar logger
        #colocar logger
        raise ValueError(f"Erro ao criar credential via procedure: {e}")


def get_data_paginated_filtered(db:Session,user_data: models.Usuario,fpData:schemas.FilterPageConfig):
        # extrai parâmetros do body com validação básica
        try:
            pageSize = getattr(fpData,"pageSize",None)
            pageNumber = getattr(fpData,"pageNumber",None)
            idSeparators = getattr(fpData,"idSeparators", []) or []
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="leitura",
            )  
        if pageSize is None or pageNumber is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Os campos 'pageSize' e 'pageNumber' são obrigatórios.",
            )

        try:
            pageSize = int(pageSize)
            pageNumber = int(pageNumber)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="'pageSize' e 'pageNumber' devem ser inteiros.",
            )

        if pageSize <= 0 or pageNumber <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="'pageSize' e 'pageNumber' devem ser maiores que zero.",
            )

        if not isinstance(idSeparators, list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="'idSeparators' deve ser uma lista de inteiros.",
            )

        # garante que os separadores sejam inteiros
        try:
            idSeparators = [int(x) for x in idSeparators]
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Elementos de 'idSeparators' devem ser inteiros.",
            )

        try:
            # chama a função de repositório adequada
            raw_rows = []
            if idSeparators:
                raw_rows = repository.get_paginated_filtered_data(db, pageSize, pageNumber, idSeparators,user_data.id)
            else:
                raw_rows = repository.get_paginated_data(db, pageSize, pageNumber,user_data.id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{e}",
            ) 
        # assegura que cada linha seja serializável (mappings() -> dict). 
        # repository já retorna lista de dicts conforme seu código.
        # Filtra pelo usuário atual caso a query não aplique o filtro
        try:
            filtered = [r for r in raw_rows if int(r.get("usuario_id", -1)) == int(user_data.id)]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"FILTRO {e}",
            )

        return {
            "pageNumber": pageNumber,
            "pageSize": pageSize,
            "items": filtered,
        }

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


# Função criada para não precisar repetir
def try_clear_all_user_data(db: Session, user_id: int):
    """
    Orquestra a exclusão de todos os dados de um usuário, mantendo a conta.

    A ordem é importante para respeitar as restrições de chave estrangeira:
    1. Logs (referenciam Usuário e Dado)
    2. Eventos (referenciam Usuário)
    3. Compartilhamentos (referenciam Usuário)
    4. Dados (referenciam Usuário)
    """
    # Busca os IDs dos dados
    dado_ids = repository.get_dado_ids_by_user(db, user_id=user_id)

    # Deleta os logs
    if dado_ids:
        repository.delete_logs_by_user_and_dados(db, user_id=user_id, dado_ids=dado_ids)

    # Deleta o restante
    repository.delete_eventos_by_user(db, user_id=user_id)
    repository.delete_compartilhamentos_by_user(db, user_id=user_id)
    repository.delete_dados_by_user(db, user_id=user_id)


def clear_all_user_data(db: Session, user_id: int) -> bool:
    try:
        try_clear_all_user_data(db=db, user_id=user_id)
        db.commit()
        return True
    except Exception:
        # Se qualquer passo falhar, desfaz tudo
        db.rollback()
        return False


def delete_user(db: Session, user_id: int) -> bool:
    """
    Deleta conta de um usuário
    """
    try:
        try_clear_all_user_data(db=db, user_id=user_id)
        repository.delete_user(db=db, user_id=user_id)
        db.commit()
        return True
    except Exception:
        # Se qualquer passo falhar, desfaz tudo
        db.rollback()
        return False
