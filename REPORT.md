# REPORT - Gestão Escolar (DW2)

## Resumo
Mini-sistema de Gestão Escolar (Alunos, Turmas, Matrículas) implementado com front-end em HTML/CSS/JS vanilla e back-end em FastAPI + SQLAlchemy + SQLite.

## Arquitetura
Fluxo: Frontend (fetch) → API (FastAPI endpoints em `backend/api.py`) → CRUD via SQLAlchemy (`backend/crud.py`) → SQLite (`backend/app.db`) → resposta JSON.

Pastas principais
- frontend/: `index.html`, `css/style.css`, `js/main.js`
- backend/: `main.py`, `api.py`, `models.py`, `schemas.py`, `crud.py`, `database.py`, `seed.py`

## Tecnologias e versões (exemplos)
- Python 3.10+ (FastAPI)
- FastAPI
- Uvicorn
- SQLAlchemy
- Pydantic
- SQLite (arquivo: `backend/app.db`)
- Frontend: HTML5, CSS3 (Grid/Flex), JavaScript ES6+
- Extensões VSCode recomendadas: Python, Pylance, Prettier

## Endpoints principais
- GET /alunos?search=&turma_id=&status=
- POST /alunos
- PUT /alunos/{id}
- DELETE /alunos/{id}
- GET /turmas
- POST /turmas
- POST /matriculas (body: { aluno_id, turma_id })
- POST /seed

Respostas conformes com códigos HTTP e mensagens de erro claras (400/404 etc.).

## Peculiaridades implementadas (3 obrigatórias)
1. Acessibilidade real
   - tabindex em inputs/selects, foco visível via CSS, aria-live (`#status-msg`) para feedback de operações, elementos com labels e roles apropriados.
2. Filtro avançado (múltiplos critérios)
   - filtros combinados por texto (search), turma e status aplicados sem recarregar a página.
3. Export CSV/JSON
   - exportação da lista atual (CSV e JSON) preservando os dados filtrados.

## Validações
- Front-end
  - Nome: 3–80 caracteres (HTML + JS)
  - Data de nascimento: obrigatório e idade mínima 5 anos (JS)
  - Email: validação por regex se informado
  - Status: obrigatório
- Back-end
  - Validação de idade >= 5 no POST /alunos (em `backend/api.py`)
  - Validação de capacidade da turma na matrícula (`backend/crud.py`) — retorna 400 com mensagem quando turma cheia

## Acessibilidade aplicada
- Foco visível e consistente
- aria-live para mensagens dinâmicas
- Formulário com labels explícitos e atributos aria-required
- Compatibilidade com navegação por teclado (tabindex, Enter ativa botões)

## Seed
- `backend/seed.py` cria 3 turmas e ~20 alunos plausíveis. Pode ser executado via `POST /seed` ou importando e chamando `run_seed()`.

## Testes de API
- Arquivo `backend/api.http` com chamadas essenciais (GET/POST/PUT/DELETE/matricular/seed) pronto para uso no Insomnia/Thunder Client ou VSCode REST Client.

## Como rodar (passos)
1. Criar e ativar ambiente virtual (Windows PowerShell):
   python -m venv .venv; .\.venv\Scripts\Activate.ps1
2. Instalar dependências:
   pip install -r requirements.txt
3. Iniciar servidor (na raiz do projeto):
   uvicorn backend.main:app --reload
4. Abrir no navegador: http://localhost:8000
5. Popular dados: POST http://localhost:8000/seed

## Prompts do Copilot (exemplos usados e comentários)
Foram registrados prompts usados durante o desenvolvimento — abaixo há exemplos (trechos aceitos e adaptados):
1. "Gerar código JS para listar alunos via fetch e renderizar tabela, com filtros por turma e status" — gerou base que foi revisada e adaptada para acessibilidade e ordenação persistida.
2. "Implement modal form handling vanilla JS create/edit" — uso de handlers e validações customizadas no front.
3. "Como validar idade mínima 5 anos em JavaScript" — recomendado e incorporado.
4. "Export array of objects to CSV in browser" — adaptado para exportar a lista filtrada.
5. "Exibir toasts acessíveis com aria-live" — integrado ao sistema de mensagens.
6. "FastAPI: criar endpoint POST /matriculas que valida capacidade" — lógica aplicada e ajustada no backend.

(Descrever aqui os prompts completos utilizados no desenvolvimento é recomendado para o relatório final — salvar os prompts que você usou com o Copilot.)

## Limitações e melhorias futuras
- Paginação ou scroll infinito não implementados (recomendado para muitas linhas).
- Testes automatizados (pytest) ausentes.
- Melhor tratamento de erros no front (campo por campo) e UI mais rica (modal mais acessível para leitores de tela).

## Arquivo de API para testes
- `backend/api.http` contém as principais chamadas para validação manual com VSCode REST Client / Insomnia.

---

Se quiser, eu posso agora:
- iniciar o servidor e executar o seed;
- rodar a seed somente;
- gerar a coleção do Thunder Client em formato JSON;
- criar commits e tag v1.0.0 (se desejar que eu faça commits locais).

Diga qual ação prefere que eu execute a seguir.
