import enum
from pydantic import (
    BaseModel,
    EmailStr,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
    PositiveInt,
    computed_field,
)
from pydantic_extra_types.color import Color
from typing import Any, Optional, List, Self
from datetime import datetime
from .models import TipoDado, TipoSeparador, Arquivo
import base64


# Enum de Eventos e Logs
class LogTipo(str, enum.Enum):
    """
    Define TODOS os tipos de atividades de auditoria que podem ser registradas.
    O valor é a string que será salva no banco.
    """

    # Usuário
    LOGIN_SUCESSO = "login_sucesso"
    LOGIN_FALHO = "login_falho"
    LOGOUT = "logout"
    EMAIL_ALTERADO = "email_alterado"
    NOME_ALTERADO = "nome_alterado"
    DADOS_LIMPOS = "dados_limpos"
    CONTA_DELETADA = "conta_deletada"

    # Dados (Cred/Arquivo)
    DADO_CRIADO = "dado_criado"
    DADO_VISUALIZADO = "dado_visualizado"
    DADO_EDITADO = "dado_editado"
    DADO_DELETADO = "dado_deletado"

    # Separadores (Pasta/Tag)
    PASTA_CRIADA = "pasta_criada"
    TAG_CRIADA = "tag_criada"
    SEPARADOR_EDITADO = "separador_editado"
    SEPARADOR_DELETADO = "separador_deletado"

    # Compartilhamento
    COMPARTILHAMENTO_CRIADO = "compartilhamento_criado"
    COMPARTILHAMENTO_ACESSADO = "compartilhamento_acessado"
    COMPARTILHAMENTO_EDITADO = "compartilhamento_editado"
    COMPARTILHAMENTO_REVOGADO = "compartilhamento_revogado"


# lista de quais eventos geram notificações.
EVENTOS_CRITICOS = {
    LogTipo.LOGIN_SUCESSO,
    LogTipo.LOGIN_FALHO,
    LogTipo.EMAIL_ALTERADO,
    LogTipo.COMPARTILHAMENTO_CRIADO,
    LogTipo.COMPARTILHAMENTO_ACESSADO,
    LogTipo.DADO_VISUALIZADO,
    LogTipo.DADO_DELETADO,
}

# Configuração Base


class BaseSchema(BaseModel):
    """
    Schema base que habilita o 'from_attributes'
    para que os schemas Pydantic possam ser criados a partir de modelos SQLAlchemy.
    """

    model_config = ConfigDict(from_attributes=True)


# Domínio: Usuário (User)

# --- Schemas de Input (Criação e Update) ---


class UserBase(BaseModel):
    """Campos base compartilhados para criação e resposta."""

    email: EmailStr
    nome: str = Field(
        ..., min_length=1, description="Nome do usuário, não pode ser vazio."
    )


class UserCreate(UserBase):
    """Schema para criar um novo usuário. Recebe a senha."""

    senha_mestre: str = Field(
        ..., min_length=1, description="Senha mestra, não pode ser vazia."
    )


class UserUpdate(BaseModel):
    """Schema para atualizar um usuário (PATCH). Todos os campos são opcionais."""

    email: Optional[EmailStr] = None
    nome: Optional[str] = Field(
        default=None,
        min_length=1,
        description="Novo nome, não pode ser vazio se fornecido.",
    )

    @model_validator(mode="after")
    def check_at_least_one_value(self) -> Self:
        """Garante que o body da requisição PATCH não esteja vazio."""
        if all(v is None for _, v in self):
            raise ValueError("Pelo menos um campo deve ser fornecido para atualização.")
        else:
            return self


# --- Schemas de Output (Resposta) ---


class UserResponse(UserBase, BaseSchema):
    """Schema para retornar dados de um usuário (sem senhas)."""

    id: int
    created_at: datetime


# Domínio: Autenticação (Auth)

# --- Schemas de Input ---


class TokenData(BaseModel):
    """Schema para os dados decodificados de dentro do JWT."""

    id: Optional[str] = None


# --- Schemas de Output ---


class Token(BaseSchema):
    """Schema para o token de acesso puro."""

    access_token: str
    token_type: str


class LoginResponse(UserResponse):
    """Schema de resposta completa ao fazer login."""

    access_token: str
    saltKDF: str
    token_type: str = "bearer"


# Domínio: Separadores
# --- Schema de Input (Separadores) ---


class FolderCreate(BaseModel):
    """Schema para criar uma nova pasta."""

    nome: str = Field(
        ..., min_length=1, description="Nome da pasta não pode ser vazio."
    )
    id_pasta_raiz: Optional[int] = None


class TagCreate(BaseModel):
    """Schema para criar uma nova tag"""

    nome: str = Field(..., min_length=1, description="Nome da tag não pode ser vazio.")
    cor: Color

    @field_validator("cor", mode="after")
    @classmethod
    def convert_color_to_hex(cls, v: Color) -> str:
        """
        Pega o objeto 'Color' (que pode ter vindo de RGB, nome, etc.)
        e o converte para uma string hexadecimal de 6 dígitos.
        """
        # O Pydantic já validou que 'v' é um objeto Color.
        # Agora nós o convertemos para o formato do nosso banco de dados.
        return v.as_hex()


# --- Update ---
class FolderUpdate(BaseModel):
    """Schema para atualizar uma Pasta."""

    nome: Optional[str] = Field(default=None, min_length=1)
    id_pasta_raiz: Optional[int] = None


class TagUpdate(BaseModel):
    """Schema para atualizar uma Tag."""

    nome: Optional[str] = Field(default=None, min_length=1)
    cor: Optional[Color] = None  # Aceita novos valores de cor

    @model_validator(mode="after")
    def check_at_least_one_value(self) -> Self:
        if all(v is None for _, v in self):
            raise ValueError("Pelo menos um campo (nome ou cor) deve ser fornecido.")
        return self

    @field_validator("cor", mode="after")
    @classmethod
    def convert_color_to_hex(cls, v: Optional[Color]) -> Optional[str]:
        """Converte a nova cor para hex, se ela for fornecida."""
        if v is not None:
            return v.as_hex()
        return None


# --- Schemas de Output ---


class SeparatorResponse(BaseSchema):
    """Schema para retornar dados planos de um Separador (Tag/Pasta)."""

    id: int
    nome: str
    tipo: TipoSeparador
    cor: Optional[str]
    id_pasta_raiz: Optional[int]  # ID do pai


# Domínio: Dados, Arquivos e Credenciais

# --- Schemas de Input (Filtros) ---


class FilterPageConfig(BaseModel):
    """Schema para filtros e paginação com validação."""

    page_size: PositiveInt
    page_number: PositiveInt
    id_separadores: List[int] = []


# --- Sub-Schemas de Output (Filhos) ---


class CredentialResponse(BaseSchema):
    """Schema para retornar os detalhes de uma Senha (filho)."""

    id: int
    host_url: Optional[str]
    email: Optional[str]
    senha_cripto: str


class FileResponse(BaseSchema):
    """Schema para retornar os detalhes de um Arquivo (filho)."""

    id: int
    extensao: str
    nome_arquivo: str
    arquivo_data: str


# --- Schema de Output Principal (Pai) ---


class DataResponse(BaseSchema):
    """Schema de resposta completo para um Dado (seja Arquivo ou Senha)."""

    id: int
    usuario_id: int
    nome_aplicacao: str
    descricao: Optional[str]
    tipo: TipoDado
    criado_em: datetime

    # Relacionamentos aninhados (um deles será None)
    arquivo: Optional[FileResponse] = None
    senha: Optional[CredentialResponse] = None
    separadores: List[SeparatorResponse] = []


# --- Sub-Schemas de Input (Criação) ---


class FileCreate(BaseModel):
    """Schema aninhado para os detalhes de um novo arquivo."""

    arquivo_data: str = Field(
        ..., min_length=1, description="Bytes do arquivo em Base64, não pode ser vazio."
    )
    # Extensão é obrigatório
    extensao: str
    # E nome do arquivo também é obrigatório
    nome_arquivo: str


class CredentialCreate(BaseModel):
    """Schema aninhado para os detalhes de uma nova credencial (senha)."""

    senha_cripto: str = Field(..., min_length=1)
    email: Optional[EmailStr] = Field(
        default=None, description="Email associado à credencial (opcional)."
    )
    host_url: Optional[str] = Field(default=None, min_length=1)


# --- Schemas de Input Principais (Criação) ---


class DataCreateFile(BaseModel):
    """Schema para criar um novo Dado do tipo Arquivo."""

    # Nome da aplicação é obrigatório
    nome_aplicacao: str
    descricao: Optional[str] = Field(default=None, min_length=1)
    arquivo: FileCreate
    id_pasta: Optional[int] = Field(
        default=None, description="ID da pasta pai (opcional)."
    )
    id_tags: List[int] = Field(
        default_factory=list, description="Lista de IDs de tags (opcional)."
    )


class DataCreateCredential(BaseModel):
    """Schema para criar um novo Dado do tipo Senha."""

    nome_aplicacao: str = Field(..., min_length=1)
    descricao: Optional[str] = Field(default=None, min_length=1)
    senha: CredentialCreate
    id_pasta: Optional[int] = Field(
        default=None, description="ID da pasta pai (opcional)."
    )
    id_tags: List[int] = Field(
        default_factory=list, description="Lista de IDs de tags (opcional)."
    )


# --- Sub-Schemas de Input (Update) ---


class FileUpdate(BaseModel):
    """Schema aninhado para atualizar os detalhes de um Arquivo."""

    arquivo_data: Optional[str] = Field(default=None, min_length=1)
    extensao: Optional[str] = Field(default=None, min_length=1)
    nome_arquivo: Optional[str] = Field(default=None, min_length=1)


class CredentialUpdate(BaseModel):
    """Schema aninhado para atualizar os detalhes de uma Senha."""

    senha_cripto: Optional[str] = Field(default=None, min_length=1)
    host_url: Optional[str] = Field(default=None, min_length=1)
    email: Optional[EmailStr] = None


# --- Schemas de Input Principais (Update) ---


class DataUpdateFile(BaseModel):
    """Schema para atualizar (PATCH) um Dado do tipo Arquivo."""

    nome_aplicacao: Optional[str] = Field(default=None, min_length=1)
    descricao: Optional[str] = Field(default=None, min_length=1)
    arquivo: Optional[FileUpdate] = None
    id_pasta: Optional[int] = Field(
        default=None,
        description="ID da nova pasta pai (use 'null' para mover para a raiz).",
    )
    id_tags: Optional[List[int]] = Field(
        default=None,
        description="Lista de IDs de tags (envie '[]' para remover todas).",
    )


class DataUpdateCredential(BaseModel):
    """Schema para atualizar (PATCH) um Dado do tipo Senha."""

    nome_aplicacao: Optional[str] = Field(default=None, min_length=1)
    descricao: Optional[str] = Field(default=None, min_length=1)
    senha: Optional[CredentialUpdate] = None
    id_pasta: Optional[int] = Field(
        default=None,
        description="ID da nova pasta pai (use 'null' para mover para a raiz).",
    )
    id_tags: Optional[List[int]] = Field(
        default=None,
        description="Lista de IDs de tags (envie '[]' para remover todas).",
    )


# Domínio do DASHBOARD
class StorageByTypeResponse(BaseSchema):
    """Representa o armazenamento usado por um tipo de extensão."""

    extensao: str
    bytes_usados: int


class DashboardResponse(BaseSchema):
    """Schema de resposta completo para o endpoint do dashboard."""

    armazenamento_total_bytes: int
    armazenamento_usado_bytes: int
    armazenamento_por_tipo: List[StorageByTypeResponse]


# Domínio: Compartilhamento


# --- Schemas de Input ---
class ShareItemCreate(BaseModel):
    """Um único item a ser compartilhado."""

    dado_origem_id: int  # O ID do 'Dado' original
    dado_criptografado: str = Field(
        ..., min_length=1, description="Blob de dados (re-criptografado) em Base64."
    )
    meta: Optional[str] = Field(
        default=None, min_length=1, description="Metadados para o destinatário."
    )


class ShareDataCreate(BaseModel):
    """
    Informações que o frontend envia ao criar um compartilhamento.
    """

    itens: List[ShareItemCreate] = Field(
        ..., min_length=1, description="Pelo menos um item deve ser compartilhado."
    )
    data_expiracao: Optional[datetime] = None
    n_acessos_total: Optional[int] = Field(default=1, gt=0)  # Pelo menos 1 acesso


class ShareRulesUpdate(BaseModel):
    """Schema para editar as REGRAS de um compartilhamento (PATCH)."""

    data_expiracao: Optional[datetime] = None
    n_acessos_total: Optional[int] = Field(
        default=None, gt=0, description="Novo número de acessos (> 0)."
    )

    @model_validator(mode="after")
    def check_at_least_one_value(self) -> Self:
        """Garante que o body da requisição PATCH não esteja vazio."""
        if all(v is None for _, v in self):
            raise ValueError(
                "Pelo menos um campo (data_expiracao ou n_acessos_total) deve ser fornecido."
            )
        return self


# --- Schemas de Output ---


class ShareCreateResponse(BaseSchema):
    """O que a API retorna após criar um compartilhamento (o link de acesso)"""

    share_link: str
    token_acesso: str


class SharedItemView(BaseSchema):
    """O que o destinatário vê de CADA item."""

    dado_criptografado: str  # O blob em Base64
    meta: Optional[str]


class SharedDataViewResponse(BaseSchema):
    """O que a API retorna quando o destinatário acessa o link"""

    itens: List[SharedItemView]
    data_expiracao: Optional[datetime]


class CompartilhamentoResponse(BaseSchema):
    """Schema para o dono ver seus compartilhamentos."""

    id: int
    token_acesso: str
    n_acessos_total: int
    n_acessos_atual: int
    data_expiracao: Optional[datetime]
    criado_em: datetime


# Domínio: Logs e Eventos (Notificações)


class LogContext(BaseModel):
    """Informações de contexto da requisição para logs (usado internamente)."""

    ip: str
    dispositivo: str


class LogResponse(BaseSchema):
    """Schema de resposta para um registro de Log (histórico de atividades)."""

    id: int
    dispositivo: Optional[str]
    data_hora: datetime
    ip: Optional[str]
    regiao: Optional[str]
    nome_aplicacao: Optional[str]
    tipo_acesso: str
    id_dado: Optional[int]


class EventoResponse(BaseSchema):
    """Schema de resposta para um Evento (notificação 'sininho')."""

    id: int
    notificacao: Optional[str]
    created_at: datetime
