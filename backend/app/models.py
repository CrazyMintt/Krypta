import enum
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    BigInteger,
    Column,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.dialects.mysql import ENUM as MysqlEnum
from sqlalchemy.dialects.mysql import LONGBLOB, LONGTEXT
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .database import Base

# Tabela de Associação (Muitos-para-Muitos)
dados_separadores_association = Table(
    "dados_separadores",
    Base.metadata,
    Column(
        "dado_id", Integer, ForeignKey("dados.id", ondelete="CASCADE"), primary_key=True
    ),
    Column(
        "separador_id",
        Integer,
        ForeignKey("separadores.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

# Enum


class TipoDado(str, enum.Enum):
    ARQUIVO = "arquivo"
    SENHA = "senha"


class TipoSeparador(str, enum.Enum):
    PASTA = "pasta"
    TAG = "tag"


# Mapeamento das Tabelas


class Usuario(Base):
    __tablename__ = "usuario"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    senha_mestre: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    saltKDF: Mapped[str] = mapped_column(String(1024))

    # Relacionamentos tipados
    dados: Mapped[List["Dado"]] = relationship(
        back_populates="usuario", cascade="all, delete-orphan"
    )
    eventos: Mapped[List["Evento"]] = relationship(
        back_populates="usuario", cascade="all, delete-orphan"
    )
    compartilhamentos_criados: Mapped[List["Compartilhamento"]] = relationship(
        back_populates="owner_usuario",
        foreign_keys="Compartilhamento.owner_usuario_id",
        cascade="all, delete-orphan",
    )
    logs: Mapped[List["Log"]] = relationship(back_populates="usuario")

    separadores: Mapped[List["Separador"]] = relationship(
        back_populates="usuario", cascade="all, delete-orphan"
    )


class Dado(Base):
    __tablename__ = "dados"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuario.id", ondelete="CASCADE")
    )
    nome_aplicacao: Mapped[Optional[str]] = mapped_column(String(255))
    descricao: Mapped[Optional[str]] = mapped_column(Text)
    tipo: Mapped[TipoDado] = mapped_column(
        MysqlEnum("arquivo", "senha", name="tipo_enum")
    )
    criado_em: Mapped[datetime] = mapped_column(server_default=func.now())

    usuario: Mapped["Usuario"] = relationship(back_populates="dados")
    arquivo: Mapped[Optional["Arquivo"]] = relationship(
        back_populates="dado", uselist=False, cascade="all, delete-orphan"
    )
    senha: Mapped[Optional["Senha"]] = relationship(
        back_populates="dado", uselist=False, cascade="all, delete-orphan"
    )
    separadores: Mapped[List["Separador"]] = relationship(
        secondary=dados_separadores_association, back_populates="dados"
    )
    logs: Mapped[List["Log"]] = relationship(back_populates="dado")
    compartilhamentos_origem: Mapped[List["DadosCompartilhados"]] = relationship(
        back_populates="dado_origem"
    )


class Arquivo(Base):
    __tablename__ = "arquivos"
    id: Mapped[int] = mapped_column(
        ForeignKey("dados.id", ondelete="CASCADE"), primary_key=True
    )
    arquivo: Mapped[Optional[bytes]] = mapped_column(LONGBLOB)
    extensao: Mapped[Optional[str]] = mapped_column(String(50))
    nome_arquivo: Mapped[Optional[str]] = mapped_column(String(255))

    dado: Mapped["Dado"] = relationship(back_populates="arquivo")


class Senha(Base):
    __tablename__ = "senhas"
    id: Mapped[int] = mapped_column(
        ForeignKey("dados.id", ondelete="CASCADE"), primary_key=True
    )
    senha_cripto: Mapped[str] = mapped_column(String(1024))
    host_url: Mapped[Optional[str]] = mapped_column(String(1024))
    email: Mapped[str] = mapped_column(String(255))
    dado: Mapped["Dado"] = relationship(back_populates="senha")


class Separador(Base):
    __tablename__ = "separadores"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuario.id", ondelete="CASCADE")
    )
    id_pasta_raiz: Mapped[Optional[int]] = mapped_column(
        ForeignKey("separadores.id", ondelete="SET NULL", onupdate="CASCADE")
    )
    nome: Mapped[str] = mapped_column(String(255))
    tipo: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    cor: Mapped[Optional[str]] = mapped_column(String(100))

    # RELACIONAMENTOS
    usuario: Mapped["Usuario"] = relationship(back_populates="separadores")

    # 'remote_side=[id]' é o argumento chave que diz ao SQLAlchemy:
    # "O 'id' local é o lado 'Um' (o pai) desta relação."
    pasta_raiz: Mapped[Optional["Separador"]] = relationship(
        back_populates="filhos", remote_side=[id]
    )

    # Permite acessar a lista de Separadores filhos deste separador.
    # O SQLAlchemy usa 'id_pasta_raiz' para encontrar os filhos.
    filhos: Mapped[List["Separador"]] = relationship(back_populates="pasta_raiz")

    dados: Mapped[List["Dado"]] = relationship(
        secondary=dados_separadores_association, back_populates="separadores"
    )


class Compartilhamento(Base):
    __tablename__ = "compartilhamento"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    owner_usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuario.id", ondelete="CASCADE")
    )
    n_acessos_total: Mapped[int] = mapped_column(BigInteger, default=0)
    n_acessos_atual: Mapped[int] = mapped_column(BigInteger, default=0)
    data_expiracao: Mapped[Optional[datetime]]
    criado_em: Mapped[datetime] = mapped_column(server_default=func.now())

    owner_usuario: Mapped["Usuario"] = relationship(
        back_populates="compartilhamentos_criados"
    )
    dados_compartilhados: Mapped[List["DadosCompartilhados"]] = relationship(
        back_populates="compartilhamento", cascade="all, delete-orphan"
    )


class DadosCompartilhados(Base):
    __tablename__ = "dados_compartilhados"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    compartilhamento_id: Mapped[int] = mapped_column(
        ForeignKey("compartilhamento.id", ondelete="CASCADE")
    )
    dado_origem_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("dados.id", ondelete="SET NULL")
    )
    dado_criptografado: Mapped[bytes] = mapped_column(LONGBLOB)
    meta: Mapped[Optional[str]] = mapped_column(LONGTEXT)
    criado_em: Mapped[datetime] = mapped_column(server_default=func.now())

    compartilhamento: Mapped["Compartilhamento"] = relationship(
        back_populates="dados_compartilhados"
    )
    dado_origem: Mapped[Optional["Dado"]] = relationship(
        back_populates="compartilhamentos_origem"
    )


class Evento(Base):
    __tablename__ = "eventos"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuario.id", ondelete="CASCADE")
    )
    notificacao: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    usuario: Mapped["Usuario"] = relationship(back_populates="eventos")


class Log(Base):
    __tablename__ = "logs"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    usuario_id: Mapped[Optional[int]] = mapped_column(ForeignKey("usuario.id"))
    dispositivo: Mapped[Optional[str]] = mapped_column(String(255))
    data_hora: Mapped[datetime] = mapped_column(server_default=func.now())
    ip: Mapped[Optional[str]] = mapped_column(String(45))
    regiao: Mapped[Optional[str]] = mapped_column(String(255))
    nome_aplicacao: Mapped[Optional[str]] = mapped_column(String(255))
    tipo_acesso: Mapped[str] = mapped_column(String(100))
    id_dado: Mapped[Optional[int]] = mapped_column(ForeignKey("dados.id"))

    usuario: Mapped[Optional["Usuario"]] = relationship(back_populates="logs")
    dado: Mapped[Optional["Dado"]] = relationship(back_populates="logs")
