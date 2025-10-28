from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime
from .models import TipoDado


# Schema de resposta
class SeparatorSchema(BaseModel):
    id: int
    nome: str
    cor: Optional[str]
    model_config = ConfigDict(from_attributes=True)


class CredentialResponse(BaseModel):
    id: int
    host_url: Optional[str]
    email: str
    model_config = ConfigDict(from_attributes=True)


class FileResponse(BaseModel):
    id: int
    extensao: Optional[str]
    nome_arquivo: Optional[str]
    model_config = ConfigDict(from_attributes=True)


class DataResponse(BaseModel):
    id: int
    usuario_id: int
    nome_aplicacao: Optional[str]
    descricao: Optional[str]
    tipo: TipoDado
    criado_em: datetime
    # Relcionamentos
    arquivo: Optional[FileResponse]
    senha: Optional[CredentialResponse]
    separadores: List[SeparatorSchema]
    model_config = ConfigDict(from_attributes=True)


# Schemas de criação de Dados
class PasswordBase(BaseModel):
    id: int
    senha_cripto: str
    host_url: str


class FileCreate(BaseModel):
    """Schema para criação de um arquivo"""

    arquivo_data: str
    extensao: Optional[str] = None
    nome_arquivo: Optional[str] = None


class DataCreateFile(BaseModel):
    nome_arquivo: Optional[str] = None
    descricao: Optional[str] = None
    arquivo: FileCreate


class CredentialBase(BaseModel):
    nome_aplicacao: str
    descricao: str
    senha_cripto: str
    email: Optional[EmailStr] = None
    host_url: Optional[str] = None


# Schemas para Usuario
class UserBase(BaseModel):
    email: EmailStr
    nome: str


class UserCreate(UserBase):
    senha_mestre: str


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class UserComplete(UserResponse):
    saltKDF: str


# Schemas de Autenticação
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class LoginResponse(UserResponse):
    access_token: str
    saltKDF: str
    token_type: str = "bearer"


# Schemas para atualizar os dados de um arquivo
class FileUpdate(BaseModel):
    """Schema para atualizar os detalhes de um Arquivo (campos opcionais)"""

    arquivo_data: Optional[str] = None
    extensao: Optional[str] = None
    nome_arquivo: Optional[str] = None


class DataUpdateFile(BaseModel):
    """Schema para atualizar um Dado do tipo Arquivo (campos opcionais)"""

    nome_aplicacao: Optional[str] = None
    descricao: Optional[str] = None
    arquivo: Optional[FileUpdate] = None
