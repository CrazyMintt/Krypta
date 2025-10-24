import uvicorn
from fastapi import FastAPI
from app.api import router as api_router
from fastapi.middleware.cors import CORSMiddleware

origins = ["http://localhost:1420"]  # Porta do frontend

app = FastAPI(
    title="Krypta API",
    description="API para o gerenciador de senhas e arquivos Krypta.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_methods=["*"], allow_headers=["*"]
)
# Inclui as rotas da API
app.include_router(api_router)


@app.get("/", tags=["Root"])
def read_root():
    """
    Endpoint raiz para verificar se a API está funcionando.
    """
    return {"message": "Bem-vindo à Krypta API!"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        ssl_keyfile="localhost+1-key.pem",
        ssl_certfile="localhost+1.pem",
    )
