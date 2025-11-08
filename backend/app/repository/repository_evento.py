from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from .. import models, schemas
from typing import List


def create_evento(db: Session, db_evento: models.Evento):
    """
    Adiciona um novo objeto Evento (notificação) à sessão (não commita).
    """
    db.add(db_evento)


def get_paginated_eventos_by_user_id(
    db: Session, user_id: int, page_size: int, page_number: int
) -> List[models.Evento]:
    """
    Busca notificações (eventos) paginadas de um usuário, mais recentes primeiro.
    """
    offset = (page_number - 1) * page_size

    stmt = (
        select(models.Evento)
        .filter(models.Evento.usuario_id == user_id)
        .order_by(desc(models.Evento.created_at))
        .offset(offset)
        .limit(page_size)
    )

    results = db.execute(stmt).scalars().all()
    return list(results)
