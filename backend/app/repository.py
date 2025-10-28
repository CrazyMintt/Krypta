
from . import models, schemas
from sqlalchemy.orm import Session
from sqlalchemy import update
from sqlalchemy.sql import or_

from sqlalchemy import text
from sqlalchemy.orm import Session

def get_paginated_data(db: Session, pageSize: int, pageNumber: int,id_user:int):
    """
    Retorna dados paginados filtrados por separadores.
    """
    # Calcular offset da página (ex: página 1 -> offset 0)
    offset = (pageNumber - 1) * pageSize
    query = f"""
    SELECT
        d.id,
        d.usuario_id,
        d.nome_aplicacao,
        d.descricao,
        d.tipo,
        d.criado_em,
        d.nota,
        s.senha_cripto,
        s.email,
        s.host_url,
        a.arquivo,
        a.extensao,
        a.nome_arquivo,
        GROUP_CONCAT(DISTINCT ds_all.separador_id ORDER BY ds_all.separador_id) AS separadores
    FROM dados AS d
    INNER JOIN usuario u ON u.id = d.usuario_id
    LEFT JOIN senhas s ON s.id = d.id
    LEFT JOIN arquivos a ON a.id = d.id
    LEFT JOIN dados_separadores ds_all ON ds_all.dado_id = d.id
    WHERE d.usuario_id = :user_id
    GROUP BY d.id
    ORDER BY d.criado_em DESC
    LIMIT :limit OFFSET :offset;
    """

    params = ({"limit": pageSize, "offset": offset, "user_id": id_user})
    # Executa query e retorna resultado
    result = db.execute(text(query), params)
    rows = result.mappings().all()  # retorna lista de dicionários

    return rows
def get_paginated_filtered_data(db: Session, pageSize: int, pageNumber: int, idSeparators: list[int], id_user: int):
    """
    Retorna dados paginados filtrados por separadores e pelo usuário.
    """
    offset = (pageNumber - 1) * pageSize

    # Cria placeholders seguros (:sep_0, :sep_1, ...)
    in_placeholders = ", ".join([f":sep_{i}" for i in range(len(idSeparators))])

    query = f"""
    SELECT
        d.id,
        d.usuario_id,
        d.nome_aplicacao,
        d.descricao,
        d.tipo,
        d.criado_em,
        d.nota,
        s.senha_cripto,
        s.email,
        s.host_url,
        a.arquivo,
        a.extensao,
        a.nome_arquivo,
        GROUP_CONCAT(DISTINCT ds_all.separador_id ORDER BY ds_all.separador_id) AS separadores
    FROM dados AS d
    LEFT JOIN senhas s ON s.id = d.id
    LEFT JOIN arquivos a ON a.id = d.id
    INNER JOIN dados_separadores ds_all ON ds_all.dado_id = d.id
        AND ds_all.separador_id IN ({in_placeholders})
    WHERE d.usuario_id = :user_id
    GROUP BY d.id
    ORDER BY d.criado_em DESC
    LIMIT :limit OFFSET :offset;
    """

    # Monta os parâmetros dinamicamente
    params = {f"sep_{i}": val for i, val in enumerate(idSeparators)}
    params.update({"limit": pageSize, "offset": offset, "user_id": id_user})

    # Executa query e retorna resultado
    result = db.execute(text(query), params)
    rows = result.mappings().all()  # retorna lista de dicionários

    return rows

def create_user(db: Session, user_data: models.Usuario) -> models.Usuario:
    db_user = models.Usuario(
        email=user_data.email,
        nome=user_data.nome,
        senha_mestre=user_data.senha_mestre,
        saltKDF=user_data.saltKDF,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_email(db: Session, email: str) -> models.Usuario | None:
    """Busca um usuário pelo seu email."""
    return db.query(models.Usuario).filter(models.Usuario.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> models.Usuario | None:
    """Busca um usuário pelo seu ID."""
    return db.query(models.Usuario).filter(models.Usuario.id == user_id).first()


def update_user(
    db: Session, db_user: models.Usuario, update_data: schemas.UserBase
) -> models.Usuario:
    """
    Atualiza um objeto de usuário no banco de dados com dados parciais.
    """
    # Converte o schema Pydantic em um dicionário, excluindo campos não enviados
    update_data_dict = update_data.model_dump(exclude_unset=True)

    # Atualiza o modelo do SQLAlchemy
    for key, value in update_data_dict.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user


def get_dado_ids_by_user(db: Session, user_id: int) -> list[int]:
    """Busca todos os IDs de Dados que pertencem a um usuário."""
    dado_ids = db.query(models.Dado.id).filter(models.Dado.usuario_id == user_id).all()
    # isso retorna uma lista de tuplas (por algum motivo)
    return [d[0] for d in dado_ids]  # transforma a lista de tuplas em uma lista normal


def delete_logs_by_user_and_dados(db: Session, user_id: int, dado_ids: list[int]):
    """Deleta todos os logs associados a um usuário e aos seus dados."""
    query = db.query(models.Log).filter(
        or_(models.Log.usuario_id == user_id, models.Log.id_dado.in_(dado_ids))
    )
    query.delete(synchronize_session=False)


def delete_eventos_by_user(db: Session, user_id: int):
    """Deleta todos os eventos associados a um usuário."""
    db.query(models.Evento).filter(models.Evento.usuario_id == user_id).delete(
        synchronize_session=False
    )


def delete_compartilhamentos_by_user(db: Session, user_id: int):
    """Deleta todos os compartilhamentos criados por um usuário."""
    db.query(models.Compartilhamento).filter(
        models.Compartilhamento.owner_usuario_id == user_id
    ).delete(synchronize_session=False)


def delete_dados_by_user(db: Session, user_id: int):
    """Deleta todos os Dados (senhas e arquivos) de um usuário."""
    db.query(models.Dado).filter(models.Dado.usuario_id == user_id).delete(
        synchronize_session=False
    )


def delete_user(db: Session, user_id: int):
    """Deleta todos a conta de um usuário."""
    db.query(models.Usuario).filter(models.Usuario.id == user_id).delete(
        synchronize_session=False
    )
