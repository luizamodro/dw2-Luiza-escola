const API_BASE = ""; // endpoints já expostos na raiz (/alunos, /turmas, ...)

// estado local
let TURMAS = [];
let ALUNOS = [];
let SORT = localStorage.getItem('sort') || 'nome';

function qs(params = {}){
  return new URLSearchParams(params).toString();
}

async function fetchTurmas(){
  const res = await fetch('/turmas');
  const data = await res.json();
  TURMAS = data;
  const sel1 = document.querySelector('#filter-turma');
  const sel2 = document.querySelector('#aluno-turma');
  sel1.innerHTML = '<option value="">Todas as turmas</option>';
  // sel2 is now an input; keep placeholder handled in HTML
  data.forEach(t => {
    const o = document.createElement('option'); o.value = t.id; o.textContent = `${t.nome} (cap ${t.capacidade})`;
    sel1.appendChild(o);
  });
  populateTurmasDatalist();
}

function populateTurmasDatalist(){
  const dl = document.querySelector('#turmas-list');
  if(!dl) return;
  dl.innerHTML = '';
  TURMAS.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id; // store id as value; label shown separately in select
    opt.textContent = t.nome;
    dl.appendChild(opt);
  });
}

function populateFilterTurmas(){
  const dl = document.querySelector('#filter-turmas-list');
  const sel = document.querySelector('#filter-turma');
  const input = document.querySelector('#filter-turma-input');
  if(!dl || !sel || !input) return;
  dl.innerHTML = '';
  // clear existing options except default
  sel.querySelectorAll('option:not([value=""])').forEach(o=>o.remove());
  TURMAS.forEach(t => {
    const opt = document.createElement('option'); opt.value = t.id; opt.textContent = t.nome;
    sel.appendChild(opt.cloneNode(true));
    const dopt = document.createElement('option'); dopt.value = t.id; dopt.textContent = t.nome; dl.appendChild(dopt);
  });

  // when user selects via input, update the select value
  input.addEventListener('input', ()=>{
    const val = input.value;
    // try find matching turma by name
    const found = TURMAS.find(t=> t.nome === val || `${t.nome} (cap ${t.capacidade})` === val);
    if(found) sel.value = found.id; else if(val==='') sel.value='';
    refreshList();
  });
}

async function fetchAlunos(params = {}){
  const qsStr = qs(params);
  const res = await fetch(`/alunos?${qsStr}`);
  if(!res.ok){
    showMessage('Erro ao carregar alunos', true);
    return [];
  }
  return res.json();
}

async function load(){
  await fetchTurmas();
  applyListenersState();
  await refreshList();
}

async function refreshList(){
  const search = document.querySelector('#search').value.trim();
  const turma_id = document.querySelector('#filter-turma').value;
  const status = document.querySelector('#filter-status').value;
  const params = {};
  if(search) params.search = search;
  if(turma_id) params.turma_id = turma_id;
  if(status) params.status = status;
  const alunos = await fetchAlunos(params);
  ALUNOS = alunos;
  sortAndRender();
  updateIndicators();
  populateNames();
  populateFilterTurmas();
}

function sortAndRender(){
  const sortField = localStorage.getItem('sort') || SORT;
  document.querySelector('#sort').value = sortField;
  const copy = [...ALUNOS];
  if(sortField === 'nome') copy.sort((a,b)=> a.nome.localeCompare(b.nome));
  else if(sortField === 'idade') copy.sort((a,b)=> new Date(a.data_nascimento) - new Date(b.data_nascimento));
  renderTable(copy);
}

function renderTable(alunos){
  const tbody = document.querySelector('#alunos-table tbody');
  tbody.innerHTML = '';
  alunos.forEach(a => {
    const tr = document.createElement('tr');
    tr.setAttribute('tabindex', '0');
    tr.setAttribute('role', 'row');
    const turma = TURMAS.find(t=>t.id===a.turma_id);
    tr.innerHTML = `
      <td>${escapeHtml(a.nome)}</td>
      <td>${a.data_nascimento}</td>
      <td>${escapeHtml(a.email||'')}</td>
      <td>${a.status}</td>
      <td>${turma?escapeHtml(turma.nome):''}</td>
      <td>
        <button type="button" data-id="${a.id}" class="btn-edit">Editar</button>
        <button type="button" data-id="${a.id}" class="btn-delete">Apagar</button>
        <button type="button" data-id="${a.id}" class="btn-matricular">Matricular</button>
      </td>
    `;
    // abrir modal ao duplo clique na linha
    tr.addEventListener('dblclick', ()=> openAlunoModal(a));
    // permitir Enter abrir quando a linha estiver focada
    tr.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') openAlunoModal(a); });
    tbody.appendChild(tr);
  })
}

function populateNames(){
  const dl = document.querySelector('#names-list');
  if(!dl) return;
  dl.innerHTML = '';
  ALUNOS.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.nome;
    dl.appendChild(opt);
  });
}

function escapeHtml(s){
  return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

function applyListenersState(){
  const search = document.querySelector('#search');
  const debounce = debounceFn(()=> refreshList(), 300);
  search.addEventListener('input', debounce);

  document.querySelector('#filter-turma').addEventListener('change', refreshList);
  document.querySelector('#filter-status').addEventListener('change', refreshList);
  document.querySelector('#sort').addEventListener('change', (e)=>{
    localStorage.setItem('sort', e.target.value);
    sortAndRender();
  });

  document.querySelector('#btn-new-aluno').addEventListener('click', ()=> openAlunoModal());
  document.querySelector('#export-csv').addEventListener('click', exportCSV);
  document.querySelector('#alunos-table').addEventListener('click', tableClick);

  // modal buttons
  document.querySelector('#save-aluno').addEventListener('click', saveAluno);
  document.querySelector('#close-aluno').addEventListener('click', closeAlunoModal);
}

function tableClick(e){
  const id = e.target.dataset.id;
  if(!id) return;
  if(e.target.classList.contains('btn-edit')) return editAluno(id);
  if(e.target.classList.contains('btn-delete')) return deleteAluno(id);
  if(e.target.classList.contains('btn-matricular')) return matricularAlunoUI(id);
}

async function editAluno(id){
  const aluno = ALUNOS.find(a=>a.id==id);
  if(!aluno) return showMessage('Aluno não encontrado', true);
  openAlunoModal(aluno);
}

function openAlunoModal(aluno){
  const dlg = document.querySelector('#modal-aluno');
  // prefill
  document.querySelector('#aluno-nome').value = aluno?.nome||'';
  document.querySelector('#aluno-data').value = aluno?.data_nascimento||'';
  document.querySelector('#aluno-email').value = aluno?.email||'';
  document.querySelector('#aluno-status').value = aluno?.status||'inativo';
  // if turma_id present, try to find turma name
  if(aluno?.turma_id){
    const t = TURMAS.find(x=>x.id===aluno.turma_id);
    document.querySelector('#aluno-turma').value = t? t.id : '';
  } else {
    document.querySelector('#aluno-turma').value = '';
  }
  dlg.dataset.editId = aluno?.id || '';
  dlg.showModal();
  document.querySelector('#aluno-nome').focus();
}

// fechar modal com Esc e restaurar foco
let lastFocused = null;
document.addEventListener('focusin', (e)=>{ lastFocused = e.target; });
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){
    const dlg = document.querySelector('#modal-aluno');
    if(dlg && dlg.open){ dlg.close(); if(lastFocused) lastFocused.focus(); }
  }
});

function closeAlunoModal(){
  const dlg = document.querySelector('#modal-aluno');
  dlg.close();
  dlg.dataset.editId = '';
}

function debounceFn(fn, wait){
  let t;
  return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), wait); }
}

function showMessage(msg, isError=false){
  const live = document.querySelector('#status-msg');
  if(live){
    live.textContent = msg;
    live.setAttribute('aria-live', isError? 'assertive' : 'polite');
  }
  // toast
  const to = document.createElement('div');
  to.className = 'toast' + (isError? ' error':'');
  to.textContent = msg;
  document.body.appendChild(to);
  setTimeout(()=> to.classList.add('visible'), 10);
  setTimeout(()=>{ to.classList.remove('visible'); setTimeout(()=>to.remove(),300); }, 3500);
}

async function saveAluno(e){
  e.preventDefault();
  const dlg = document.querySelector('#modal-aluno');
  const id = dlg.dataset.editId;
  const nome = document.querySelector('#aluno-nome').value.trim();
  const data = document.querySelector('#aluno-data').value;
  const email = document.querySelector('#aluno-email').value.trim() || null;
  const status = document.querySelector('#aluno-status').value;
  const turma_id = document.querySelector('#aluno-turma').value || null;

  // validações client-side
  if(nome.length < 3 || nome.length > 80) return showMessage('Nome inválido (3-80)', true);
  if(!data) return showMessage('Data de nascimento obrigatória', true);
  const idade = calcAge(data);
  if(idade < 5) return showMessage('Aluno deve ter pelo menos 5 anos', true);
  if(email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showMessage('Email inválido', true);

  const payload = { nome, data_nascimento: data, email, status, turma_id: turma_id? Number(turma_id): null };

  try{
    let res;
    if(id){
      res = await fetch(`/alunos/${id}`, { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    }else{
      res = await fetch('/alunos', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    }
    if(!res.ok){
      const err = await res.json().catch(()=>({detail:'Erro'}));
      showMessage(err.detail || 'Erro ao salvar', true);
      return;
    }
    showMessage('Aluno salvo com sucesso');
    closeAlunoModal();
    await refreshList();
  }catch(err){
    showMessage('Erro de rede', true);
  }
}

function calcAge(dateStr){
  const dob = new Date(dateStr);
  const diff = Date.now() - dob.getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return age;
}

async function deleteAluno(id){
  if(!confirm('Confirma exclusão do aluno?')) return;
  try{
    const res = await fetch(`/alunos/${id}`, { method: 'DELETE' });
    if(!res.ok) return showMessage('Erro ao apagar', true);
    showMessage('Aluno apagado');
    await refreshList();
  }catch(e){ showMessage('Erro de rede', true); }
}

async function matricularAlunoUI(id){
  const turmaOptions = TURMAS.map(t => `${t.id}: ${t.nome}`).join('\n');
  const escolha = prompt('Informe o id da turma para matricular:\n' + turmaOptions);
  if(!escolha) return;
  const turma_id = Number(escolha);
  if(!TURMAS.find(t=>t.id===turma_id)) return showMessage('Turma inválida', true);
  try{
    const res = await fetch('/matriculas', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ aluno_id: Number(id), turma_id }) });
    if(!res.ok){ const err = await res.json().catch(()=>({detail:'Erro'})); showMessage(err.detail || 'Erro na matrícula', true); return; }
    showMessage('Matrícula realizada');
    await refreshList();
  }catch(e){ showMessage('Erro de rede', true); }
}

function exportCSV(){
  if(!ALUNOS.length) return showMessage('Nenhum aluno para exportar', true);
  const rows = [['nome','data_nascimento','email','status','turma']];
  ALUNOS.forEach(a=>{
    const turma = TURMAS.find(t=>t.id===a.turma_id);
    rows.push([a.nome, a.data_nascimento, a.email||'', a.status, turma?turma.nome:'']);
  });
  const csv = rows.map(r => r.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'alunos.csv'; a.click(); URL.revokeObjectURL(url);
  showMessage('CSV exportado');
}

// util: export JSON
function exportJSON(){
  const data = JSON.stringify(ALUNOS, null, 2);
  const blob = new Blob([data], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'alunos.json'; a.click(); URL.revokeObjectURL(url);
  showMessage('JSON exportado');
}

// inicializa
window.addEventListener('DOMContentLoaded', load);

// Accessibility: allow Enter on table buttons when focused
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' && document.activeElement && document.activeElement.dataset && document.activeElement.dataset.id){
    document.activeElement.click();
  }
});
