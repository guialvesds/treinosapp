/* ========================================
   FitTrack - Script JavaScript
   Aplicação para gerenciamento de treinos
   ======================================== */

// --- Variáveis Globais ---
let treinos = [];
let treinoAtualId = null;
let exercicioAtualId = null;
let itemAExcluir = null;

// --- Elementos do DOM ---
const telaInicial = document.getElementById('tela-inicial');
const telaCriarTreino = document.getElementById('tela-criar-treino');
const telaTreino = document.getElementById('tela-treino');
const telaCriarExercicio = document.getElementById('tela-criar-exercicio');
const listaTreinos = document.getElementById('lista-treinos');
const listaExercicios = document.getElementById('lista-exercicios');
const tituloTreino = document.getElementById('titulo-treino');
const modalConfirmacao = document.getElementById('modal-confirmacao');
const modalMensagem = document.getElementById('modal-mensagem');

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
  carregarDados();
  configurarEventos();
  renderizarTreinos();
});

// --- Funções de Carregamento e Persistência ---
function carregarDados() {
  const dados = localStorage.getItem('fittrack_treinos');
  if (dados) {
    treinos = JSON.parse(dados);
  } else {
    treinos = [];
  }
}

function salvarDados() {
  localStorage.setItem('fittrack_treinos', JSON.stringify(treinos));
}

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// --- Navegação entre Telas ---
function mostrarTela(tela) {
  // Ocultar todas as telas
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
  // Mostrar tela selecionada
  tela.classList.add('ativa');
}

function voltarTelaInicial() {
  mostrarTela(telaInicial);
  renderizarTreinos();
}

function voltarTelaTreino() {
  mostrarTela(telaTreino);
  renderizarExercicios(treinoAtualId);
}

// --- Configuração de Eventos ---
function configurarEventos() {
  // Botão adicionar treino
  document.getElementById('btn-adicionar-treino').addEventListener('click', () => {
    mostrarTela(telaCriarTreino);
    document.getElementById('nome-treino').value = '';
    document.getElementById('nome-treino').focus();
  });

  // Botão salvar treino
  document.getElementById('btn-salvar-treino').addEventListener('click', salvarTreino);

  // Enter no campo de treino
  document.getElementById('nome-treino').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') salvarTreino();
  });

  // Botão adicionar exercício
  document.getElementById('btn-adicionar-exercicio').addEventListener('click', () => {
    mostrarTela(telaCriarExercicio);
    limparFormularioExercicio();
  });

  // Botão salvar exercício
  document.getElementById('btn-salvar-exercicio').addEventListener('click', salvarExercicio);

  // Enter nos campos de exercício
  document.getElementById('nome-exercicio').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') salvarExercicio();
  });

  // Modal de confirmação
  document.getElementById('btn-cancelar-excluir').addEventListener('click', () => {
    modalConfirmacao.classList.remove('ativo');
    itemAExcluir = null;
  });

  document.getElementById('btn-confirmar-excluir').addEventListener('click', confirmarExclusao);
}

// --- Funções de Treinos ---
function salvarTreino() {
  const nome = document.getElementById('nome-treino').value.trim();
  
  if (!nome) {
    alert('Por favor, digite um nome para o treino.');
    return;
  }

  const novoTreino = {
    id: gerarId(),
    nome: nome,
    exercicios: []
  };

  treinos.push(novoTreino);
  salvarDados();
  voltarTelaInicial();
}

function renderizarTreinos() {
  if (treinos.length === 0) {
    listaTreinos.innerHTML = `
      <div class="mensagem-vazia">
        <span>🏋️</span>
        <p>Nenhum treino cadastrado.<br>Clique no botão abaixo para criar seu primeiro treino!</p>
      </div>
    `;
    return;
  }

  listaTreinos.innerHTML = treinos.map(treino => {
    const totalExercicios = treino.exercicios.length;
    const concluidos = treino.exercicios.filter(e => e.concluido).length;
    const expandido = treino.expandido;
    return `
      <div class="card-treino">
        <div class="card-treino-info" onclick="abrirTreino('${treino.id}')">
          <div class="card-treino-nome">${treino.nome}</div>
          <p>${totalExercicios} exercício${totalExercicios !== 1 ? 's' : ''} • ${concluidos} concluído${concluidos !== 1 ? 's' : ''}</p>
        </div>
        <div class="card-treino-acoes">
          <button class="btn-card btn-expandir" onclick="event.stopPropagation();toggleExpandirTreino('${treino.id}')">${expandido ? '−' : '+'}</button>
          <button class="btn-card btn-abrir" onclick="abrirTreino('${treino.id}')">Abrir</button>
          <button class="btn-card btn-excluir" onclick="solicitarExclusaoTreino('${treino.id}')">🗑️</button>
        </div>
      </div>
      <div class="treino-expandido" style="display:${expandido ? 'block' : 'none'};margin-bottom:8px;">${expandido ? renderizarExerciciosInline(treino) : ''}</div>
    `;
  }).join('');

  // Reanexar evento do botão adicionar treino
  const btnAddTreino = document.getElementById('btn-adicionar-treino');
  if (btnAddTreino) {
    btnAddTreino.onclick = () => {
      mostrarTela(telaCriarTreino);
      document.getElementById('nome-treino').value = '';
      document.getElementById('nome-treino').focus();
    };
  }
}

// Renderiza exercícios inline para o modo expandido
function renderizarExerciciosInline(treino) {
  if (!treino.exercicios.length) {
    return `<div class='mensagem-vazia'><span>💪</span><p>Nenhum exercício cadastrado.</p></div>`;
  }
  return treino.exercicios.map(exercicio => {
    const totalSeries = exercicio.series;
    const concluidas = exercicio.progresso.filter(r => r >= exercicio.reps).length;
    const porcentagem = Math.round((concluidas / totalSeries) * 100);
    return `
      <div class="card-exercicio card-exercicio-mini ${exercicio.concluido ? 'concluido' : ''}" style="margin-top:8px;">
        <div class="exercicio-cabecalho">
          <span class="exercicio-nome">${exercicio.nome}</span>
          <span class="exercicio-status">${porcentagem}%</span>
        </div>
      </div>
    `;
  }).join('');
}

function toggleExpandirTreino(treinoId) {
  const treino = treinos.find(t => t.id === treinoId);
  if (!treino) return;
  treino.expandido = !treino.expandido;
  salvarDados();
  renderizarTreinos();
}

window.toggleExpandirTreino = toggleExpandirTreino;


function abrirTreino(id) {
  const treino = treinos.find(t => t.id === id);
  if (!treino) return;

  treinoAtualId = id;
  tituloTreino.textContent = treino.nome;
  renderizarExercicios(id);
  mostrarTela(telaTreino);
}

function solicitarExclusaoTreino(id) {
  const treino = treinos.find(t => t.id === id);
  if (!treino) return;

  itemAExcluir = { tipo: 'treino', id: id };
  modalMensagem.textContent = `Deseja excluir o treino "${treino.nome}"?`;
  modalConfirmacao.classList.add('ativo');
}

function solicitarExclusaoExercicio(treinoId, exercicioId) {
  const treino = treinos.find(t => t.id === treinoId);
  if (!treino) return;

  const exercicio = treino.exercicios.find(e => e.id === exercicioId);
  if (!exercicio) return;

  itemAExcluir = { tipo: 'exercicio', treinoId: treinoId, exercicioId: exercicioId };
  modalMensagem.textContent = `Deseja excluir o exercício "${exercicio.nome}"?`;
  modalConfirmacao.classList.add('ativo');
}

function confirmarExclusao() {
  if (!itemAExcluir) return;

  if (itemAExcluir.tipo === 'treino') {
    treinos = treinos.filter(t => t.id !== itemAExcluir.id);
    salvarDados();
    renderizarTreinos();
  } else if (itemAExcluir.tipo === 'exercicio') {
    const treino = treinos.find(t => t.id === itemAExcluir.treinoId);
    if (treino) {
      treino.exercicios = treino.exercicios.filter(e => e.id !== itemAExcluir.exercicioId);
      salvarDados();
      renderizarExercicios(itemAExcluir.treinoId);
    }
  }

  modalConfirmacao.classList.remove('ativo');
  itemAExcluir = null;
}

// --- Funções de Exercícios ---
function limparFormularioExercicio() {
  document.getElementById('nome-exercicio').value = '';
  document.getElementById('num-series').value = '3';
  document.getElementById('num-reps').value = '12';
  document.getElementById('nome-exercicio').focus();
}

function salvarExercicio() {
  const nome = document.getElementById('nome-exercicio').value.trim();
  const series = parseInt(document.getElementById('num-series').value) || 3;
  const reps = parseInt(document.getElementById('num-reps').value) || 12;

  if (!nome) {
    alert('Por favor, digite um nome para o exercício.');
    return;
  }

  const treino = treinos.find(t => t.id === treinoAtualId);
  if (!treino) return;

  const novoExercicio = {
    id: gerarId(),
    nome: nome,
    series: series,
    reps: reps,
    progresso: new Array(series).fill(0),
    concluido: false
  };

  treino.exercicios.push(novoExercicio);
  salvarDados();
  voltarTelaTreino();
}

function renderizarExercicios(treinoId) {
  const treino = treinos.find(t => t.id === treinoId);
  if (!treino) return;

  if (treino.exercicios.length === 0) {
    listaExercicios.innerHTML = `
      <div class="mensagem-vazia">
        <span>💪</span>
        <p>Nenhum exercício cadastrado.<br>Clique no botão abaixo para adicionar um exercício!</p>
      </div>
    `;
    return;
  }

  listaExercicios.innerHTML = treino.exercicios.map(exercicio => {
    const statusClass = exercicio.concluido ? 'concluido' : 'em-andamento';
    // Calcular porcentagem de conclusão
    const totalSeries = exercicio.series;
    const concluidas = exercicio.progresso.filter(r => r >= exercicio.reps).length;
    const porcentagem = Math.round((concluidas / totalSeries) * 100);
    return `
      <div class="card-exercicio ${exercicio.concluido ? 'concluido' : ''}">
        <div class="exercicio-cabecalho">
          <span class="exercicio-nome">${exercicio.nome}</span>
          <span class="exercicio-status ${statusClass}">${porcentagem}%</span>
        </div>
        <div class="exercicio-series">
          ${exercicio.progresso.map((reps, index) => `
            <div class="serie-item">
              <div class="serie-info">
                <input type="checkbox" class="serie-checkbox" id="serie-checkbox-${exercicio.id}-${index}" onchange="marcarSerieConcluida('${treinoId}', '${exercicio.id}', ${index}, this.checked)" ${reps >= exercicio.reps ? 'checked' : ''}>
                <label for="serie-checkbox-${exercicio.id}-${index}" style="margin-right:8px;"></label>
                <span class="serie-numero">Série ${index + 1}:</span>
                <span class="serie-contador ${reps >= exercicio.reps ? 'concluido' : ''}">${reps}/${exercicio.reps}</span>
              </div>
              <div class="serie-botoes">
                <button class="btn-serie btn-menos" onclick="atualizarRep('${treinoId}', '${exercicio.id}', ${index}, -1)">−</button>
                <button class="btn-serie btn-mais" onclick="atualizarRep('${treinoId}', '${exercicio.id}', ${index}, 1)" ${reps >= exercicio.reps ? 'disabled' : ''}>+</button>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="exercicio-footer" style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
          <button class="btn-card btn-relogio" onclick="iniciarDescanso('${treinoId}', '${exercicio.id}')" style="padding: 8px 12px; font-size: 14px;">⏰ Descanso</button>
          <span id="timer-${exercicio.id}" class="timer-descanso" style="margin-left: 10px;"></span>
          <button class="btn-card btn-excluir" onclick="solicitarExclusaoExercicio('${treinoId}', '${exercicio.id}')" style="padding: 8px 12px; font-size: 12px;">🗑️ Excluir</button>
        </div>
      </div>
    `;
  }).join('');
}

// Relógio de descanso de 2 minutos
let timerInterval = null;
function iniciarDescanso(treinoId, exercicioId) {
  const timerSpan = document.getElementById(`timer-${exercicioId}`);
  if (!timerSpan) return;
  let tempo = 120; // 2 minutos
  clearInterval(timerInterval);
  atualizarTimer(timerSpan, tempo);
  timerInterval = setInterval(() => {
    tempo--;
    atualizarTimer(timerSpan, tempo);
    if (tempo <= 0) {
      clearInterval(timerInterval);
      timerSpan.textContent = 'Descanso finalizado!';
      timerSpan.classList.add('timer-finalizado');
      setTimeout(() => { timerSpan.textContent = ''; timerSpan.classList.remove('timer-finalizado'); }, 4000);
    }
  }, 1000);
}

function atualizarTimer(span, tempo) {
  const min = Math.floor(tempo / 60);
  const seg = tempo % 60;
  span.textContent = `${min}:${seg.toString().padStart(2, '0')}`;
  span.classList.remove('timer-finalizado');
}

window.iniciarDescanso = iniciarDescanso;


function atualizarRep(treinoId, exercicioId, serieIndex, delta) {
  const treino = treinos.find(t => t.id === treinoId);
  if (!treino) return;
  const exercicio = treino.exercicios.find(e => e.id === exercicioId);
  if (!exercicio) return;
  const repsAtual = exercicio.progresso[serieIndex];
  const novasReps = repsAtual + delta;
  // Validar limites
  if (novasReps < 0) return;
  if (novasReps > exercicio.reps) return;
  exercicio.progresso[serieIndex] = novasReps;
  // Verificar se todas as séries foram concluídas
  const todasConcluidas = exercicio.progresso.every(reps => reps >= exercicio.reps);
  exercicio.concluido = todasConcluidas;
  salvarDados();
  renderizarExercicios(treinoId);
}

// Marcar série como concluída via checkbox
function marcarSerieConcluida(treinoId, exercicioId, serieIndex, checked) {
  const treino = treinos.find(t => t.id === treinoId);
  if (!treino) return;
  const exercicio = treino.exercicios.find(e => e.id === exercicioId);
  if (!exercicio) return;
  if (checked) {
    exercicio.progresso[serieIndex] = exercicio.reps;
  } else {
    exercicio.progresso[serieIndex] = 0;
  }
  // Verificar se todas as séries foram concluídas
  const todasConcluidas = exercicio.progresso.every(reps => reps >= exercicio.reps);
  exercicio.concluido = todasConcluidas;
  salvarDados();
  renderizarExercicios(treinoId);
}

window.marcarSerieConcluida = marcarSerieConcluida;

// --- Funções Globais (acessíveis via onclick) ---
window.voltarTelaInicial = voltarTelaInicial;
window.voltarTelaTreino = voltarTelaTreino;
window.abrirTreino = abrirTreino;
window.solicitarExclusaoTreino = solicitarExclusaoTreino;
window.solicitarExclusaoExercicio = solicitarExclusaoExercicio;
window.atualizarRep = atualizarRep;