from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from .. import models, schemas
from typing import List


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
