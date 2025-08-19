from sqlalchemy.orm import Session
from . import models, schemas
from datetime import date, timedelta
from fastapi import HTTPException


def get_alunos(db: Session, search: str = None, turma_id: int = None, status: str = None):
    q = db.query(models.Aluno)
    if search:
        q = q.filter(models.Aluno.nome.ilike(f"%{search}%"))
    if turma_id:
        q = q.filter(models.Aluno.turma_id == turma_id)
    if status:
        q = q.filter(models.Aluno.status == status)
    return q.all()


def get_turmas(db: Session):
    return db.query(models.Turma).all()


def create_turma(db: Session, turma: schemas.TurmaCreate):
    db_turma = models.Turma(nome=turma.nome, capacidade=turma.capacidade)
    db.add(db_turma)
    db.commit()
    db.refresh(db_turma)
    return db_turma


def create_aluno(db: Session, aluno: schemas.AlunoCreate):
    db_aluno = models.Aluno(
        nome=aluno.nome,
        data_nascimento=aluno.data_nascimento,
        email=aluno.email,
        status=aluno.status,
        turma_id=aluno.turma_id,
    )
    db.add(db_aluno)
    db.commit()
    db.refresh(db_aluno)
    return db_aluno


def update_aluno(db: Session, id: int, aluno: schemas.AlunoCreate):
    db_aluno = db.query(models.Aluno).filter(models.Aluno.id == id).first()
    if not db_aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    for k, v in aluno.dict().items():
        setattr(db_aluno, k, v)
    db.commit()
    db.refresh(db_aluno)
    return db_aluno


def delete_aluno(db: Session, id: int):
    db_aluno = db.query(models.Aluno).filter(models.Aluno.id == id).first()
    if not db_aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    db.delete(db_aluno)
    db.commit()
    return True


def matricular(db: Session, aluno_id: int, turma_id: int):
    db_aluno = db.query(models.Aluno).filter(models.Aluno.id == aluno_id).first()
    if not db_aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    db_turma = db.query(models.Turma).filter(models.Turma.id == turma_id).first()
    if not db_turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")

    # checa capacidade
    ocupacao = db.query(models.Aluno).filter(models.Aluno.turma_id == turma_id).count()
    if ocupacao >= db_turma.capacidade:
        raise HTTPException(status_code=400, detail="Turma cheia")

    db_aluno.turma_id = turma_id
    db_aluno.status = "ativo"
    db.commit()
    db.refresh(db_aluno)
    return db_aluno
