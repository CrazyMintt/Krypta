from sqlalchemy.orm import Session
from . import models, schemas, repository, core
from .exceptions import UserNotFoundError, EmailAlreadyExistsError
import logging
import os
import sys
from sqlalchemy import update, text

# ==============================
# Configuração do logger (Docker-friendly, debugado)
# ==============================

LOG_DIR = "/app/logs"
os.makedirs(LOG_DIR, exist_ok=True)

# Use sys.stdout explicitamente para garantir que vá para stdout (docker logs)
console_handler = logging.StreamHandler(stream=sys.stdout)
console_handler.setLevel(logging.INFO)

file_handler = logging.FileHandler(f"{LOG_DIR}/create_credential.log", mode="a", encoding="utf-8")
file_handler.setLevel(logging.INFO)

formatter = logging.Formatter(
    fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
console_handler.setFormatter(formatter)
file_handler.setFormatter(formatter)

# Logger do módulo
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Evita adicionar handlers duplicados se o módulo for recarregado
if not logger.handlers:
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

# Impede que a mensagem "suba" para loggers pai que podem suprimi-las
logger.propagate = False

# ---------- Opcional: também registre no root logger se estiver usando frameworks ----------
# Isso ajuda quando uvicorn/gunicorn estão no controle dos logs;
# adiciona um handler ao logger root só se não houver nenhum handler.
root_logger = logging.getLogger()
if not root_logger.handlers:
    root_logger.addHandler(console_handler)
    root_logger.setLevel(logging.INFO)

# ==============================
# Funções utilitárias de debug (execute manualmente ao iniciar)
# ==============================
def _debug_loggers():
    """Imprime info útil para debug de handlers e níveis (chame apenas durante debug)."""
    print("=== debug loggers ===", file=sys.stderr)
    print("module logger:", logger, file=sys.stderr)
    print("module handlers:", logger.handlers, file=sys.stderr)
    print("module propagate:", logger.propagate, file=sys.stderr)
    print("root logger handlers:", logging.getLogger().handlers, file=sys.stderr)
    print("======================", file=sys.stderr)

# Chame uma vez ao importar (comente em produção se preferir)
_debug_loggers()

# ==============================
# Função principal
# ==============================
def create_credential(db: Session, user: models.Usuario, credential_data: schemas.CredentialBase) -> bool:
    nome_aplicacao = getattr(credential_data, "nome_aplicacao", None)
    if not nome_aplicacao:
        raise ValueError("Campo 'nome_aplicacao' é obrigatório.")

    descricao = getattr(credential_data, "descricao", None)
    senha_cripto = getattr(credential_data, "senha_cripto", None)
    if not senha_cripto:
        raise ValueError("Campo 'senha_cripto' é obrigatório para tipo 'senha'.")

    email = getattr(credential_data, "email", None)
    host_url = getattr(credential_data, "host_url", None)

    logger.info(f"[create_credential] Iniciando criação para usuário {user.id}, app='{nome_aplicacao}'")

    try:
        call_sql = text(
            "CALL create_credential(:p_usuario_id, :p_nome_aplicacao, :p_descricao, "
            ":p_tipo, :p_senha_cripto, :p_email, :p_host_url, @p_dado_id)"
        )

        db.execute(
            call_sql,
            {
                "p_usuario_id": int(user.id),
                "p_nome_aplicacao": nome_aplicacao,
                "p_descricao": descricao,
                "p_tipo": "senha",
                "p_senha_cripto": senha_cripto,
                "p_email": email,
                "p_host_url": host_url,
            },
        )
        db.commit()

        out = db.execute(text("SELECT @p_dado_id")).fetchone()
        novo_dado_id = out[0] if out else None

        if not novo_dado_id:
            raise ValueError("Procedure retornou NULL ou falhou ao criar o dado.")

  
        logger.info(f"[create_credential] Credential criada com sucesso (dado_id={novo_dado_id}) para usuário {user.id}")
        return True

    except Exception as e:
        try:
            db.rollback()
        except Exception as rb_err:
            logger.error(f"[create_credential] Falha no rollback: {rb_err}")

        logger.exception(f"[create_credential] Erro ao criar credential para usuário {user.id}: {e}")
        raise ValueError(f"Erro ao criar credential via procedure: {e}")


def register_user(db: Session, user_data: schemas.UserCreate) -> models.Usuario | None:
    """
    Serviço para registrar um novo usuário.
    Contém a lógica de negócio para verificar se o email já existe.
    """
    # Verificar se já existe um usuário com este email
    existing_user = repository.get_user_by_email(db=db, email=user_data.email)
    if existing_user:
        return None
    # Cria o hash da senha
    hashed_password = core.get_password_hash(user_data.senha_mestre)
    salt = core.generate_crypto_salt()

    new_user = models.Usuario(
        email=user_data.email,
        nome=user_data.nome,
        senha_mestre=hashed_password,
        saltKDF=salt,
    )

    return repository.create_user(db, user_data=new_user)


def authenticate_and_login_user(
    db: Session, email: str, password: str
) -> schemas.LoginResponse | None:
    """
    Serviço para autenticar um usuário.
    Contém a lógica de negócio completa para o processo de login.
    """
    user = repository.get_user_by_email(db, email)

    if not user or not core.verify_password(password, user.senha_mestre):
        return None

    access_token = core.create_access_token(
        data={"sub": str(user.id)}
    )  # tem que ser string

    return schemas.LoginResponse(
        nome=user.nome,
        id=user.id,
        created_at=user.created_at,
        email=user.email,
        access_token=access_token,
        saltKDF=user.saltKDF,
    )


def edit_user(
    db: Session, user: models.Usuario, update_data: schemas.UserBase
) -> models.Usuario:

    # verificar se o email já não está em uso por outro usuario
    if update_data.email and update_data.email != user.email:
        existing_user = repository.get_user_by_email(db, email=update_data.email)
        if existing_user:
            raise EmailAlreadyExistsError(
                f"O email {update_data.email} já está em uso."
            )

    return repository.update_user(db=db, db_user=user, update_data=update_data)


def clear_all_user_data(db: Session, user_id: int) -> bool:
    """
    Orquestra a exclusão de todos os dados de um usuário, mantendo a conta.

    A ordem é importante para respeitar as restrições de chave estrangeira:
    1. Logs (referenciam Usuário e Dado)
    2. Eventos (referenciam Usuário)
    3. Compartilhamentos (referenciam Usuário)
    4. Dados (referenciam Usuário)
    """
    try:
        # Busca os IDs dos dados
        dado_ids = repository.get_dado_ids_by_user(db, user_id=user_id)

        # Deleta os logs
        if dado_ids:
            repository.delete_logs_by_user_and_dados(
                db, user_id=user_id, dado_ids=dado_ids
            )

        # Deleta o restante
        repository.delete_eventos_by_user(db, user_id=user_id)
        repository.delete_compartilhamentos_by_user(db, user_id=user_id)
        repository.delete_dados_by_user(db, user_id=user_id)

        db.commit()
        return True

    except Exception as e:
        # Se qualquer passo falhar, desfaz tudo
        db.rollback()
        print(f"Erro ao limpar dados do usuário {user_id}: {e}")
        return False
