import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        # O argumento 'pool_pre_ping' verifica a conexão antes de cada checkout.
        pool_pre_ping=True,
    )
else:
    raise Exception("Variável DATABASE_URL não configurada.")
# Cria uma fábrica de sessões. Cada instância de SessionLocal será uma sessão de banco de dados.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para as classes de modelo do SQLAlchemy.
Base = declarative_base()

# Dependência para Injeção no FastAPI


def get_db():
    """
    Função geradora que fornece uma sessão de banco de dados para as rotas da API.
    Garante que a sessão seja sempre fechada após a requisição.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
