# Estrutura do Projeto:
```
backend/
├── app/
│   ├── __init__.py
│   ├── api.py              # Define os endpoints/rotas da API (ex: /users, /token).
│   ├── core.py             # Lógica de segurança (hashing, JWT) e configurações.
│   ├── database.py         # Configura a conexão com o banco de dados e a sessão.
│   ├── models.py           # Contém os modelos ORM do SQLAlchemy (representa as tabelas).
│   ├── repository.py       # Camada de acesso aos dados (CRUD - as queries).
│   ├── schemas.py          # Contém os schemas Pydantic (valida os dados da API).
│   └── services.py         # Contém a lógica de negócio (as regras da aplicação).
│
├── .env                    # Arquivo para variáveis de ambiente (senha do DB, etc.).
├── main.py                 # Ponto de entrada da aplicação que inicializa o FastAPI.
└── requirements.txt        # Lista de todas as dependências Python do projeto.
```