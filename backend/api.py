from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from . import crud, schemas, models
from .database import SessionLocal
from fastapi import HTTPException
from typing import List, Optional

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/alunos", response_model=List[schemas.AlunoOut])
def list_alunos(search: Optional[str] = None, turma_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_alunos(db, search, turma_id, status)


@router.post("/alunos", response_model=schemas.AlunoOut)
def create_aluno(aluno: schemas.AlunoCreate, db: Session = Depends(get_db)):
    # valida idade >=5
    from datetime import date
    idade = (date.today() - aluno.data_nascimento).days / 365.25
    if idade < 5:
        raise HTTPException(status_code=400, detail="Aluno deve ter pelo menos 5 anos")
    return crud.create_aluno(db, aluno)


@router.put("/alunos/{id}", response_model=schemas.AlunoOut)
def put_aluno(id: int, aluno: schemas.AlunoCreate, db: Session = Depends(get_db)):
    return crud.update_aluno(db, id, aluno)


@router.delete("/alunos/{id}")
def del_aluno(id: int, db: Session = Depends(get_db)):
    crud.delete_aluno(db, id)
    return {"ok": True}


@router.get("/turmas", response_model=List[schemas.TurmaOut])
def list_turmas(db: Session = Depends(get_db)):
    return crud.get_turmas(db)


@router.post("/turmas", response_model=schemas.TurmaOut)
def post_turma(turma: schemas.TurmaCreate, db: Session = Depends(get_db)):
    return crud.create_turma(db, turma)


@router.post("/matriculas", response_model=schemas.AlunoOut)
def matricula(payload: dict, db: Session = Depends(get_db)):
    aluno_id = payload.get("aluno_id")
    turma_id = payload.get("turma_id")
    if not aluno_id or not turma_id:
        raise HTTPException(status_code=400, detail="aluno_id e turma_id obrigatórios")
    return crud.matricular(db, aluno_id, turma_id)
