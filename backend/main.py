from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# importa para criar as tabelas ao iniciar
from backend.database import engine, Base
from backend import api

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gestão Escolar - API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(api.router)

# monta a pasta frontend para servir arquivos estáticos (opcional)
app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")
