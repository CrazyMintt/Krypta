import logging
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from .. import models
from typing import List

logger = logging.getLogger(__name__)


def create_log_entry(db: Session, db_log: models.Log):
    """
    Adiciona um novo objeto Log à sessão.
    """
    db.add(db_log)


def get_paginated_logs_by_user_id(
    db: Session, user_id: int, page_size: int, page_number: int
) -> List[models.Log]:
    """
    Busca logs paginados de um usuário.
    """
    offset = (page_number - 1) * page_size

    stmt = (
        select(models.Log)
        .filter(models.Log.usuario_id == user_id)
        .order_by(desc(models.Log.data_hora))
        .offset(offset)
        .limit(page_size)
    )

    results = db.execute(stmt).scalars().all()
    return list(results)


def update_log_region(db: Session, log_id: int, regiao: str):
    """
    Adiciona a informação de 'regiao' a um registro de Log
    que já existe.
    """
    try:
        # Busca o log pelo ID
        db_log = db.query(models.Log).filter(models.Log.id == log_id).first()
        if db_log:
            # Atualiza o campo e commita
            db_log.regiao = regiao
            db.commit()
    except Exception as e:
        db.rollback()
        # Loga o erro, mas não quebra a tarefa de background
        logger = logging.getLogger(__name__)
        logger.error(f"Falha ao atualizar região do log {log_id}: {e}")
