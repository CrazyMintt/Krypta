from typing import List
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.services import service_notificacao
from .. import models, schemas
from ..exceptions import DataNotFoundError, SeparatorNameTakenError
from ..repository import repository_separador, repository_data


# GET


def get_tags_by_user(db: Session, user_id: int) -> List[models.Separador]:
    """
    Busca a lista de tags para a barra lateral do frontend.
    """
    return repository_separador.get_all_tags_by_user(db, user_id=user_id)


def get_root_folders(db: Session, user_id: int) -> List[models.Separador]:
    """
    Busca as pastas do nível raiz para o painel principal.
    """
    return repository_separador.get_root_folders_by_user(db, user_id=user_id)


def get_child_folders(
    db: Session, user_id: int, parent_folder_id: int
) -> List[models.Separador]:
    """
    Busca as subpastas de uma pasta pai, após validar o acesso.
    """
    # Validar se a pasta pai existe, pertence ao usuário e é uma pasta
    parent_folder = repository_separador.get_separador_by_id_and_user_id(
        db, separador_id=parent_folder_id, user_id=user_id
    )

    if not parent_folder:
        raise DataNotFoundError(
            f"Pasta com id {parent_folder_id} não encontrada ou não pertence ao usuário."
        )
    if parent_folder.tipo != models.TipoSeparador.PASTA:
        raise ValueError(f"O item com id {parent_folder_id} é uma Tag, não uma Pasta.")

    # Se for válida, buscar as filhas
    return repository_separador.get_child_folders_by_parent_id(
        db, user_id=user_id, parent_folder_id=parent_folder_id
    )


# CREATE


def create_folder(
    db: Session,
    user: models.Usuario,
    folder_data: schemas.FolderCreate,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
) -> models.Separador:
    """
    Serviço para um novo Separador do tipo Pasta.
    Faz todas as validações necessárias
    """

    existing_folder = repository_separador.get_folder_by_name_and_parent(
        db,
        nome=folder_data.nome,
        user_id=user.id,
        parent_id=folder_data.id_pasta_raiz,
    )
    if existing_folder:
        if folder_data.id_pasta_raiz is None:
            raise SeparatorNameTakenError(
                f"Já existe uma pasta raiz com o nome '{folder_data.nome}'."
            )
        else:
            raise SeparatorNameTakenError(
                f"A pasta '{folder_data.nome}' já existe dentro desta pasta pai."
            )

    if folder_data.id_pasta_raiz is not None:
        parent_folder = repository_separador.get_separador_by_id_and_user_id(
            db=db, separador_id=folder_data.id_pasta_raiz, user_id=user.id
        )
        if not parent_folder:
            raise DataNotFoundError(
                "A pasta raiz especificada não existe ou não pertence à esse usuário"
            )
        if parent_folder.tipo != models.TipoSeparador.PASTA:
            raise ValueError("Não é possível criar uma pasta dentro de uma TAG")
    db_folder = models.Separador(
        nome=folder_data.nome,
        tipo=models.TipoSeparador.PASTA,
        usuario_id=user.id,
        id_pasta_raiz=folder_data.id_pasta_raiz,
        cor=None,
    )
    try:
        db_folder = repository_separador.create_separador(db, db_separador=db_folder)
        service_notificacao.log_and_notify(
            db, user, schemas.LogTipo.PASTA_CRIADA, log_context, tasks
        )
        db.commit()
        db.refresh(db_folder)
        return db_folder
    except Exception as e:
        db.rollback()
        raise e


def create_tag(
    db: Session,
    user: models.Usuario,
    tag_data: schemas.TagCreate,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
) -> models.Separador:
    """
    Serviço para criar um novo Separador do tipo Tag.
    Valida se já existe uma Tag com o mesmo nome.
    """

    existing_tag = repository_separador.get_tag_by_name_and_user(
        db, nome=tag_data.nome, user_id=user.id
    )
    if existing_tag:
        raise SeparatorNameTakenError(
            f"Já existe uma tag com o nome '{tag_data.nome}'."
        )
    db_tag = models.Separador(
        nome=tag_data.nome,
        tipo=models.TipoSeparador.TAG,
        usuario_id=user.id,
        cor=tag_data.cor,
        id_pasta_raiz=None,
    )
    try:
        db_tag = repository_separador.create_separador(db, db_separador=db_tag)
        service_notificacao.log_and_notify(
            db, user, schemas.LogTipo.TAG_CRIADA, log_context, tasks
        )
        db.commit()
        db.refresh(db_tag)
        return db_tag
    except Exception as e:
        db.rollback()
        raise e


# EDIT


def edit_folder(
    db: Session,
    user: models.Usuario,
    folder_id: int,
    update_data: schemas.FolderUpdate,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
) -> models.Separador:

    update_dict = update_data.model_dump(exclude_unset=True)

    if not update_dict:
        raise ValueError("Pelo menos um campo deve ser fornecido para atualização.")

    #  Busca a pasta e valida a propriedade
    db_folder = repository_separador.get_separador_by_id_and_user_id(
        db, folder_id, user.id
    )
    if not db_folder or db_folder.tipo != models.TipoSeparador.PASTA:
        raise DataNotFoundError(f"Pasta com id {folder_id} não encontrada.")

    if "nome" in update_dict and update_dict["nome"] != db_folder.nome:
        parent_id_to_check = update_dict.get("id_pasta_raiz", db_folder.id_pasta_raiz)
        existing = repository_separador.get_folder_by_name_and_parent(
            db, nome=update_dict["nome"], user_id=user.id, parent_id=parent_id_to_check
        )
        if existing:
            raise SeparatorNameTakenError(
                f"O nome '{update_dict['nome']}' já existe nesta localização."
            )

    if "id_pasta_raiz" in update_dict:
        new_parent_id = update_dict["id_pasta_raiz"]  # Pode ser None ou int

        if new_parent_id is None:
            pass  # Mover para a raiz é sempre válido

        elif new_parent_id == db_folder.id:
            raise ValueError("Uma pasta não pode ser movida para dentro de si mesma.")

        else:
            # Verificação de Loop de Hierarquia
            current_parent = repository_separador.get_separador_by_id_and_user_id(
                db, new_parent_id, user.id
            )

            if not current_parent or current_parent.tipo != models.TipoSeparador.PASTA:
                raise DataNotFoundError(
                    "A nova pasta pai não foi encontrada ou não pertence ao usuário."
                )

            # Loop para verificar se o novo pai é um descendente da pasta que estamos movendo
            temp_parent = current_parent
            while temp_parent is not None:
                if temp_parent.id_pasta_raiz == db_folder.id:
                    raise ValueError(
                        "Não é possível mover uma pasta para dentro de uma de suas próprias subpastas."
                    )
                if temp_parent.id_pasta_raiz is None:
                    break  # Chegou à raiz, sem loop
                temp_parent = repository_separador.get_separador_by_id_and_user_id(
                    db, temp_parent.id_pasta_raiz, user.id
                )
    # Tenta realizar as operações no DB e commitar
    try:
        db_folder = repository_separador.update_folder(
            db, db_folder=db_folder, update_data=update_data
        )
        service_notificacao.log_and_notify(
            db, user, schemas.LogTipo.SEPARADOR_EDITADO, log_context, tasks
        )
        db.commit()
        return db_folder

    except Exception as e:
        db.rollback()
        raise e


def edit_tag(
    db: Session,
    user: models.Usuario,
    tag_id: int,
    update_data: schemas.TagUpdate,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
) -> models.Separador:
    """Edita uma tag, permitindo mudança de nome ou cor."""

    # Busca a tag e valida a propriedade
    db_tag = repository_separador.get_separador_by_id_and_user_id(db, tag_id, user.id)
    if not db_tag or db_tag.tipo != models.TipoSeparador.TAG:
        raise DataNotFoundError(
            f"Tag com id {tag_id} não encontrada ou não pertence ao usuário."
        )

    update_dict = update_data.model_dump(exclude_unset=True)

    if "nome" in update_dict and update_dict["nome"] != db_tag.nome:
        existing = repository_separador.get_tag_by_name_and_user(
            db, update_dict["nome"], user.id
        )
        if existing:
            raise SeparatorNameTakenError(
                f"O nome de tag '{update_dict['nome']}' já existe."
            )
    try:
        repository_separador.update_tag(db, db_tag=db_tag, update_data=update_data)

        service_notificacao.log_and_notify(
            db, user, schemas.LogTipo.SEPARADOR_EDITADO, log_context, tasks
        )
        db.commit()
        return db_tag
    except Exception as e:
        db.rollback()
        raise e


# DELETE


def delete_tag_by_id(
    db: Session,
    user: models.Usuario,
    tag_id: int,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
):
    """
    Deleta uma Tag específica.
    Verifica se a tag existe, pertence ao usuário e é do tipo TAG.
    """
    db_tag = repository_separador.get_separador_by_id_and_user_id(
        db, separador_id=tag_id, user_id=user.id
    )

    if not db_tag:
        raise DataNotFoundError(
            f"Tag com id {tag_id} não encontrada ou não pertence ao usuário."
        )

    if db_tag.tipo != models.TipoSeparador.TAG:
        raise ValueError(
            f"O item com id {tag_id} é uma Pasta, não uma Tag, e não pode ser excluído por este endpoint."
        )

    try:
        repository_separador.delete_separador(db, db_separador=db_tag)
        service_notificacao.log_and_notify(
            db, user, schemas.LogTipo.SEPARADOR_DELETADO, log_context, tasks
        )

        # O ON DELETE CASCADE em 'dados_separadores' é executado pelo banco
        db.commit()
    except Exception as e:
        db.rollback()
        raise e


def delete_folder_recursively(
    db: Session,
    user: models.Usuario,
    folder_id: int,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
):
    """
    Deleta uma Pasta e TODO o seu conteúdo (subpastas e dados).
    """
    # Valida se a pasta existe, pertence ao usuário e é uma PASTA
    db_folder = repository_separador.get_separador_by_id_and_user_id(
        db, separador_id=folder_id, user_id=user.id
    )
    if not db_folder or db_folder.tipo != models.TipoSeparador.PASTA:
        raise DataNotFoundError(
            f"Pasta com id {folder_id} não encontrada ou não pertence ao usuário."
        )

    try:
        # Encontra todos os IDs de pastas (esta + todas as descendentes)
        all_folder_ids = repository_separador.get_folder_and_all_descendants_ids(
            db, folder_id=folder_id, user_id=user.id
        )

        # Encontra todos os IDs de dados únicos nessas pastas
        all_data_ids = repository_data.get_dado_ids_by_separador_ids(db, all_folder_ids)

        if all_data_ids:
            # Deleta todos os LOGS associados a esses dados
            repository_data.delete_logs_by_dado_ids(db, all_data_ids)

            # Deleta todos os DADOS
            # (CASCADE cuidará de Senha/Arquivo/DadosCompartilhados/dados_separadores)
            repository_data.delete_dados_by_ids(db, all_data_ids)

        # Deleta todas as PASTAS (a pasta principal e suas filhas)
        repository_separador.delete_separadores_by_ids(db, all_folder_ids)

        service_notificacao.log_and_notify(
            db, user, schemas.LogTipo.SEPARADOR_DELETADO, log_context, tasks
        )
        db.commit()

    except Exception as e:
        db.rollback()
        raise e
