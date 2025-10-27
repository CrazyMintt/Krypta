# Estrutura geral do Projeto
```
.
├── backend
│   ├── app                # Comunicação com o db, camada de serviço, etc.
│   ├── Dockerfile         # Arquivo usado para construir imagem do Backend com python e as bibliotecas necessárias
│   ├── main.py            # Inicialização da aplicação
│   ├── README.md          # Mais informações sobre o Backend
│   └── requirements.txt   # Bibliotecas do python
├── docker-compose.yml     # Arquivo para subir as imagens do Docker do Backend e Frontend
├── frontend
│   ├── Dockerfile         # Arquivo usado para construir imagem do frontend com node (e as dependências do package.json) e nginx
│   ├── index.html
│   ├── package.json       # Dependências do node
│   ├── package-lock.json
│   ├── public
│   ├── README.md          # Mais informações sobre o Frontend
│   ├── src                # Código fonte do Frontend
│   ├── src-tauri
│   └── vite.config.js
├── KryptaFisico.sql       # Script de criação do banco de dados
├── KryptaLogico.png       # Representação em diagrama do modelo lógico do banco de dados
└── README.md              # Informações gerais sobre o projeto (você está aqui)
```
# Como rodar
> Toda a aplicação pode ser construida e executada localmente com Docker. Na raiz do projeto execute:

```docker compose up -d --build```

## Frontend
Para rodar apenas o Frontend, rodar o seguinte comando:
```docker compose up frontend -d --build```

## Backend 
Para rodar apenas o Backend, rodar o seguinte comando:
```docker compose up backend -d --build```
