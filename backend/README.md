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
# Instruções

## Ambiente Virtual e Dependências

Primeiro, configure o ambiente virtual e instale as dependências do projeto.

### Crie o ambiente virtual
```python -m venv .venv```

### Ative o ambiente virtual
#### No Linux:
```source .venv/bin/activate```
#### No Windows:
```.venv\Scripts\activate```

### Instale as dependências
```pip install -r requirements.txt```


## Configurando HTTPS com mkcert

Para rodar a API localmente com HTTPS, precisamos do mkcert.

Instale o mkcert:

No Windows (usando Chocolatey):

```choco install mkcert```
Ou faça o build https://github.com/FiloSottile/mkcert

No Arch Linux:

```

sudo pacman -S mkcert

```


1. Instale a autoridade de certificação local (só precisa ser feito uma vez):

```mkcert -install```


2. Gere os certificados na pasta raiz do projeto:

```mkcert localhost 127.0.0.1```


## Executando a Aplicação

A aplicação é servida com Uvicorn, usando main.py como ponto de entrada. Use o seguinte comando para iniciar o servidor com HTTPS:

```
python main.py
```


A API estará disponível em https://127.0.0.1:8000.