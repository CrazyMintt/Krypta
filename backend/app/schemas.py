from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

# Schemas para Usuario

# Propriedades base compartilhadas por outros schemas
class UserBase(BaseModel):
    email: EmailStr
    nome: str

# Schema para criação de um novo usuário
class UserCreate(UserBase):
    senha_mestre: str

# Schema para ler os dados de um usuário (o que a API retorna)
class User(UserBase):
    # Permite que o Pydantic leia os dados de um objeto SQLAlchemy
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    crypto_salt: str