from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date


class TurmaCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=80)
    capacidade: int = Field(..., ge=1)


class TurmaOut(BaseModel):
    id: int
    nome: str
    capacidade: int

    class Config:
        orm_mode = True


class AlunoBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=80)
    data_nascimento: date
    email: Optional[EmailStr] = None
    status: str = Field(...)
    turma_id: Optional[int] = None


class AlunoCreate(AlunoBase):
    pass


class AlunoOut(AlunoBase):
    id: int

    class Config:
        orm_mode = True
