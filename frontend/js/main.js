// js/main.js

// ============================
// js/main.js (versão melhorada)

// Modo híbrido: se API_BASE for vazio ou fetch falhar, usamos localStorage como fallback.
const API_BASE = ""; // coloque a base da API, ex: "http://127.0.0.1:8000"
let TURMAS = [];
let ALUNOS = [];
let SORT = localStorage.getItem("sort") || "nome";

function qs(params) {
  const entries = Object.entries(params).filter(([_, v]) => v !== "" && v !== null && v !== undefined);
  if (!entries.length) return "";
  return (
    "?" +
    entries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&")
  );
}

function escapeHtml(s = "") {
  return String(s).replace(/[&<>'\"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[c]));
}

function calcAge(dateString) {
  if (!dateString) return "";
  const b = new Date(dateString);
  if (isNaN(b)) return "";
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
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
  document.querySelector("#status-msg").textContent = msg;
}

async function apiGet(path) {
  if (!API_BASE) throw new Error("no-api");
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`api:${res.status}`);
  return await res.json();
}

async function apiPost(path, body) {
  if (!API_BASE) throw new Error("no-api");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`api:${res.status}:${text}`);
  }
  return await res.json();
}

async function apiPut(path, body) {
  if (!API_BASE) throw new Error("no-api");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`api:${res.status}:${text}`);
  }
  return await res.json();
}

async function apiDelete(path) {
  if (!API_BASE) throw new Error("no-api");
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`api:${res.status}:${text}`);
  }
  return await res.json();
}

// ---------- Storage fallback (localStorage) ----------
function saveLocalData() {
  localStorage.setItem("dw_alunos", JSON.stringify(ALUNOS));
  localStorage.setItem("dw_turmas", JSON.stringify(TURMAS));
}

function loadLocalData() {
  try {
    ALUNOS = JSON.parse(localStorage.getItem("dw_alunos") || "[]");
    TURMAS = JSON.parse(localStorage.getItem("dw_turmas") || "[]");
  } catch (e) {
    ALUNOS = [];
    TURMAS = [];
  }
}

// Ensure dates are normalized to YYYY-MM-DD so <input type="date"> shows properly
function normalizeAlunoDates(){
  ALUNOS = ALUNOS.map(a => {
    if (!a) return a;
    const d = a.data_nascimento;
    if (!d) return a;
    // if already ISO-like YYYY-MM-DD, keep
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return a;
    const dt = new Date(d);
    if (isNaN(dt)) return a;
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth()+1).padStart(2,'0');
    const dd = String(dt.getDate()).padStart(2,'0');
    return { ...a, data_nascimento: `${yy}-${mm}-${dd}` };
  });
}

function idNext(items) {
  return items.reduce((m, it) => Math.max(m, it.id || 0), 0) + 1;
}

// ---------- Fetchs (com fallback) ----------
async function fetchTurmas() {
  try {
    if (API_BASE) TURMAS = await apiGet("/turmas");
    else throw new Error("no-api");
  } catch (err) {
    // fallback to localStorage
    loadLocalData();
    if (!TURMAS || !TURMAS.length) {
      // seed minimal local turmas se não houver
      TURMAS = [
        { id: 1, nome: "Turma A", capacidade: 30, nivel: "Fundamental" },
        { id: 2, nome: "Turma B", capacidade: 25, nivel: "Ensino Médio" },
      ];
    }
    showMessage("Modo offline: usando dados locais", true);
  }

  // popular selects/datalists
  const select = document.querySelector("#filter-turma");
  const datalistFilter = document.querySelector("#filter-turmas-list");
  const formSelect = document.querySelector("#aluno-turma");

  select.innerHTML = `<option value="">Todas as turmas</option>`;
  datalistFilter.innerHTML = "";
  formSelect.value = "";
  const datalistTurmas = document.querySelector("#turmas-list");
  datalistTurmas.innerHTML = "";

  TURMAS.forEach((t) => {
    select.innerHTML += `<option value="${t.id}">${escapeHtml(t.nome)} (${escapeHtml(t.nivel || '')})</option>`;
    datalistFilter.innerHTML += `<option value="${escapeHtml(t.nome)}">`;
    // filter select uses id, datalist and input use name
    formSelect.value = formSelect.value; // no-op to be safe
    datalistTurmas.innerHTML += `<option value="${escapeHtml(t.nome)}">`;
  });

  // set nivel filter options (keeps default options in HTML)
  const filterNivel = document.querySelector('#filter-nivel');
  if (filterNivel) {
    // ensure selected value remains
    const cur = filterNivel.value;
    filterNivel.value = cur;
  }
}

async function fetchAlunos(params = {}) {
  try {
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/alunos${qs(params)}`);
      if (!res.ok) throw new Error("api");
      ALUNOS = await res.json();
    } else throw new Error("no-api");
  } catch (err) {
    loadLocalData();
    // se não houver alunos locais, cria uma lista vazia
    ALUNOS = ALUNOS || [];
    // apply filters locally if provided
    const nomeFilter = params.nome ? params.nome.toLowerCase() : "";
    const turmaFilter = params.turma_id ? String(params.turma_id) : "";
    const statusFilter = params.status ? params.status : "";
    if (nomeFilter || turmaFilter || statusFilter) {
      ALUNOS = ALUNOS.filter((a) => {
        const matchesNome = !nomeFilter || (a.nome && a.nome.toLowerCase().includes(nomeFilter));
        const matchesTurma = !turmaFilter || String(a.turma_id) === turmaFilter;
        const matchesStatus = !statusFilter || a.status === statusFilter;
        return matchesNome && matchesTurma && matchesStatus;
      });
    }
  }
  renderAlunos();
}

// ---------- Render ----------
function renderAlunos() {
  const tbody = document.querySelector("#alunos-table tbody");
  tbody.innerHTML = "";

  let sorted = [...ALUNOS].sort((a, b) =>
    SORT === "idade"
      ? new Date(a.data_nascimento) - new Date(b.data_nascimento)
      : (a.nome || "").localeCompare(b.nome || "")
  );

  sorted.forEach((aluno) => {
    const tr = document.createElement("tr");
    const turmaObj = (aluno.turma_id && (TURMAS.find((t) => t.id === aluno.turma_id) || {})) || {};
    const turmaNome = turmaObj.nome || "";
    const turmaNivel = turmaObj.nivel || "";
    const idade = calcAge(aluno.data_nascimento);
    tr.innerHTML = `
      <td>${escapeHtml(aluno.nome)}</td>
      <td>${aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString("pt-BR") : ""}</td>
      <td>${idade !== "" ? idade : ""}</td>
      <td>${escapeHtml(aluno.email || "")}</td>
      <td>${escapeHtml(aluno.status || "")}</td>
      <td>${escapeHtml(turmaNome)}${turmaNivel ? ` (${escapeHtml(turmaNivel)})` : ''}</td>
      <td>
        <button data-id="${aluno.id}" class="edit">✏️</button>
        <button data-id="${aluno.id}" class="delete">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

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

// ---------- CRUD (com fallback) ----------
async function saveAluno() {
  console.log("saveAluno called");
  const id = document.querySelector("#modal-aluno").dataset.id;
  const nome = document.querySelector("#aluno-nome").value.trim();
  const data_nascimento = document.querySelector("#aluno-data").value;
  const email = document.querySelector("#aluno-email").value.trim();
  const status = document.querySelector("#aluno-status").value;
  const turmaVal = document.querySelector("#aluno-turma").value;
  const turma_id = turmaVal ? Number(turmaVal) : null;
  const turmaNivelSelect = document.querySelector('#aluno-turma-nivel');
  const turmaNivel = turmaNivelSelect ? turmaNivelSelect.value : '';

  if (!nome || !data_nascimento || !status) {
    showMessage("Preencha todos os campos obrigatórios", true);
    return;
  }

  const payload = { nome, data_nascimento, email, status, turma_id };

  try {
    if (API_BASE) {
      if (id) await apiPut(`/alunos/${id}`, payload);
      else await apiPost(`/alunos`, payload);
      showMessage(id ? "Aluno atualizado com sucesso" : "Aluno criado com sucesso");
      await fetchAlunos(getFilters());
      closeModal();
      return;
    }
  } catch (err) {
    // se falhar na API, cai para modo local
    console.warn("API error, fallback local", err);
  }

  // fallback local
  // if turma was typed as text, map it to turma_id by name and create if necessary
  const turmaInput = document.querySelector("#aluno-turma").value.trim();
  if (turmaInput) {
    // try find turma by name
    let t = TURMAS.find((x) => x.nome.toLowerCase() === turmaInput.toLowerCase());
    if (!t) {
      // create new turma locally
      const nid = idNext(TURMAS);
      t = { id: nid, nome: turmaInput, capacidade: 999, nivel: turmaNivel || 'Fundamental' };
      TURMAS.push(t);
      saveLocalData();
    }
    payload.turma_id = t.id;
  }
  if (id) {
    const idx = ALUNOS.findIndex((a) => String(a.id) === String(id));
    if (idx >= 0) {
      ALUNOS[idx] = { ...ALUNOS[idx], ...payload, id: Number(id) };
      showMessage("Aluno atualizado (offline)");
    }
  } else {
    const nid = idNext(ALUNOS);
    ALUNOS.push({ ...payload, id: nid });
    showMessage("Aluno criado (offline)");
  }
  saveLocalData();
  fetchAlunos(getFilters());
  closeModal();
}

async function deleteAluno(id) {
  if (!confirm("Deseja realmente excluir este aluno?")) return;
  try {
    if (API_BASE) await apiDelete(`/alunos/${id}`);
    else throw new Error("no-api");
    showMessage("Aluno excluído");
    await fetchAlunos(getFilters());
    return;
  } catch (err) {
    // fallback local
    const idx = ALUNOS.findIndex((a) => String(a.id) === String(id));
    if (idx >= 0) {
      ALUNOS.splice(idx, 1);
      saveLocalData();
      showMessage("Aluno excluído (offline)");
      fetchAlunos(getFilters());
    } else showMessage("Aluno não encontrado", true);
  }
}

// ---------- Modal ----------
function openModal(id = null) {
  const modal = document.querySelector("#modal-aluno");
  modal.dataset.id = id || "";

  if (id) {
    const aluno = ALUNOS.find((a) => String(a.id) === String(id));
    if (!aluno) {
      showMessage("Aluno não encontrado", true);
      return;
    }
    document.querySelector("#aluno-nome").value = aluno.nome || "";
    document.querySelector("#aluno-data").value = aluno.data_nascimento || "";
    document.querySelector("#aluno-email").value = aluno.email || "";
    document.querySelector("#aluno-status").value = aluno.status || "ativo";
    // show turma name in input and set nivel select when editing
    const turmaObj = TURMAS.find((t) => String(t.id) === String(aluno.turma_id));
    document.querySelector("#aluno-turma").value = turmaObj ? turmaObj.nome : (aluno.turma_id || "");
    const nivelSel = document.querySelector('#aluno-turma-nivel');
    if (nivelSel) nivelSel.value = turmaObj && turmaObj.nivel ? turmaObj.nivel : 'Fundamental';
    modal.querySelector("h2").textContent = "Editar Aluno";
  } else {
    modal.querySelector("form").reset();
    const nivelSel = document.querySelector('#aluno-turma-nivel');
    if (nivelSel) nivelSel.value = 'Fundamental';
    modal.querySelector("h2").textContent = "Novo Aluno";
  }

  // showModal may not be supported in some browsers or when opened via file://
  // show the modal (div fallback) and set aria-hidden
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
  modal.setAttribute("open", "true");
  const first = modal.querySelector("input,select,button");
  if (first) first.focus();
}

function closeModal() {
  const modal = document.querySelector("#modal-aluno");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  modal.removeAttribute("open");
}

// ---------- Filtros e busca ----------
function getFilters() {
  return {
    nome: document.querySelector("#search").value.trim(),
    turma_id: document.querySelector("#filter-turma").value || "",
    status: document.querySelector("#filter-status").value,
  };
}

// ---------- Export ----------
function exportCSV() {
  const headers = ["Nome", "Data Nascimento", "Idade", "Email", "Status", "Turma"];
  const rows = ALUNOS.map((a) => {
    const idade = calcAge(a.data_nascimento);
    const t = (a.turma_id && (TURMAS.find((tt) => tt.id === a.turma_id) || {})) || {};
    const tLabel = t.nome ? `${t.nome}${t.nivel ? ` (${t.nivel})` : ''}` : '';
    return [
      a.nome,
      a.data_nascimento ? new Date(a.data_nascimento).toLocaleDateString("pt-BR") : "",
      idade !== "" ? idade : "",
      a.email || "",
      a.status || "",
      tLabel,
    ];
  });
  const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "alunos.csv";
  a.click();
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(ALUNOS, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "alunos.json";
  a.click();
}

// ---------- Init ----------
function init() {
  // eventos
  document.querySelector("#search").addEventListener(
    "input",
    debounceFn(() => fetchAlunos(getFilters()), 300)
  );
  document.querySelector("#filter-turma").addEventListener("change", () => fetchAlunos(getFilters()));
  document.querySelector("#filter-status").addEventListener("change", () => fetchAlunos(getFilters()));
  document.querySelector("#sort").value = SORT;
  document.querySelector("#sort").addEventListener("change", (e) => {
    SORT = e.target.value;
    localStorage.setItem("sort", SORT);
    renderAlunos();
  });
  document.querySelector("#btn-new-aluno").addEventListener("click", () => openModal());
  document.querySelector("#save-aluno").addEventListener("click", saveAluno);
  document.querySelector("#close-aluno").addEventListener("click", closeModal);
  document.querySelector("#export-csv").addEventListener("click", exportCSV);
  document.querySelector("#export-json").addEventListener("click", exportJSON);

  loadLocalData();
  normalizeAlunoDates();
  fetchTurmas();
  fetchAlunos(getFilters());
}

function debounceFn(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

// start
document.addEventListener("DOMContentLoaded", init);
