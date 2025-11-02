from typing import Optional, List
from . import models, schemas
from sqlalchemy.orm import Session, joinedload, contains_eager
from sqlalchemy import func, or_, select

# Funções de Busca


def get_user_by_email(db: Session, email: str) -> models.Usuario | None:
    """Busca um usuário pelo seu email."""
    stmt = select(models.Usuario).filter(models.Usuario.email == email)
    return db.execute(stmt).scalar_one_or_none()


def get_user_by_id(db: Session, user_id: int) -> models.Usuario | None:
    """Busca um usuário pelo seu ID."""
    stmt = select(models.Usuario).filter(models.Usuario.id == user_id)
    return db.execute(stmt).scalar_one_or_none()


def get_dado_by_id_and_user_id(
    db: Session, dado_id: int, user_id: int
) -> models.Dado | None:
    """Busca um Dado específico pelo seu ID e o ID do usuário proprietário."""
    stmt = select(models.Dado).filter(
        models.Dado.id == dado_id, models.Dado.usuario_id == user_id
    )
    return db.execute(stmt).scalar_one_or_none()


def get_dado_ids_by_user(db: Session, user_id: int) -> List[int]:
    """Busca todos os IDs de Dados que pertencem a um usuário."""
    stmt = select(models.Dado.id).filter(models.Dado.usuario_id == user_id)
    result = db.execute(stmt).scalars().all()

    return list(result)


def get_paginated_data(
    db: Session, pageSize: int, pageNumber: int, id_user: int
) -> List[models.Dado]:
    """
    Retorna dados paginados de um usuário
    """
    offset = (pageNumber - 1) * pageSize

    stmt = (
        select(models.Dado)
        .filter(models.Dado.usuario_id == id_user)
        .options(
            joinedload(models.Dado.senha),
            joinedload(models.Dado.arquivo),
            joinedload(models.Dado.separadores),
        )
        .order_by(models.Dado.criado_em.desc())
        .offset(offset)
        .limit(pageSize)
    )

    result = db.execute(stmt).unique().scalars().all()

    return list(result)


def get_paginated_filtered_data(
    db: Session, pageSize: int, pageNumber: int, idSeparators: list[int], id_user: int
) -> List[models.Dado]:
    """
    Retorna dados paginados, filtrados por separadores
    """
    offset = (pageNumber - 1) * pageSize

    stmt = (
        select(models.Dado)
        .join(models.Dado.separadores)
        .filter(
            models.Dado.usuario_id == id_user, models.Separador.id.in_(idSeparators)
        )
        .options(
            joinedload(models.Dado.senha),
            joinedload(models.Dado.arquivo),
            contains_eager(models.Dado.separadores),
        )
        .order_by(models.Dado.criado_em.desc())
        .offset(offset)
        .limit(pageSize)
        .distinct()
    )  # Adiciona distinct()

    result = db.execute(stmt).unique().scalars().all()

    return list(result)


def get_compartilhamento_ids_by_dado_id(db: Session, dado_id: int) -> List[int]:
    """Busca IDs de Compartilhamentos que contêm um Dado específico."""
    stmt = (
        select(models.DadosCompartilhados.compartilhamento_id)
        .filter(models.DadosCompartilhados.dado_origem_id == dado_id)
        .distinct()
    )
    result = db.execute(stmt).scalars().all()
    return list(result)


def count_remaining_dados_compartilhados(
    db: Session, comp_id: int, excluding_dado_id: int
) -> int:
    """
    Conta quantos DadosCompartilhados restam em um Compartilhamento,
    EXCLUINDO aquele que está associado a um dado_origem_id específico.
    """
    stmt = select(func.count(models.DadosCompartilhados.id)).filter(
        models.DadosCompartilhados.compartilhamento_id == comp_id,
        models.DadosCompartilhados.dado_origem_id != excluding_dado_id,
    )

    count = db.execute(stmt).scalar()
    return count or 0


def get_separador_by_id_and_user_id(
    db: Session, separador_id: int, user_id: int
) -> models.Separador:
    stmt = select(models.Separador).filter(
        models.Separador.id == separador_id, models.Separador.usuario_id == user_id
    )
    return db.execute(stmt).scalar_one_or_none()


def get_folder_by_name_and_parent(
    db: Session, nome: str, user_id: int, parent_id: Optional[int]
) -> models.Separador | None:
    """
    Busca uma pasta por nome e ID da pasta pai,
    garantindo que pertença ao usuário.
    'parent_id=None' busca na raiz.
    """
    stmt = select(models.Separador).filter(
        models.Separador.nome == nome,
        models.Separador.tipo == models.TipoSeparador.PASTA,
        models.Separador.usuario_id == user_id,
        models.Separador.id_pasta_raiz == parent_id,  # A verificação de "irmão"
    )
    return db.execute(stmt).scalar_one_or_none()


def get_tag_by_name_and_user(
    db: Session, nome: str, user_id: int
) -> models.Separador | None:
    """
    Busca um separador por nome, tipo (PASTA ou TAG) e dono.
    Usado para verificar duplicatas.
    """
    stmt = select(models.Separador).filter(
        models.Separador.nome == nome,
        models.Separador.tipo == models.TipoSeparador.TAG,
        models.Separador.usuario_id == user_id,
    )
    return db.execute(stmt).scalar_one_or_none()


def get_all_tags_by_user(db: Session, user_id: int) -> List[models.Separador]:
    """
    Busca todas as Tags (tipo TAG) de um usuário, ordenadas por nome.
    """
    stmt = (
        select(models.Separador)
        .filter(
            models.Separador.usuario_id == user_id,
            models.Separador.tipo == models.TipoSeparador.TAG,
        )
        .order_by(models.Separador.nome)
    )

    results = db.execute(stmt).scalars().all()
    return list(results)


def get_root_folders_by_user(db: Session, user_id: int) -> List[models.Separador]:
    """
    Busca todas as Pastas (tipo PASTA) do nível raiz (sem pai) de um usuário.
    """
    stmt = (
        select(models.Separador)
        .filter(
            models.Separador.usuario_id == user_id,
            models.Separador.tipo == models.TipoSeparador.PASTA,
            models.Separador.id_pasta_raiz == None,  # Filtro para pastas raiz
        )
        .order_by(models.Separador.nome)
    )

    results = db.execute(stmt).scalars().all()
    return list(results)


def get_child_folders_by_parent_id(
    db: Session, user_id: int, parent_folder_id: int
) -> List[models.Separador]:
    """
    Busca todas as Subpastas (tipo PASTA) de uma pasta pai específica.
    """
    stmt = (
        select(models.Separador)
        .filter(
            models.Separador.usuario_id == user_id,  # Segurança
            models.Separador.tipo == models.TipoSeparador.PASTA,
            models.Separador.id_pasta_raiz == parent_folder_id,  # Filtro pela pasta pai
        )
        .order_by(models.Separador.nome)
    )

    results = db.execute(stmt).scalars().all()
    return list(results)


# Funções de Criação


def create_user(db: Session, user_data: models.Usuario) -> models.Usuario:
    db.add(user_data)
    db.commit()
    db.refresh(user_data)
    return user_data


def create_file(db: Session, dado: models.Dado, arquivo: models.Arquivo) -> models.Dado:
    try:
        db.add(dado)
        db.flush()
        arquivo.id = dado.id
        db.add(arquivo)
        db.commit()
        db.refresh(dado)
        return dado
    except Exception as e:
        db.rollback()
        raise e


def create_credential(
    db: Session, dado: models.Dado, senha: models.Senha
) -> models.Dado:
    """Cria um novo Dado e sua Senha filha associada."""
    try:
        db.add(dado)
        db.flush()
        senha.id = dado.id
        db.add(senha)
        db.commit()
        db.refresh(dado)
        return dado
    except Exception as e:
        db.rollback()
        raise e


def create_separador(db: Session, db_separador: models.Separador) -> models.Separador:
    """
    Cria um objeto Separador (pasta/tag) no banco de dados.
    """
    try:
        db.add(db_separador)
        db.commit()
        db.refresh(db_separador)
        return db_separador
    except Exception as e:
        db.rollback()
        raise e


# Funções de Atualização


def update_user(
    db: Session, db_user: models.Usuario, update_data: schemas.UserUpdate
) -> models.Usuario:
    update_data_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_data_dict.items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_file_data(
    db: Session,
    db_dado: models.Dado,
    db_arquivo: models.Arquivo,
    update_data: schemas.DataUpdateFile,
    decoded_bytes: Optional[bytes],
) -> models.Dado:
    try:
        dado_update_dict = update_data.model_dump(
            exclude={"arquivo"}, exclude_unset=True
        )
        for key, value in dado_update_dict.items():
            setattr(db_dado, key, value)

        if update_data.arquivo:
            file_update_dict = update_data.arquivo.model_dump(
                exclude={"arquivo_data"}, exclude_unset=True
            )
            if decoded_bytes is not None:
                db_arquivo.arquivo = decoded_bytes
            if "nome_arquivo" in file_update_dict:
                db_arquivo.nome_arquivo = file_update_dict["nome_arquivo"]
            if "extensao" in file_update_dict:
                db_arquivo.extensao = file_update_dict["extensao"]

        db.commit()
        db.refresh(db_dado)
        return db_dado
    except Exception as e:
        db.rollback()
        raise e


def update_credential_data(
    db: Session,
    db_dado: models.Dado,
    db_senha: models.Senha,
    update_data: schemas.DataUpdateCredential,
) -> models.Dado:
    try:
        dado_update_dict = update_data.model_dump(exclude={"senha"}, exclude_unset=True)
        for key, value in dado_update_dict.items():
            setattr(db_dado, key, value)

        if update_data.senha:
            senha_update_dict = update_data.senha.model_dump(exclude_unset=True)
            for key, value in senha_update_dict.items():
                setattr(db_senha, key, value)

        db.commit()
        db.refresh(db_dado)
        return db_dado
    except Exception as e:
        db.rollback()
        raise e


def update_folder(
    db: Session, db_folder: models.Separador, update_data: schemas.FolderUpdate
) -> models.Separador:
    """
    Aplica atualizações parciais a uma Pasta e commita no banco.
    """
    try:
        update_dict = update_data.model_dump(exclude_unset=True)

        for key, value in update_dict.items():
            setattr(db_folder, key, value)

        db.commit()
        db.refresh(db_folder)
        return db_folder

    except Exception as e:
        db.rollback()
        raise e


def update_tag(
    db: Session, db_tag: models.Separador, update_data: schemas.TagUpdate
) -> models.Separador:
    """
    Aplica atualizações parciais a uma Tag e commita no banco.
    """
    try:
        update_dict = update_data.model_dump(exclude_unset=True)

        for key, value in update_dict.items():
            setattr(db_tag, key, value)

        db.commit()
        db.refresh(db_tag)
        return db_tag

    except Exception as e:
        db.rollback()
        raise e


# Funções de Exclusão


def delete_logs_by_user_and_dados(db: Session, user_id: int, dado_ids: List[int]):
    query = db.query(models.Log).filter(
        or_(models.Log.usuario_id == user_id, models.Log.id_dado.in_(dado_ids))
    )
    query.delete(synchronize_session=False)


def delete_eventos_by_user(db: Session, user_id: int):
    db.query(models.Evento).filter(models.Evento.usuario_id == user_id).delete(
        synchronize_session=False
    )


def delete_compartilhamentos_by_user(db: Session, user_id: int):
    db.query(models.Compartilhamento).filter(
        models.Compartilhamento.owner_usuario_id == user_id
    ).delete(synchronize_session=False)


def delete_dados_by_user(db: Session, user_id: int):
    db.query(models.Dado).filter(models.Dado.usuario_id == user_id).delete(
        synchronize_session=False
    )


def delete_user_by_id(db: Session, user_id: int):
    db.query(models.Usuario).filter(models.Usuario.id == user_id).delete(
        synchronize_session=False
    )


def delete_logs_by_dado_id(db: Session, dado_id: int):
    db.query(models.Log).filter(models.Log.id_dado == dado_id).delete(
        synchronize_session=False
    )


def delete_dado(db: Session, db_dado: models.Dado):
    db.delete(db_dado)


def delete_compartilhamento_by_id(db: Session, comp_id: int):
    db.query(models.Compartilhamento).filter(
        models.Compartilhamento.id == comp_id
    ).delete(synchronize_session=False)


def delete_separador(db: Session, db_separador: models.Separador):
    db.delete(db_separador)


def get_folder_and_all_descendants_ids(
    db: Session, folder_id: int, user_id: int
) -> List[int]:
    """
    Usa uma query recursiva (CTE) em puro SQLAlchemy para buscar o ID da pasta pai
    e todos os IDs de suas subpastas descendentes,
    garantindo que todas pertençam ao usuário.
    """

    # Seleciona o ID da pasta que o usuário quer deletar
    base_case = (
        select(models.Separador.id)
        .filter(
            models.Separador.id == folder_id,
            models.Separador.usuario_id == user_id,
            models.Separador.tipo == models.TipoSeparador.PASTA,
        )
        .cte(name="folder_tree", recursive=True)
    )  # .cte() transforma em 'WITH RECURSIVE folder_tree AS (...)'

    # Passo Recursivo
    # Junta a tabela Separador com a própria CTE (folder_tree)
    # para encontrar todas as subpastas.
    recursive_step = (
        select(models.Separador.id)
        .join(base_case, models.Separador.id_pasta_raiz == base_case.c.id)
        .filter(
            models.Separador.tipo == models.TipoSeparador.PASTA,
            models.Separador.usuario_id == user_id,  # Garante segurança em cada passo
        )
    )

    # União (UNION ALL)
    # Combina o Caso Base com o Passo Recursivo
    recursive_cte = base_case.union_all(recursive_step)

    # Query Final
    # Seleciona todos os IDs encontrados na CTE
    final_stmt = select(recursive_cte.c.id)

    # Executa e retorna a lista de IDs
    return list(db.execute(final_stmt).scalars().all())


def get_dado_ids_by_separador_ids(db: Session, separador_ids: List[int]) -> List[int]:
    """
    Busca todos os IDs de 'Dados' únicos que estão
    associados a uma lista de IDs de separadores.
    """
    if not separador_ids:
        return []

    stmt = (
        select(models.dados_separadores_association.c.dado_id)
        .filter(models.dados_separadores_association.c.separador_id.in_(separador_ids))
        .distinct()
    )

    return list(db.execute(stmt).scalars().all())


def delete_logs_by_dado_ids(db: Session, dado_ids: List[int]):
    """
    Deleta em lote todos os logs associados a uma lista de IDs de Dados.
    (Esta é uma nova função plural, diferente da 'delete_logs_by_dado_id')
    """
    if not dado_ids:
        return

    query = db.query(models.Log).filter(models.Log.id_dado.in_(dado_ids))
    query.delete(synchronize_session=False)


def delete_dados_by_ids(db: Session, dado_ids: List[int]):
    """
    Deleta em lote todos os 'Dados' de uma lista de IDs.
    O CASCADE do banco cuidará de Senhas, Arquivos, DadosCompartilhados, etc.
    """
    if not dado_ids:
        return

    query = db.query(models.Dado).filter(models.Dado.id.in_(dado_ids))
    query.delete(synchronize_session=False)


def delete_separadores_by_ids(db: Session, separador_ids: List[int]):
    """
    Deleta em lote todos os 'Separadores' (pastas/tags) de uma lista de IDs.
    """
    if not separador_ids:
        return

    query = db.query(models.Separador).filter(models.Separador.id.in_(separador_ids))
    query.delete(synchronize_session=False)
