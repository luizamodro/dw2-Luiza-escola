from pydantic import BaseModel
from datetime import date
from typing import Optional


# --- Alunos ---
class AlunoBase(BaseModel):
    nome: str
    data_nascimento: date
    status: str = "ativo"
    turma_id: Optional[int] = None


class AlunoCreate(AlunoBase):
    pass


class AlunoUpdate(AlunoBase):
    pass


class AlunoOut(AlunoBase):
    id: int

    class Config:
        orm_mode = True


# --- Turmas ---
class TurmaBase(BaseModel):
    nome: str


class TurmaCreate(TurmaBase):
    pass


class TurmaOut(TurmaBase):
    id: int

    class Config:
        orm_mode = True


# --- Matrícula ---
class MatriculaIn(BaseModel):
    aluno_id: int
    turma_id: int
