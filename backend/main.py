from fastapi import FastAPI
from app.routes import router

app = FastAPI(title="Krypta API", description="API do projeto de Gerenciador de Credencias e arquivos: Krypta")
app.include_router(router)