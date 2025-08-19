const API = "/api"; // quando for rodar via uvicorn --app-dir backend, ajustar

async function fetchAlunos(params = {}){
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/alunos?${qs}`);
  return res.json();
}

async function load(){
  const alunos = await fetchAlunos();
  renderTable(alunos);
}

function renderTable(alunos){
  const tbody = document.querySelector('#alunos-table tbody');
  tbody.innerHTML = '';
  alunos.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${a.nome}</td>
      <td>${a.data_nascimento}</td>
      <td>${a.email||''}</td>
      <td>${a.status}</td>
      <td>${a.turma_id||''}</td>
      <td><button data-id="${a.id}" class="btn-edit">Editar</button></td>
    `;
    tbody.appendChild(tr);
  })
}

window.addEventListener('DOMContentLoaded', load);
