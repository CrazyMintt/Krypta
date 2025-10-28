from typing import Optional
from . import models, schemas
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.sql import or_


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


def get_dado_by_id_and_user_id(
    db: Session, dado_id: int, user_id: int
) -> models.Dado | None:
    """Busca um Dado específico pelo seu ID e o ID do usuário proprietário."""
    return (
        db.query(models.Dado)
        .filter(models.Dado.id == dado_id, models.Dado.usuario_id == user_id)
        .first()
    )


def delete_logs_by_dado_id(db: Session, data_id: int):
    """Deleta todos os logs associados a um ID de Dado específico."""
    db.query(models.Log).filter(models.Log.id_dado == data_id).delete(
        synchronize_session=False
    )


def delete_dado(db: Session, db_dado: models.Dado):
    """Deleta um objeto Dado do banco de dados."""
    db.delete(db_dado)


def get_compartilhamento_ids_by_dado_id(db: Session, dado_id: int) -> list[int]:
    """Busca IDs de Compartilhamentos que contêm um Dado específico."""
    comp_ids = (
        db.query(models.DadosCompartilhados.compartilhamento_id)
        .filter(models.DadosCompartilhados.dado_origem_id == dado_id)
        .distinct()
        .all()
    )
    return [c[0] for c in comp_ids]


def count_remaining_dados_compartilhados(
    db: Session, comp_id: int, excluding_dado_id: int
) -> int:
    """
    Conta quantos DadosCompartilhados restam em um Compartilhamento,
    EXCLUINDO aquele que está associado a um dado_origem_id específico.
    """
    count = (
        db.query(func.count(models.DadosCompartilhados.id))
        .filter(
            models.DadosCompartilhados.compartilhamento_id == comp_id,
            # Não conta o dado que será deletado
            models.DadosCompartilhados.dado_origem_id != excluding_dado_id,
        )
        .scalar()
    )
    return count or 0


def delete_compartilhamento_by_id(db: Session, comp_id: int):
    """Deleta um Compartilhamento pelo ID."""
    db.query(models.Compartilhamento).filter(
        models.Compartilhamento.id == comp_id
    ).delete(synchronize_session=False)


def update_file_data(
    db: Session,
    db_dado: models.Dado,
    db_arquivo: models.Arquivo,
    update_data: schemas.DataUpdateFile,
    decoded_bytes: Optional[bytes],
) -> models.Dado:
    """
    Aplica atualizações parciais a um Dado do tipo Arquivo e seu Arquivo filho,
    e commita as alterações no banco de dados.
    """
    try:
        # Atualizar campos do Dado pai
        dado_update_dict = update_data.model_dump(
            exclude={"arquivo"}, exclude_unset=True
        )
        for key, value in dado_update_dict.items():
            setattr(db_dado, key, value)

        # Atualizar o Arquivo filho
        if update_data.arquivo:
            # Pega o dicionário do schema, mas ignora 'arquivo_data' (string)
            file_update_dict = update_data.arquivo.model_dump(
                exclude={"arquivo_data"}, exclude_unset=True
            )

            # Atualiza o blob
            if decoded_bytes is not None:
                db_arquivo.arquivo = decoded_bytes

            # Atualizar outros campos do Arquivo (nome, extensão)
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
