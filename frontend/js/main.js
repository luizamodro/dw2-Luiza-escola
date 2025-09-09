// js/main.js

// ============================
// Variáveis globais
// ============================
const API_BASE = ""; // se tiver prefixo de API, coloque aqui
let TURMAS = [];
let ALUNOS = [];
let SORT = localStorage.getItem("sort") || "nome";

// ============================
// Utils
// ============================
function qs(params) {
  return (
    "?" +
    Object.entries(params)
      .filter(([_, v]) => v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&")
  );
}

function escapeHtml(s) {
  return s.replace(/[&<>'"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[c]));
}

function debounceFn(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

function showMessage(msg, isError = false) {
  const div = document.createElement("div");
  div.className = "toast" + (isError ? " error" : "");
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.classList.add("visible"), 50);
  setTimeout(() => {
    div.classList.remove("visible");
    div.addEventListener("transitionend", () => div.remove());
  }, 3000);

  // acessibilidade
  document.querySelector("#status-msg").textContent = msg;
}

// ============================
// Fetch
// ============================
async function fetchTurmas() {
  try {
    const res = await fetch(`${API_BASE}/turmas`);
    TURMAS = await res.json();

    // preencher filtros e datalists
    const select = document.querySelector("#filter-turma");
    const datalistFilter = document.querySelector("#filter-turmas-list");
    const datalistForm = document.querySelector("#turmas-list");

    select.innerHTML = `<option value="">Todas as turmas</option>`;
    datalistFilter.innerHTML = "";
    datalistForm.innerHTML = "";

    TURMAS.forEach((t) => {
      select.innerHTML += `<option value="${t.nome}">${t.nome}</option>`;
      datalistFilter.innerHTML += `<option value="${t.nome}">`;
      datalistForm.innerHTML += `<option value="${t.nome}">`;
    });
  } catch (err) {
    showMessage("Erro ao carregar turmas", true);
  }
}

async function fetchAlunos(params = {}) {
  try {
    const res = await fetch(`${API_BASE}/alunos${qs(params)}`);
    ALUNOS = await res.json();
    renderAlunos();
  } catch (err) {
    showMessage("Erro ao carregar alunos", true);
  }
}

// ============================
// Renderização
// ============================
function renderAlunos() {
  const tbody = document.querySelector("#alunos-table tbody");
  tbody.innerHTML = "";

  // ordenação
  let sorted = [...ALUNOS].sort((a, b) =>
    SORT === "idade"
      ? new Date(a.data_nascimento) - new Date(b.data_nascimento)
      : a.nome.localeCompare(b.nome)
  );

  sorted.forEach((aluno) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(aluno.nome)}</td>
      <td>${new Date(aluno.data_nascimento).toLocaleDateString("pt-BR")}</td>
      <td>${escapeHtml(aluno.email || "")}</td>
      <td>${escapeHtml(aluno.status)}</td>
      <td>${escapeHtml(aluno.turma || "")}</td>
      <td>
        <button data-id="${aluno.id}" class="edit">✏️</button>
        <button data-id="${aluno.id}" class="delete">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // ações dos botões
  tbody.querySelectorAll(".edit").forEach((btn) =>
    btn.addEventListener("click", () => openModal(btn.dataset.id))
  );
  tbody.querySelectorAll(".delete").forEach((btn) =>
    btn.addEventListener("click", () => deleteAluno(btn.dataset.id))
  );

  renderIndicadores();
}

function renderIndicadores() {
  const div = document.querySelector("#indicadores");
  const total = ALUNOS.length;
  const ativos = ALUNOS.filter((a) => a.status === "ativo").length;
  const inativos = total - ativos;

  div.innerHTML = `
    <p>Total: ${total}</p>
    <p>Ativos: ${ativos}</p>
    <p>Inativos: ${inativos}</p>
  `;
}

// ============================
// CRUD
// ============================
async function saveAluno() {
  const id = document.querySelector("#modal-aluno").dataset.id;
  const nome = document.querySelector("#aluno-nome").value.trim();
  const data_nascimento = document.querySelector("#aluno-data").value;
  const email = document.querySelector("#aluno-email").value.trim();
  const status = document.querySelector("#aluno-status").value;
  const turma = document.querySelector("#aluno-turma").value.trim();

  if (!nome || !data_nascimento || !status) {
    showMessage("Preencha todos os campos obrigatórios", true);
    return;
  }

  const aluno = { nome, data_nascimento, email, status, turma };

  try {
    if (id) {
      await fetch(`${API_BASE}/alunos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aluno),
      });
      showMessage("Aluno atualizado com sucesso");
    } else {
      await fetch(`${API_BASE}/alunos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aluno),
      });
      showMessage("Aluno criado com sucesso");
    }
    closeModal();
    fetchAlunos(getFilters());
  } catch (err) {
    showMessage("Erro ao salvar aluno", true);
  }
}

async function deleteAluno(id) {
  if (!confirm("Deseja realmente excluir este aluno?")) return;
  try {
    await fetch(`${API_BASE}/alunos/${id}`, { method: "DELETE" });
    showMessage("Aluno excluído");
    fetchAlunos(getFilters());
  } catch (err) {
    showMessage("Erro ao excluir aluno", true);
  }
}

// ============================
// Modal
// ============================
function openModal(id = null) {
  const modal = document.querySelector("#modal-aluno");
  modal.dataset.id = id || "";

  if (id) {
    const aluno = ALUNOS.find((a) => a.id == id);
    document.querySelector("#aluno-nome").value = aluno.nome;
    document.querySelector("#aluno-data").value = aluno.data_nascimento;
    document.querySelector("#aluno-email").value = aluno.email || "";
    document.querySelector("#aluno-status").value = aluno.status;
    document.querySelector("#aluno-turma").value = aluno.turma || "";
    modal.querySelector("h2").textContent = "Editar Aluno";
  } else {
    modal.querySelector("form").reset();
    modal.querySelector("h2").textContent = "Novo Aluno";
  }

  modal.showModal();
}

function closeModal() {
  const modal = document.querySelector("#modal-aluno");
  modal.close();
}

// ============================
// Filtros e busca
// ============================
function getFilters() {
  return {
    nome: document.querySelector("#search").value.trim(),
    turma: document.querySelector("#filter-turma").value,
    status: document.querySelector("#filter-status").value,
  };
}

// ============================
// Exportação
// ============================
function exportCSV() {
  const headers = ["Nome", "Data Nascimento", "Email", "Status", "Turma"];
  const rows = ALUNOS.map((a) => [
    a.nome,
    new Date(a.data_nascimento).toLocaleDateString("pt-BR"),
    a.email || "",
    a.status,
    a.turma || "",
  ]);
  const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "alunos.csv";
  a.click();
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(ALUNOS, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "alunos.json";
  a.click();
}

// ============================
// Inicialização
// ============================
function init() {
  // eventos
  document.querySelector("#search").addEventListener(
    "input",
    debounceFn(() => fetchAlunos(getFilters()), 400)
  );
  document.querySelector("#filter-turma").addEventListener("change", () =>
    fetchAlunos(getFilters())
  );
  document.querySelector("#filter-status").addEventListener("change", () =>
    fetchAlunos(getFilters())
  );
  document.querySelector("#sort").value = SORT;
  document.querySelector("#sort").addEventListener("change", (e) => {
    SORT = e.target.value;
    localStorage.setItem("sort", SORT);
    renderAlunos();
  });
  document.querySelector("#btn-new-aluno").addEventListener("click", () =>
    openModal()
  );
  document.querySelector("#save-aluno").addEventListener("click", saveAluno);
  document.querySelector("#close-aluno").addEventListener("click", closeModal);
  document.querySelector("#export-csv").addEventListener("click", exportCSV);
  document.querySelector("#export-json").addEventListener("click", exportJSON);

  // carregar dados iniciais
  fetchTurmas();
  fetchAlunos(getFilters());
}

document.addEventListener("DOMContentLoaded", init);
