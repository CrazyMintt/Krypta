from sqlalchemy.orm import Session
from . import models, schemas, repository, core
from .exceptions import UserNotFoundError, EmailAlreadyExistsError, DataNotFoundError
import logging
import os
import sys
from sqlalchemy import update, text
import base64

# ==============================
# Função principal
# ==============================


def create_credential(
    db: Session, user: models.Usuario, credential_data: schemas.CredentialBase
) -> bool:
    nome_aplicacao = getattr(credential_data, "nome_aplicacao", None)
    if not nome_aplicacao:
        raise ValueError("Campo 'nome_aplicacao' é obrigatório.")

    descricao = getattr(credential_data, "descricao", None)
    senha_cripto = getattr(credential_data, "senha_cripto", None)
    if not senha_cripto:
        raise ValueError("Campo 'senha_cripto' é obrigatório para tipo 'senha'.")

    email = getattr(credential_data, "email", None)
    host_url = getattr(credential_data, "host_url", None)

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

        return novo_dado_id

    except Exception as e:
        try:
            db.rollback()
        except Exception as rb_err:
            pass  # colocar logger
        # colocar logger
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


# Função criada para não precisar repetir
def try_clear_all_user_data(db: Session, user_id: int):
    """
    Orquestra a exclusão de todos os dados de um usuário, mantendo a conta.

    A ordem é importante para respeitar as restrições de chave estrangeira:
    1. Logs (referenciam Usuário e Dado)
    2. Eventos (referenciam Usuário)
    3. Compartilhamentos (referenciam Usuário)
    4. Dados (referenciam Usuário)
    """
    # Busca os IDs dos dados
    dado_ids = repository.get_dado_ids_by_user(db, user_id=user_id)

    # Deleta os logs
    if dado_ids:
        repository.delete_logs_by_user_and_dados(db, user_id=user_id, dado_ids=dado_ids)

    # Deleta o restante
    repository.delete_eventos_by_user(db, user_id=user_id)
    repository.delete_compartilhamentos_by_user(db, user_id=user_id)
    repository.delete_dados_by_user(db, user_id=user_id)


def clear_all_user_data(db: Session, user_id: int) -> bool:
    try:
        try_clear_all_user_data(db=db, user_id=user_id)
        db.commit()
        return True
    except Exception:
        # Se qualquer passo falhar, desfaz tudo
        db.rollback()
        return False


def delete_user(db: Session, user_id: int) -> bool:
    """
    Deleta conta de um usuário
    """
    try:
        try_clear_all_user_data(db=db, user_id=user_id)
        repository.delete_user(db=db, user_id=user_id)
        db.commit()
        return True
    except Exception:
        # Se qualquer passo falhar, desfaz tudo
        db.rollback()
        return False


def create_file(
    db: Session, user_id: int, file_data: schemas.DataCreateFile
) -> models.Dado:
    """
    Serviço para criar um novo Dado do tipo Arquivo.
    """

    # Decodificar a string Base64 para bytes
    try:
        encrypted_bytes = base64.b64decode(file_data.arquivo.arquivo_data)
    except Exception as e:
        # Se a string Base64 for inválida, levanta um ValueError
        # que a API vai capturar como um erro 400 (Bad Request).
        raise ValueError(f"Codificação Base64 inválida: {e}")

    # Criar os objetos de modelo

    # Dado
    db_dado = models.Dado(
        usuario_id=user_id,
        nome_aplicacao=file_data.nome_arquivo,
        descricao=file_data.descricao,
        tipo=models.TipoDado.ARQUIVO,  # Define o tipo
    )

    # Arquivo
    db_arquivo = models.Arquivo(
        arquivo=encrypted_bytes,  # Salva os bytes decodificados
        nome_arquivo=file_data.arquivo.nome_arquivo,
        extensao=file_data.arquivo.extensao,
    )
    created_data = repository.create_file(db=db, dado=db_dado, arquivo=db_arquivo)
    return created_data


def get_specific_data(db: Session, user_id: int, data_id: int) -> models.Dado:
    """
    Busca um Dado específico pelo seu ID, garantindo que pertença ao usuário.
    """
    db_dado = repository.get_dado_by_id_and_user_id(
        db, dado_id=data_id, user_id=user_id
    )
    if not db_dado:
        raise DataNotFoundError(
            f"Dado com id {data_id} não encontrado ou não pertence ao usuário."
        )
    return db_dado


def delete_data_by_id(db: Session, user_id: int, dado_id: int):
    """
    Operação de remoção de um Dado específico, Logs associados
    e limpa Compartilhamentos órfãos
    """
    dado = repository.get_dado_by_id_and_user_id(
        db=db, user_id=user_id, dado_id=dado_id
    )
    if not dado:
        raise DataNotFoundError(
            f"Dado com id {dado_id} não encontrado ou não pertence ao usuário."
        )
    try:
        # IDs dos compartilhamentos afetados pela remoção desse dado
        compartilhamento_ids = repository.get_compartilhamento_ids_by_dado_id(
            db, dado_id=dado_id
        )

        # Deletar os Logs associados primeiro
        repository.delete_logs_by_dado_id(db, data_id=dado_id)

        # O SQLAlchemy/DB cuida do cascade para Senha/Arquivo/Separadores
        repository.delete_dado(db, db_dado=dado)

        # depois deletar o Dado, deleta os Compartilhamentos afetados
        for comp_id in compartilhamento_ids:
            # Verifica se o compartilhamento tinha outros dados
            remaining_items_count = repository.count_remaining_dados_compartilhados(
                db, comp_id=comp_id, excluding_dado_id=dado_id
            )
            if remaining_items_count == 0:
                repository.delete_compartilhamento_by_id(db, comp_id=comp_id)

        db.commit()

    except Exception as e:
        # Se algo der errado, desfaz tudo
        db.rollback()
        raise e


def edit_file_data(
    db: Session, user_id: int, data_id: int, update_data: schemas.DataUpdateFile
) -> models.Dado:
    """
    Serviço para editar um Dado do tipo Arquivo.
    Valida, decodifica Base64 (se necessário) e chama o repositório para salvar.
    """
    db_dado = repository.get_dado_by_id_and_user_id(
        db, dado_id=data_id, user_id=user_id
    )
    if not db_dado:
        raise DataNotFoundError(
            f"Dado com id {data_id} não encontrado ou não pertence ao usuário."
        )
    if db_dado.tipo != models.TipoDado.ARQUIVO:
        raise ValueError(f"Dado com id {data_id} não é do tipo Arquivo.")

    # Variável para armazenar os bytes decodificados, se houver
    decoded_bytes: bytes | None = None

    # 2. Pré-processar a atualização do arquivo (decodificar Base64)
    if update_data.arquivo and update_data.arquivo.arquivo_data:
        try:
            decoded_bytes = base64.b64decode(update_data.arquivo.arquivo_data)
        except Exception as e:
            raise ValueError(f"Codificação Base64 inválida fornecida: {e}")
    try:
        updated_dado = repository.update_file_data(
            db=db,
            db_dado=db_dado,
            db_arquivo=db_dado.arquivo,
            update_data=update_data,
            decoded_bytes=decoded_bytes,
        )
        return updated_dado
    except Exception as e:
        raise e


def edit_credential_data(
    db: Session, user_id: int, data_id: int, update_data: schemas.DataUpdateCredential
) -> models.Dado:
    """
    Serviço para editar um Dado do tipo Senha.
    """
    # Buscar o Dado
    db_dado = repository.get_dado_by_id_and_user_id(
        db, dado_id=data_id, user_id=user_id
    )
    if not db_dado:
        raise DataNotFoundError(
            f"Dado com id {data_id} não encontrado ou não pertence ao usuário."
        )
    if db_dado.tipo != models.TipoDado.SENHA:
        raise ValueError(f"Dado com id {data_id} não é do tipo Senha.")

    try:
        updated_dado = repository.update_credential_data(
            db=db,
            db_dado=db_dado,
            db_senha=db_dado.senha,
            update_data=update_data,
        )
        return updated_dado
    except Exception as e:
        raise e
