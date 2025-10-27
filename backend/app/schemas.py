from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime


# Schemas de Dados
class PasswordBase(BaseModel):
    id: int
    senha_cripto: str
    host_url: str


class FileBase(BaseModel):
    id: int
    arquivo: str
    extensao: str
    nome_arquivo: str


class DataBase(BaseModel):
    id: int
    nome_aplicacao: str
    descricao: Optional[str]
    tipo: str
    criado_em: datetime
    senha: Optional[PasswordBase]
    arquivo: Optional[FileBase]


class CredentialBase(BaseModel):
    nome_aplicacao:str
    descricao:str
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
