const fs = require('fs');
const path = require('path');
const vm = require('vm');

function carregarBase() {
  const codigo = fs.readFileSync(path.join(__dirname, 'dados_unidades_hidraulicas_gman.js'), 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(codigo, sandbox, { filename: 'dados_unidades_hidraulicas_gman.js' });
  return sandbox.window.GMAN_UNIDADES_HIDRAULICAS_BASE;
}

function normalizar(v) {
  return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function criarMotorOS(unidades) {
  const os = [];
  const statusEquip = new Map(unidades.map(u => [u.ID_UNIDADE, 'Operando']));
  const historico = [];
  const seq = new Map();

  function podeAtuar(usuario, ordem) {
    return usuario.perfil === 'gestao' || normalizar(usuario.nome) === normalizar(ordem.responsavel);
  }
  function ativas(id) {
    return os.filter(o => o.idUnidade === id && !['Concluida', 'Cancelada'].includes(o.status));
  }
  function abrir(unidade, usuario, criticidade) {
    if (ativas(unidade.ID_UNIDADE).some(o => normalizar(o.responsavel) === normalizar(usuario.nome))) {
      return { ok: false, erro: 'OS duplicada proibida para mesmo responsavel' };
    }
    const base = unidade.ID_UNIDADE;
    const n = (seq.get(base) || 0) + 1;
    seq.set(base, n);
    const ordem = {
      idOS: `${base}.${String(n).padStart(2, '0')}`,
      idUnidade: base,
      tipoUnidade: unidade.TIPO_UNIDADE,
      origemDesenho: unidade.ORIGEM_DESENHO,
      sistema: unidade.SISTEMA,
      responsavel: usuario.nome,
      status: 'Aberta',
      criticidade,
      condicao: '',
      historico: ['abertura']
    };
    os.push(ordem);
    historico.push(['abrir', ordem.idOS]);
    return { ok: true, ordem };
  }
  function iniciar(ordem, usuario, condicao, justificativa) {
    if (!podeAtuar(usuario, ordem)) return { ok: false, erro: 'permissao' };
    if (!condicao || !justificativa) return { ok: false, erro: 'condicao obrigatoria' };
    ordem.status = 'Em execucao';
    ordem.condicao = condicao;
    ordem.historico.push('inicio');
    statusEquip.set(ordem.idUnidade, condicao);
    return { ok: true };
  }
  function andamento(ordem, usuario, texto) {
    if (!podeAtuar(usuario, ordem)) return { ok: false, erro: 'permissao' };
    if (!texto) return { ok: false, erro: 'andamento vazio' };
    ordem.status = 'Em andamento';
    ordem.historico.push('andamento');
    return { ok: true };
  }
  function pendencia(ordem, usuario) {
    if (!podeAtuar(usuario, ordem)) return { ok: false, erro: 'permissao' };
    ordem.status = 'Aguardando material';
    ordem.historico.push('pendencia');
    statusEquip.set(ordem.idUnidade, 'Aguardando material');
    return { ok: true };
  }
  function redistribuir(ordem, gestor, novoResponsavel) {
    if (gestor.perfil !== 'gestao') return { ok: false, erro: 'permissao' };
    ordem.responsavel = novoResponsavel.nome;
    ordem.historico.push('redistribuicao');
    return { ok: true };
  }
  function cancelar(ordem, gestor, motivo) {
    if (gestor.perfil !== 'gestao' || !motivo) return { ok: false, erro: 'cancelamento invalido' };
    ordem.status = 'Cancelada';
    ordem.historico.push('cancelamento');
    if (!ativas(ordem.idUnidade).length) statusEquip.set(ordem.idUnidade, 'Operando');
    return { ok: true };
  }
  function concluir(ordem, usuario, condicaoFinal) {
    if (!podeAtuar(usuario, ordem)) return { ok: false, erro: 'permissao' };
    if (!condicaoFinal) return { ok: false, erro: 'condicao final obrigatoria' };
    ordem.status = 'Concluida';
    ordem.historico.push('conclusao');
    const restantes = ativas(ordem.idUnidade);
    if (!restantes.length) statusEquip.set(ordem.idUnidade, condicaoFinal);
    return { ok: true, restantes: restantes.length };
  }
  function reabrir(ordem) {
    return ordem.status === 'Concluida' ? { ok: false, erro: 'reabertura bloqueada' } : { ok: true };
  }
  return { os, statusEquip, abrir, iniciar, andamento, pendencia, redistribuir, cancelar, concluir, reabrir };
}

function runSimulation(totalCycles = 500) {
  const base = carregarBase();
  const unidadesBase = base.unidades.filter(u => ['EBAB', 'EBAT', 'ETA', 'RES', 'IN LINE'].includes(u.TIPO_UNIDADE));
  const porSistema = ['100', '200', '300', '400', '600', '700'].map(s => unidadesBase.filter(u => u.SISTEMA === s));
  const unidades = [];
  for (let pos = 0; pos < Math.max(...porSistema.map(g => g.length)); pos++) {
    porSistema.forEach(grupo => { if (grupo[pos]) unidades.push(grupo[pos]); });
  }
  const perfis = [
    { nome: 'GESTAO GMAN', perfil: 'gestao' },
    { nome: 'LIDER MECANICA', perfil: 'lider' },
    { nome: 'LIDER ELETRICA', perfil: 'lider' },
    { nome: 'LIDER CALDEIRARIA', perfil: 'lider' },
    { nome: 'LIDER USINAGEM', perfil: 'lider' }
  ];
  const criticidades = ['baixa', 'media', 'alta', 'critica'];
  const condicoes = ['Em manutencao (operando)', 'Em manutencao (parado)', 'Parado', 'Aguardando material'];
  const falhas = [];
  const cobertura = { perfis: new Set(), sistemas: new Set(), tipos: new Set(), origens: new Set(), criticidades: new Set(), sequencias: new Set() };
  const motor = criarMotorOS(unidades);

  let criadas = 0;
  for (let i = 0; criadas < totalCycles; i++) {
    const unidade = unidades[i % unidades.length];
    const responsavel = perfis[(i % (perfis.length - 1)) + 1];
    const gestao = perfis[0];
    const criticidade = criticidades[i % criticidades.length];
    const inicial = motor.statusEquip.get(unidade.ID_UNIDADE);
    const abertura = motor.abrir(unidade, responsavel, criticidade);
    if (!abertura.ok) { falhas.push(['abertura', abertura.erro, unidade.ID_UNIDADE]); continue; }
    criadas++;
    const ordem = abertura.ordem;
    cobertura.perfis.add(responsavel.perfil);
    cobertura.perfis.add(gestao.perfil);
    cobertura.sistemas.add(unidade.SISTEMA);
    cobertura.tipos.add(unidade.TIPO_UNIDADE);
    cobertura.origens.add(unidade.ORIGEM_DESENHO);
    cobertura.criticidades.add(criticidade);
    cobertura.sequencias.add(ordem.idOS.split('.').pop());

    if (motor.statusEquip.get(unidade.ID_UNIDADE) !== inicial) falhas.push(['status abertura', ordem.idOS]);
    if (motor.abrir(unidade, responsavel, criticidade).ok) falhas.push(['duplicidade permitida', ordem.idOS]);
    const invasor = perfis.find(p => p.perfil === 'lider' && p.nome !== responsavel.nome);
    if (motor.iniciar(ordem, invasor, condicoes[i % condicoes.length], 'teste indevido').ok) falhas.push(['permissao lider fora', ordem.idOS]);
    const inicio = motor.iniciar(ordem, responsavel, condicoes[i % condicoes.length], 'justificativa operacional');
    if (!inicio.ok) falhas.push(['inicio', inicio.erro, ordem.idOS]);
    if (motor.statusEquip.get(unidade.ID_UNIDADE) !== condicoes[i % condicoes.length]) falhas.push(['status inicio', ordem.idOS]);
    if (!motor.andamento(ordem, responsavel, 'andamento registrado').ok) falhas.push(['andamento', ordem.idOS]);
    if (i % 7 === 0 && !motor.pendencia(ordem, responsavel).ok) falhas.push(['pendencia', ordem.idOS]);
    if (i % 11 === 0 && !motor.redistribuir(ordem, gestao, responsavel).ok) falhas.push(['redistribuicao', ordem.idOS]);
    if (i % 13 === 0) {
      const cancelada = motor.cancelar(ordem, gestao, 'cancelamento controlado');
      if (!cancelada.ok) falhas.push(['cancelamento', ordem.idOS]);
    } else {
      const fim = motor.concluir(ordem, responsavel, 'Operando');
      if (!fim.ok) falhas.push(['conclusao', fim.erro, ordem.idOS]);
      if (motor.reabrir(ordem).ok) falhas.push(['reabertura permitida', ordem.idOS]);
    }
  }

  for (let g = 0; g < 20; g++) {
    const unidade = unidades[(g * 5) % unidades.length];
    const responsaveis = perfis.slice(1, 4);
    const abertas = responsaveis.map((r, idx) => motor.abrir(unidade, r, criticidades[idx]));
    if (abertas.some(a => !a.ok)) falhas.push(['vinculada abertura', unidade.ID_UNIDADE]);
    abertas.forEach(a => a.ok && cobertura.sequencias.add(a.ordem.idOS.split('.').pop()));
    abertas.forEach((a, idx) => a.ok && motor.iniciar(a.ordem, responsaveis[idx], condicoes[idx], 'inicio vinculada'));
    const primeira = abertas[0].ordem;
    motor.concluir(primeira, responsaveis[0], 'Operando');
    if (motor.statusEquip.get(unidade.ID_UNIDADE) === 'Operando') falhas.push(['retorno indevido operando com OS vinculada aberta', unidade.ID_UNIDADE]);
    abertas.slice(1).forEach((a, idx) => motor.concluir(a.ordem, responsaveis[idx + 1], 'Operando'));
    if (motor.statusEquip.get(unidade.ID_UNIDADE) !== 'Operando') falhas.push(['concordancia final', unidade.ID_UNIDADE]);
  }

  const requisitos = [
    ['perfis', ['gestao', 'lider']],
    ['sistemas', ['100', '200', '300', '400', '600', '700']],
    ['tipos', ['EBAB', 'EBAT', 'ETA', 'RES', 'IN LINE']],
    ['origens', ['EBAT/RES', 'ETA/RES']],
    ['criticidades', criticidades],
    ['sequencias', ['01', '02', '03']]
  ];
  requisitos.forEach(([nome, esperados]) => esperados.forEach(v => {
    if (!cobertura[nome].has(v)) falhas.push(['cobertura', nome, v]);
  }));

  return {
    totalCycles,
    fullOk: totalCycles - falhas.length,
    failures: falhas.length,
    risk: falhas.length ? 'ALTO' : 'BAIXO',
    totalOSSimuladas: motor.os.length,
    cobertura: Object.fromEntries(Object.entries(cobertura).map(([k, v]) => [k, Array.from(v).sort()])),
    falhas
  };
}

if (require.main === module) {
  const resultado = runSimulation(500);
  console.log(JSON.stringify(resultado, null, 2));
  if (resultado.failures) process.exit(1);
}

module.exports = { runSimulation };
