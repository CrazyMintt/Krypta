from sqlalchemy.orm import Session
from . import models, schemas, repository, core
from .exceptions import (
    EmailAlreadyExistsError,
    DataNotFoundError,
    SeparatorNameTakenError,
)
import base64
from typing import List


# AUTH
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


# Funções GET


def get_data_paginated_filtered(
    db: Session, user_data: models.Usuario, fpData: schemas.FilterPageConfig
) -> List[models.Dado]:
    """
    Busca dados paginados e/ou filtrados.
    A validação dos parâmetros é feita pelo schema Pydantic.
    """
    # A validação de pageSize, pageNumber e idSeparators agora é
    # tratada automaticamente pelo FastAPI/Pydantic na camada da API.

    # Se não houver filtros, chama a função paginada simples
    if not fpData.id_separadores:
        return repository.get_paginated_data(
            db,
            pageSize=fpData.page_size,
            pageNumber=fpData.page_number,
            id_user=user_data.id,
        )
    # Se houver filtros, chama a função filtrada
    else:
        return repository.get_paginated_filtered_data(
            db,
            pageSize=fpData.page_size,
            pageNumber=fpData.page_number,
            idSeparators=fpData.id_separadores,
            id_user=user_data.id,
        )


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


def get_tags_by_user(db: Session, user_id: int) -> List[models.Separador]:
    """
    Busca a lista de tags para a barra lateral do frontend.
    """
    return repository.get_all_tags_by_user(db, user_id=user_id)


def get_root_folders(db: Session, user_id: int) -> List[models.Separador]:
    """
    Busca as pastas do nível raiz para o painel principal.
    """
    return repository.get_root_folders_by_user(db, user_id=user_id)


def get_child_folders(
    db: Session, user_id: int, parent_folder_id: int
) -> List[models.Separador]:
    """
    Busca as subpastas de uma pasta pai, após validar o acesso.
    """
    # Validar se a pasta pai existe, pertence ao usuário e é uma pasta
    parent_folder = repository.get_separador_by_id_and_user_id(
        db, separador_id=parent_folder_id, user_id=user_id
    )

    if not parent_folder:
        raise DataNotFoundError(
            f"Pasta com id {parent_folder_id} não encontrada ou não pertence ao usuário."
        )
    if parent_folder.tipo != models.TipoSeparador.PASTA:
        raise ValueError(f"O item com id {parent_folder_id} é uma Tag, não uma Pasta.")

    # Se for válida, buscar as filhas
    return repository.get_child_folders_by_parent_id(
        db, user_id=user_id, parent_folder_id=parent_folder_id
    )


# Funções CREATE
def create_credential(
    db: Session, user: models.Usuario, credential_data: schemas.DataCreateCredential
) -> models.Dado:
    """
    Serviço para criar um novo Dado do tipo Senha
    """
    try:
        # Criar os objetos de modelo
        db_dado = models.Dado(
            usuario_id=user.id,
            nome_aplicacao=credential_data.nome_aplicacao,
            descricao=credential_data.descricao,
            tipo=models.TipoDado.SENHA,
        )

        db_senha = models.Senha(
            senha_cripto=credential_data.senha.senha_cripto,
            email=credential_data.senha.email,
            host_url=credential_data.senha.host_url,
        )

        # Chamar o repositório para salvar
        created_data = repository.create_credential(db=db, dado=db_dado, senha=db_senha)
        return created_data

    except Exception as e:
        # Se o repositório fizer rollback e relançar, capturamos aqui
        raise ValueError(f"Erro ao criar credencial: {e}")


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
        nome_aplicacao=file_data.nome_aplicacao,
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


def create_folder(
    db: Session, user_id: int, folder_data: schemas.FolderCreate
) -> models.Separador:

    existing_folder = repository.get_folder_by_name_and_parent(
        db,
        nome=folder_data.nome,
        user_id=user_id,
        parent_id=folder_data.id_pasta_raiz,
    )
    if existing_folder:
        if folder_data.id_pasta_raiz is None:
            raise SeparatorNameTakenError(
                f"Já existe uma pasta raiz com o nome '{folder_data.nome}'."
            )
        else:
            raise SeparatorNameTakenError(
                f"A pasta '{folder_data.nome}' já existe dentro desta pasta pai."
            )

    if folder_data.id_pasta_raiz is not None:
        parent_folder = repository.get_separador_by_id_and_user_id(
            db=db, separador_id=folder_data.id_pasta_raiz, user_id=user_id
        )
        if not parent_folder:
            raise DataNotFoundError(
                "A pasta raiz especificada não existe ou não pertence à esse usuário"
            )
        if parent_folder.tipo != models.TipoSeparador.PASTA:
            raise ValueError("Não é possível criar uma pasta dentro de uma TAG")
    db_folder = models.Separador(
        nome=folder_data.nome,
        tipo=models.TipoSeparador.PASTA,
        usuario_id=user_id,
        id_pasta_raiz=folder_data.id_pasta_raiz,
        cor=None,
    )
    return repository.create_separador(db, db_separador=db_folder)


def create_tag(
    db: Session, user_id: int, tag_data: schemas.TagCreate
) -> models.Separador:

    existing_tag = repository.get_tag_by_name_and_user(
        db, nome=tag_data.nome, user_id=user_id
    )
    if existing_tag:
        raise SeparatorNameTakenError(
            f"Já existe uma tag com o nome '{tag_data.nome}'."
        )

    db_tag = models.Separador(
        nome=tag_data.nome,
        tipo=models.TipoSeparador.TAG,
        usuario_id=user_id,
        cor=tag_data.cor,
        id_pasta_raiz=None,
    )
    return repository.create_separador(db, db_separador=db_tag)


# Funções EDIT
def edit_user(
    db: Session, user: models.Usuario, update_data: schemas.UserUpdate
) -> models.Usuario:
    """
    Serviço para editar um usuário.
    """

    # verificar se o email já não está em uso por outro usuario
    if update_data.email and update_data.email != user.email:
        existing_user = repository.get_user_by_email(db, email=update_data.email)
        if existing_user:
            raise EmailAlreadyExistsError(
                f"O email {update_data.email} já está em uso."
            )

    return repository.update_user(db=db, db_user=user, update_data=update_data)


def edit_file_data(
    db: Session, user_id: int, data_id: int, update_data: schemas.DataUpdateFile
) -> models.Dado:
    """
    Serviço para editar um Dado do tipo Arquivo.
    Valida, decodifica Base64 (se necessário) e chama o repositório para salvar.
    """
    # Valida campos vazios

    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        raise ValueError("Pelo menos um campo deve ser fornecido para atualização.")

    db_dado = repository.get_dado_by_id_and_user_id(
        db, dado_id=data_id, user_id=user_id
    )
    if not db_dado:
        raise DataNotFoundError(
            f"Dado com id {data_id} não encontrado ou não pertence ao usuário."
        )
    if db_dado.tipo != models.TipoDado.ARQUIVO:
        raise ValueError(f"Dado com id {data_id} não é do tipo Arquivo.")

    decoded_bytes: bytes | None = None

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
    # Valida campos vazios

    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        raise ValueError("Pelo menos um campo deve ser fornecido para atualização.")
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


def edit_folder(
    db: Session, user_id: int, folder_id: int, update_data: schemas.FolderUpdate
) -> models.Separador:

    update_dict = update_data.model_dump(exclude_unset=True)

    if not update_dict:
        raise ValueError("Pelo menos um campo deve ser fornecido para atualização.")

    #  Busca a pasta e valida a propriedade
    db_folder = repository.get_separador_by_id_and_user_id(db, folder_id, user_id)
    if not db_folder or db_folder.tipo != models.TipoSeparador.PASTA:
        raise DataNotFoundError(f"Pasta com id {folder_id} não encontrada.")

    if "nome" in update_dict and update_dict["nome"] != db_folder.nome:
        parent_id_to_check = update_dict.get("id_pasta_raiz", db_folder.id_pasta_raiz)
        existing = repository.get_folder_by_name_and_parent(
            db, nome=update_dict["nome"], user_id=user_id, parent_id=parent_id_to_check
        )
        if existing:
            raise SeparatorNameTakenError(
                f"O nome '{update_dict['nome']}' já existe nesta localização."
            )

    if "id_pasta_raiz" in update_dict:
        new_parent_id = update_dict["id_pasta_raiz"]  # Pode ser None ou int

        if new_parent_id is None:
            pass  # Mover para a raiz é sempre válido

        elif new_parent_id == db_folder.id:
            raise ValueError("Uma pasta não pode ser movida para dentro de si mesma.")

        else:
            # Verificação de Loop de Hierarquia
            current_parent = repository.get_separador_by_id_and_user_id(
                db, new_parent_id, user_id
            )

            if not current_parent or current_parent.tipo != models.TipoSeparador.PASTA:
                raise DataNotFoundError(
                    "A nova pasta pai não é válida ou não foi encontrada."
                )

            # Loop para verificar se o novo pai é um descendente da pasta que estamos movendo
            temp_parent = current_parent
            while temp_parent is not None:
                if temp_parent.id_pasta_raiz == db_folder.id:
                    raise ValueError(
                        "Não é possível mover uma pasta para dentro de uma de suas próprias subpastas."
                    )
                if temp_parent.id_pasta_raiz is None:
                    break  # Chegou à raiz, sem loop
                temp_parent = repository.get_separador_by_id_and_user_id(
                    db, temp_parent.id_pasta_raiz, user_id
                )

    return repository.update_folder(db, db_folder=db_folder, update_data=update_data)


def edit_tag(
    db: Session, user_id: int, tag_id: int, update_data: schemas.TagUpdate
) -> models.Separador:
    """Edita uma tag, permitindo mudança de nome ou cor."""

    # Busca a tag e valida a propriedade
    db_tag = repository.get_separador_by_id_and_user_id(db, tag_id, user_id)
    if not db_tag or db_tag.tipo != models.TipoSeparador.TAG:
        raise DataNotFoundError(f"Tag com id {tag_id} não encontrada.")

    update_dict = update_data.model_dump(exclude_unset=True)

    if "nome" in update_dict and update_dict["nome"] != db_tag.nome:
        existing = repository.get_tag_by_name_and_user(db, update_dict["nome"], user_id)
        if existing:
            raise SeparatorNameTakenError(
                f"O nome de tag '{update_dict['nome']}' já existe."
            )

    return repository.update_tag(db, db_tag=db_tag, update_data=update_data)


# Funções DELETE
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
    except Exception as e:
        # Se qualquer passo falhar, desfaz tudo
        db.rollback()
        return False


def delete_user(db: Session, user_id: int) -> bool:
    """
    Deleta conta de um usuário
    """
    try:
        try_clear_all_user_data(db=db, user_id=user_id)
        repository.delete_user_by_id(db=db, user_id=user_id)
        db.commit()
        return True
    except Exception:
        # Se qualquer passo falhar, desfaz tudo
        db.rollback()
        return False


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
        repository.delete_logs_by_dado_id(db, dado_id=dado_id)

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


def delete_tag_by_id(db: Session, user_id: int, tag_id: int):
    """
    Deleta uma Tag específica.
    Verifica se a tag existe, pertence ao usuário e é do tipo TAG.
    """
    db_tag = repository.get_separador_by_id_and_user_id(
        db, separador_id=tag_id, user_id=user_id
    )

    if not db_tag:
        raise DataNotFoundError(
            f"Tag com id {tag_id} não encontrada ou não pertence ao usuário."
        )

    if db_tag.tipo != models.TipoSeparador.TAG:
        raise ValueError(
            f"O item com id {tag_id} é uma Pasta, não uma Tag, e não pode ser excluído por este endpoint."
        )

    try:
        repository.delete_separador(db, db_separador=db_tag)

        # O ON DELETE CASCADE em 'dados_separadores' é executado pelo banco
        db.commit()
    except Exception as e:
        db.rollback()
        raise e


def delete_folder_recursively(db: Session, user_id: int, folder_id: int):
    """
    Deleta uma Pasta e TODO o seu conteúdo (subpastas e dados).
    """
    # Valida se a pasta existe, pertence ao usuário e é uma PASTA
    db_folder = repository.get_separador_by_id_and_user_id(
        db, separador_id=folder_id, user_id=user_id
    )
    if not db_folder or db_folder.tipo != models.TipoSeparador.PASTA:
        raise DataNotFoundError(
            f"Pasta com id {folder_id} não encontrada ou não pertence ao usuário."
        )

    try:
        # Encontra todos os IDs de pastas (esta + todas as descendentes)
        all_folder_ids = repository.get_folder_and_all_descendants_ids(
            db, folder_id=folder_id, user_id=user_id
        )

        # Encontra todos os IDs de dados únicos nessas pastas
        all_data_ids = repository.get_dado_ids_by_separador_ids(db, all_folder_ids)

        if all_data_ids:
            # Deleta todos os LOGS associados a esses dados
            repository.delete_logs_by_dado_ids(db, all_data_ids)

            # Deleta todos os DADOS
            # (CASCADE cuidará de Senha/Arquivo/DadosCompartilhados/dados_separadores)
            repository.delete_dados_by_ids(db, all_data_ids)

        # Deleta todas as PASTAS (a pasta principal e suas filhas)
        repository.delete_separadores_by_ids(db, all_folder_ids)

        db.commit()

    except Exception as e:
        db.rollback()
        raise e
