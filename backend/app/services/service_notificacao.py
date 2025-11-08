from sqlalchemy.orm import Session
from fastapi import BackgroundTasks
from typing import List
from .. import models, schemas
from ..repository import repository_log, repository_evento
from . import service_utils


def log_and_notify(
    db: Session,
    user: models.Usuario,
    tipo_acesso: str,
    log_context: schemas.LogContext,
    tasks: BackgroundTasks,
    dado: models.Dado | None = None,
):
    """
    Serviço central para criar Logs e, se crítico,
    criar Eventos (notificações) e disparar emails.
    """

    # Criar o Log de auditoria
    db_log = models.Log(
        usuario_id=user.id,
        dispositivo=log_context.dispositivo,
        ip=log_context.ip,
        tipo_acesso=tipo_acesso,
        id_dado=dado.id if dado else None,
        nome_aplicacao=dado.nome_aplicacao if dado else None,
    )
    repository_log.create_log_entry(db, db_log=db_log)

    # Lógica de Notificação para eventos críticos
    eventos_criticos = [
        "login_sucesso",
        "login_falho",
        "senha_mestra_alterada",
        "compartilhamento_criado",
    ]

    if tipo_acesso in eventos_criticos:

        mensagem_notificacao = (
            f"Um novo evento de '{tipo_acesso}' foi detectado em sua conta."
        )

        # Criar a notificação na Tabela Eventos
        db_evento = models.Evento(usuario_id=user.id, notificacao=mensagem_notificacao)
        repository_evento.create_evento(db, db_evento=db_evento)

        # Disparar o email em background
        tasks.add_task(
            service_utils.send_email_alert_placeholder,
            email=user.email,
            assunto=f"Alerta de Segurança: {tipo_acesso}",
            mensagem=f"{mensagem_notificacao} do IP: {log_context.ip}",
        )


# --- Serviço de Leitura ---


def get_user_notifications(
    db: Session, user_id: int, page_size: int, page_number: int
) -> List[models.Evento]:
    """Busca as notificações (Eventos) paginadas para o usuário."""
    return repository_evento.get_paginated_eventos_by_user_id(
        db, user_id=user_id, page_size=page_size, page_number=page_number
    )
