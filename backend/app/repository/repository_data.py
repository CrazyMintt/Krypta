from typing import Optional, List
from .. import models, schemas
from sqlalchemy.orm import Session, joinedload, subqueryload
from sqlalchemy import func, or_, select, BigInteger, desc, Row

# --- Funções de Busca (Dado, Senha, Arquivo) ---


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
    """Retorna dados paginados de um usuário"""
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
    """Retorna dados paginados, filtrados por separadores"""
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
            subqueryload(models.Dado.separadores),
        )
        .order_by(models.Dado.criado_em.desc())
        .offset(offset)
        .limit(pageSize)
        .distinct()
    )
    result = db.execute(stmt).unique().scalars().all()
    return list(result)


def get_credential_by_name_and_optional_email(
    db: Session, user_id: int, nome_aplicacao: str, email: Optional[str]
) -> models.Dado | None:
    """Busca uma credencial (Dado) pelo nome_aplicacao e email."""
    stmt = (
        select(models.Dado)
        .join(models.Senha)
        .filter(
            models.Dado.usuario_id == user_id,
            models.Dado.nome_aplicacao == nome_aplicacao,
            models.Dado.tipo == models.TipoDado.SENHA,
        )
    )
    if email is not None:
        stmt = stmt.filter(models.Senha.email == email)
    else:
        stmt = stmt.filter(models.Senha.email == None)
    return db.execute(stmt).scalar_one_or_none()


def get_files_by_name_and_ext(
    db: Session, user_id: int, nome_arquivo: str, extensao: str
) -> List[models.Dado]:
    """Busca arquivos por nome e extensão para checagem de duplicata."""
    stmt = (
        select(models.Dado)
        .join(models.Arquivo)
        .filter(
            models.Dado.usuario_id == user_id,
            models.Arquivo.nome_arquivo == nome_arquivo,
            models.Arquivo.extensao == extensao,
            models.Dado.tipo == models.TipoDado.ARQUIVO,
        )
        .options(joinedload(models.Dado.separadores))
    )
    return list(db.execute(stmt).unique().scalars().all())


def find_file_duplicate(
    db: Session,
    user_id: int,
    nome_aplicacao: str,
    nome_arquivo: str,
    extensao: str,
    parent_folder_id: Optional[int],
) -> models.Dado | None:
    """Verifica duplicata de arquivo (nome/extensão) na mesma pasta pai."""
    stmt = (
        select(models.Dado)
        .join(models.Arquivo)
        .filter(
            models.Dado.usuario_id == user_id,
            models.Dado.nome_aplicacao == nome_aplicacao,
            models.Arquivo.nome_arquivo == nome_arquivo,
            models.Arquivo.extensao == extensao,
            models.Dado.tipo == models.TipoDado.ARQUIVO,
        )
    )

    if parent_folder_id is None:
        # Procura arquivo que NÃO esteja em NENHUMA pasta.
        dados_em_pasta_sq = (
            select(models.dados_separadores_association.c.dado_id)
            .join(
                models.Separador,
                models.Separador.id
                == models.dados_separadores_association.c.separador_id,
            )
            .filter(models.Separador.tipo == models.TipoSeparador.PASTA)
            .distinct()
            .subquery()
        )
        stmt = stmt.outerjoin(
            dados_em_pasta_sq, models.Dado.id == dados_em_pasta_sq.c.dado_id
        ).filter(dados_em_pasta_sq.c.dado_id == None)
    else:
        # Procura arquivo que esteja LIGADO a essa pasta.
        stmt = stmt.join(models.Dado.separadores).filter(
            models.Separador.id == parent_folder_id,
            models.Separador.tipo == models.TipoSeparador.PASTA,
        )
    return db.execute(stmt.limit(1)).scalar_one_or_none()


def get_dado_ids_by_separador_ids(db: Session, separador_ids: List[int]) -> List[int]:
    """Busca IDs de 'Dados' únicos associados a uma lista de separadores."""
    if not separador_ids:
        return []
    stmt = (
        select(models.dados_separadores_association.c.dado_id)
        .filter(models.dados_separadores_association.c.separador_id.in_(separador_ids))
        .distinct()
    )
    return list(db.execute(stmt).scalars().all())


# --- Funções de Busca (Compartilhamento) ---


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
    """Conta quantos DadosCompartilhados restam em um Compartilhamento."""
    stmt = select(func.count(models.DadosCompartilhados.id)).filter(
        models.DadosCompartilhados.compartilhamento_id == comp_id,
        models.DadosCompartilhados.dado_origem_id != excluding_dado_id,
    )
    count = db.execute(stmt).scalar()
    return count or 0


# --- Funções de Busca (Dashboard) ---


def get_total_storage_used_by_user(db: Session, user_id: int) -> int:
    """
    Calcula a soma total de bytes de todos os arquivos de um usuário
    usando a função 'LENGTH()' do SQL.
    """
    # func.length() obtém o tamanho do blob
    # func.sum() soma tudo
    # .cast(BigInteger) garante que o resultado caiba
    stmt = (
        select(func.sum(func.length(models.Arquivo.arquivo)).cast(BigInteger))
        .join(models.Dado, models.Arquivo.id == models.Dado.id)
        .filter(models.Dado.usuario_id == user_id)
    )

    total_bytes = db.execute(stmt).scalar()

    # scalar() retorna None se o usuário não tiver arquivos
    return total_bytes or 0


def get_storage_used_by_file_type(db: Session, user_id: int) -> List[Row]:
    """
    Retorna uma lista de tuplas (extensao, bytes_usados)
    agrupada por tipo de arquivo, ordenada da maior para a menor.
    """
    stmt = (
        select(
            models.Arquivo.extensao,
            func.sum(func.length(models.Arquivo.arquivo)).label("bytes_usados"),
        )
        .join(models.Dado, models.Arquivo.id == models.Dado.id)
        .filter(models.Dado.usuario_id == user_id)
        .group_by(models.Arquivo.extensao)
        .order_by(desc("bytes_usados"))  # Ordena do maior para o menor
    )

    # Retorna uma lista de Rows, ex: [('pdf', 10240), ('png', 5120)]
    return list(db.execute(stmt).all())


# --- Funções de Criação (Dado, Senha, Arquivo) ---


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


# --- Funções de Atualização (Dado, Senha, Arquivo) ---


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


# --- Funções de Exclusão (Dado, Log, Evento, Compartilhamento) ---


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


def delete_logs_by_dado_ids(db: Session, dado_ids: List[int]):
    """Deleta em lote todos os logs associados a uma lista de IDs de Dados."""
    if not dado_ids:
        return
    query = db.query(models.Log).filter(models.Log.id_dado.in_(dado_ids))
    query.delete(synchronize_session=False)


def delete_dados_by_ids(db: Session, dado_ids: List[int]):
    """Deleta em lote todos os 'Dados' de uma lista de IDs."""
    if not dado_ids:
        return
    query = db.query(models.Dado).filter(models.Dado.id.in_(dado_ids))
    query.delete(synchronize_session=False)
