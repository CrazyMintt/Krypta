import base64
from typing import List, Optional
from sqlalchemy.orm import Session
from .. import models, schemas
from ..exceptions import DataNotFoundError
from ..repository import repository_separador, repository_data


def decode_base64_file(base64_string: str) -> bytes:
    """
    Decodifica uma string Base64 para bytes, levantando um ValueError em caso de falha.
    """
    try:
        return base64.b64decode(base64_string)
    except Exception as e:
        # A camada da API (router) vai capturar isso como um erro 400 (Bad Request)
        raise ValueError(f"Codificação Base64 inválida: {e}")


def validate_and_get_separadores_for_create(
    db: Session, user_id: int, id_pasta: Optional[int], id_tags: List[int]
) -> tuple[List[models.Separador], Optional[int]]:
    """
    Função helper para CRIAR dados.
    Valida e busca tags e pasta, retornando a lista final de separadores
    e o ID da pasta pai para validação de duplicatas.
    """
    final_separadores: List[models.Separador] = []
    parent_folder_id: Optional[int] = None

    # Validar e buscar Tags
    if id_tags:
        fetched_tags = repository_separador.get_tags_by_ids_and_user(
            db, tag_ids=id_tags, user_id=user_id
        )
        if len(fetched_tags) != len(set(id_tags)):
            raise DataNotFoundError(
                "Uma ou mais tags fornecidas não foram encontradas ou não pertencem a este usuário."
            )
        final_separadores.extend(fetched_tags)

    # Validar e buscar Pasta
    if id_pasta is not None:
        fetched_pasta = repository_separador.get_folder_by_id_and_user(
            db, folder_id=id_pasta, user_id=user_id
        )
        if not fetched_pasta:
            raise DataNotFoundError(
                "A pasta especificada não foi encontrada ou não pertence a este usuário."
            )
        final_separadores.append(fetched_pasta)
        parent_folder_id = fetched_pasta.id

    return final_separadores, parent_folder_id


def handle_separador_update(
    db: Session,
    user_id: int,
    db_dado: models.Dado,
    update_dict: dict,
    update_data: schemas.DataUpdateFile | schemas.DataUpdateCredential,
) -> Optional[int]:
    """
    Função helper para ATUALIZAR dados.
    Modifica 'db_dado.separadores' diretamente.
    Retorna o ID da pasta pai final para validação de duplicatas.
    """
    # Separa os separadores atuais
    current_tags = [
        s for s in db_dado.separadores if s.tipo == models.TipoSeparador.TAG
    ]
    current_pasta_list = [
        s for s in db_dado.separadores if s.tipo == models.TipoSeparador.PASTA
    ]
    current_parent_id = current_pasta_list[0].id if current_pasta_list else None

    final_separadores: List[models.Separador] = []
    final_parent_id: Optional[int] = None

    # Atualizar Tags
    if "id_tags" in update_dict:
        if update_data.id_tags:
            fetched_tags = repository_separador.get_tags_by_ids_and_user(
                db, update_data.id_tags, user_id
            )
            if len(fetched_tags) != len(set(update_data.id_tags)):
                raise DataNotFoundError(
                    "Uma ou mais tags fornecidas não foram encontradas."
                )
            final_separadores.extend(fetched_tags)
    else:
        final_separadores.extend(current_tags)

    # Atualizar Pasta
    if "id_pasta" in update_dict:
        if update_data.id_pasta is not None:
            fetched_pasta = repository_separador.get_folder_by_id_and_user(
                db, update_data.id_pasta, user_id
            )
            if not fetched_pasta:
                raise DataNotFoundError("A pasta especificada não foi encontrada.")
            final_separadores.append(fetched_pasta)
            final_parent_id = fetched_pasta.id
    else:
        final_separadores.extend(current_pasta_list)
        final_parent_id = current_parent_id

    db_dado.separadores = final_separadores
    return final_parent_id


def clear_all_user_data_logic(db: Session, user_id: int):
    """
    Orquestra a exclusão de todos os dados de um usuário, mantendo a conta.
    (Sem commit/rollback)
    """
    dado_ids = repository_data.get_dado_ids_by_user(db, user_id=user_id)
    if dado_ids:
        repository_data.delete_logs_by_user_and_dados(
            db, user_id=user_id, dado_ids=dado_ids
        )

    repository_data.delete_eventos_by_user(db, user_id=user_id)
    repository_data.delete_compartilhamentos_by_user(db, user_id=user_id)
    repository_data.delete_dados_by_user(db, user_id=user_id)
