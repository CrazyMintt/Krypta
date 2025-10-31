from pydantic import (
    BaseModel,
    EmailStr,
    ConfigDict,
    Field,
    model_validator,
    PositiveInt,
)
from typing import Optional, List, Self
from datetime import datetime
from .models import TipoDado, TipoSeparador

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
    id_pasta_raiz: Optional[int] = Field(default=None, alias="idPastaRaiz")


class TagCreate(BaseModel):
    """Schema para criar uma nova tag"""

    nome: str = Field(..., min_length=1, description="Nome da tag não pode ser vazio.")
    cor: str = Field(..., min_length=1, description="Cor não pode ser vazia.")


# --- Schemas de Output ---


class SeparatorResponse(BaseSchema):
    """Schema para retornar dados planos de um Separador (Tag/Pasta)."""

    id: int
    nome: str
    tipo: TipoSeparador
    cor: Optional[str]
    id_pasta_raiz: Optional[int]  # ID do pai


class SeparatorHierarchyResponse(BaseSchema):
    """Schema recursivo para retornar a árvore de pastas/tags completa."""

    id: int
    nome: str
    tipo: TipoSeparador
    cor: Optional[str]
    id_pasta_raiz: Optional[int]
    filhos: List["SeparatorHierarchyResponse"] = []  # Relação recursiva


# Domínio: Dados, Arquivos e Credenciais

# --- Schemas de Input (Filtros) ---


class FilterPageConfig(BaseModel):
    """Schema para filtros e paginação com validação."""

    pageSize: PositiveInt
    pageNumber: PositiveInt
    idSeparators: List[int] = []


# --- Sub-Schemas de Output (Filhos) ---


class CredentialResponse(BaseSchema):
    """Schema para retornar os detalhes de uma Senha (filho)."""

    id: int
    host_url: Optional[str]
    email: str


class FileResponse(BaseSchema):
    """Schema para retornar os detalhes de um Arquivo (filho)."""

    id: int
    extensao: str
    nome_arquivo: str


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
    email: Optional[str] = Field(default=None, min_length=1)
    host_url: Optional[str] = Field(default=None, min_length=1)


# --- Schemas de Input Principais (Criação) ---


class DataCreateFile(BaseModel):
    """Schema para criar um novo Dado do tipo Arquivo."""

    # Nome da aplicação é obrigatório
    nome_aplicacao: str
    descricao: Optional[str] = Field(default=None, min_length=1)
    arquivo: FileCreate
    idSeparadores: List[int] = Field(default_factory=list)


class DataCreateCredential(BaseModel):
    """Schema para criar um novo Dado do tipo Senha."""

    nome_aplicacao: str = Field(..., min_length=1)
    descricao: Optional[str] = Field(default=None, min_length=1)
    senha: CredentialCreate
    idSeparadores: List[int] = Field(default_factory=list)


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

    @model_validator(mode="after")
    def check_at_least_one_value(self) -> Self:
        """Garante que o body da requisição PATCH não esteja vazio."""
        if all(v is None for _, v in self):
            raise ValueError("Pelo menos um campo deve ser fornecido para atualização.")
        return self


class DataUpdateCredential(BaseModel):
    """Schema para atualizar (PATCH) um Dado do tipo Senha."""

    nome_aplicacao: Optional[str] = Field(default=None, min_length=1)
    descricao: Optional[str] = Field(default=None, min_length=1)
    senha: Optional[CredentialUpdate] = None

    @model_validator(mode="after")
    def check_at_least_one_value(self) -> Self:
        """Garante que o body da requisição PATCH não esteja vazio."""
        if all(v is None for _, v in self):
            raise ValueError("Pelo menos um campo deve ser fornecido para atualização.")
        return self
