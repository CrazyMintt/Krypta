import enum
from sqlalchemy import (
    Column,
    Integer,
    BigInteger,
    String,
    DateTime,
    ForeignKey,
    Text,
    Table,
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
from sqlalchemy.dialects.mysql import LONGBLOB, LONGTEXT, ENUM as MysqlEnum

Base = declarative_base()

# Tabela de Associação (Muitos-para-Muitos)
dados_separadores_association = Table('dados_separadores', Base.metadata,
                                      Column('dado_id', Integer, ForeignKey(
                                          'dados.id', ondelete="CASCADE"), primary_key=True),
                                      Column('separador_id', Integer, ForeignKey(
                                          'separadores.id', ondelete="CASCADE"), primary_key=True)
                                      )


class TipoDado(str, enum.Enum):
    ARQUIVO = "arquivo"
    SENHA = "senha"

# Mapeamento das Tabelas


class Usuario(Base):
    __tablename__ = 'usuario'
    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    senha_mestre = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    dados = relationship("Dado", back_populates="usuario",
                         cascade="all, delete-orphan")
    eventos = relationship(
        "Evento", back_populates="usuario", cascade="all, delete-orphan")
    compartilhamentos_criados = relationship("Compartilhamento", back_populates="owner_usuario",
                                             foreign_keys='Compartilhamento.owner_usuario_id', cascade="all, delete-orphan")

    logs = relationship("Log", back_populates="usuario")


class Dado(Base):
    __tablename__ = 'dados'
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey(
        'usuario.id', ondelete="CASCADE"), nullable=False)
    nome_aplicacao = Column(String(255))
    descricao = Column(Text)
    tipo = Column(MysqlEnum('arquivo', 'senha',
                  name='tipo_enum'), nullable=False)
    criado_em = Column(DateTime, server_default=func.now())
    nota = Column(String(1000))

    usuario = relationship("Usuario", back_populates="dados")
    arquivo = relationship("Arquivo", back_populates="dado",
                           uselist=False, cascade="all, delete-orphan")
    senha = relationship("Senha", back_populates="dado",
                         uselist=False, cascade="all, delete-orphan")
    separadores = relationship(
        "Separador", secondary=dados_separadores_association, back_populates="dados")

    # Relações sem cascade definido no SQL
    logs = relationship("Log", back_populates="dado")
    compartilhamentos_origem = relationship(
        "DadosCompartilhados", back_populates="dado_origem")


class Arquivo(Base):
    __tablename__ = 'arquivos'
    # Chave Primária que é também Chave Estrangeira (One-to-One)
    id = Column(Integer, ForeignKey(
        'dados.id', ondelete="CASCADE"), primary_key=True)
    arquivo = Column(LONGBLOB)
    extensao = Column(String(50))
    nome_arquivo = Column(String(255))

    dado = relationship("Dado", back_populates="arquivo")


class Senha(Base):
    __tablename__ = 'senhas'
    # Chave Primária que é também Chave Estrangeira (One-to-One)
    id = Column(Integer, ForeignKey(
        'dados.id', ondelete="CASCADE"), primary_key=True)
    senha_cripto = Column(String(1024), nullable=False)
    host_url = Column(String(1024))

    dado = relationship("Dado", back_populates="senha")


class Separador(Base):
    __tablename__ = 'separadores'
    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(255), nullable=False)
    tipo = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    cor = Column(String(100))

    dados = relationship(
        "Dado", secondary=dados_separadores_association, back_populates="separadores")


class Compartilhamento(Base):
    __tablename__ = 'compartilhamento'
    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_usuario_id = Column(Integer, ForeignKey(
        'usuario.id', ondelete="CASCADE"), nullable=False)
    n_acessos_total = Column(BigInteger, nullable=False, default=0)
    n_acessos_atual = Column(BigInteger, nullable=False, default=0)
    data_expiracao = Column(DateTime)
    criado_em = Column(DateTime, server_default=func.now())

    owner_usuario = relationship(
        "Usuario", back_populates="compartilhamentos_criados")
    dados_compartilhados = relationship(
        "DadosCompartilhados", back_populates="compartilhamento", cascade="all, delete-orphan")


class DadosCompartilhados(Base):
    __tablename__ = 'dados_compartilhados'
    id = Column(Integer, primary_key=True, autoincrement=True)
    compartilhamento_id = Column(Integer, ForeignKey(
        'compartilhamento.id', ondelete="CASCADE"), nullable=False)
    dado_origem_id = Column(Integer, ForeignKey(
        'dados.id', ondelete="SET NULL"))
    dado_criptografado = Column(LONGBLOB, nullable=False)
    meta = Column(LONGTEXT)
    criado_em = Column(DateTime, server_default=func.now())

    compartilhamento = relationship(
        "Compartilhamento", back_populates="dados_compartilhados")
    dado_origem = relationship(
        "Dado", back_populates="compartilhamentos_origem")


class Evento(Base):
    __tablename__ = 'eventos'
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey(
        'usuario.id', ondelete="CASCADE"), nullable=False)
    notificacao = Column(Text)
    data_hora = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    usuario = relationship("Usuario", back_populates="eventos")


class Log(Base):
    __tablename__ = 'logs'
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey('usuario.id'))
    dispositivo = Column(String(255))
    data_hora = Column(DateTime, nullable=False, server_default=func.now())
    ip = Column(String(45))
    regiao = Column(String(255))
    nome_aplicacao = Column(String(255))
    tipo_acesso = Column(String(100), nullable=False)
    id_dado = Column(Integer, ForeignKey('dados.id'))

    usuario = relationship("Usuario", back_populates="logs")
    dado = relationship("Dado", back_populates="logs")
