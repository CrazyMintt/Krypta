import logging
from typing import List
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks

from app.repository import repository_log

from .. import services
from .. import models, schemas
from ..repository import repository_data
from ..exceptions import (
    DataNotFoundError,
    DuplicateDataError,
    StorageLimitExceededError,
)

logger = logging.getLogger(__name__)

# GET


def get_data_paginated_filtered(
    db: Session, user_data: models.Usuario, fpData: schemas.FilterPageConfig
) -> List[models.Dado]:
    """
    Busca dados paginados e/ou filtrados.
    A validação dos parâmetros é feita pelo schema Pydantic.
    """
    # A validação de pageSize, pageNumber e idSeparators é
    # tratada automaticamente pelo FastAPI/Pydantic na camada da API.

    # Se não houver filtros, chama a função paginada simples
    if not fpData.id_separadores:
        return repository_data.get_paginated_data(
            db,
            pageSize=fpData.page_size,
            pageNumber=fpData.page_number,
            id_user=user_data.id,
        )
    # Se houver filtros, chama a função filtrada
    else:
        return repository_data.get_paginated_filtered_data(
            db,
            pageSize=fpData.page_size,
            pageNumber=fpData.page_number,
            idSeparators=fpData.id_separadores,
            id_user=user_data.id,
        )


def get_specific_data(
    db: Session,
    user: models.Usuario,
    data_id: int,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
) -> models.Dado:
    """
    Busca um Dado específico pelo seu ID, garantindo que pertença ao usuário.
    """
    db_dado = repository_data.get_dado_by_id_and_user_id(
        db, dado_id=data_id, user_id=user.id
    )
    if not db_dado:
        raise DataNotFoundError(
            f"Dado com id {data_id} não encontrado ou não pertence ao usuário."
        )
    try:
        services.log_and_notify(
            db, user, schemas.LogTipo.DADO_VISUALIZADO, log_context, tasks, dado=db_dado
        )
        db.commit()
    except Exception as e:
        logger.error(
            f"Falha ao logar vizualização do Dado {data_id}: {e}", exc_info=True
        )
        db.rollback()
    return db_dado


# CREATE
def create_credential(
    db: Session,
    user: models.Usuario,
    credential_data: schemas.DataCreateCredential,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
) -> models.Dado:
    """
    Serviço para criar um novo Dado do tipo Senha,
    associando-o a pastas/tags.
    """
    # Validações de Duplicata de Nome e Email
    credencial_email = credential_data.senha.email
    existing_credential = repository_data.get_credential_by_name_and_optional_email(
        db,
        user_id=user.id,
        nome_aplicacao=credential_data.nome_aplicacao,
        email=credencial_email,
    )
    if existing_credential:
        if credencial_email:
            raise DuplicateDataError(
                f"Uma credencial com o nome '{credential_data.nome_aplicacao}' "
                f"e email '{credencial_email}' já existe."
            )
        else:
            raise DuplicateDataError(
                f"Uma credencial com o nome '{credential_data.nome_aplicacao}' (e sem email) já existe."
            )

    # Chama o helper de utils
    final_separadores, _ = services.validate_and_get_separadores_for_create(
        db,
        user_id=user.id,
        id_pasta=credential_data.id_pasta,
        id_tags=credential_data.id_tags,
    )
    try:
        db_dado = models.Dado(
            usuario_id=user.id,
            nome_aplicacao=credential_data.nome_aplicacao,
            descricao=credential_data.descricao,
            tipo=models.TipoDado.SENHA,
            separadores=final_separadores,
        )
        db_senha = models.Senha(
            senha_cripto=credential_data.senha.senha_cripto,
            iv_senha_cripto=credential_data.senha.iv_senha_cripto,
            email=credential_data.senha.email,
            host_url=credential_data.senha.host_url,
        )
        created_data = repository_data.create_credential(
            db=db, dado=db_dado, senha=db_senha
        )
        services.log_and_notify(
            db=db,
            user=user,
            tipo_acesso=schemas.LogTipo.DADO_CRIADO,
            log_context=log_context,
            tasks=tasks,
            dado=created_data,
        )
        db.commit()
        db.refresh(created_data)
        return created_data
    except Exception as e:
        db.rollback()
        raise e


def create_file(
    db: Session,
    user: models.Usuario,
    file_data: schemas.DataCreateFile,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
) -> models.Dado:
    """
    Serviço para criar um novo Dado do tipo Arquivo.
    """

    # Chama o helper de utils
    final_separadores, parent_folder_id = (
        services.validate_and_get_separadores_for_create(
            db, user_id=user.id, id_pasta=file_data.id_pasta, id_tags=file_data.id_tags
        )
    )

    existing_duplicate = repository_data.find_file_duplicate(
        db,
        user_id=user.id,
        nome_aplicacao=file_data.nome_aplicacao,
        nome_arquivo=file_data.arquivo.nome_arquivo,
        extensao=file_data.arquivo.extensao,
        parent_folder_id=parent_folder_id,
    )
    if existing_duplicate:
        raise DuplicateDataError(
            f"O arquivo '{file_data.nome_aplicacao} / {file_data.arquivo.nome_arquivo}.{file_data.arquivo.extensao}' já existe nesta pasta."
        )

    encrypted_bytes = services.decode_base64_file(file_data.arquivo.arquivo_data)

    novo_arquivo_bytes = len(encrypted_bytes)

    # Obter armazenamento atual
    usado_total = repository_data.get_total_storage_used_by_user(db, user_id=user.id)

    # Verificar o limite (lendo do objeto 'user')
    if (usado_total + novo_arquivo_bytes) > user.armazenamento_total:
        raise StorageLimitExceededError(
            f"Não é possível adicionar o arquivo. Limite de armazenamento de {user.armazenamento_total // (1024*1024)}MB excedido."
        )
    db_dado = models.Dado(
        usuario_id=user.id,
        nome_aplicacao=file_data.nome_aplicacao,
        descricao=file_data.descricao,
        tipo=models.TipoDado.ARQUIVO,
        separadores=final_separadores,
    )
    db_arquivo = models.Arquivo(
        arquivo=encrypted_bytes,
        iv_arquivo=file_data.arquivo.iv_arquivo,
        nome_arquivo=file_data.arquivo.nome_arquivo,
        extensao=file_data.arquivo.extensao,
    )
    created_data = repository_data.create_file(db=db, dado=db_dado, arquivo=db_arquivo)

    services.log_and_notify(
        db, user, schemas.LogTipo.DADO_CRIADO, log_context, tasks, dado=created_data
    )
    db.commit()
    db.refresh(created_data)

    return created_data


# EDIT
def edit_file_data(
    db: Session,
    user: models.Usuario,
    data_id: int,
    update_data: schemas.DataUpdateFile,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
) -> models.Dado:
    """
    Serviço para editar um Dado do tipo Arquivo.
    Valida, decodifica Base64 (se necessário) e chama o repositório para salvar.
    """
    # Valida campos vazios
    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        raise ValueError("Pelo menos um campo deve ser fornecido para atualização.")

    db_dado = repository_data.get_dado_by_id_and_user_id(
        db, dado_id=data_id, user_id=user.id
    )
    if not db_dado or db_dado.tipo != models.TipoDado.ARQUIVO or not db_dado.arquivo:
        raise DataNotFoundError(
            f"Arquivo com id {data_id} inválido ou não pertence ao usuário."
        )

    # Chama o helper de utils
    final_parent_id = services.handle_separador_update(
        db,
        user_id=user.id,
        db_dado=db_dado,
        update_dict=update_dict,
        update_data=update_data,
    )

    # Determina os valores finais para validação de duplicata
    update_file_dict = (
        update_data.arquivo.model_dump(exclude_unset=True)
        if update_data.arquivo
        else {}
    )

    final_nome_app = update_dict.get("nome_aplicacao", db_dado.nome_aplicacao)
    final_nome_arquivo = update_file_dict.get(
        "nome_arquivo", db_dado.arquivo.nome_arquivo
    )
    final_extensao = update_file_dict.get("extensao", db_dado.arquivo.extensao)

    # Validação de Duplicata
    # Só checa se um dos campos-chave (nome, ext, pasta, nome_app) mudou
    if (
        "nome_aplicacao" in update_dict
        or "nome_arquivo" in update_file_dict
        or "extensao" in update_file_dict
        or "id_pasta" in update_dict
    ):

        existing_duplicate = repository_data.find_file_duplicate(
            db,
            user_id=user.id,
            nome_aplicacao=final_nome_app,
            nome_arquivo=final_nome_arquivo,
            extensao=final_extensao,
            parent_folder_id=final_parent_id,
        )

        if existing_duplicate and existing_duplicate.id != data_id:
            raise DuplicateDataError(
                f"O arquivo '{final_nome_app} / {final_nome_arquivo}.{final_extensao}' já existe nesta pasta."
            )

    decoded_bytes: bytes | None = None
    if update_data.arquivo and "arquivo_data" in update_file_dict:
        base64_string = update_data.arquivo.arquivo_data
        if base64_string is not None:
            decoded_bytes = services.decode_base64_file(base64_string)
            novo_arquivo_bytes = len(decoded_bytes)
            tamanho_arquivo_antigo = repository_data.get_file_size_by_id(
                db, db_dado.arquivo.id
            )
            usado_total = repository_data.get_total_storage_used_by_user(
                db, user_id=user.id
            )
            novo_total_usado = (
                usado_total - tamanho_arquivo_antigo
            ) + novo_arquivo_bytes

            # Verifica o limite
            if novo_total_usado > user.armazenamento_total:
                raise StorageLimitExceededError(
                    f"Não é possível atualizar o arquivo. Limite de armazenamento de {user.armazenamento_total // (1024*1024)}MB excedido."
                )

    try:
        updated_dado = repository_data.update_file_data(
            db=db,
            db_dado=db_dado,
            db_arquivo=db_dado.arquivo,
            update_data=update_data,
            decoded_bytes=decoded_bytes,
        )
        services.log_and_notify(
            db,
            user,
            schemas.LogTipo.DADO_EDITADO,
            log_context,
            tasks,
            dado=updated_dado,
        )
        db.commit()
        db.refresh(updated_dado)
        return updated_dado
    except Exception as e:
        raise e


def edit_credential_data(
    db: Session,
    user: models.Usuario,
    data_id: int,
    update_data: schemas.DataUpdateCredential,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
) -> models.Dado:
    """
    Serviço para editar um Dado do tipo Senha.
    """
    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        raise ValueError("Pelo menos um campo deve ser fornecido para atualização.")

    db_dado = repository_data.get_dado_by_id_and_user_id(
        db, dado_id=data_id, user_id=user.id
    )
    if not db_dado or db_dado.tipo != models.TipoDado.SENHA or not db_dado.senha:
        raise DataNotFoundError(
            f"Credencial com id {data_id} inválida ou não pertence ao usuário."
        )

    # Validação de credencial Duplicada
    update_senha_dict = (
        update_data.senha.model_dump(exclude_unset=True) if update_data.senha else {}
    )
    final_nome_app = update_dict.get("nome_aplicacao", db_dado.nome_aplicacao)
    if "email" in update_senha_dict:
        final_email = update_senha_dict["email"]
    else:
        final_email = db_dado.senha.email
    if final_nome_app:
        existing = repository_data.get_credential_by_name_and_optional_email(
            db, user.id, final_nome_app, final_email
        )
        if existing and existing.id != data_id:
            if final_email:
                raise DuplicateDataError(
                    f"Uma credencial com o nome '{existing.nome_aplicacao} e email '{final_email}' já existe."
                )
            else:
                raise DuplicateDataError(
                    f"Uma credencial com o nome '{existing.nome_aplicacao}' (e sem email) já existe."
                )

    # Chama o helper de utils
    _ = services.handle_separador_update(
        db,
        user_id=user.id,
        db_dado=db_dado,
        update_dict=update_dict,
        update_data=update_data,
    )

    try:
        updated_dado = repository_data.update_credential_data(
            db=db,
            db_dado=db_dado,
            db_senha=db_dado.senha,
            update_data=update_data,
        )
        services.log_and_notify(
            db,
            user,
            schemas.LogTipo.DADO_EDITADO,
            log_context,
            tasks,
            dado=updated_dado,
        )
        db.commit()
        db.refresh(updated_dado)
        return updated_dado
    except Exception as e:
        raise e


# DELETE
def delete_data_by_id(
    db: Session,
    user: models.Usuario,
    dado_id: int,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
):
    """
    Operação de remoção de um Dado específico, Logs associados
    e limpa Compartilhamentos órfãos
    """
    dado = repository_data.get_dado_by_id_and_user_id(
        db=db, user_id=user.id, dado_id=dado_id
    )
    if not dado:
        raise DataNotFoundError(
            f"Dado com id {dado_id} não encontrado ou não pertence ao usuário."
        )
    try:
        # IDs dos compartilhamentos afetados pela remoção desse dado
        compartilhamento_ids = repository_data.get_compartilhamento_ids_by_dado_id(
            db, dado_id=dado_id
        )

        # Deletar os Logs associados primeiro
        repository_data.delete_logs_by_dado_id(db, dado_id=dado_id)

        # O SQLAlchemy/DB cuida do cascade para Senha/Arquivo/Separadores
        repository_data.delete_dado(db, db_dado=dado)

        # depois deletar o Dado, deleta os Compartilhamentos afetados
        for comp_id in compartilhamento_ids:
            # Verifica se o compartilhamento tinha outros dados
            remaining_items_count = (
                repository_data.count_remaining_dados_compartilhados(
                    db, comp_id=comp_id, excluding_dado_id=dado_id
                )
            )
            if remaining_items_count == 0:
                repository_data.delete_compartilhamento_by_id(db, comp_id=comp_id)
        services.log_and_notify(
            db, user, schemas.LogTipo.DADO_DELETADO, log_context, tasks, dado=dado
        )
        db.commit()
    except Exception as e:
        # Se algo der errado, desfaz tudo
        db.rollback()
        raise e
