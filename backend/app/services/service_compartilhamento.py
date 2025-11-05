from datetime import datetime
from sqlalchemy.orm import Session
from .. import models, schemas
from ..repository import repository_compartilhamento, repository_data
from ..exceptions import DataNotFoundError
from .service_utils import decode_base64_file
import secrets


def create_share_link(
    db: Session, user_id: int, share_data: schemas.ShareDataCreate
) -> models.Compartilhamento:
    """
    Serviço para criar um novo compartilhamento.
    """

    # Verificar se o Dado original existe e pertence ao usuário
    db_dado_origem = repository_data.get_dado_by_id_and_user_id(
        db, dado_id=share_data.dado_origem_id, user_id=user_id
    )
    if not db_dado_origem:
        raise DataNotFoundError(
            "O dado que você está tentando compartilhar não foi encontrado."
        )

    # Decodificar o blob criptografado
    encrypted_bytes = decode_base64_file(share_data.dado_criptografado)

    # Gerar o token de acesso seguro
    token = secrets.token_urlsafe(32)  # Gera um token de 32 bytes

    # Criar os objetos de modelo
    db_compartilhamento = models.Compartilhamento(
        owner_usuario_id=user_id,
        token_acesso=token,  # Armazena o token
        n_acessos_total=share_data.n_acessos_total,
        data_expiracao=share_data.data_expiracao,
        n_acessos_atual=0,
    )

    db_dado_compartilhado = models.DadosCompartilhados(
        dado_origem_id=share_data.dado_origem_id,
        dado_criptografado=encrypted_bytes,  # Salva os bytes
        meta=share_data.meta,
    )

    # Chamar o repositório para salvar
    return repository_compartilhamento.create_share(
        db,
        db_compartilhamento=db_compartilhamento,
        db_dado_compartilhado=db_dado_compartilhado,
    )


def get_shared_data_by_token(
    db: Session, token_acesso: str
) -> models.DadosCompartilhados:
    """
    Serviço para que um destinatário acesse um dado compartilhado.
    Verifica as regras de acesso.
    """
    # 1. Buscar o 'envelope' do Compartilhamento
    db_share = repository_compartilhamento.get_share_by_token(
        db, token_acesso=token_acesso
    )

    if not db_share:
        raise DataNotFoundError("Link de compartilhamento inválido ou expirado.")

    # 2. Validar as regras de negócio
    if db_share.data_expiracao and db_share.data_expiracao < datetime.now():
        raise DataNotFoundError("Este link de compartilhamento expirou.")

    if db_share.n_acessos_atual >= db_share.n_acessos_total:
        raise DataNotFoundError(
            "Este link de compartilhamento atingiu o número máximo de acessos."
        )

    if not db_share.dados_compartilhados:
        # O dado original foi deletado e o cascade limpou o filho
        raise DataNotFoundError("O item original deste compartilhamento foi removido.")

    # 3. Incrementar o contador de acessos
    repository_compartilhamento.increment_share_access_count(db, db_share)

    # 4. Retornar o dado criptografado
    # ( assumindo um-para-um, pegamos o primeiro )
    return db_share.dados_compartilhados[0]
