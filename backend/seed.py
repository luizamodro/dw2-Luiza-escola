from .database import SessionLocal
from . import models
from datetime import date
import random


def random_date(start_year=2005, end_year=2019):
    start = date(start_year, 1, 1).toordinal()
    end = date(end_year, 12, 31).toordinal()
    return date.fromordinal(random.randint(start, end))


def run_seed():
    db = SessionLocal()
    try:
        # remover dados antigos
        db.query(models.Aluno).delete()
        db.query(models.Turma).delete()
        db.commit()

        # criar 3 turmas
        turmas = [
            models.Turma(nome="1A - Manhã", capacidade=10),
            models.Turma(nome="2B - Tarde", capacidade=8),
            models.Turma(nome="3C - Noite", capacidade=12),
        ]
        for t in turmas:
            db.add(t)
        db.commit()

        turmas_db = db.query(models.Turma).all()

        nomes = [
            "Ana", "Bruno", "Carla", "Diego", "Eduarda", "Felipe", "Gabriela", "Heitor",
            "Isabela", "João", "Karla", "Lucas", "Marina", "Neto", "Olivia", "Paulo",
            "Quésia", "Rafael", "Sofia", "Tiago"
        ]

        for i, nome in enumerate(nomes):
            aluno = models.Aluno(
                nome=f"{nome} Silva",
                data_nascimento=random_date(),
                email=f"{nome.lower()}.{i}@escola.test",
                status="inativo",
            )
            # distribuir alunos em turmas até capacidade
            turma = random.choice(turmas_db)
            ocupacao = db.query(models.Aluno).filter(models.Aluno.turma_id == turma.id).count()
            if ocupacao < turma.capacidade:
                aluno.status = "ativo"
                aluno.turma_id = turma.id
            db.add(aluno)

        db.commit()
    finally:
        db.close()
