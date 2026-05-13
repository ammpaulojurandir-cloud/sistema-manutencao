const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { runSimulation } = require('./SIMULADOR_CICLO_OS_500');
const repoRoot = path.join(__dirname, '..');

function carregarBase() {
  const codigo = fs.readFileSync(path.join(repoRoot, 'dados_unidades_hidraulicas_gman.js'), 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(codigo, sandbox, { filename: 'dados_unidades_hidraulicas_gman.js' });
  return sandbox.window.GMAN_UNIDADES_HIDRAULICAS_BASE;
}

function gerarEquipamentosOficiaisSinteticos(total = 214) {
  const sistemas = ['100', '200', '300', '400', '600', '700'];
  const brutas = { '100': '101', '200': '201', '300': '301', '400': '401', '600': '601', '700': '701' };
  const lista = [];
  for (let i = 0; i < total; i++) {
    const sistema = sistemas[i % sistemas.length];
    const prefixo = i < sistemas.length ? brutas[sistema] : sistema.slice(0, 1) + String(i + 10).padStart(2, '0');
    lista.push({ id: `${prefixo}-GMAN-${String(i + 1).padStart(3, '0')}`, systemCode: sistema, status: i % 17 === 0 ? 'down' : i % 5 === 0 ? 'alert' : 'ok' });
  }
  return lista;
}

function contarTotalizadores(equipamentos, reservatorios) {
  const sistemas = ['100', '200', '300', '400', '600', '700'];
  const brutas = ['101', '201', '301', '401', '601', '701'];
  const base = equipamentos.filter(e => sistemas.includes(String(e.systemCode)));
  const resultado = {
    all: base.length,
    brutas: base.filter(e => brutas.includes(String(e.id).split('-')[0])).length,
    reservatorios: reservatorios.length
  };
  sistemas.forEach(s => { resultado[s] = base.filter(e => String(e.systemCode) === s).length; });
  return resultado;
}

function validarIndex(base) {
  const html = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
  const htmlCompacto = html.replace(/\s+/g, '');
  const falhas = [];
  const ordem = ['all', '100', '200', '300', '400', '600', '700', 'brutas', 'reservatorios'];
  const inicioFiltro = html.indexOf('<div class="systems-filter">');
  const fimFiltro = html.indexOf('<div id="apiStatus"', inicioFiltro);
  const blocoFiltro = inicioFiltro >= 0 && fimFiltro > inicioFiltro ? html.slice(inicioFiltro, fimFiltro) : html;
  const pos = ordem.map(f => blocoFiltro.indexOf(`data-system-filter="${f}"`));
  if (pos.some(p => p < 0)) falhas.push('Nem todos os botões principais existem.');
  for (let i = 1; i < pos.length; i++) if (pos[i] < pos[i - 1]) falhas.push('Ordem dos botões principais divergente.');
  if (!html.includes('RESERVATÓRIOS')) falhas.push('Botão RESERVATÓRIOS ausente.');
  if (!/data-system-filter="reservatorios"[^>]*abrirPainelReservatoriosGMAN104/.test(blocoFiltro)) falhas.push('Botão RESERVATÓRIOS não abre painel/modal próprio.');
  if (/class="systems-totalizadores"/.test(html)) falhas.push('Bloco systems-totalizadores recriado.');
  if (!html.includes('dados_unidades_hidraulicas_gman.js')) falhas.push('Base hidráulica validada não foi carregada no index.');
  if (!/function renderReservatoriosGMAN104/.test(html)) falhas.push('Renderização de reservatórios ausente.');
  if (!/function abrirPainelReservatoriosGMAN104/.test(html)) falhas.push('Painel/modal de reservatórios ausente.');
  if (!/function selecionarSistemaReservatoriosGMAN104/.test(html)) falhas.push('Seleção de reservatórios por sistema ausente.');
  if (!/function abrirReservatorioGMAN104/.test(html)) falhas.push('Ficha técnica de reservatório ausente.');
  if (!/DIAGRAMA HIDRÁULICO/.test(html)) falhas.push('Previsão visual do diagrama hidráulico ausente.');
  if (!/function setHTMLSemPiscarGMAN104/.test(html) || !/function atualizarTelaSemPiscarGMAN104/.test(html)) falhas.push('Camada anti-piscada da atualização automática ausente.');
  if (!html.includes("setBtn('all'")) falhas.push('Totalizador do botão TODAS ausente.');
  if (!htmlCompacto.includes("['100','200','300','400','600','700'].forEach(c=>setBtn(c,")) falhas.push('Totalizadores dos sistemas 100-700 ausentes.');
  if (!html.includes("setBtn('brutas'")) falhas.push('Totalizador do botão BRUTAS ausente.');
  if (!html.includes("setBtn('reservatorios'")) falhas.push('Totalizador do botão RESERVATÓRIOS ausente.');
  if (!/Fechar/.test(html) || !/Voltar|Cancelar/.test(html)) falhas.push('Padrão VOLTAR/FECHAR não encontrado.');
  const botoesVazios = [...html.matchAll(/<button\b[^>]*>\s*<\/button>/g)];
  if (botoesVazios.length) falhas.push('Há botão visível vazio.');
  const resInvalidos = base.reservatorios.filter(r => r.TIPO_UNIDADE !== 'RES');
  if (resInvalidos.length) falhas.push('Aba RESERVATORIOS possui tipo diferente de RES.');
  const bombeamentoInvalidos = base.estacoesBombeamento.filter(r => !['EBAB', 'EBAT', 'IN LINE'].includes(r.TIPO_UNIDADE));
  if (bombeamentoInvalidos.length) falhas.push('Aba ESTACOES_BOMBEAMENTO possui tipo inválido.');
  if (base.unidades.some(u => /\bVRP\b/i.test([u.TIPO_UNIDADE, u.NOME_UNIDADE, u.ORIGEM_DESENHO].join(' ')))) falhas.push('VRP apareceu na base principal.');
  if (base.unidades.some(u => String(u.SISTEMA) === '500')) falhas.push('Sistema 500 apareceu na base hidráulica.');
  const reservatorios = base.reservatorios.filter(r => r.TIPO_UNIDADE === 'RES');
  if (reservatorios.some(r => !['100', '200', '300', '400', '600', '700'].includes(String(r.SISTEMA)))) falhas.push('Reservatório com sistema inválido.');
  if (reservatorios.some(r => /\b(VRP|EBAB|EBAT|ETA|IN LINE)\b/i.test(String(r.TIPO_UNIDADE)))) falhas.push('Filtro RESERVATÓRIOS contém tipo indevido.');
  if (reservatorios.some(r => !String(r.CAPACIDADE_M3 || '').trim())) falhas.push('Reservatório sem capacidade padronizada ou pendência explícita.');
  return falhas;
}

function runSandbox() {
  const base = carregarBase();
  const equipamentos = gerarEquipamentosOficiaisSinteticos(214);
  const reservatorios = base.reservatorios.filter(r => r.TIPO_UNIDADE === 'RES');
  const totalizadores = contarTotalizadores(equipamentos, reservatorios);
  const falhas = [];
  Object.entries(totalizadores).forEach(([filtro, total]) => {
    if (total <= 0) falhas.push(`Totalizador sem dados: ${filtro}`);
  });
  falhas.push(...validarIndex(base));

  const sim500 = runSimulation(500);
  if (sim500.failures) falhas.push(`Simulador 500 falhou: ${sim500.failures}`);

  const sim100 = runSimulation(100);
  if (sim100.failures) falhas.push(`Sandbox 100 OS falhou: ${sim100.failures}`);

  const resultado = {
    totalOSSimuladas: 500,
    totalOSSandbox: 100,
    totalizadores,
    botaoReservatorios: totalizadores.reservatorios === reservatorios.length,
    falhasCriticasFinais: falhas.length,
    falhasPermissaoFinais: sim500.falhas.filter(f => String(f[0]).includes('permissao')).length,
    falhasStatusFinais: sim500.falhas.filter(f => String(f[0]).includes('status')).length,
    falhasConcordanciaFinais: sim500.falhas.filter(f => String(f[0]).includes('concordancia')).length,
    falhasRetornoOperandoFinais: sim500.falhas.filter(f => String(f[0]).includes('retorno')).length,
    falhasTotalizadorFinais: falhas.filter(f => String(f).includes('Totalizador')).length,
    falhasBotaoReservatoriosFinais: falhas.filter(f => String(f).includes('RESERVAT')).length,
    falhasVoltarFecharFinais: falhas.filter(f => String(f).includes('VOLTAR') || String(f).includes('FECHAR')).length,
    falhas
  };
  fs.writeFileSync(path.join(repoRoot, 'docs', 'homologacao', 'RELATORIO_HOMOLOGACAO_RESERVATORIOS_GMAN.txt'), JSON.stringify(resultado, null, 2), 'utf8');
  return resultado;
}

if (require.main === module) {
  const resultado = runSandbox();
  console.log(JSON.stringify(resultado, null, 2));
  if (resultado.falhasCriticasFinais) process.exit(1);
}

module.exports = { runSandbox };
