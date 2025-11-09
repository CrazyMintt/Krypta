import httpx
import logging
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks
from typing import List

from app.database import SessionLocal
from .. import models, schemas
from ..repository import repository_log, repository_evento
from . import service_utils

logger = logging.getLogger(__name__)


# Função separada para lidar com as tarefas lentas em background
def _task_send_email_and_fetch_region(
    log_id: int, ip: str | None, email: str, assunto: str, mensagem: str
):
    """
    TAREFA DE BACKGROUND (LENTA):
    1. Busca a região do IP.
    2. Atualiza o Log no DB com a região.
    3. Envia o email de notificação.
    """
    # Buscar Região
    regiao = "Desconhecida"
    if ip != "unknown" and ip != "127.0.0.1":
        try:
            # Chamada de rede síncrona (OK, pois está em background)
            url = f"http://ip-api.com/json/{ip}"
            response = httpx.get(url, timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                regiao = f"{data.get('city', '')}, {data.get('region', '')}, {data.get('country', '')}"
        except Exception as e:
            logger.error(f"Falha ao buscar GeoIP para {ip}: {e}")

    # Atualizar o Log no DB
    # A tarefa de background roda *fora* da sessão da request,
    # então ela precisa criar sua própria sessão de DB.
    db: Session = SessionLocal()
    try:
        repository_log.update_log_region(db, log_id=log_id, regiao=regiao)
    finally:
        db.close()

    # Enviar o Email
    mensagem_com_regiao = f"{mensagem}\nRegião: {regiao}"
    service_utils.send_email_alert_placeholder(
        email=email, assunto=assunto, mensagem=mensagem_com_regiao
    )


def log_and_notify(
    db: Session,
    user: models.Usuario,
    tipo_acesso: schemas.LogTipo,
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
        tipo_acesso=tipo_acesso.value,
        id_dado=dado.id if dado else None,
        nome_aplicacao=dado.nome_aplicacao if dado else None,
    )
    repository_log.create_log_entry(db, db_log=db_log)
    db.flush()
    db.refresh(db_log)

    # Lógica de Notificação para eventos críticos
    if tipo_acesso in schemas.EVENTOS_CRITICOS:

        mensagem_notificacao = (
            f"Um novo evento de '{tipo_acesso.value}' foi detectado em sua conta."
        )

        # Criar a notificação na Tabela Eventos
        db_evento = models.Evento(usuario_id=user.id, notificacao=mensagem_notificacao)
        repository_evento.create_evento(db, db_evento=db_evento)

        # Disparar o email em background
        tasks.add_task(
            _task_send_email_and_fetch_region,
            log_id=db_log.id,  # Passa o ID do log
            ip=db_log.ip,
            email=user.email,
            assunto=f"Alerta de Segurança: {tipo_acesso.value}",
            mensagem=f"{mensagem_notificacao} do IP: {db_log.ip}",
        )


# --- Serviço de Leitura ---


def get_user_notifications(
    db: Session, user_id: int, page_size: int, page_number: int
) -> List[models.Evento]:
    """Busca as notificações (Eventos) paginadas para o usuário."""
    return repository_evento.get_paginated_eventos_by_user_id(
        db, user_id=user_id, page_size=page_size, page_number=page_number
    )
