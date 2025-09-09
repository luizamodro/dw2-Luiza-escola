from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from . import crud, schemas, seed
from .database import SessionLocal
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Gestão Escolar")

# --- CORS (permitir front-end rodando em outro domínio/porta) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ou restrinja ao front-end
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Dependência do DB ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Alunos ---
@app.get("/alunos", response_model=List[schemas.AlunoOut])
def list_alunos(
    search: Optional[str] = None,
    turma_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return crud.get_alunos(db, search, turma_id, status)


@app.post("/alunos", response_model=schemas.AlunoOut)
def create_aluno(aluno: schemas.AlunoCreate, db: Session = Depends(get_db)):
    idade = (date.today() - aluno.data_nascimento).days / 365.25
    if idade < 5:
        raise HTTPException(status_code=400, detail="Aluno deve ter pelo menos 5 anos")
    return crud.create_aluno(db, aluno)


@app.put("/alunos/{id}", response_model=schemas.AlunoOut)
def put_aluno(id: int, aluno: schemas.AlunoUpdate, db: Session = Depends(get_db)):
    aluno_atualizado = crud.update_aluno(db, id, aluno)
    if not aluno_atualizado:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    return aluno_atualizado


@app.delete("/alunos/{id}")
def del_aluno(id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_aluno(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    return {"ok": True}


# --- Turmas ---
@app.get("/turmas", response_model=List[schemas.TurmaOut])
def list_turmas(db: Session = Depends(get_db)):
    return crud.get_turmas(db)


@app.post("/turmas", response_model=schemas.TurmaOut)
def post_turma(turma: schemas.TurmaCreate, db: Session = Depends(get_db)):
    return crud.create_turma(db, turma)


# --- Matrículas ---
@app.post("/matriculas", response_model=schemas.AlunoOut)
def matricula(payload: schemas.MatriculaIn, db: Session = Depends(get_db)):
    return crud.matricular(db, payload.aluno_id, payload.turma_id)


# --- Seed ---
@app.post("/seed")
def run_seed():
    seed.run_seed()
    return {"ok": True, "msg": "Seed executada"}
