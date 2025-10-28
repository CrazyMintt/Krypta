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

O backend pode ser executado com **Docker** (recomendado) ou diretamente com **Python**.

> Em ambos os casos, é necessário:
> - Configurar corretamente o arquivo `.env` (ver seção abaixo)
> - Ter o banco de dados criado localmente com um usuário com acesso externo (necessário se usar Docker)
> - Gerar certificados locais com `mkcert` para que o HTTPS funcione corretamente


## Configurando HTTPS com mkcert

Para rodar a API localmente com HTTPS, é necessário o [mkcert](https://github.com/FiloSottile/mkcert).

### Instale o mkcert:

No Windows (usando Chocolatey):

```bash
choco install mkcert```
Ou faça o build a partir do repositório oficial https://github.com/FiloSottile/mkcert

No Arch Linux:

```bash
sudo pacman -S mkcert
```

1. Instale a autoridade de certificação local (só precisa ser feito uma vez):

```bash
mkcert -install```

2. Gere os certificados na pasta raiz do projeto:

```bash
mkcert localhost 127.0.0.1```

---

## Configuração do Python

### Ambiente Virtual e Dependências

```bash
python -m venv .venv
```

**Ativar o ambiente virtual:**

- **Linux:**
  ```bash
  source .venv/bin/activate
  ```
- **Windows:**
  ```bash
  .venv\Scripts\activate
  ```

**Instalar dependências:**
```bash
pip install -r requirements.txt
```

---

### Variáveis de Ambiente
O arquivo `.env` deve conter as variáveis necessárias para o funcionamento da aplicação.
Um template está disponível em `.env.new`.

### Exemplo de `.env`

```env
DATABASE_USER=usuario
DATABASE_PASSWORD=senha
DATABASE_PORT=3306
DATABASE_HOST=host.docker.internal # Use localhost caso execute com o python sem docker
DATABASE_URL=mysql+pymysql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/KryptaTeste
```


---

## Banco de Dados Local

Antes de iniciar o backend:

1. Certifique-se de que o **banco de dados** está criado localmente a partir do script KryptaFisico.sql
2. Crie um **usuário com permissões de acesso externas**, não apenas `localhost`.
   Isso é necessário para que o backend rodando no container Docker consiga se conectar ao banco.

### Exemplo de criação de usuário:

```sql
CREATE USER 'meu_usuario'@'%' IDENTIFIED BY 'minha_senha';
GRANT ALL PRIVILEGES ON *.* TO 'meu_usuario'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

3. Atualize o `.env` com as credenciais correspondentes.

---

## Executando a Aplicação

Para executar o backend com python, é necessário estar dentro do diretório **backend** e executar o comando:
```bash
python main.py
```

Para executar o backend com docker, é necessário executar o seguinte comando **na raiz do projeto**
```bash
docker compose up backend --build```


A API estará disponível em `https://127.0.0.1:8000`.
