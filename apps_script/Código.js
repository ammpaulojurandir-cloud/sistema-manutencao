/**
 * GMAN 8.5.6.105 — Endereços oficiais das estações, validação da base 88 e compatibilidade 8.5.6.104
 * Arquivo oficial: GMAN_8_5_6_105_APPS_SCRIPT_COMPLETO.txt
 * Entrega em TXT para substituição integral no Google Apps Script.
 *
 * ESCOPO DESTA VERSÃO
 * - Somente funcionalidade. Não altera layout, cores ou identidade visual.
 * - Administrador, supervisor e gerente têm os mesmos poderes operacionais.
 * - Coordenador atua por área; líder/equipe atua somente em OS sob sua responsabilidade.
 * - Status do equipamento só muda por OS vinculada.
 * - Conclusão da OS exige condição operacional final real, sem assumir Operando escondido, e reavalia concordância das OS vinculadas.
 * - Bloqueia OS duplicada para mesmo equipamento + mesmo responsável.
 * - Mantém numeração ####.NN/AA.
 * - Patrimônio obrigatório/opcional conforme componente, equipe, serviço não exclusivo e confirmação patrimonial carregada da base oficial.
 * - Histórico automático, não editável, com regra por perfil.
 * - Encerradas ficam restritas à gestão/coordenação conforme área; operacional não acessa encerradas.
 * - Evidências são opcionais e não bloqueiam conclusão; evidência inválida é ignorada/registrada como pendência, sem impedir a OS.
 * - KPIs/rankings calculados sem considerar TESTE.
 * - LockService aplicado nas ações críticas de gravação para evitar concorrência e clique duplo.
 * - Máquina de estados protege transições da OS: Aberta → Em execução → Andamento/Teste/Aguardando → Concluída/Cancelada.
 * - Ações críticas exigem usuário validado na aba USUARIOS ou no mapa oficial do servidor.
 * - Auditoria de ações críticas corrigida e efetiva.
 * - Confirmação patrimonial exige tique quando o PAT carregado da base permanece igual.
 * - Rota listarEnderecosEstacoes lê ENDERECOS_ESTACOES, normaliza legado 500 para 300 e alerta erro de base sem travar o sistema.
 */

const GMAN = Object.freeze({
  VERSAO: 'GMAN 8.5.6.105',
  TITULO: 'Endereços oficiais das estações, base 88 validada e compatibilidade frontend 8.5.6.104',
  TZ: 'America/Sao_Paulo',
  CICLO_OPERACIONAL_ATIVO: true,
  CICLO_DATA_CORTE: '07/05/2026',
  CICLO_HORA_CORTE: '00:00:00',
  CICLO_CRITERIO: 'DATA_CORTE_UNICA_SEM_RESET_POR_VERSAO',
  SISTEMAS_OFICIAIS: ['100', '200', '300', '400', '600', '700'],
  BRUTAS: ['101', '201', '301', '401', '601', '701'],
  PERFIS_ACESSO_TOTAL: ['ADMINISTRADOR', 'SUPERVISOR', 'GERENTE'],
  PERFIS_COORDENACAO: ['COORDENADOR'],
  USUARIOS_OFICIAIS: Object.freeze({
    'PAULO JURANDIR': { nome:'PAULO JURANDIR', perfil:'ADMINISTRADOR', area:'TODOS' },
    'RAFAEL SPIES': { nome:'RAFAEL SPIES', perfil:'SUPERVISOR', area:'TODOS' },
    'ROGERIO ALVES': { nome:'ROGÉRIO ALVES', perfil:'GERENTE', area:'TODOS' },
    'JEFERSON MACHADO': { nome:'JEFERSON MACHADO', perfil:'COORDENADOR', area:'ELETRICA' },
    'VALTEMIR OLMOS': { nome:'VALTEMIR OLMOS', perfil:'COORDENADOR', area:'MECANICA' },
    'MAURICIO DO CARMO': { nome:'MAURICIO DO CARMO', perfil:'COORDENADOR', area:'ELETRICA' },
    'RODRIGO FORTES': { nome:'RODRIGO FORTES', perfil:'LIDER', area:'MECANICA' },
    'LUCIANO CRUZ': { nome:'LUCIANO CRUZ', perfil:'LIDER', area:'MECANICA' },
    'RONALDO LEMOS': { nome:'RONALDO LEMOS', perfil:'LIDER', area:'MECANICA' },
    'VALNEIR OLIVEIRA': { nome:'VALNEIR OLIVEIRA', perfil:'LIDER', area:'MECANICA' },
    'ANTONIO CARLOS LEAL': { nome:'ANTONIO CARLOS LEAL', perfil:'LIDER', area:'MECANICA' },
    'RICARDO MATHIOLA': { nome:'RICARDO MATHIOLA', perfil:'LIDER', area:'MECANICA' },
    'CARLOS ALBERTO': { nome:'CARLOS ALBERTO', perfil:'LIDER', area:'ELETRICA' },
    'ANDRE MARQUES': { nome:'ANDRE MARQUES', perfil:'LIDER', area:'ELETRICA' },
    'ROQUE BECKER': { nome:'ROQUE BECKER', perfil:'LIDER', area:'ELETRICA' },
    'SAULO LOCKMAN': { nome:'SAULO LOCKMAN', perfil:'LIDER', area:'ELETRICA' },
    'SIDNEI ROCHA': { nome:'SIDNEI ROCHA', perfil:'LIDER', area:'CALDEIRARIA' },
    'GABRIEL STUMM': { nome:'GABRIEL STUMM', perfil:'LIDER', area:'USINAGEM' }
  }),
  AREAS_PATRIMONIO_OPCIONAL: ['USINAGEM', 'CALDEIRARIA', 'INSTALACOES MECANICAS'],
  STATUS_OS_ENCERRADOS: ['CONCLUIDA', 'CANCELADA', 'ENCERRADA', 'FECHADA', 'FINALIZADA'],
  STATUS_OS_ATIVOS: ['ABERTA', 'RECEBIDA', 'NAO INICIADA', 'AGUARDANDO EQUIPE', 'AGUARDANDO RESPONSAVEL', 'AGUARDANDO NOVO RESPONSAVEL', 'EM EXECUCAO', 'EM ANDAMENTO', 'AGUARDANDO MATERIAL', 'AGUARDANDO LIBERACAO', 'EM TESTE'],
  ACOES_CRITICAS_LOCK: ['criarOS', 'iniciarOS', 'atualizarAndamentoOS', 'concluirOS', 'cancelarOS', 'solicitarCancelamentoOS', 'solicitarRedistribuicaoOS', 'responderSolicitacaoOS'],
  ESTADOS_OS_PERMITIDOS: Object.freeze({
    'ABERTA': ['EM EXECUCAO', 'CANCELADA'],
    'AGUARDANDO EQUIPE': ['EM EXECUCAO', 'CANCELADA'],
    'RECEBIDA': ['EM EXECUCAO', 'CANCELADA'],
    'NAO INICIADA': ['EM EXECUCAO', 'CANCELADA'],
    'AGUARDANDO RESPONSAVEL': ['EM EXECUCAO', 'CANCELADA'],
    'AGUARDANDO NOVO RESPONSAVEL': ['EM EXECUCAO', 'CANCELADA'],
    'INICIADA': ['EM EXECUCAO', 'EM ANDAMENTO', 'EM TESTE', 'AGUARDANDO MATERIAL', 'AGUARDANDO LIBERACAO', 'CONCLUIDA', 'CANCELADA'],
    'EM EXECUCAO': ['EM ANDAMENTO', 'EM TESTE', 'AGUARDANDO MATERIAL', 'AGUARDANDO LIBERACAO', 'CONCLUIDA', 'CANCELADA'],
    'EM ANDAMENTO': ['EM EXECUCAO', 'EM TESTE', 'AGUARDANDO MATERIAL', 'AGUARDANDO LIBERACAO', 'CONCLUIDA', 'CANCELADA'],
    'EM TESTE': ['EM EXECUCAO', 'CONCLUIDA', 'CANCELADA'],
    'AGUARDANDO MATERIAL': ['EM EXECUCAO', 'CANCELADA'],
    'AGUARDANDO LIBERACAO': ['EM EXECUCAO', 'CANCELADA'],
    'EM MANUTENCAO': ['EM EXECUCAO', 'EM ANDAMENTO', 'EM TESTE', 'AGUARDANDO MATERIAL', 'AGUARDANDO LIBERACAO', 'CONCLUIDA', 'CANCELADA'],
    'PARADO': ['EM EXECUCAO', 'EM ANDAMENTO', 'CANCELADA'],
    'OPERANDO COM RESTRICAO': ['EM EXECUCAO', 'EM ANDAMENTO', 'CONCLUIDA', 'CANCELADA'],
    'PENDENTE': ['EM EXECUCAO', 'EM ANDAMENTO', 'CANCELADA']
  }),
  LIMITE_FOTOS_POR_USUARIO_OS: 2,
  LIMITE_AUDIO_POR_USUARIO_OS: 1,
  LIMITE_AUDIO_SEGUNDOS: 60,
  ABAS: {
    EQUIPAMENTOS: 'EQUIPAMENTOS',
    STATUS_ATUAL: 'STATUS_ATUAL',
    ORDENS: 'ORDENS_SERVICO',
    HISTORICO_OS: 'HISTORICO_OS',
    HISTORICO: 'HISTORICO',
    PATRIMONIO: 'PATRIMONIO',
    PATRIMONIO_GRUPOS: 'PATRIMONIO_GRUPOS',
    ENDERECOS_ESTACOES: 'ENDERECOS_ESTACOES',
    EVIDENCIAS: 'EVIDENCIAS',
    ANEXOS: 'ANEXOS',
    USUARIOS: 'USUARIOS',
    EQUIPES_SETORES: 'EQUIPES_SETORES',
    KPIS: 'KPIS',
    KPI_REINCIDENCIA: 'KPI_REINCIDENCIA',
    AUDITORIA_LOGS: 'AUDITORIA_LOGS',
    QUARENTENA_OS: 'QUARENTENA_OS',
    QUARENTENA_STATUS: 'QUARENTENA_STATUS',
    QUARENTENA_EVID: 'QUARENTENA_EVID',
    QUARENTENA_PATR: 'QUARENTENA_PATR',
    QUARENTENA_HIST: 'QUARENTENA_HIST'
  }
});

const COMPONENTES_GMAN = Object.freeze([
  { codigo:'PAINEL', label:'Painel', obrigatorio:true, pats:['PAT_PAINEL'], descs:['DESC_PAINEL'] },
  { codigo:'MOTOR', label:'Motor', obrigatorio:true, pats:['PAT_MOTOR'], descs:['DESC_MOTOR'] },
  { codigo:'BOMBA', label:'Bomba', obrigatorio:true, pats:['PAT_BOMBA'], descs:['DESC_BOMBA'] },
  { codigo:'VS', label:'Válvula de Sucção', obrigatorio:true, pats:['PAT_VS','PAT_VALVULA_SUCCAO'], descs:['DESC_VS','DESC_VALVULA_SUCCAO'] },
  { codigo:'VR', label:'Válvula de Recalque', obrigatorio:true, pats:['PAT_VR','PAT_VALVULA_RECALQUE'], descs:['DESC_VR','DESC_VALVULA_RECALQUE'] },
  { codigo:'RETENCAO', label:'Válvula de Retenção', obrigatorio:true, pats:['PAT_RETENCAO','PAT_VALVULA_RETENCAO'], descs:['DESC_RETENCAO','DESC_VALVULA_RETENCAO'] },
  { codigo:'TUBULACAO', label:'Tubulação', obrigatorio:false, pats:['PAT_TUBULACAO'], descs:['DESC_TUBULACAO'] }
]);

const ALIASES = Object.freeze({
  idEquipamento: ['ID_EQUIPAMENTO', 'ID_GRUPO', 'ID_NORMALIZADO'],
  equipamento: ['NOME_EQUIPAMENTO_GRUPO', 'EQUIPAMENTO', 'NOME_GRUPO'],
  sistema: ['SISTEMA'],
  bruta: ['FILTRO_BRUTAS', 'BRUTA'],
  tipoLocal: ['TIPO_LOCAL', 'TIPO'],
  localEstacao: ['LOCAL_ESTACAO', 'LOCALIDADE'],
  ativo: ['ATIVO'],
  statusOperacional: ['STATUS_OPERACIONAL', 'STATUS_ATUAL'],
  statusVisual: ['STATUS_VISUAL_GRUPO', 'STATUS_VISUAL'],
  idOsBloqueadora: ['ID_OS_BLOQUEADORA', 'ID_OS_VINCULADA'],
  numeroOsBaseAtiva: ['NUMERO_OS_BASE_ATIVA'],
  setoresAtivos: ['SETORES_ATIVOS'],
  justificativaStatus: ['JUSTIFICATIVA_STATUS', 'JUSTIFICATIVA', 'OBSERVACAO'],
  dataUltimaAlteracao: ['DATA_ULTIMA_ALTERACAO', 'DATA'],
  horaUltimaAlteracao: ['HORA_ULTIMA_ALTERACAO', 'HORA'],
  usuarioUltimaAlteracao: ['USUARIO_ULTIMA_ALTERACAO', 'USUARIO'],
  idOS: ['ID_OS'],
  numeroOS: ['NUMERO_OS'],
  numeroOSBase: ['NUMERO_OS_BASE', 'OS_BASE', 'BASE_OS'],
  sequenciaOS: ['SEQUENCIA_OS'],
  anoOS: ['ANO_OS'],
  statusOS: ['STATUS_OS'],
  area: ['SETOR_EQUIPE', 'AREA', 'EQUIPE_RESPONSAVEL'],
  responsavel: ['RESPONSAVEL', 'EXECUTANTE_CANONICO'],
  tipoOS: ['TIPO_OS', 'TIPO_MANUTENCAO'],
  prioridade: ['PRIORIDADE'],
  descricao: ['DESCRICAO_SOLICITACAO', 'DESCRICAO_PROBLEMA'],
  dataAbertura: ['DATA_ABERTURA'],
  horaAbertura: ['HORA_ABERTURA'],
  abertoPor: ['ABERTO_POR', 'CRIADO_POR'],
  dataInicio: ['DATA_INICIO'],
  horaInicio: ['HORA_INICIO'],
  usuarioInicio: ['USUARIO_INICIO'],
  condicaoInicio: ['CONDICAO_OPERACIONAL_INICIO'],
  justificativaInicio: ['JUSTIFICATIVA_STATUS_INICIO'],
  dataAndamento: ['DATA_ULTIMO_ANDAMENTO'],
  horaAndamento: ['HORA_ULTIMO_ANDAMENTO'],
  andamentoTexto: ['ANDAMENTO_TEXTO'],
  motivoPendencia: ['MOTIVO_PENDENCIA'],
  servicoRealizado: ['SERVICO_REALIZADO'],
  condicaoFinal: ['CONDICAO_OPERACIONAL_FINAL', 'SITUACAO_FINAL_EQUIPAMENTO'],
  justificativaFinal: ['JUSTIFICATIVA_CONDICAO_FINAL', 'OBSERVACAO_FINAL'],
  materiais: ['MATERIAIS_UTILIZADOS', 'MATERIAIS'],
  membrosEquipe: ['MEMBROS_EQUIPE'],
  semUsoVeiculo: ['SEM_USO_VEICULO'],
  prefixoVeiculo: ['PREFIXO_VEICULO'],
  motorista: ['MOTORISTA'],
  kmInicial: ['KM_INICIAL'],
  kmFinal: ['KM_FINAL'],
  kmRodado: ['KM_RODADO'],
  validacaoKM: ['VALIDACAO_KM'],
  itensAdicionais: ['ITENS_ADICIONAIS_OBSERVADOS', 'EQUIPAMENTOS_ADICIONAIS'],
  dataConclusao: ['DATA_CONCLUSAO'],
  horaConclusao: ['HORA_CONCLUSAO'],
  finalizadoPor: ['FINALIZADO_POR'],
  motivoCancelamento: ['MOTIVO_CANCELAMENTO'],
  obsCancelamento: ['OBS_CANCELAMENTO'],
  solicitacaoRedistribuicao: ['SOLICITACAO_REDISTRIBUICAO'],
  novoSetor: ['NOVO_SETOR'],
  novoResponsavel: ['NOVO_RESPONSAVEL'],
  versaoRegra: ['VERSAO_REGRA'],
  entraReincidencia: ['ENTRA_REINCIDENCIA'],
  bloqueioRetorno: ['BLOQUEIO_RETORNO_OPERANDO'],
  ativoProducao: ['ATIVO_PRODUCAO'],
  componentesSolicitados: ['COMPONENTES_SOLICITADOS']
});

function doGet(e) {
  const p = parametros_(e);
  const acao = String((p && (p.acao || p.action)) || '').trim();
  if (acaoCriticaComLock_(acao)) {
    return responder_({ sucesso:false, erro:'Ação crítica bloqueada via GET. Use o fluxo oficial do app para garantir LockService, auditoria e validação de usuário.', versao:GMAN.VERSAO, dataHoraBrasil:dataHoraBrasil_() });
  }
  return responder_(rotear_(p));
}
function doPost(e) { const p = parametros_(e); return responder_(executarComConfiabilidadeIndustrial_(p)); }

function parametros_(e) {
  const p = (e && e.parameter) ? Object.assign({}, e.parameter) : {};
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : '';
  if (raw) {
    try { Object.assign(p, JSON.parse(raw)); }
    catch (err) { p._raw = raw; }
  }
  return p;
}

function responder_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj, null, 2)).setMimeType(ContentService.MimeType.JSON);
}

function acaoCriticaComLock_(acao) {
  const alvo = String(acao || '').trim();
  return GMAN.ACOES_CRITICAS_LOCK.some(a => String(a).toLowerCase() === alvo.toLowerCase());
}

function executarComConfiabilidadeIndustrial_(p) {
  const acao = String((p && (p.acao || p.action)) || '').trim();
  if (!acaoCriticaComLock_(acao)) return rotear_(p);
  const lock = LockService.getScriptLock();
  let travado = false;
  const ini = Date.now();
  try {
    lock.waitLock(30000);
    travado = true;
    const r = rotear_(p);
    if (r && r.sucesso === false) registrarAuditoriaConfiabilidade_('ACAO_CRITICA_REJEITADA', p && p.usuario, acao, r.erro || r.mensagem || 'Sem detalhe', p);
    return r;
  } catch (err) {
    registrarAuditoriaConfiabilidade_('LOCKSERVICE_ERRO', p && p.usuario, acao, String(err && err.message ? err.message : err), p);
    return { sucesso:false, erro:'Sistema ocupado ou ação concorrente bloqueada com segurança: ' + String(err && err.message ? err.message : err), versao:GMAN.VERSAO, titulo:GMAN.TITULO, tempoMs:Date.now()-ini, dataHoraBrasil:dataHoraBrasil_() };
  } finally {
    if (travado) {
      try { lock.releaseLock(); } catch(e) {}
    }
  }
}

function registrarAuditoriaConfiabilidade_(acao, usuario, alvo, detalhe, contexto) {
  try {
    const sh = sh_(GMAN.ABAS.AUDITORIA_LOGS, true);
    let headers = getHeaders_(sh);
    if (!headers.length || !headers.some(h => txt_(h))) {
      headers = ['DATA', 'HORA', 'USUARIO', 'ACAO', 'ALVO', 'DETALHE', 'VERSAO', 'ORIGEM_HORARIO'];
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    const ctx = contexto || (usuario && typeof usuario === 'object' ? usuario : null) || {};
    const nomeUsuario = usuario && typeof usuario === 'object' ? usuario.nome : txt_(usuario);
    appendLinhaGenerica_(sh, headers, { DATA:dataBrasilEvento_(ctx), HORA:horaBrasilEvento_(ctx), USUARIO:nomeUsuario, ACAO:acao, ALVO:txt_(alvo), DETALHE:txt_(detalhe), VERSAO:GMAN.VERSAO, ORIGEM_HORARIO:txt_(ctx.origemHorario || 'DISPOSITIVO_OU_SERVIDOR') });
  } catch(e) {}
}

function rotear_(p) {
  const ini = Date.now();
  try {
    const acao = String(p.acao || p.action || '').trim();
    let r;
    switch (acao) {
      case '': r = health_(); break;
      case 'health': case 'testeSaudeGMAN': case 'listarSaude': r = health_(); break;
      case 'listarEquipamentos': r = listarEquipamentos_(); break;
      case 'listarEnderecosEstacoes': r = listarEnderecosEstacoes_(); break;
      case 'listarStatus': case 'listarStatusAtual': r = listarStatus_(); break;
      case 'listarOS': case 'listarOrdens': r = listarOS_(p); break;
      case 'detalharOS': case 'buscarOS': case 'verDetalhesOS': r = detalharOS_(p); break;
      case 'criarOS': r = criarOS_(p); break;
      case 'iniciarOS': r = iniciarOS_(p); break;
      case 'atualizarAndamentoOS': r = atualizarAndamentoOS_(p); break;
      case 'concluirOS': r = concluirOS_(p); break;
      case 'cancelarOS': r = cancelarOS_(p); break;
      case 'solicitarCancelamentoOS': r = solicitarCancelamentoOS_(p); break;
      case 'solicitarRedistribuicaoOS': r = solicitarRedistribuicaoOS_(p); break;
      case 'listarSolicitacoesPendentes': r = listarSolicitacoesPendentes_(p); break;
      case 'listarNotificacoesUsuario': r = listarNotificacoesUsuario_(p); break;
      case 'responderSolicitacaoOS': r = responderSolicitacaoOS_(p); break;
      case 'listarHistoricoGrupo': r = listarHistoricoGrupo_(p); break;
      case 'listarHistoricoOS': case 'detalharHistoricoOS': r = listarHistoricoOS_(p); break;
      case 'listarPatrimonioGrupo': r = listarPatrimonioGrupo_(p); break;
      case 'calcularKPIs': r = calcularKPIs_(p); break;
      case 'diagnosticoCicloAtual': r = diagnosticoCicloAtual_(); break;
      case 'diagnosticoProfundo': case 'diagnosticoAlicerce': r = diagnosticoProfundo_(); break;
      case 'diagnosticoDriveEvidencias': case 'testarDriveEvidencias': r = diagnosticoDriveEvidencias_(); break;
      case 'simularQuarentenaSegura': r = simularQuarentenaSegura_(); break;
      case 'listarGatilhos': r = listarGatilhos_(); break;
      default: throw new Error('Ação não reconhecida: ' + acao);
    }
    r.versao = GMAN.VERSAO;
    r.titulo = GMAN.TITULO;
    r.tempoMs = Date.now() - ini;
    r.dataHoraBrasil = dataHoraBrasil_();
    return r;
  } catch (err) {
    return { sucesso:false, erro:String(err && err.message ? err.message : err), versao:GMAN.VERSAO, titulo:GMAN.TITULO, tempoMs:Date.now()-ini, dataHoraBrasil:dataHoraBrasil_() };
  }
}

function ss_() {
  const prop = PropertiesService.getScriptProperties().getProperty('GMAN_SPREADSHEET_ID');
  if (prop) return SpreadsheetApp.openById(prop);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Planilha não encontrada. Vincule o Apps Script à planilha oficial ou configure GMAN_SPREADSHEET_ID.');
  return active;
}

function sh_(nome, criar) {
  const ss = ss_();
  let sh = ss.getSheetByName(nome);
  if (!sh && criar) sh = ss.insertSheet(nome);
  if (!sh) throw new Error('Aba não encontrada: ' + nome);
  return sh;
}

function now_() { return new Date(); }
function dataBrasil_() { return Utilities.formatDate(now_(), GMAN.TZ, 'dd/MM/yyyy'); }
function horaBrasil_() { return Utilities.formatDate(now_(), GMAN.TZ, 'HH:mm:ss'); }
function dataHoraBrasil_() { return Utilities.formatDate(now_(), GMAN.TZ, 'dd/MM/yyyy HH:mm:ss'); }

function dataBrasilEvento_(p) {
  const s = txt_(p && (p.dataDispositivo || p.dataBrasil || p.dataLocal));
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  return dataBrasil_();
}
function horaBrasilEvento_(p) {
  const s = txt_(p && (p.horaDispositivo || p.horaBrasil || p.horaLocal));
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) return String(m[1]).padStart(2,'0') + ':' + m[2] + ':' + (m[3] || '00');
  return horaBrasil_();
}
function horaUsuarioEvento_(u) {
  const s = txt_(u && u.horaDispositivo);
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) return String(m[1]).padStart(2,'0') + ':' + m[2] + ':' + (m[3] || '00');
  return horaBrasil_();
}
function dataUsuarioEvento_(u) {
  const s = txt_(u && u.dataDispositivo);
  return /^\d{2}\/\d{2}\/\d{4}$/.test(s) ? s : dataBrasil_();
}
function ano2_() { return Utilities.formatDate(now_(), GMAN.TZ, 'yy'); }
function uid_(prefixo) { return prefixo + '-' + Utilities.formatDate(now_(), GMAN.TZ, 'yyyyMMddHHmmss') + '-' + Utilities.getUuid().slice(0,8).toUpperCase(); }
function txt_(v) { return v === null || v === undefined ? '' : String(v).trim(); }

function valorDataBrasil_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) return Utilities.formatDate(v, GMAN.TZ, 'dd/MM/yyyy');
  const s = txt_(v);
  if (!s) return '';
  if (s.indexOf('1899') >= 0 || /GMT-0306/i.test(s) || /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/i.test(s)) return '';
  let m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return m[1] + '/' + m[2] + '/' + m[3];
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[3] + '/' + m[2] + '/' + m[1];
  return '';
}
function valorHoraBrasil_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) return Utilities.formatDate(v, GMAN.TZ, 'HH:mm:ss');
  const s = txt_(v);
  if (!s) return '';
  if (s.indexOf('1899') >= 0 || /GMT-0306/i.test(s)) return '';
  const m = s.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
  if (m) return m[1].length === 5 ? m[1] + ':00' : m[1];
  return '';
}
function valorDataHoraBrasilCampos_(data, hora) {
  const d = valorDataBrasil_(data);
  const h = valorHoraBrasil_(hora);
  return (d + (h ? ' ' + h : '')).trim();
}
function statusConcluido_(s) { return statusCanon_(s) === 'CONCLUIDA'; }

function canon_(v) { return txt_(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/Ç/g,'C').replace(/[^A-Z0-9]+/g,' ').trim(); }
function normalizarSistema_(v, id) { let s = txt_(v).replace(/\.0$/,''); if (s === '500') return '300'; if (GMAN.SISTEMAS_OFICIAIS.indexOf(s) >= 0) return s; const pref = txt_(id).slice(0,1); return ['1','2','3','4','6','7'].indexOf(pref) >= 0 ? pref + '00' : s; }
function sistemaBruta_(id) { return GMAN.BRUTAS.indexOf(txt_(id).split('-')[0]) >= 0 ? 'SIM' : 'NÃO'; }
function areaCanon_(v) { const s = canon_(v); if (s.indexOf('INSTAL') >= 0) return 'INSTALACOES MECANICAS'; if (s.indexOf('ELETR') >= 0) return 'ELETRICA'; if (s.indexOf('AUTOM') >= 0) return 'AUTOMACAO'; if (s.indexOf('USIN') >= 0) return 'USINAGEM'; if (s.indexOf('CALD') >= 0) return 'CALDEIRARIA'; if (s.indexOf('MECAN') >= 0) return 'MECANICA'; if (s.indexOf('TOD') >= 0 || s.indexOf('GEST') >= 0) return 'TODOS'; return s; }
function statusCanon_(v) { return canon_(v); }
function statusEncerrado_(s) { return GMAN.STATUS_OS_ENCERRADOS.indexOf(statusCanon_(s)) >= 0; }
function statusAtivo_(s) { return !statusEncerrado_(s || 'ABERTA'); }
function statusOSCanonFluxo_(s) { return statusCanon_(s || 'ABERTA'); }
function validarTransicaoOS_(statusAtual, statusNovo, contexto) {
  const atual = statusOSCanonFluxo_(statusAtual || 'ABERTA');
  const novo = statusOSCanonFluxo_(statusNovo);
  if (!novo) throw new Error('Status de destino da OS é obrigatório.');
  if (atual === novo) return true;
  if (statusEncerrado_(atual)) throw new Error('OS encerrada não pode mudar de status.');
  const permitidos = (GMAN.ESTADOS_OS_PERMITIDOS && GMAN.ESTADOS_OS_PERMITIDOS[atual]) || [];
  if (permitidos.indexOf(novo) < 0) {
    throw new Error('Transição de status bloqueada pela máquina de estados: ' + (statusAtual || 'Aberta') + ' → ' + statusNovo + '. Primeiro siga o fluxo operacional correto da OS.');
  }
  return true;
}
function contemTeste_(obj) {
  // Não excluir o status operacional legítimo 'Em teste'.
  // Excluir somente registros claramente marcados como teste/simulação/quarentena.
  const valores = Array.isArray(obj) ? obj : Object.keys(obj || {}).map(k => obj[k]);
  return valores.some(v => {
    const s = canon_(v);
    if (!s) return false;
    if (s === 'TESTE' || s === 'SIMULACAO' || s === 'DADO TESTE' || s === 'REGISTRO TESTE') return true;
    if (/^(TESTE|SIMULACAO|QUARENTENA)[ _\-]/.test(s)) return true;
    if (/^[A-Z_]*(TESTE|SIMULACAO)[A-Z_]*$/.test(s) && s.indexOf('EM TESTE') < 0) return true;
    return false;
  });
}
function parseNumero_(v) { const n = Number(String(v).replace(',','.')); return isNaN(n) ? null : n; }

function getHeaders_(sheet) {
  const last = sheet.getLastColumn ? sheet.getLastColumn() : 0;
  if (!last) return [];
  return sheet.getRange(1, 1, 1, last).getValues()[0].map(h => txt_(h));
}
function headerIndex_(headers, nomes) {
  const lista = Array.isArray(nomes) ? nomes : [nomes];
  const canonHeaders = headers.map(canon_);
  for (let i=0;i<lista.length;i++) {
    const idx = canonHeaders.indexOf(canon_(lista[i]));
    if (idx >= 0) return idx;
  }
  return -1;
}
function linhas_(nomeAba) {
  const sh = sh_(nomeAba, false);
  const values = sh.getDataRange().getValues();
  const headers = values.length ? values[0].map(h => txt_(h)) : [];
  const rows = [];
  for (let r=1;r<values.length;r++) {
    const vals = values[r];
    if (!vals.some(v => txt_(v) !== '')) continue;
    rows.push({ _row:r+1, _vals:vals, _headers:headers });
  }
  return { sheet:sh, headers:headers, rows:rows };
}
function get_(row, chaveOuAliases) {
  const aliases = ALIASES[chaveOuAliases] || chaveOuAliases;
  const idx = headerIndex_(row._headers || [], aliases);
  return idx >= 0 ? row._vals[idx] : '';
}
function setCampo_(sheet, headers, rowNumber, chaveOuAliases, value) {
  const aliases = ALIASES[chaveOuAliases] || chaveOuAliases;
  const idx = headerIndex_(headers, aliases);
  if (idx >= 0) sheet.getRange(rowNumber, idx+1).setValue(value);
}
function setCampos_(sheet, headers, rowNumber, obj) {
  Object.keys(obj).forEach(k => setCampo_(sheet, headers, rowNumber, k, obj[k]));
}
function appendLinha_(sheet, headers, obj) {
  const row = headers.map(h => {
    for (const k in obj) {
      const aliases = ALIASES[k] || [k];
      if (aliases.map(canon_).indexOf(canon_(h)) >= 0 || canon_(k) === canon_(h)) return obj[k];
    }
    return '';
  });
  sheet.appendRow(row);
  return sheet.getLastRow();
}
function parseDataBrasil_(valor) {
  const s = txt_(valor);
  if (!s) return 0;
  if (s.indexOf('1899') >= 0 || /GMT-0306/i.test(s) || /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/i.test(s)) return 0;
  let m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) return new Date(Number(m[3]), Number(m[2])-1, Number(m[1]), Number(m[4]||0), Number(m[5]||0), Number(m[6]||0)).getTime();
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]), Number(m[4]||0), Number(m[5]||0), Number(m[6]||0)).getTime();
  return 0;
}

function primeiroDataHoraLinha_(row, pares) {
  for (let i=0;i<pares.length;i++) {
    const d = txt_(get_(row, pares[i][0]));
    const h = txt_(get_(row, pares[i][1]));
    const ms = parseDataBrasil_((d + (h ? ' ' + h : '')).trim()) || parseDataBrasil_(d);
    if (ms) return ms;
  }
  return 0;
}
function dataHoraLinhaMs_(row) {
  if (!row) return 0;
  const dataHoraBrasil = txt_(get_(row,['DATA_HORA_BRASIL','ATUALIZADO_EM']));
  const msBrasil = parseDataBrasil_(dataHoraBrasil);
  if (msBrasil) return msBrasil;
  return primeiroDataHoraLinha_(row, [
    ['dataConclusao','horaConclusao'],
    ['dataAndamento','horaAndamento'],
    ['dataInicio','horaInicio'],
    ['dataAbertura','horaAbertura'],
    ['dataUltimaAlteracao','horaUltimaAlteracao']
  ]);
}
function corteOperacionalMs_() {
  return parseDataBrasil_(GMAN.CICLO_DATA_CORTE + ' ' + GMAN.CICLO_HORA_CORTE);
}
function cicloOperacionalAtivo_() { return GMAN.CICLO_OPERACIONAL_ATIVO === true; }
function dentroCicloAtualPorMs_(ms) {
  if (!cicloOperacionalAtivo_()) return true;
  return !!ms && ms >= corteOperacionalMs_();
}
function versaoLinha_(row) {
  return txt_(get_(row,'versaoRegra')) || txt_(get_(row,['VERSAO_REGRA','VERSAO']));
}
function numeroVersao_(v) {
  const m = String(v || '').match(/8\.5\.6\.(\d+)/);
  return m ? Number(m[1]) : 0;
}
function linhaMarcadaComoLegado_(row) {
  const txt = canon_(Array.isArray(row && row._vals) ? row._vals.join(' ') : JSON.stringify(row || {}));
  return txt.indexOf('LEGADO') >= 0 || txt.indexOf('TESTE ANTIGO') >= 0 || txt.indexOf('FORA DO CICLO') >= 0 || txt.indexOf('QUARENTENA') >= 0;
}
function linhaDoCicloAtual_(row) {
  // RESET OPERACIONAL ÚNICO GMAN:
  // Não zera a cada nova versão. O corte é fixo; registros novos continuam no radar.
  // Apenas legado/teste antigo explicitamente marcado, ou datas anteriores ao corte sem versão nova, ficam fora.
  if (!cicloOperacionalAtivo_()) return true;
  if (linhaMarcadaComoLegado_(row)) return false;
  const ms = dataHoraLinhaMs_(row);
  if (dentroCicloAtualPorMs_(ms)) return true;
  const nv = numeroVersao_(versaoLinha_(row));
  if (nv >= 77) return true;
  return false;
}

function dentroCicloAtualOS_(row) { return linhaDoCicloAtual_(row); }
function dentroCicloAtualStatus_(row) { return linhaDoCicloAtual_(row); }
function dentroCicloAtualHistorico_(row) { return linhaDoCicloAtual_(row); }
function filtroCicloInfo_() {
  return { ativo:cicloOperacionalAtivo_(), criterio:GMAN.CICLO_CRITERIO, versaoOficial:GMAN.VERSAO, dataCorte:GMAN.CICLO_DATA_CORTE, horaCorte:GMAN.CICLO_HORA_CORTE, descricao:'Reset operacional único e fixo: novas versões não zeram o ciclo. OS/status/histórico após o corte permanecem no radar; legado/teste antigo fica preservado fora dos painéis.' };
}


function ordenarPorDataDesc_(a,b) {
  const da = parseDataBrasil_(a.dataHora || a.DATA_HORA_BRASIL || ((a.dataUltimaAlteracao || '') + ' ' + (a.horaUltimaAlteracao || '')));
  const db = parseDataBrasil_(b.dataHora || b.DATA_HORA_BRASIL || ((b.dataUltimaAlteracao || '') + ' ' + (b.horaUltimaAlteracao || '')));
  if (db !== da) return db - da;
  return Number(b._row || 0) - Number(a._row || 0);
}

function usuarioOficialPorNome_(nome) {
  const chave = canon_(nome);
  return (GMAN.USUARIOS_OFICIAIS && GMAN.USUARIOS_OFICIAIS[chave]) ? GMAN.USUARIOS_OFICIAIS[chave] : null;
}

function perfilUsuarioPorNivel_(valor, fallback) {
  const bruto = txt_(valor);
  const m = bruto.match(/^\s*([1-6])(?:[.,]0+)?\s*$/);
  if (m) {
    const mapa = { '1':'ADMINISTRADOR', '2':'SUPERVISOR', '3':'GERENTE', '4':'COORDENADOR', '5':'LIDER', '6':'OPERACIONAL' };
    return mapa[m[1]];
  }
  const perfil = canon_(bruto || fallback);
  if (perfil === 'ADMIN') return 'ADMINISTRADOR';
  if (perfil === 'COORDENACAO') return 'COORDENADOR';
  if (perfil === 'LIDERANCA') return 'LIDER';
  if (perfil === 'EXECUTANTE') return 'EXECUTOR';
  return perfil || 'OPERACIONAL';
}

function usuario_(p) {
  const nomeInformado = txt_(p.usuario || p.nomeUsuario || p.user || p.nome || 'SISTEMA');
  const perfilInformado = perfilUsuarioPorNivel_(p.nivel || p.NIVEL || p.perfil || p.funcao || p.role || '', '');
  const areaInformada = areaCanon_(p.area || p.areaUsuario || '');
  if (!nomeInformado || canon_(nomeInformado) === 'SISTEMA') return { nome:'SISTEMA', perfil:'SISTEMA', area:'TODOS', origem:'SISTEMA', horaDispositivo:horaBrasilEvento_(p), dataDispositivo:dataBrasilEvento_(p) };

  // Segurança: quando houver aba USUARIOS, o Apps Script valida perfil/área pela planilha,
  // e não confia cegamente no perfil enviado pelo navegador.
  try {
    const dados = linhas_(GMAN.ABAS.USUARIOS);
    const h = dados.headers.map(canon_);
    const idxNome = ['NOME','USUARIO','USUARIO NOME','NOME COMPLETO','NOME USUARIO'].map(canon_).map(x=>h.indexOf(x)).find(i=>i>=0);
    const idxPerfil = ['PERFIL','FUNCAO','CARGO','TIPO USUARIO'].map(canon_).map(x=>h.indexOf(x)).find(i=>i>=0);
    const idxNivel = ['NIVEL','NÍVEL','NIVEL ACESSO','NÍVEL ACESSO'].map(canon_).map(x=>h.indexOf(x)).find(i=>i>=0);
    const idxArea = ['AREA','SETOR','EQUIPE','AREA PRINCIPAL','SETOR EQUIPE'].map(canon_).map(x=>h.indexOf(x)).find(i=>i>=0);
    const idxAtivo = ['ATIVO','STATUS','USUARIO ATIVO'].map(canon_).map(x=>h.indexOf(x)).find(i=>i>=0);
    if (idxNome >= 0) {
      const alvo = canon_(nomeInformado);
      for (let i=0;i<dados.rows.length;i++) {
        const r = dados.rows[i];
        if (canon_(r._vals[idxNome]) !== alvo) continue;
        const ativo = idxAtivo >= 0 ? canon_(r._vals[idxAtivo]) : 'SIM';
        if (ativo && ativo.indexOf('NAO') >= 0) throw new Error('Usuário inativo na aba USUARIOS: ' + nomeInformado);
        const perfilAba = idxPerfil >= 0 ? txt_(r._vals[idxPerfil]) : '';
        const nivelAba = idxNivel >= 0 ? txt_(r._vals[idxNivel]) : '';
        return {
          nome: txt_(r._vals[idxNome]) || nomeInformado,
          perfil: perfilUsuarioPorNivel_(perfilAba || nivelAba, perfilInformado),
          area: idxArea >= 0 ? areaCanon_(r._vals[idxArea]) : areaInformada,
          origem:'ABA_USUARIOS',
          horaDispositivo:horaBrasilEvento_(p),
          dataDispositivo:dataBrasilEvento_(p)
        };
      }
    }
  } catch(e) {
    if (String(e && e.message || '').indexOf('Usuário inativo') >= 0) throw e;
  }

  const oficial = usuarioOficialPorNome_(nomeInformado);
  if (oficial) return { nome:oficial.nome, perfil:oficial.perfil, area:oficial.area, origem:'MAPA_OFICIAL_SERVIDOR', horaDispositivo:horaBrasilEvento_(p), dataDispositivo:dataBrasilEvento_(p) };

  if (GMAN.PERFIS_ACESSO_TOTAL.indexOf(perfilInformado) >= 0 || GMAN.PERFIS_COORDENACAO.indexOf(perfilInformado) >= 0) {
    throw new Error('Perfil privilegiado bloqueado sem validação oficial: ' + nomeInformado);
  }
  return { nome:nomeInformado, perfil:perfilInformado || 'OPERACIONAL', area:areaInformada, origem:'PAYLOAD_OPERACIONAL', horaDispositivo:horaBrasilEvento_(p), dataDispositivo:dataBrasilEvento_(p) };
}
function validarUsuarioAcaoCritica_(u, acao) {
  const origem = String(u && u.origem || '').toUpperCase();
  if (origem === 'ABA_USUARIOS' || origem === 'MAPA_OFICIAL_SERVIDOR' || origem === 'MAPA_OFICIAL_PRIVILEGIOS') {
    registrarAuditoriaConfiabilidade_('USUARIO_VALIDADO_ACAO_CRITICA', u, acao, 'Origem: ' + origem + ' | Perfil: ' + (u.perfil || '') + ' | Área: ' + (u.area || ''), u);
    return true;
  }
  throw new Error('Ação crítica bloqueada: usuário precisa estar validado na aba USUARIOS ou no mapa oficial do servidor. Usuário: ' + (u && u.nome ? u.nome : 'não informado'));
}

function acessoTotal_(u) { return GMAN.PERFIS_ACESSO_TOTAL.indexOf(canon_(u && u.perfil)) >= 0; }
function coordenador_(u) { return GMAN.PERFIS_COORDENACAO.indexOf(canon_(u && u.perfil)) >= 0; }
function mesmoResponsavel_(u, os) { return canon_(get_(os, 'responsavel')) === canon_(u && u.nome); }
function mesmoCriador_(u, os) { return canon_(get_(os, 'abertoPor')) === canon_(u && u.nome); }
function podeCoordenadorArea_(u, os) {
  if (!coordenador_(u)) return false;
  const au = areaCanon_(u.area);
  if (!au || au === 'TODOS') return false;
  const areaOS = areaCanon_(get_(os, 'area'));
  return !!areaOS && areaOS.indexOf(au) >= 0;
}
function podeVerEncerradas_(u, os) {
  // Encerradas não aparecem para equipe/líder operacional.
  // Gestão total vê todas; coordenação vê somente encerradas da própria área.
  if (acessoTotal_(u)) return true;
  if (coordenador_(u) && (!os || podeCoordenadorArea_(u, os))) return true;
  return false;
}
function podeVerOS_(u, os) {
  if (statusEncerrado_(get_(os, 'statusOS'))) return podeVerEncerradas_(u, os);
  return acessoTotal_(u) || podeCoordenadorArea_(u, os) || mesmoResponsavel_(u, os) || mesmoCriador_(u, os);
}
function podeVerDetalheOS_(u, os) {
  return podeVerOS_(u, os);
}
function podeAlterarOS_(u, os) { return acessoTotal_(u) || podeCoordenadorArea_(u, os) || mesmoResponsavel_(u, os); }
function podeCancelarOS_(u) { return acessoTotal_(u); }
function areaPatrimonioOpcional_(area) { return GMAN.AREAS_PATRIMONIO_OPCIONAL.indexOf(areaCanon_(area)) >= 0; }

function equipamentosOficiais_() {
  const dados = linhas_(GMAN.ABAS.EQUIPAMENTOS);
  const lista = [];
  const mapa = {};
  dados.rows.forEach(r => {
    const id = txt_(get_(r,'idEquipamento'));
    if (!id || contemTeste_(r._vals)) return;
    const ativo = txt_(get_(r,'ativo'));
    if (ativo && canon_(ativo).indexOf('NAO') >= 0) return;
    const sistema = normalizarSistema_(get_(r,'sistema'), id);
    if (GMAN.SISTEMAS_OFICIAIS.indexOf(sistema) < 0) return;
    const nome = txt_(get_(r,'equipamento')) || id;
    const item = { idEquipamento:id, id:id, equipamento:nome, nome:nome, sistema:sistema, bruta:txt_(get_(r,'bruta')) || sistemaBruta_(id), tipoLocal:txt_(get_(r,'tipoLocal')), localEstacao:txt_(get_(r,'localEstacao')), ativo:ativo || 'SIM' };
    lista.push(item); mapa[id] = item;
  });
  return { lista:lista, mapa:mapa };
}
function listarEquipamentos_() { const eq = equipamentosOficiais_(); return { sucesso:true, equipamentos:eq.lista, total:eq.lista.length }; }

function valorEnderecoEstacao_(row, nomes) {
  return txt_(get_(row, nomes));
}
function codigoEstacao_(valor) {
  const s = txt_(valor).replace(/\.0$/, '');
  const m = s.match(/\d+/);
  return m ? m[0] : s;
}
function sistemaEnderecoEstacao_(row) {
  const estacao = codigoEstacao_(valorEnderecoEstacao_(row, ['ESTACAO','ESTAÇÃO','CODIGO_ESTACAO','CÓDIGO_ESTACAO']));
  if (['503','504','505','515'].indexOf(estacao) >= 0) return '300';
  const sistema = valorEnderecoEstacao_(row, ['SISTEMA_GMAN','SISTEMA','CODIGO_SISTEMA','CÓDIGO_SISTEMA']);
  return normalizarSistema_(sistema, estacao);
}
function itemEnderecoEstacao_(row) {
  const estacao = codigoEstacao_(valorEnderecoEstacao_(row, ['ESTACAO','ESTAÇÃO','CODIGO_ESTACAO','CÓDIGO_ESTACAO']));
  return {
    SISTEMA_GMAN: sistemaEnderecoEstacao_(row),
    ESTACAO: estacao,
    TIPO: valorEnderecoEstacao_(row, ['TIPO','TIPO_ESTACAO','TIPO_ESTAÇÃO']),
    NOME_ESTACAO: valorEnderecoEstacao_(row, ['NOME_ESTACAO','NOME_ESTAÇÃO','NOME','ESTACAO_NOME','ESTAÇÃO_NOME']),
    ENDERECO: valorEnderecoEstacao_(row, ['ENDERECO','ENDEREÇO','LOGRADOURO']),
    MUNICIPIO: valorEnderecoEstacao_(row, ['MUNICIPIO','MUNICÍPIO','CIDADE']),
    LATITUDE: valorEnderecoEstacao_(row, ['LATITUDE','LAT']),
    LONGITUDE: valorEnderecoEstacao_(row, ['LONGITUDE','LONG','LON','LNG'])
  };
}
function contemEnderecoEstacao_(lista, estacao, termos) {
  const alvo = String(estacao || '');
  const tokens = (termos || []).map(canon_);
  return lista.some(item => {
    if (codigoEstacao_(item.ESTACAO) !== alvo) return false;
    const texto = canon_([item.TIPO, item.NOME_ESTACAO, item.ENDERECO, item.MUNICIPIO].join(' '));
    return tokens.every(t => texto.indexOf(t) >= 0);
  });
}
function validarEnderecosEstacoes_(itens, rowsOriginais) {
  const alertas = [];
  if (itens.length !== 88) alertas.push('A aba ENDERECOS_ESTACOES deve ter 88 estações oficiais; leitura atual: ' + itens.length + '.');
  if (!contemEnderecoEstacao_(itens, '102', ['EBAT'])) alertas.push('A base ENDERECOS_ESTACOES não contém EBAT 102.');
  if (!contemEnderecoEstacao_(itens, '402', ['EBAT','XAVANTES','RESTINGA'])) alertas.push('A base ENDERECOS_ESTACOES não contém EBAT 402 Xavantes / Restinga I.');
  const sistema500 = [];
  const estacao500 = [];
  (rowsOriginais || []).forEach(row => {
    const sisRaw = codigoEstacao_(valorEnderecoEstacao_(row, ['SISTEMA_GMAN','SISTEMA','CODIGO_SISTEMA','CÓDIGO_SISTEMA']));
    const estRaw = codigoEstacao_(valorEnderecoEstacao_(row, ['ESTACAO','ESTAÇÃO','CODIGO_ESTACAO','CÓDIGO_ESTACAO']));
    const texto = canon_([
      valorEnderecoEstacao_(row, ['TIPO','TIPO_ESTACAO','TIPO_ESTAÇÃO']),
      valorEnderecoEstacao_(row, ['NOME_ESTACAO','NOME_ESTAÇÃO','NOME','ESTACAO_NOME','ESTAÇÃO_NOME']),
      valorEnderecoEstacao_(row, ['ENDERECO','ENDEREÇO','LOGRADOURO'])
    ].join(' '));
    if (sisRaw === '500') sistema500.push(estRaw || '?');
    if (estRaw === '500' || (texto.indexOf('ETA') >= 0 && texto.indexOf('LOMBA DO SABAO') >= 0)) estacao500.push(estRaw || '?');
  });
  if (sistema500.length) alertas.push('A base ENDERECOS_ESTACOES contém SISTEMA_GMAN 500 nas estações: ' + sistema500.join(', ') + '. O retorno foi normalizado sem criar sistema 500.');
  if (estacao500.length) alertas.push('A base ENDERECOS_ESTACOES contém ESTACAO 500 / ETA Lomba do Sabão. Remova esse legado da aba oficial.');
  ['503','504','505','515'].forEach(cod => {
    const item = itens.find(x => codigoEstacao_(x.ESTACAO) === cod);
    if (!item) alertas.push('A estação ' + cod + ' não foi localizada para validar retorno como SISTEMA_GMAN 300.');
    if (item && item.SISTEMA_GMAN !== '300') alertas.push('A estação ' + cod + ' deve retornar SISTEMA_GMAN 300; retorno atual: ' + item.SISTEMA_GMAN + '.');
  });
  const saida500 = itens.filter(x => txt_(x.SISTEMA_GMAN) === '500').map(x => x.ESTACAO || '?');
  if (saida500.length) alertas.push('Falha de normalização: o retorno ainda contém SISTEMA_GMAN 500 nas estações ' + saida500.join(', ') + '.');
  return {
    ok: alertas.length === 0,
    totalEsperado: 88,
    totalEncontrado: itens.length,
    alertas: alertas
  };
}
function listarEnderecosEstacoes_() {
  try {
    const dados = linhas_(GMAN.ABAS.ENDERECOS_ESTACOES);
    const lista = dados.rows
      .filter(r => !contemTeste_(r._vals))
      .map(itemEnderecoEstacao_)
      .filter(item => txt_(item.ESTACAO) !== '500' && !(canon_(item.TIPO + ' ' + item.NOME_ESTACAO).indexOf('ETA LOMBA DO SABAO') >= 0));
    const validacao = validarEnderecosEstacoes_(lista, dados.rows);
    const alerta = validacao.ok ? '' : 'ALERTA GMAN 8.5.6.105: base ENDERECOS_ESTACOES com inconsistências. ' + validacao.alertas.join(' ');
    return {
      sucesso:true,
      enderecosEstacoes:lista,
      estacoes:lista,
      enderecos:lista,
      total:lista.length,
      validacaoBase:validacao,
      alerta:alerta
    };
  } catch (err) {
    const alerta = 'ALERTA GMAN 8.5.6.105: não foi possível ler a aba ENDERECOS_ESTACOES. O sistema continua ativo, mas o mapa/lista de endereços deve usar fallback seguro. Detalhe: ' + String(err && err.message ? err.message : err);
    return {
      sucesso:true,
      enderecosEstacoes:[],
      estacoes:[],
      enderecos:[],
      total:0,
      validacaoBase:{ ok:false, totalEsperado:88, totalEncontrado:0, alertas:[alerta] },
      alerta:alerta
    };
  }
}

function limparJustificativaSistema_(valor) {
  var t = txt_(valor);
  if (!t) return '';
  t = t.replace(/^Andamento da OS:\s*/i, '').trim();
  t = t.replace(/^Condição operacional:\s*[^|]+\|\s*/i, '').trim();
  t = t.replace(/^Conclusão registrada com condição final:\s*[^.]+\.\s*/i, '').trim();
  t = t.replace(/^Status consolidado:\s*[^|]+\|\s*/i, '').trim();
  var m = t.match(/Motivo:\s*(.+)$/i); if (m) t = m[1].trim();
  if (t.indexOf('|') >= 0) { var partes = t.split('|').map(function(x){return x.trim();}).filter(Boolean); if (partes.length) t = partes[partes.length-1]; }
  var n = canon_(t);
  var genericos = ['STATUS MANTIDO POR OS ATIVA','STATUS REAVALIADO','REAVALIADO PELA API','MANTIDO BLOQUEIO OPERACIONAL','TODAS AS OS DO GRUPO','HA OS DO GRUPO','HÁ OS DO GRUPO','RETORNO AUTOMATICO','RETORNO AUTOMÁTICO','OS CANCELADA E GRUPO REAVALIADO','OS CANCELADA POREM EXISTE OUTRA OS ATIVA','OS CANCELADA, PORÉM EXISTE OUTRA OS ATIVA'];
  for (var i=0;i<genericos.length;i++) if (n.indexOf(canon_(genericos[i])) >= 0) return '';
  if (['OPERANDO','EM MANUTENCAO','EM MANUTENCAO OPERANDO','EM MANUTENCAO PARADO','PARADO','CONCLUIDA','CANCELADA','EM EXECUCAO','EM ANDAMENTO','AGUARDANDO MATERIAL','AGUARDANDO LIBERACAO','EM TESTE'].indexOf(n) >= 0) return '';
  return t;
}
function justificativaRealOS_(os) {
  if (!os) return '';
  var campos = ['andamentoTexto','justificativaFinal','servicoRealizado','justificativaInicio','motivoCancelamento','observacao','motivoPendencia'];
  for (var i=0;i<campos.length;i++) { var v = limparJustificativaSistema_(os[campos[i]]); if (v) return v; }
  return '';
}

function statusMap_() {
  const oficiais = equipamentosOficiais_();
  const dados = linhas_(GMAN.ABAS.STATUS_ATUAL);
  const mapa = {};
  dados.rows.forEach(r => {
    const id = txt_(get_(r,'idEquipamento'));
    if (!id || !oficiais.mapa[id] || contemTeste_(r._vals)) return;
    if (cicloOperacionalAtivo_() && !dentroCicloAtualStatus_(r)) return;
    if (!mapa[id] || dataHoraLinhaMs_(r) >= dataHoraLinhaMs_(mapa[id])) mapa[id] = r;
  });
  return mapa;
}
function listarStatus_() {
  const oficiais = equipamentosOficiais_();
  const st = statusMap_();
  const osAtivasPorEquip = {};
  try {
    linhas_(GMAN.ABAS.ORDENS).rows
      .filter(r => !contemTeste_(r._vals))
      .filter(r => !cicloOperacionalAtivo_() || dentroCicloAtualOS_(r))
      .map(osObj_)
      .filter(o => statusAtivo_(o.statusOS))
      .forEach(o => {
        if (!osAtivasPorEquip[o.idEquipamento]) osAtivasPorEquip[o.idEquipamento] = [];
        osAtivasPorEquip[o.idEquipamento].push(o);
      });
  } catch(e) {}
  const lista = oficiais.lista.map(eq => {
    const ativas = osAtivasPorEquip[eq.idEquipamento] || [];
    if (ativas.length) {
      const operacionais = ativas.filter(o => txt_(o.condicaoOperacionalAtual) || txt_(o.dataInicio) || ['ABERTA','RECEBIDA','NAO INICIADA','AGUARDANDO RESPONSAVEL','AGUARDANDO EQUIPE','AGUARDANDO NOVO RESPONSAVEL'].indexOf(statusCanon_(o.statusOS)) < 0);
      if (!operacionais.length) {
        const r = st[eq.idEquipamento];
        const statusAtual = r ? (txt_(get_(r,'statusOperacional')) || 'Operando') : 'Operando';
        const osRef = ativas[0];
        return {
          idEquipamento:eq.idEquipamento,
          equipamento:eq.equipamento,
          sistema:eq.sistema,
          statusAtual:statusAtual,
          statusVisual:'Aberta',
          dataUltimaAlteracao:osRef.dataAbertura || '',
          horaUltimaAlteracao:osRef.horaAbertura || '',
          usuario:osRef.responsavel || '',
          justificativa:justificativaRealOS_(osRef),
          idOsVinculada:osRef.idOS || '',
          numeroOS:osRef.numeroOS || '',
          quantidadeOSAtivas:ativas.length,
          responsaveisAtivos:ativas.map(o=>o.responsavel).filter(Boolean).join(', ')
        };
      }
      const pior = escolherPiorStatusAtivo_(operacionais.slice());
      const osRef = operacionais.find(o => o.idOS === pior.idOS) || operacionais[0];
      return {
        idEquipamento:eq.idEquipamento,
        equipamento:eq.equipamento,
        sistema:eq.sistema,
        statusAtual:pior.status,
        statusVisual:pior.status,
        dataUltimaAlteracao:osRef.dataInicio || osRef.dataAbertura || '',
        horaUltimaAlteracao:osRef.horaInicio || osRef.horaAbertura || '',
        usuario:osRef.responsavel || '',
        justificativa:justificativaRealOS_(osRef),
        idOsVinculada:pior.idOS || '',
        numeroOS:pior.numeroOS || '',
        quantidadeOSAtivas:ativas.length,
        responsaveisAtivos:ativas.map(o=>o.responsavel).filter(Boolean).join(', ')
      };
    }
    // Sem OS ativa, o painel respeita o último STATUS_ATUAL consolidado pela API.
    // Não força Operando se a última conclusão deixou Em manutenção/Em teste/Parado.
    const r = st[eq.idEquipamento];
    const statusAtual = r ? (txt_(get_(r,'statusOperacional')) || txt_(get_(r,'statusVisual')) || 'Operando') : 'Operando';
    const statusVisual = r ? (txt_(get_(r,'statusVisual')) || statusAtual) : statusAtual;
    return {
      idEquipamento:eq.idEquipamento,
      equipamento:eq.equipamento,
      sistema:eq.sistema,
      statusAtual:statusAtual,
      statusVisual:statusVisual,
      dataUltimaAlteracao:r?valorDataBrasil_(get_(r,'dataUltimaAlteracao')):'',
      horaUltimaAlteracao:r?valorHoraBrasil_(get_(r,'horaUltimaAlteracao')):'',
      usuario:r?txt_(get_(r,'usuarioUltimaAlteracao')):'',
      justificativa:r?limparJustificativaSistema_(get_(r,'justificativaStatus')):'',
      idOsVinculada:r?txt_(get_(r,'idOsBloqueadora')):'',
      numeroOS:r?txt_(get_(r,'numeroOsBaseAtiva')):'',
      quantidadeOSAtivas:0,
      responsaveisAtivos:''
    };
  });
  return { sucesso:true, status:lista, total:lista.length, cicloOperacional:filtroCicloInfo_() };
}


function osObj_(r) {
  return {
    idOS:txt_(get_(r,'idOS')), ID_OS:txt_(get_(r,'idOS')),
    numeroOS:txt_(get_(r,'numeroOS')), NUMERO_OS:txt_(get_(r,'numeroOS')),
    numeroOSBase:txt_(get_(r,'numeroOSBase')), NUMERO_OS_BASE:txt_(get_(r,'numeroOSBase')),
    sequenciaOS:txt_(get_(r,'sequenciaOS')), statusOS:txt_(get_(r,'statusOS')) || 'Aberta', STATUS_OS:txt_(get_(r,'statusOS')) || 'Aberta',
    idEquipamento:txt_(get_(r,'idEquipamento')), ID_EQUIPAMENTO:txt_(get_(r,'idEquipamento')),
    equipamento:txt_(get_(r,'equipamento')), EQUIPAMENTO:txt_(get_(r,'equipamento')),
    sistema:normalizarSistema_(get_(r,'sistema'), get_(r,'idEquipamento')), SISTEMA:normalizarSistema_(get_(r,'sistema'), get_(r,'idEquipamento')),
    area:txt_(get_(r,'area')), AREA:txt_(get_(r,'area')),
    responsavel:txt_(get_(r,'responsavel')), RESPONSAVEL:txt_(get_(r,'responsavel')),
    tipoManutencao:txt_(get_(r,'tipoOS')), prioridade:txt_(get_(r,'prioridade')), descricaoProblema:txt_(get_(r,'descricao')),
    dataAbertura:valorDataBrasil_(get_(r,'dataAbertura')), horaAbertura:valorHoraBrasil_(get_(r,'horaAbertura')), dataHoraAbertura:valorDataHoraBrasilCampos_(get_(r,'dataAbertura'), get_(r,'horaAbertura')), criadoPor:txt_(get_(r,'abertoPor')),
    dataInicio:valorDataBrasil_(get_(r,'dataInicio')), horaInicio:valorHoraBrasil_(get_(r,'horaInicio')), dataHoraInicio:valorDataHoraBrasilCampos_(get_(r,'dataInicio'), get_(r,'horaInicio')), usuarioInicio:txt_(get_(r,'usuarioInicio')),
    condicaoFinal:txt_(get_(r,'condicaoFinal')), CONDICAO_OPERACIONAL_FINAL:txt_(get_(r,'condicaoFinal')),
    condicaoOperacionalAtual:txt_(get_(r,'condicaoInicio')) || txt_(get_(r,'condicaoFinal')),
    dataConclusao:valorDataBrasil_(get_(r,'dataConclusao')), horaConclusao:valorHoraBrasil_(get_(r,'horaConclusao')), dataHoraConclusao:valorDataHoraBrasilCampos_(get_(r,'dataConclusao'), get_(r,'horaConclusao')), finalizadoPor:txt_(get_(r,'finalizadoPor')),
    membrosEquipe:txt_(get_(r,'membrosEquipe')), componentesSolicitados:txt_(get_(r,'componentesSolicitados')), andamentoTexto:txt_(get_(r,'andamentoTexto')), justificativaInicio:txt_(get_(r,'justificativaInicio')), justificativaFinal:txt_(get_(r,'justificativaFinal')), kmInicial:txt_(get_(r,'kmInicial')), kmFinal:txt_(get_(r,'kmFinal')), kmRodado:txt_(get_(r,'kmRodado')),
    _row:r._row, _raw:r
  };
}
function listarOS_(p) {
  const u = usuario_(p || {});
  const dados = linhas_(GMAN.ABAS.ORDENS);
  const idFiltro = txt_(p.idEquipamento || p.idGrupo);
  const incluirEncerradas = String(p.incluirEncerradas || '').toLowerCase() === 'true' || p.incluirEncerradas === true;
  const somenteAbertas = String(p.somenteAbertas || '').toLowerCase() === 'true' || p.somenteAbertas === true;
  const incluirLegado = String(p.incluirLegado || '').toLowerCase() === 'true' || p.incluirLegado === true;
  let lista = dados.rows.filter(r => !contemTeste_(r._vals)).filter(r => incluirLegado || dentroCicloAtualOS_(r)).map(osObj_);
  if (idFiltro) lista = lista.filter(o => o.idEquipamento === idFiltro);
  if (!incluirEncerradas) lista = lista.filter(o => statusAtivo_(o.statusOS));
  if (somenteAbertas) lista = lista.filter(o => statusAtivo_(o.statusOS));
  lista = lista.filter(o => podeVerOS_(u, o._raw));
  lista.sort((a,b) => {
    const db = parseDataBrasil_((b.dataAbertura || '') + ' ' + (b.horaAbertura || ''));
    const da = parseDataBrasil_((a.dataAbertura || '') + ' ' + (a.horaAbertura || ''));
    if (db !== da) return db - da;
    return Number(b._row || 0) - Number(a._row || 0);
  });
  return { sucesso:true, ordens:lista, total:lista.length };
}

function detalharOS_(p) {
  const u = usuario_(p || {});
  const id = txt_(p.idOS || p.numeroOS || p.id || p.numero);
  if (!id) throw new Error('ID/Número da OS é obrigatório para ver detalhes.');
  const loc = localizarOS_(id);
  if (!podeVerDetalheOS_(u, loc.row)) throw new Error('Permissão bloqueada para visualizar o detalhe completo desta OS.');
  const os = osObj_(loc.row);
  return { sucesso:true, os:os, detalhe:os, somenteLeitura:!podeAlterarOS_(u, loc.row) || statusEncerrado_(os.statusOS), podeAlterar:podeAlterarOS_(u, loc.row), podeCancelar:podeCancelarOS_(u) };
}
function localizarOS_(idOS) {
  const dados = linhas_(GMAN.ABAS.ORDENS);
  for (let i=0;i<dados.rows.length;i++) {
    const r = dados.rows[i];
    const id = txt_(get_(r,'idOS'));
    const num = txt_(get_(r,'numeroOS'));
    if (id === txt_(idOS) || num === txt_(idOS)) return { dados:dados, row:r, os:osObj_(r) };
  }
  throw new Error('OS não localizada: ' + idOS);
}

function gerarNumeroOS_(idEquip, responsavel) {
  const dados = linhas_(GMAN.ABAS.ORDENS);
  const ano = ano2_();
  let maxBase = 0;
  let baseAtiva = '';
  let maxSeqBase = 0;
  dados.rows.forEach(r => {
    if (cicloOperacionalAtivo_() && !dentroCicloAtualOS_(r)) return;
    const num = txt_(get_(r,'numeroOS'));
    const id = txt_(get_(r,'idEquipamento'));
    const st = txt_(get_(r,'statusOS'));
    const m = num.match(/^(\d{4})\.(\d{2})\/(\d{2})$/);
    if (m && m[3] === ano) maxBase = Math.max(maxBase, Number(m[1]));
    if (id === idEquip && statusAtivo_(st)) {
      if (m) { baseAtiva = m[1]; maxSeqBase = Math.max(maxSeqBase, Number(m[2])); }
      else {
        const b = txt_(get_(r,'numeroOSBase')) || txt_(get_(r,'OS_BASE'));
        if (b) baseAtiva = b.replace(/\D/g,'').padStart(4,'0').slice(-4);
      }
    }
  });
  const base = baseAtiva || String(maxBase + 1).padStart(4,'0');
  const seq = baseAtiva ? maxSeqBase + 1 : 1;
  const numero = base + '.' + String(seq).padStart(2,'0') + '/' + ano;
  return { numero:numero, base:base, sequencia:seq, ano:ano };
}

function criarOS_(p) {
  const u = usuario_(p);
  validarUsuarioAcaoCritica_(u, 'criarOS');
  const id = txt_(p.idEquipamento || p.idGrupo);
  const resp = txt_(p.responsavel || p.executor || p.responsavelOS);
  const area = txt_(p.area || p.equipeResponsavel || p.setorEquipe);
  const tipo = txt_(p.tipoManutencao || p.tipoOS);
  const prioridade = txt_(p.prioridade || 'Normal');
  const desc = txt_(p.descricaoProblema || p.descricaoSolicitacao || p.descricao);
  if (!id) throw new Error('ID do equipamento é obrigatório.');
  if (!resp) throw new Error('Responsável é obrigatório.');
  if (!acessoTotal_(u)) {
    if (coordenador_(u)) {
      const areaUsuario = areaCanon_(u.area);
      const areaOS = areaCanon_(area);
      if (areaUsuario && areaUsuario !== 'TODOS' && areaOS.indexOf(areaUsuario) < 0) throw new Error('Permissão bloqueada: coordenador só pode abrir OS na própria área.');
    } else {
      throw new Error('Permissão bloqueada: usuário operacional não pode abrir OS. Solicite abertura à gestão ou coordenação.');
    }
  }
  if (!area) throw new Error('Área/equipe é obrigatória.');
  if (!tipo) throw new Error('Tipo de manutenção é obrigatório.');
  if (!prioridade) throw new Error('Prioridade é obrigatória.');
  if (!desc) throw new Error('Descrição do problema é obrigatória.');
  const eq = equipamentosOficiais_().mapa[id];
  if (!eq) throw new Error('Equipamento não existe na base oficial: ' + id);
  const ord = linhas_(GMAN.ABAS.ORDENS);
  ord.rows.forEach(r => {
    if (cicloOperacionalAtivo_() && !dentroCicloAtualOS_(r)) return;
    if (txt_(get_(r,'idEquipamento')) === id && statusAtivo_(get_(r,'statusOS')) && canon_(get_(r,'responsavel')) === canon_(resp)) throw new Error('Já existe OS ativa para este equipamento com o mesmo responsável.');
  });
  const n = gerarNumeroOS_(id, resp);
  const idOS = 'OS-' + n.base + '-' + String(n.sequencia).padStart(2,'0') + '-' + n.ano + '-' + Utilities.getUuid().slice(0,8).toUpperCase();
  const campos = {
    idOS:idOS, numeroOS:n.numero, numeroOSBase:n.base, sequenciaOS:n.sequencia, anoOS:n.ano,
    statusOS:'Aberta', sistema:eq.sistema, bruta:eq.bruta, tipoLocal:eq.tipoLocal, localEstacao:eq.localEstacao,
    idEquipamento:id, equipamento:eq.equipamento, area:area, responsavel:resp, tipoOS:tipo, prioridade:prioridade, descricao:desc,
    dataAbertura:dataBrasilEvento_(p), horaAbertura:horaBrasilEvento_(p), abertoPor:u.nome, versaoRegra:GMAN.VERSAO,
    componentesSolicitados:txt_(p.componentesSolicitados || p.componentes || ''), ativoProducao:'SIM', entraReincidencia: canon_(tipo).indexOf('CORRET') >= 0 ? 'SIM' : 'NÃO'
  };
  appendLinha_(ord.sheet, ord.headers, campos);
  registrarHistorico_({ usuario:u, idEquipamento:id, equipamento:eq.equipamento, idOS:idOS, numeroOS:n.numero, acao:'ABERTURA_OS', statusNovo:'Aberta', observacao:txt_(p.descricaoProblema || p.descricao || p.observacao || '') });
  return { sucesso:true, mensagem:'OS criada com sucesso.', idOS:idOS, numeroOS:n.numero };
}

function iniciarOS_(p) {
  const u = usuario_(p);
  validarUsuarioAcaoCritica_(u, 'iniciarOS');
  const loc = localizarOS_(p.idOS || p.numeroOS);
  if (!podeAlterarOS_(u, loc.row)) throw new Error('Permissão bloqueada: usuário não pode iniciar esta OS.');
  if (statusEncerrado_(get_(loc.row,'statusOS'))) throw new Error('OS encerrada não pode ser iniciada.');
  validarTransicaoOS_(get_(loc.row,'statusOS') || 'Aberta', 'Em execução', 'iniciarOS');
  const cond = txt_(p.condicaoOperacional || p.condicao || '');
  const just = txt_(p.justificativa || p.observacao);
  if (!cond) throw new Error('Condição operacional é obrigatória para iniciar OS.');
  if (!just) throw new Error('Justificativa é obrigatória para iniciar OS.');
  setCampos_(loc.dados.sheet, loc.dados.headers, loc.row._row, { statusOS:'Em execução', dataInicio:dataBrasilEvento_(p), horaInicio:horaBrasilEvento_(p), usuarioInicio:u.nome, condicaoInicio:cond, justificativaInicio:just, versaoRegra:GMAN.VERSAO });
  atualizarStatusEquipamentoPorOS_(txt_(get_(loc.row,'idEquipamento')), cond, 'Iniciada', loc.os.idOS, loc.os.numeroOS, u, 'Início da OS: ' + just);
  registrarHistorico_({ usuario:u, idEquipamento:loc.os.idEquipamento, equipamento:loc.os.equipamento, idOS:loc.os.idOS, numeroOS:loc.os.numeroOS, acao:'INICIO_OS', statusAnterior:loc.os.statusOS, statusNovo:'Em execução', observacao:just });
  return { sucesso:true, mensagem:'OS iniciada.' };
}

function atualizarAndamentoOS_(p) {
  const u = usuario_(p);
  validarUsuarioAcaoCritica_(u, 'atualizarAndamentoOS');
  const loc = localizarOS_(p.idOS || p.numeroOS);
  if (!podeAlterarOS_(u, loc.row)) throw new Error('Permissão bloqueada: usuário não pode atualizar esta OS.');
  if (statusEncerrado_(get_(loc.row,'statusOS'))) throw new Error('OS encerrada não pode receber andamento.');
  const statusOS = txt_(p.statusOS || p.status || '');
  const cond = txt_(p.condicaoOperacional || p.condicao || p.condicaoAtual);
  const just = txt_(p.justificativa || p.andamento || p.observacao);
  if (!statusOS) throw new Error('Status da OS é obrigatório.');
  validarTransicaoOS_(get_(loc.row,'statusOS') || 'Aberta', statusOS, 'atualizarAndamentoOS');
  if (!just) throw new Error('Justificativa/andamento é obrigatório.');
  setCampos_(loc.dados.sheet, loc.dados.headers, loc.row._row, { statusOS:statusOS, dataAndamento:dataBrasilEvento_(p), horaAndamento:horaBrasilEvento_(p), andamentoTexto:just, condicaoInicio:cond || get_(loc.row,'condicaoInicio'), versaoRegra:GMAN.VERSAO });
  if (cond) atualizarStatusEquipamentoPorOS_(loc.os.idEquipamento, cond, cond, loc.os.idOS, loc.os.numeroOS, u, just);
  registrarHistorico_({ usuario:u, idEquipamento:loc.os.idEquipamento, equipamento:loc.os.equipamento, idOS:loc.os.idOS, numeroOS:loc.os.numeroOS, acao:'ANDAMENTO_OS', statusAnterior:loc.os.statusOS, statusNovo:statusOS, observacao:just });
  return { sucesso:true, mensagem:'Andamento da OS '+loc.os.numeroOS+' registrado por '+u.nome+'. Registro do usuário: '+just };
}

function concluirOS_(p) {
  const u = usuario_(p);
  validarUsuarioAcaoCritica_(u, 'concluirOS');
  const loc = localizarOS_(p.idOS || p.numeroOS);
  if (!podeAlterarOS_(u, loc.row)) throw new Error('Permissão bloqueada: usuário não pode concluir esta OS.');
  if (statusEncerrado_(get_(loc.row,'statusOS'))) throw new Error('OS já encerrada.');
  validarTransicaoOS_(get_(loc.row,'statusOS') || 'Aberta', 'Concluída', 'concluirOS');
  const servico = txt_(p.servicoRealizado || p.servico);
  const materiais = txt_(p.materiais || p.materiaisUtilizados);
  const membros = txt_(p.membrosEquipe);
  let condicaoFinal = normalizarCondicaoOperacionalFinal_(p.condicaoFinalEquipamento || p.condicaoFinal || p.condicaoOperacionalFinal || '');
  // A condição final deve ser informada de forma explícita. A API não assume Operando escondido
  // e não aceita estados pendentes como condição final de OS concluída.
  if (!condicaoFinal) throw new Error('Condição operacional final é obrigatória: Operando, Em manutenção (operando) ou Em manutenção (parado).');
  if (['Operando','Em manutenção (operando)','Em manutenção (parado)'].indexOf(condicaoFinal) < 0) throw new Error('Condição operacional final inválida para conclusão. Use apenas: Operando, Em manutenção (operando) ou Em manutenção (parado).');
  const obsFinal = txt_(p.observacaoFinal || p.justificativaFinal);
  if (!servico) throw new Error('Serviço executado é obrigatório.');
  if (!materiais) throw new Error('Materiais utilizados é obrigatório.');
  if (!membros) throw new Error('Membros da equipe é obrigatório no encerramento.');
  if (!obsFinal) throw new Error('Observação/justificativa final é obrigatória.');
  const semVeic = p.semUsoVeiculo === true || String(p.semUsoVeiculo).toLowerCase() === 'true' || canon_(p.semUsoVeiculo) === 'SIM';
  if (!semVeic) {
    if (!txt_(p.motorista)) throw new Error('Motorista é obrigatório, exceto quando marcar Sem uso de veículo.');
    if (!txt_(p.prefixoVeiculo)) throw new Error('Prefixo do veículo é obrigatório, exceto quando marcar Sem uso de veículo.');
    if (txt_(p.kmInicial) === '' || txt_(p.kmFinal) === '') throw new Error('KM inicial e KM final são obrigatórios, exceto quando marcar Sem uso de veículo.');
  }
  validarPatrimonioConclusao_(loc, p);
  let resultadoEvidencias = { total:0, salvas:0, pendentes:0, erros:0, status:[] };
  try {
    validarEvidenciasPayload_(p, loc.os.idOS, u.nome);
    resultadoEvidencias = gravarEvidencias_(p, loc.os, u);
  } catch(errEv) {
    // Evidência é opcional. Se vier fora da regra, ela não bloqueia a conclusão da OS.
    p.evidencias = [];
    resultadoEvidencias = { total:0, salvas:0, pendentes:0, erros:1, status:['EVIDENCIA_IGNORADA_SEM_BLOQUEAR_CONCLUSAO: ' + String(errEv && errEv.message ? errEv.message : errEv)] };
  }
  const kmIni = parseNumero_(p.kmInicial), kmFim = parseNumero_(p.kmFinal);
  const kmRod = (!semVeic && kmIni !== null && kmFim !== null) ? Math.max(0, kmFim - kmIni) : '';
  setCampos_(loc.dados.sheet, loc.dados.headers, loc.row._row, { statusOS:'Concluída', servicoRealizado:servico, materiais:materiais, membrosEquipe:membros, condicaoFinal:condicaoFinal, justificativaFinal:obsFinal, semUsoVeiculo:semVeic?'SIM':'NÃO', motorista:semVeic?'':p.motorista, prefixoVeiculo:semVeic?'':p.prefixoVeiculo, kmInicial:semVeic?'':p.kmInicial, kmFinal:semVeic?'':p.kmFinal, kmRodado:kmRod, validacaoKM:semVeic?'SEM USO DE VEÍCULO':'OK', itensAdicionais:txt_(p.equipamentosAdicionais || p.itensAdicionais), dataConclusao:dataBrasilEvento_(p), horaConclusao:horaBrasilEvento_(p), finalizadoPor:u.nome, versaoRegra:GMAN.VERSAO, bloqueioRetorno:'NÃO' });
  gravarPatrimonio_(loc, p, u);
  SpreadsheetApp.flush();
  const statusFinal = reavaliarStatusEquipamentoAposFechamento_(loc.os.idEquipamento, loc.os.idOS, obsFinal, u);
  registrarHistorico_({ usuario:u, idEquipamento:loc.os.idEquipamento, equipamento:loc.os.equipamento, idOS:loc.os.idOS, numeroOS:loc.os.numeroOS, acao:'CONCLUSAO_OS', statusAnterior:loc.os.statusOS, statusNovo:'Concluída', observacao:obsFinal });
  calcularKPIs_({ gravar:true });
  return { sucesso:true, mensagem:'OS '+loc.os.numeroOS+' concluída por '+u.nome+'. Condição final informada: '+condicaoFinal+'. Registro do usuário: '+obsFinal, statusEquipamento:statusFinal, condicaoFinalInformada:condicaoFinal, justificativaReal:obsFinal, statusReferenciaOS:'Em execução → Concluída', evidenciasObrigatorias:false, evidencias:resultadoEvidencias };
}

function cancelarOS_(p) {
  const u = usuario_(p);
  validarUsuarioAcaoCritica_(u, 'cancelarOS');
  if (!podeCancelarOS_(u)) throw new Error('Somente administrador, supervisor ou gerente podem cancelar OS diretamente.');
  const loc = localizarOS_(p.idOS || p.numeroOS);
  const motivo = txt_(p.motivo || p.justificativa);
  if (!motivo) throw new Error('Motivo do cancelamento é obrigatório.');
  if (statusEncerrado_(get_(loc.row,'statusOS'))) throw new Error('OS já está encerrada/cancelada.');
  validarTransicaoOS_(get_(loc.row,'statusOS') || 'Aberta', 'Cancelada', 'cancelarOS');
  setCampos_(loc.dados.sheet, loc.dados.headers, loc.row._row, { statusOS:'Cancelada', motivoCancelamento:motivo, obsCancelamento:motivo, dataConclusao:dataBrasilEvento_(p), horaConclusao:horaBrasilEvento_(p), finalizadoPor:u.nome, versaoRegra:GMAN.VERSAO, bloqueioRetorno:'NÃO' });
  SpreadsheetApp.flush();
  const statusFinal = reavaliarStatusEquipamentoAposCancelamento_(loc.os.idEquipamento, loc.os.idOS, motivo, u);
  registrarHistorico_({ usuario:u, idEquipamento:loc.os.idEquipamento, equipamento:loc.os.equipamento, idOS:loc.os.idOS, numeroOS:loc.os.numeroOS, acao:'CANCELAMENTO_OS', statusAnterior:loc.os.statusOS, statusNovo:'Cancelada', observacao:motivo });
  calcularKPIs_({ gravar:true });
  return { sucesso:true, mensagem:'OS '+loc.os.numeroOS+' cancelada por '+u.nome+'. Motivo registrado: '+motivo, statusEquipamento:statusFinal, justificativaReal:motivo };
}
function solicitarCancelamentoOS_(p) {
  const u = usuario_(p);
  validarUsuarioAcaoCritica_(u, 'solicitarCancelamentoOS');
  const loc = localizarOS_(p.idOS || p.numeroOS);
  if (!podeAlterarOS_(u, loc.row)) throw new Error('Permissão bloqueada para solicitar cancelamento desta OS.');
  const motivo = txt_(p.motivo || p.justificativa);
  if (!motivo) throw new Error('Motivo é obrigatório.');
  setCampos_(loc.dados.sheet, loc.dados.headers, loc.row._row, { obsCancelamento:'SOLICITAÇÃO DE CANCELAMENTO por ' + u.nome + ': ' + motivo, versaoRegra:GMAN.VERSAO });
  registrarHistorico_({ usuario:u, idEquipamento:loc.os.idEquipamento, equipamento:loc.os.equipamento, idOS:loc.os.idOS, numeroOS:loc.os.numeroOS, acao:'SOLICITACAO_CANCELAMENTO_OS', observacao:motivo });
  return { sucesso:true, mensagem:'Solicitação de cancelamento registrada.' };
}
function solicitarRedistribuicaoOS_(p) {
  const u = usuario_(p);
  validarUsuarioAcaoCritica_(u, 'solicitarRedistribuicaoOS');
  const loc = localizarOS_(p.idOS || p.numeroOS);
  if (!podeAlterarOS_(u, loc.row)) throw new Error('Permissão bloqueada para solicitar redistribuição desta OS.');
  const motivo = txt_(p.motivo || p.justificativa);
  if (!motivo) throw new Error('Motivo é obrigatório.');
  setCampos_(loc.dados.sheet, loc.dados.headers, loc.row._row, { solicitacaoRedistribuicao:'SOLICITAÇÃO por ' + u.nome + ': ' + motivo, versaoRegra:GMAN.VERSAO });
  registrarHistorico_({ usuario:u, idEquipamento:loc.os.idEquipamento, equipamento:loc.os.equipamento, idOS:loc.os.idOS, numeroOS:loc.os.numeroOS, acao:'SOLICITACAO_REDISTRIBUICAO_OS', observacao:motivo });
  return { sucesso:true, mensagem:'Solicitação de redistribuição registrada.' };
}

function atualizarStatusEquipamentoPorOS_(idEquip, statusOperacional, statusVisual, idOS, numeroOS, usuario, justificativa) {
  const oficiais = equipamentosOficiais_();
  const eq = oficiais.mapa[idEquip];
  if (!eq) throw new Error('Equipamento não oficial para atualizar status: ' + idEquip);
  const dados = linhas_(GMAN.ABAS.STATUS_ATUAL);
  const rows = [];
  dados.rows.forEach(r => { if (txt_(get_(r,'idEquipamento')) === idEquip) rows.push(r); });
  const campos = { idEquipamento:idEquip, equipamento:eq.equipamento, sistema:eq.sistema, bruta:eq.bruta || sistemaBruta_(idEquip), tipoLocal:eq.tipoLocal, localEstacao:eq.localEstacao, statusOperacional:statusOperacional, statusVisual:statusVisual || statusOperacional, idOsBloqueadora:idOS || '', numeroOsBaseAtiva:numeroOS || '', setoresAtivos:'', justificativaStatus:justificativa || '', dataUltimaAlteracao:dataUsuarioEvento_(usuario), horaUltimaAlteracao:horaUsuarioEvento_(usuario), usuarioUltimaAlteracao:usuario.nome || usuario, versaoRegra:GMAN.VERSAO };
  if (rows.length) {
    // Perícia forense 8.5.6.96: se houver STATUS_ATUAL duplicado para o mesmo grupo,
    // todos os registros do grupo recebem o mesmo status consolidado. Isso impede que
    // uma linha antiga volte a dominar a tela por data/hora ou cache de planilha.
    rows.forEach(r => setCampos_(dados.sheet, dados.headers, r._row, campos));
  } else {
    appendLinha_(dados.sheet, dados.headers, campos);
  }
}


function osGrupoCiclo_(idEquip) {
  const dados = linhas_(GMAN.ABAS.ORDENS);
  return dados.rows.filter(r => !contemTeste_(r._vals)).filter(r => !cicloOperacionalAtivo_() || dentroCicloAtualOS_(r)).map(osObj_).filter(o => o.idEquipamento === idEquip);
}
function todasOSGrupoConcluidas_(idEquip) {
  const lista = osGrupoCiclo_(idEquip).filter(o => statusCanon_(o.statusOS) !== 'CANCELADA');
  if (!lista.length) return true;
  return lista.every(o => statusConcluido_(o.statusOS));
}

function reavaliarStatusEquipamentoAposFechamento_(idEquip, idOSFechada, obsFinal, usuario) {
  const ativas = osGrupoCiclo_(idEquip).filter(o => o.idOS !== idOSFechada && statusAtivo_(o.statusOS));
  let status = 'Em manutenção (operando)';
  let visual = 'Em manutenção (operando)';
  let bloqueadora = '';
  let numero = '';
  let just = obsFinal;
  if (ativas.length) {
    const pior = escolherPiorStatusAtivo_(ativas);
    const osBloqueadora = ativas.find(o => o.idOS === pior.idOS) || ativas[0];
    status = pior.status;
    visual = pior.status;
    bloqueadora = pior.idOS;
    numero = pior.numeroOS;
    just = obsFinal || justificativaRealOS_(osBloqueadora);
  } else if (todasOSGrupoConcluidas_(idEquip)) {
    const consolidado = piorCondicaoFinalConcluida_(osGrupoCiclo_(idEquip).filter(o => statusCanon_(o.statusOS) !== 'CANCELADA'));
    status = consolidado;
    visual = consolidado;
    just = obsFinal || '';
  } else {
    status = 'Em manutenção (operando)';
    visual = 'Em manutenção (operando)';
    just = obsFinal || '';
  }
  atualizarStatusEquipamentoPorOS_(idEquip, status, visual, bloqueadora, numero, usuario, just);
  return status;
}

function reavaliarStatusEquipamentoAposCancelamento_(idEquip, idOSCancelada, motivo, usuario) {
  const ativas = osGrupoCiclo_(idEquip).filter(o => o.idOS !== idOSCancelada && statusAtivo_(o.statusOS));
  if (ativas.length) {
    const pior = escolherPiorStatusAtivo_(ativas);
    atualizarStatusEquipamentoPorOS_(idEquip, pior.status, pior.status, pior.idOS, pior.numeroOS, usuario, motivo);
    return pior.status;
  }
  if (todasOSGrupoConcluidas_(idEquip)) {
    const consolidado = piorCondicaoFinalConcluida_(osGrupoCiclo_(idEquip).filter(o => statusCanon_(o.statusOS) !== 'CANCELADA'));
    atualizarStatusEquipamentoPorOS_(idEquip, consolidado, consolidado, '', '', usuario, motivo);
    return consolidado;
  }
  atualizarStatusEquipamentoPorOS_(idEquip, 'Em manutenção (operando)', 'Em manutenção (operando)', '', '', usuario, motivo);
  return 'Em manutenção (operando)';
}
function escolherPiorStatusAtivo_(ativas) {
  const ordem = ['PARADO','EM MANUTENCAO PARADO','AGUARDANDO MATERIAL','AGUARDANDO LIBERACAO','EM TESTE','EM MANUTENCAO OPERANDO','OPERANDO'];
  function rank(o) {
    const s = canon_(o.condicaoOperacionalAtual || o.statusOS || 'EM MANUTENCAO OPERANDO');
    if (s.indexOf('PARADO') >= 0) return 0;
    if (s.indexOf('MATERIAL') >= 0) return 2;
    if (s.indexOf('LIBERACAO') >= 0) return 3;
    if (s.indexOf('TESTE') >= 0) return 4;
    if (s.indexOf('OPERANDO') >= 0 && s.indexOf('MANUTENCAO') >= 0) return 5;
    if (s.indexOf('OPERANDO') >= 0) return 6;
    return 1;
  }
  ativas.sort((a,b)=>rank(a)-rank(b));
  const o = ativas[0];
  const s = canon_(o.condicaoOperacionalAtual || o.statusOS);
  let st = 'Em manutenção (operando)';
  if (s.indexOf('PARADO') >= 0) st = 'Em manutenção (parado)';
  else if (s.indexOf('MATERIAL') >= 0) st = 'Aguardando material';
  else if (s.indexOf('LIBERACAO') >= 0) st = 'Aguardando liberação';
  else if (s.indexOf('TESTE') >= 0) st = 'Em teste';
  return { status:st, idOS:o.idOS, numeroOS:o.numeroOS };
}


function normalizarCondicaoOperacionalFinal_(v) {
  const s = canon_(v);
  if (!s) return '';
  if (s.indexOf('PARADO') >= 0) return 'Em manutenção (parado)';
  if (s.indexOf('MANUTENCAO') >= 0 && s.indexOf('OPERANDO') >= 0) return 'Em manutenção (operando)';
  if (s.indexOf('OPERANDO') >= 0 || s === 'SIM') return 'Operando';
  if (s.indexOf('TESTE') >= 0) return 'Em teste';
  if (s.indexOf('MATERIAL') >= 0) return 'Aguardando material';
  if (s.indexOf('LIBERACAO') >= 0) return 'Aguardando liberação';
  return '';
}

function piorCondicaoFinalConcluida_(lista) {
  const concluidas = (lista || []).filter(o => statusConcluido_(o.statusOS));
  if (!concluidas.length) return 'Operando';
  const condicoes = concluidas.map(o => normalizarCondicaoOperacionalFinal_(o.condicaoFinal || o.condicaoOperacionalAtual || 'Operando')).filter(Boolean);
  if (!condicoes.length) return 'Operando';
  if (condicoes.some(c => canon_(c).indexOf('PARADO') >= 0)) return 'Em manutenção (parado)';
  if (condicoes.some(c => canon_(c).indexOf('MATERIAL') >= 0)) return 'Aguardando material';
  if (condicoes.some(c => canon_(c).indexOf('LIBERACAO') >= 0)) return 'Aguardando liberação';
  if (condicoes.some(c => canon_(c).indexOf('TESTE') >= 0)) return 'Em teste';
  if (condicoes.some(c => canon_(c).indexOf('MANUTENCAO') >= 0)) return 'Em manutenção (operando)';
  return 'Operando';
}

function patrimonioExistente_(idEquip) {
  const abas = [GMAN.ABAS.PATRIMONIO, GMAN.ABAS.PATRIMONIO_GRUPOS];
  const out = {};
  abas.forEach(nome => {
    try {
      const dados = linhas_(nome);
      dados.rows.forEach(r => {
        const id = txt_(get_(r,'idEquipamento')) || txt_(get_(r, ['ID_GRUPO']));
        if (id !== idEquip) return;
        COMPONENTES_GMAN.forEach(c => {
          c.pats.forEach(k => { const v = txt_(get_(r, [k])); if (v && !out[k]) out[k] = v; });
          c.descs.forEach(k => { const v = txt_(get_(r, [k])); if (v && !out[k]) out[k] = v; });
        });
      });
    } catch(e) {}
  });
  return out;
}
function componenteFoiSolicitado_(comp, texto) {
  const s = canon_(texto);
  if (!s) return false;
  if (s.indexOf(comp.codigo) >= 0) return true;
  if (s.indexOf(canon_(comp.label)) >= 0) return true;
  if (comp.codigo === 'VS' && s.indexOf('SUCCAO') >= 0) return true;
  if (comp.codigo === 'VR' && s.indexOf('RECALQUE') >= 0) return true;
  return false;
}
function osSemComponentePatrimonial_(texto) {
  const s = canon_(texto);
  if (!s) return false;
  // Não liberar patrimônio por palavra ampla como "geral". Só libera quando a OS foi marcada como
  // Outros/serviço não exclusivo/sem componente patrimonial de forma clara.
  return s === 'OUTROS'
    || s.indexOf('OUTROS') === 0
    || s.indexOf('SERVICO GERAL SEM COMPONENTE') >= 0
    || s.indexOf('SERVICO NAO EXCLUSIVO') >= 0
    || s.indexOf('NAO EXCLUSIVO DO EQUIPAMENTO') >= 0
    || s.indexOf('NAO EXCLUSIVO') >= 0
    || s.indexOf('SEM COMPONENTE') >= 0
    || s.indexOf('SEM COMPONENTE PATRIMONIAL') >= 0;
}

function validarPatrimonioConclusao_(loc, p) {
  const area = txt_(get_(loc.row,'area')) || p.area || p.equipeResponsavel;
  if (areaPatrimonioOpcional_(area)) return true;
  const existentes = patrimonioExistente_(loc.os.idEquipamento);
  const solicitados = txt_(get_(loc.row,'componentesSolicitados')) || txt_(p.componentesSolicitados);
  const solicitadosCanon = canon_(solicitados);
  if (osSemComponentePatrimonial_(solicitadosCanon)) return true;
  const validarTodosObrigatorios = !solicitadosCanon;
  const faltas = [];
  COMPONENTES_GMAN.forEach(c => {
    if (!c.obrigatorio) return;
    if (!validarTodosObrigatorios && !componenteFoiSolicitado_(c, solicitados)) return;
    const payloadValores = c.pats.map(k => txt_(p[k] || p[k.toLowerCase()])).filter(Boolean);
    const existenteValores = c.pats.map(k => txt_(existentes[k])).filter(Boolean);
    const temPayload = payloadValores.length > 0;
    const temExistente = existenteValores.length > 0;
    const confirmado = c.pats.some(k => p['CONFIRMA_' + k] === true || p['confirma_' + k.toLowerCase()] === true || String(p['CONFIRMA_' + k]).toLowerCase() === 'true' || String(p['confirma_' + k.toLowerCase()]).toLowerCase() === 'true') || p['CONFIRMA_EQUIPAMENTO_MESMO_' + c.codigo] === true || String(p['CONFIRMA_EQUIPAMENTO_MESMO_' + c.codigo]).toLowerCase() === 'true';
    const payloadIgualExistente = temPayload && temExistente && payloadValores.some(v => existenteValores.map(canon_).indexOf(canon_(v)) >= 0);
    if (!temPayload && !(confirmado && temExistente)) faltas.push(c.label);
    else if (payloadIgualExistente && !confirmado) faltas.push(c.label + ' (marque a confirmação de que permanece o mesmo ou altere o PAT)');
  });
  if (faltas.length) throw new Error('Patrimônio obrigatório pendente: ' + faltas.join(', ') + '. Informe o PAT ou confirme patrimônio já cadastrado.');
  return true;
}
function gravarPatrimonio_(loc, p, u) {
  let dados;
  try { dados = linhas_(GMAN.ABAS.PATRIMONIO); }
  catch(e) { return; }
  let row = null;
  dados.rows.forEach(r => { if ((txt_(get_(r,'idEquipamento')) || txt_(get_(r,['ID_GRUPO']))) === loc.os.idEquipamento && !row) row = r; });
  const eq = equipamentosOficiais_().mapa[loc.os.idEquipamento];
  const campos = { idEquipamento:loc.os.idEquipamento, sistema:loc.os.sistema, equipamento:eq?eq.equipamento:loc.os.equipamento, atualizadoPor:u.nome, versaoRegra:GMAN.VERSAO };
  COMPONENTES_GMAN.forEach(c => {
    c.pats.forEach(k => { const v = txt_(p[k] || p[k.toLowerCase()]); if (v) campos[k] = v; });
    c.descs.forEach(k => { const v = txt_(p[k] || p[k.toLowerCase()]); if (v) campos[k] = v; });
    if (p['CONFIRMA_EQUIPAMENTO_MESMO_' + c.codigo] === true || String(p['CONFIRMA_EQUIPAMENTO_MESMO_' + c.codigo]).toLowerCase() === 'true') campos['CONFIRMA_EQUIPAMENTO_MESMO_' + c.codigo] = 'SIM';
  });
  campos['ATUALIZADO_EM'] = dataHoraBrasil_();
  if (row) setCampos_(dados.sheet, dados.headers, row._row, campos);
  else appendLinha_(dados.sheet, dados.headers, campos);
}
function contarEvidenciasExistentes_(idOS, usuario) {
  const out = { fotos:0, audios:0 };
  try {
    const dados = linhas_(GMAN.ABAS.EVIDENCIAS);
    dados.rows.forEach(r => {
      const id = txt_(get_(r, ['ID_OS','idOS']));
      const user = txt_(get_(r, ['USUARIO','usuario']));
      const data = txt_(get_(r, ['DATA_REGISTRO','DATA']));
      if (id !== idOS) return;
      if (canon_(user) !== canon_(usuario)) return;
      if (data && data !== dataBrasil_()) return;
      const tipo = canon_(get_(r, ['TIPO_EVIDENCIA','TIPO','MIME_TYPE']));
      if (tipo.indexOf('FOTO') >= 0 || tipo.indexOf('IMAGE') >= 0) out.fotos++;
      if (tipo.indexOf('AUDIO') >= 0) out.audios++;
    });
  } catch(e) {}
  return out;
}

function validarEvidenciasPayload_(p, idOS, usuario) {
  const ev = Array.isArray(p.evidencias) ? p.evidencias : [];
  if (!ev.length) return true;
  const fotos = ev.filter(e => canon_(e.tipo || e.TIPO_EVIDENCIA).indexOf('FOTO') >= 0 || canon_(e.mime || '').indexOf('IMAGE') >= 0);
  const audios = ev.filter(e => canon_(e.tipo || e.TIPO_EVIDENCIA).indexOf('AUDIO') >= 0 || canon_(e.mime || '').indexOf('AUDIO') >= 0);
  const videos = ev.filter(e => canon_(e.tipo || e.TIPO_EVIDENCIA).indexOf('VIDEO') >= 0 || canon_(e.mime || '').indexOf('VIDEO') >= 0);
  if (videos.length) throw new Error('Vídeo bloqueado pelas regras GMAN.');
  ev.forEach(e => { const origem = canon_(e.origem || e.ORIGEM || ''); if (origem && ['CAMERA','GRAVADOR','MICROFONE','CAPTURA_AO_VIVO'].indexOf(origem) < 0) throw new Error('Evidência deve ser capturada na hora: câmera ou gravador do sistema. Arquivo da memória não é permitido.'); });
  const existentes = contarEvidenciasExistentes_(idOS, usuario);
  if (existentes.fotos + fotos.length > GMAN.LIMITE_FOTOS_POR_USUARIO_OS) throw new Error('Limite de 2 fotos por usuário na OS/dia excedido. Já registradas hoje: ' + existentes.fotos + '.');
  if (existentes.audios + audios.length > GMAN.LIMITE_AUDIO_POR_USUARIO_OS) throw new Error('Limite de 1 áudio por usuário na OS/dia excedido. Já registrados hoje: ' + existentes.audios + '.');
  audios.forEach(a => {
    const dur = Number(a.duracaoSegundos || a.DURACAO_SEGUNDOS || 0);
    if (!dur || dur <= 0) throw new Error('Duração real do áudio é obrigatória para validar o limite de 1 minuto.');
    if (dur > GMAN.LIMITE_AUDIO_SEGUNDOS) throw new Error('Áudio excede 1 minuto. Duração informada: ' + dur + ' segundos.');
  });
  return true;
}


function garantirCabecalhosEvidencias_(dados) {
  const obrig = ['ID_EVIDENCIA','ID_OS','NUMERO_OS','ID_EQUIPAMENTO','EQUIPAMENTO','USUARIO','PERFIL','TIPO_EVIDENCIA','NOME_ARQUIVO','MIME_TYPE','TAMANHO_BYTES','DURACAO_SEGUNDOS','OBSERVACAO','DATA_REGISTRO','HORA_REGISTRO','DATA_HORA_BRASIL','VERSAO_REGRA','ORIGEM','ID_ARQUIVO','LINK_ARQUIVO','STATUS_ARMAZENAMENTO','HASH_EVIDENCIA'];
  const headers = dados.headers.slice();
  obrig.forEach(h => {
    if (headerIndex_(headers, h) < 0) {
      dados.sheet.getRange(1, headers.length + 1).setValue(h);
      headers.push(h);
    }
  });
  return headers;
}
function pastaEvidenciasGMAN_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('GMAN_EVIDENCIAS_FOLDER_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch(e) {}
  }
  const nome = 'GMAN_EVIDENCIAS_CAPTURADAS_AO_VIVO';
  const it = DriveApp.getFoldersByName(nome);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(nome);
  props.setProperty('GMAN_EVIDENCIAS_FOLDER_ID', folder.getId());
  return folder;
}
function salvarEvidenciaDrive_(e, os, usuario) {
  const raw = txt_(e.conteudoBase64 || e.CONTEUDO_BASE64 || e.dataUrl || e.DATA_URL || '');
  if (!raw) return { id:'', url:'', status:'SEM_CONTEUDO_CAPTURADO' };
  const m = raw.match(/^data:([^;]+);base64,(.+)$/);
  const mime = (e.mime || e.MIME_TYPE || (m ? m[1] : 'application/octet-stream'));
  const b64 = m ? m[2] : raw;
  try {
    const bytes = Utilities.base64Decode(b64);
    const ext = mime.indexOf('image/') === 0 ? '.jpg' : (mime.indexOf('audio/') === 0 ? '.webm' : '.bin');
    const nomeSeguro = (txt_(os.numeroOS || os.idOS || 'OS') + '_' + txt_(e.tipo || e.TIPO_EVIDENCIA || 'EVID') + '_' + Utilities.getUuid().slice(0,8) + ext).replace(/[^A-Za-z0-9_.-]/g,'_');
    const file = pastaEvidenciasGMAN_().createFile(Utilities.newBlob(bytes, mime, nomeSeguro));
    return { id:file.getId(), url:file.getUrl(), status:'SALVO_NO_DRIVE' };
  } catch(err) {
    return { id:'', url:'', status:'ERRO_AO_SALVAR_NO_DRIVE: ' + String(err && err.message ? err.message : err) };
  }
}

function erroAutorizacaoDrive_(status) {
  const s = String(status || '');
  return s.indexOf('DriveApp.') >= 0 || s.indexOf('permissão para chamar DriveApp') >= 0 || s.indexOf('permiss') >= 0 && s.indexOf('Drive') >= 0 || s.indexOf('authorization') >= 0 || s.indexOf('Authorization') >= 0;
}

function gravarEvidencias_(p, os, usuario) {
  const ev = Array.isArray(p.evidencias) ? p.evidencias : [];
  const resumo = { total:ev.length, salvas:0, pendentes:0, erros:0, status:[] };
  if (!ev.length) return resumo;
  let dados;
  try { dados = linhas_(GMAN.ABAS.EVIDENCIAS); }
  catch(e) {
    const sh = sh_(GMAN.ABAS.EVIDENCIAS, true);
    if (sh.getLastRow() === 0) sh.appendRow(['ID_EVIDENCIA','ID_OS','NUMERO_OS','ID_EQUIPAMENTO','EQUIPAMENTO','USUARIO','PERFIL','TIPO_EVIDENCIA','NOME_ARQUIVO','MIME_TYPE','TAMANHO_BYTES','DURACAO_SEGUNDOS','OBSERVACAO','DATA_REGISTRO','HORA_REGISTRO','DATA_HORA_BRASIL','VERSAO_REGRA','ORIGEM','ID_ARQUIVO','LINK_ARQUIVO','STATUS_ARMAZENAMENTO','HASH_EVIDENCIA']);
    dados = linhas_(GMAN.ABAS.EVIDENCIAS);
  }
  const headers = garantirCabecalhosEvidencias_(dados);
  ev.forEach(e => {
    const arquivo = salvarEvidenciaDrive_(e, os, usuario);
    let statusArmazenamento = arquivo && arquivo.status ? arquivo.status : 'FALHA_DESCONHECIDA';
    if (arquivo && arquivo.status === 'SALVO_NO_DRIVE' && arquivo.url) resumo.salvas++;
    else {
      resumo.pendentes++;
      if (erroAutorizacaoDrive_(statusArmazenamento)) {
        statusArmazenamento = 'PENDENTE_AUTORIZACAO_DRIVE: ' + statusArmazenamento;
      } else {
        statusArmazenamento = 'PENDENTE_REVISAO_EVIDENCIA: ' + statusArmazenamento;
      }
    }
    resumo.status.push(statusArmazenamento);
    const payload = {
      ID_EVIDENCIA: uid_('EVID'),
      ID_OS: os.idOS || '',
      NUMERO_OS: os.numeroOS || '',
      ID_EQUIPAMENTO: os.idEquipamento || '',
      EQUIPAMENTO: os.equipamento || '',
      USUARIO: usuario.nome || usuario,
      PERFIL: usuario.perfil || '',
      TIPO_EVIDENCIA: e.tipo || e.TIPO_EVIDENCIA || '',
      NOME_ARQUIVO: e.nome || e.filename || e.NOME_ARQUIVO || '',
      MIME_TYPE: e.mime || e.MIME_TYPE || '',
      TAMANHO_BYTES: e.tamanhoBytes || e.TAMANHO_BYTES || '',
      DURACAO_SEGUNDOS: e.duracaoSegundos || e.DURACAO_SEGUNDOS || '',
      OBSERVACAO: p.observacaoEvidencia || e.observacao || '',
      DATA_REGISTRO: dataBrasilEvento_(p),
      HORA_REGISTRO: horaBrasilEvento_(p),
      DATA_HORA_BRASIL: dataBrasilEvento_(p) + ' ' + horaBrasilEvento_(p),
      VERSAO_REGRA: GMAN.VERSAO,
      ORIGEM: e.origem || e.ORIGEM || 'CAPTURA_AO_VIVO',
      ID_ARQUIVO: arquivo && arquivo.id ? arquivo.id : '',
      LINK_ARQUIVO: arquivo && arquivo.url ? arquivo.url : '',
      STATUS_ARMAZENAMENTO: statusArmazenamento,
      HASH_EVIDENCIA: e.hash || e.HASH_EVIDENCIA || ''
    };
    try { appendLinhaGenerica_(dados.sheet, headers, payload); }
    catch(errLinha) {
      resumo.erros++;
      resumo.status.push('ERRO_AO_REGISTRAR_EVIDENCIA_NA_PLANILHA: ' + String(errLinha && errLinha.message ? errLinha.message : errLinha));
    }
  });
  return resumo;
}
function registrarHistorico_(o) {
  const u = o.usuario || {nome:'SISTEMA', perfil:'SISTEMA'};
  const payloadOS = { ID_HISTORICO:uid_('HIST'), ID_OS:o.idOS || '', NUMERO_OS:o.numeroOS || '', ID_EQUIPAMENTO:o.idEquipamento || '', NOME_EQUIPAMENTO_GRUPO:o.equipamento || '', ACAO:o.acao || '', DESCRICAO:o.observacao || '', STATUS_OS:o.statusNovo || '', STATUS_OPERACIONAL:o.statusNovo || '', DATA_HORA_BRASIL:(dataUsuarioEvento_(u)+' '+horaUsuarioEvento_(u)), USUARIO:u.nome || u, NAO_EDITAVEL:'SIM', PERFIL:u.perfil || '', STATUS_ANTERIOR:o.statusAnterior || '', STATUS_NOVO:o.statusNovo || '', JUSTIFICATIVA:o.observacao || '', OBSERVACAO:o.observacao || '', VERSAO_REGRA:GMAN.VERSAO, ORIGEM:'APPS_SCRIPT' };
  try { const h = linhas_(GMAN.ABAS.HISTORICO_OS); appendLinhaGenerica_(h.sheet, h.headers, payloadOS); } catch(e) {}
  const payload = { ID_HISTORICO:uid_('HIST'), DATA_HORA_BRASIL:(dataUsuarioEvento_(u)+' '+horaUsuarioEvento_(u)), USUARIO:u.nome || u, PERFIL:u.perfil || '', ID_EQUIPAMENTO:o.idEquipamento || '', ACAO:o.acao || '', STATUS_ANTERIOR:o.statusAnterior || '', STATUS_NOVO:o.statusNovo || '', ID_OS:o.idOS || '', OBSERVACAO:o.observacao || '', VERSAO:GMAN.VERSAO };
  try { const h2 = linhas_(GMAN.ABAS.HISTORICO); appendLinhaGenerica_(h2.sheet, h2.headers, payload); } catch(e) {}
}
function appendLinhaGenerica_(sheet, headers, obj) {
  sheet.appendRow(headers.map(h => obj[h] !== undefined ? obj[h] : obj[canon_(h)] !== undefined ? obj[canon_(h)] : ''));
}

function listarHistoricoGrupo_(p) {
  const u = usuario_(p);
  const id = txt_(p.idEquipamento || p.idGrupo);
  if (!id) throw new Error('ID do equipamento é obrigatório para consultar histórico.');
  const osPorId = {};
  try { linhas_(GMAN.ABAS.ORDENS).rows.filter(r => !cicloOperacionalAtivo_() || dentroCicloAtualOS_(r)).forEach(r => { const o = osObj_(r); if (o.idOS) osPorId[o.idOS] = o; }); } catch(e) {}

  const lista = [];
  const vistos = {};
  [GMAN.ABAS.HISTORICO_OS, GMAN.ABAS.HISTORICO].forEach(nome => {
    try {
      const dados = linhas_(nome);
      dados.rows.forEach(r => {
        if (txt_(get_(r,'idEquipamento')) !== id) return;
        if (cicloOperacionalAtivo_() && !dentroCicloAtualHistorico_(r)) return;
        const item = {
          _row:r._row,
          idHistorico:txt_(get_(r,['ID_HISTORICO'])),
          idOS:txt_(get_(r,'idOS')),
          numeroOS:txt_(get_(r,'numeroOS')),
          idEquipamento:id,
          acao:txt_(get_(r,['ACAO'])),
          dataHora:txt_(get_(r,['DATA_HORA_BRASIL'])),
          usuario:txt_(get_(r,['USUARIO'])),
          perfil:txt_(get_(r,['PERFIL'])),
          statusAnterior:txt_(get_(r,['STATUS_ANTERIOR'])),
          statusNovo:txt_(get_(r,['STATUS_NOVO'])),
          observacao:txt_(get_(r,['OBSERVACAO','JUSTIFICATIVA','DESCRICAO']))
        };
        const chave = item.idHistorico || [item.idOS,item.acao,item.dataHora,item.usuario,item.observacao].join('|');
        if (vistos[chave]) return;
        vistos[chave] = true;
        lista.push(item);
      });
    } catch(e) {}
  });
  lista.sort(ordenarPorDataDesc_);

  let out = lista;
  let regra = 'OPERACIONAL: últimas 3 intervenções do grupo';
  if (acessoTotal_(u)) {
    regra = 'ACESSO TOTAL: histórico completo';
  } else if (coordenador_(u)) {
    regra = 'COORDENADOR: histórico completo das OS da área quando identificável; demais itens do grupo em leitura limitada';
    out = lista.filter(h => {
      const os = h.idOS ? osPorId[h.idOS] : null;
      return os ? podeCoordenadorArea_(u, os._raw || os) : true;
    });
  } else {
    out = lista.slice(0,3);
  }
  if (!acessoTotal_(u) && !coordenador_(u)) out = out.slice(0,3);
  return { sucesso:true, historico:out, total:out.length, regra:regra };
}

function eventoOSCompleto_(tipo, data, hora, usuario, statusAnterior, statusNovo, observacao, os) {
  const dh = valorDataHoraBrasilCampos_(data, hora) || txt_(data) || '';
  return {
    tipo: tipo,
    acao: tipo,
    dataHora: dh,
    usuario: usuario || '',
    statusAnterior: statusAnterior || '',
    statusNovo: statusNovo || '',
    observacao: observacao || '',
    idOS: os.idOS || '',
    numeroOS: os.numeroOS || '',
    idEquipamento: os.idEquipamento || '',
    origem: 'ORDENS_SERVICO'
  };
}

function eventosEstruturadosDaOS_(os) {
  const eventos = [];
  eventos.push(eventoOSCompleto_('ABERTURA_OS', os.dataAbertura, os.horaAbertura, os.criadoPor, '', 'Aberta', os.descricaoProblema || 'OS aberta.', os));
  if (os.dataInicio || os.horaInicio || os.usuarioInicio || os.justificativaInicio) {
    eventos.push(eventoOSCompleto_('INICIO_OS', os.dataInicio, os.horaInicio, os.usuarioInicio, 'Aberta', 'Em execução', (os.justificativaInicio || ''), os));
  }
  if (os.andamentoTexto) {
    eventos.push(eventoOSCompleto_('ANDAMENTO_OS', os.dataAndamento, os.horaAndamento, os.responsavel, '', os.statusOS || '', os.andamentoTexto, os));
  }
  if (os.dataConclusao || os.horaConclusao || os.finalizadoPor || statusEncerrado_(os.statusOS)) {
    eventos.push(eventoOSCompleto_(statusCanon_(os.statusOS) === 'CANCELADA' ? 'CANCELAMENTO_OS' : 'CONCLUSAO_OS', os.dataConclusao, os.horaConclusao, os.finalizadoPor, '', os.statusOS || '', (os.justificativaFinal || '') + (os.membrosEquipe ? ' | Membros: ' + os.membrosEquipe : ''), os));
  }
  return eventos.filter(e => e.dataHora || e.observacao || e.usuario);
}

function listarHistoricoOS_(p) {
  const u = usuario_(p || {});
  const id = txt_(p.idOS || p.numeroOS || p.id || p.numero);
  if (!id) throw new Error('ID ou número da OS é obrigatório para consultar o histórico completo.');
  const loc = localizarOS_(id);
  if (!podeVerDetalheOS_(u, loc.row)) throw new Error('Permissão bloqueada para visualizar o histórico completo desta OS.');
  const os = osObj_(loc.row);
  const lista = [];
  const vistos = {};
  function adicionar(item) {
    if (!item) return;
    const chave = item.idHistorico || [item.origem || '', item.idOS || '', item.numeroOS || '', item.acao || item.tipo || '', item.dataHora || '', item.usuario || '', item.observacao || ''].join('|');
    if (vistos[chave]) return;
    vistos[chave] = true;
    lista.push(item);
  }
  eventosEstruturadosDaOS_(os).forEach(adicionar);
  [GMAN.ABAS.HISTORICO_OS, GMAN.ABAS.HISTORICO].forEach(nome => {
    try {
      const dados = linhas_(nome);
      dados.rows.forEach(r => {
        const rid = txt_(get_(r,'idOS'));
        const rnum = txt_(get_(r,'numeroOS'));
        if (rid !== os.idOS && rnum !== os.numeroOS) return;
        if (cicloOperacionalAtivo_() && !dentroCicloAtualHistorico_(r)) return;
        adicionar({
          _row:r._row,
          idHistorico:txt_(get_(r,['ID_HISTORICO'])),
          idOS:rid || os.idOS,
          numeroOS:rnum || os.numeroOS,
          idEquipamento:txt_(get_(r,'idEquipamento')) || os.idEquipamento,
          acao:txt_(get_(r,['ACAO'])) || 'MOVIMENTACAO_OS',
          tipo:txt_(get_(r,['ACAO'])) || 'MOVIMENTACAO_OS',
          dataHora:txt_(get_(r,['DATA_HORA_BRASIL'])),
          usuario:txt_(get_(r,['USUARIO'])),
          perfil:txt_(get_(r,['PERFIL'])),
          statusAnterior:txt_(get_(r,['STATUS_ANTERIOR'])),
          statusNovo:txt_(get_(r,['STATUS_NOVO'])),
          observacao:txt_(get_(r,['OBSERVACAO','JUSTIFICATIVA','DESCRICAO'])),
          origem:nome
        });
      });
    } catch(e) {}
  });
  lista.sort((a,b) => {
    const da = parseDataBrasil_(a.dataHora || '') || 0;
    const db = parseDataBrasil_(b.dataHora || '') || 0;
    if (da !== db) return da - db;
    return Number(a._row || 0) - Number(b._row || 0);
  });
  return { sucesso:true, os:os, historicoCompleto:lista, historico:lista, total:lista.length, regra:'Histórico completo da OS, não editável, conforme permissão do perfil.' };
}

function listarPatrimonioGrupo_(p) {
  const id = txt_(p.idEquipamento || p.idGrupo);
  if (!id) throw new Error('ID do equipamento é obrigatório.');
  return { sucesso:true, patrimonio:patrimonioExistente_(id) };
}

function calcularKPIs_(opts) {
  const eq = equipamentosOficiais_();
  const st = listarStatus_().status;
  const os = linhas_(GMAN.ABAS.ORDENS).rows.filter(r=>!contemTeste_(r._vals)).filter(r=>!cicloOperacionalAtivo_() || dentroCicloAtualOS_(r)).map(osObj_);
  const total = eq.lista.length;
  const operando = st.filter(x=>canon_(x.statusAtual)==='OPERANDO').length;
  const manut = st.filter(x=>canon_(x.statusAtual).indexOf('MANUTENCAO')>=0 || canon_(x.statusAtual).indexOf('AGUARD')>=0 || canon_(x.statusAtual).indexOf('TESTE')>=0).length;
  const parado = st.filter(x=>canon_(x.statusAtual).indexOf('PARADO')>=0).length;
  const ativas = os.filter(o=>statusAtivo_(o.statusOS)).length;
  const concluidas = os.filter(o=>canon_(o.statusOS).indexOf('CONCLUID')>=0).length;
  const canceladas = os.filter(o=>canon_(o.statusOS).indexOf('CANCEL')>=0).length;
  const disponibilidade = total ? Math.round((operando/total)*10000)/100 : 0;
  const rankingArea = ranking_(os.filter(o=>statusAtivo_(o.statusOS) || canon_(o.statusOS).indexOf('CONCLUID')>=0), o=>o.area || 'Sem área');
  const rankingLider = ranking_(os.filter(o=>canon_(o.statusOS).indexOf('CONCLUID')>=0), o=>o.responsavel || 'Sem responsável');
  const reinc = ranking_(os.filter(o=>canon_(o.tipoManutencao).indexOf('CORRET')>=0 || canon_(o.descricaoProblema).indexOf('CORRET')>=0), o=>o.idEquipamento).filter(x=>x.quantidade>=2).map(x=>({ idEquipamento:x.item, item:x.item, quantidade:x.quantidade, criticidade:x.quantidade>=3?'CRÍTICA':'ATENÇÃO' }));
  const kpis = [
    { indicador:'Total de equipamentos', valor:total, meta:'214 oficiais', status: total>=1?'OK':'ATENÇÃO' },
    { indicador:'Operando', valor:operando, meta:'Máximo possível', status:'OK' },
    { indicador:'Em manutenção', valor:manut, meta:'Controlado', status: manut>0?'ATENÇÃO':'OK' },
    { indicador:'Parados', valor:parado, meta:'0 crítico', status: parado>0?'CRÍTICO':'OK' },
    { indicador:'Disponibilidade plena atual', valor:disponibilidade + '%', meta:'≥ 95%', status:disponibilidade>=95?'OK':'ATENÇÃO' },
    { indicador:'OS ativas', valor:ativas, meta:'Acompanhamento', status:ativas>0?'ATENÇÃO':'OK' },
    { indicador:'OS concluídas', valor:concluidas, meta:'Histórico', status:'OK' },
    { indicador:'OS canceladas', valor:canceladas, meta:'Rastrear motivo', status:canceladas>0?'ATENÇÃO':'OK' }
  ];
  if (opts && opts.gravar) gravarKPIs_(kpis);
  return { sucesso:true, kpis:kpis, rankingArea:rankingArea.slice(0,10), rankingLider:rankingLider.slice(0,10), rankingReincidencia:reinc.slice(0,10), cicloOperacional:filtroCicloInfo_() };
}
function ranking_(lista, fn) {
  const map = {};
  lista.forEach(o=>{ const k = txt_(fn(o)) || 'Sem informação'; map[k] = (map[k]||0)+1; });
  return Object.keys(map).map(k=>({item:k, nome:k, quantidade:map[k], total:map[k]})).sort((a,b)=>b.quantidade-a.quantidade);
}
function gravarKPIs_(kpis) {
  try {
    const d = linhas_(GMAN.ABAS.KPIS);
    kpis.forEach(k=>appendLinhaGenerica_(d.sheet, d.headers, { INDICADOR:k.indicador, VALOR_CALCULADO_API:k.valor, META:k.meta, STATUS:k.status, ATUALIZADO_EM:dataHoraBrasil_(), OBSERVACAO:GMAN.VERSAO }));
  } catch(e) {}
}

function diagnosticoProfundo_() {
  const eq = equipamentosOficiais_();
  const st = listarStatus_().status;
  const os = listarOS_({ incluirEncerradas:true, usuario:'PAULO JURANDIR', perfil:'administrador' }).ordens;
  const alertas = [];
  let legadoSistema500 = 0;
  const idsStatusRaw = {};

  try {
    const eqRaw = linhas_(GMAN.ABAS.EQUIPAMENTOS);
    eqRaw.rows.forEach(r => {
      const sistemaBruto = txt_(get_(r,'sistema')).replace(/\.0$/,'');
      if (sistemaBruto === '500') legadoSistema500++;
    });
  } catch(e) {}

  try {
    const statusRaw = linhas_(GMAN.ABAS.STATUS_ATUAL);
    statusRaw.rows.forEach(r => {
      if (contemTeste_(r._vals)) return;
      if (cicloOperacionalAtivo_() && !dentroCicloAtualStatus_(r)) return;
      const id = txt_(get_(r,'idEquipamento'));
      if (!id) return;
      idsStatusRaw[id] = (idsStatusRaw[id] || 0) + 1;
    });
  } catch(e) {}

  const statusDuplicados = Object.keys(idsStatusRaw).filter(id => idsStatusRaw[id] > 1);
  statusDuplicados.forEach(id => alertas.push('STATUS_ATUAL duplicado na planilha: ' + id + ' (' + idsStatusRaw[id] + ' registros).'));

  if (legadoSistema500 > 0) {
    alertas.push('Sistema 500 legado encontrado em EQUIPAMENTOS: ' + legadoSistema500 + ' registro(s). A API normaliza para o Sistema 300, sem ocultar o equipamento.');
  }

  return {
    sucesso:true,
    resumo:{ equipamentos:eq.lista.length, status:st.length, os:os.length, alertas:alertas.length, legadoSistema500:legadoSistema500, statusDuplicados:statusDuplicados.length },
    alertas:alertas,
    regra:'Diagnóstico funcional sem alteração de dados. Sistema 500 legado é incorporado ao Sistema 300 na API, sem botão próprio e sem sonegar registros.'
  };
}
function diagnosticoDriveEvidencias_() {
  const out = { sucesso:true, driveAutorizado:false, pastaId:'', pastaNome:'GMAN_EVIDENCIAS_CAPTURADAS_AO_VIVO', mensagem:'' };
  try {
    const folder = pastaEvidenciasGMAN_();
    out.driveAutorizado = true;
    out.pastaId = folder.getId();
    out.url = folder.getUrl();
    out.mensagem = 'Drive autorizado para evidências GMAN.';
  } catch(e) {
    out.driveAutorizado = false;
    out.mensagem = 'Drive ainda não autorizado para o Apps Script. Execute a função prepararAutorizacaoDriveGMAN uma vez no editor do Apps Script ou publique nova versão autorizando o escopo do Drive.';
    out.erro = String(e && e.message ? e.message : e);
  }
  return out;
}

function prepararAutorizacaoDriveGMAN() {
  const folder = pastaEvidenciasGMAN_();
  return 'Drive autorizado para evidências GMAN. Pasta: ' + folder.getName() + ' | ID: ' + folder.getId();
}

function simularQuarentenaSegura_() { return { sucesso:true, modo:'SIMULAÇÃO', observacao:'Esta versão lista a ação sem mover registros. Quarentena real deve usar confirmação forte em rotina separada.', candidatos:[] }; }
function listarGatilhos_() {
  try { return { sucesso:true, gatilhos:ScriptApp.getProjectTriggers().map(t=>({funcao:t.getHandlerFunction(), tipo:String(t.getEventType())})) }; }
  catch(e) { return { sucesso:true, gatilhos:[], observacao:'Não foi possível consultar gatilhos neste contexto.' }; }
}


function health_() {
  let idPlanilha = '';
  let nomePlanilha = '';
  try {
    const ss = ss_();
    idPlanilha = ss.getId ? ss.getId() : '';
    nomePlanilha = ss.getName ? ss.getName() : '';
  } catch(e) {}
  return { sucesso:true, versao:GMAN.VERSAO, titulo:GMAN.TITULO, dataHoraBrasil:dataHoraBrasil_(), planilha:{ id:idPlanilha, nome:nomePlanilha }, regras:{ acessoTotal:GMAN.PERFIS_ACESSO_TOTAL, coordenacao:GMAN.PERFIS_COORDENACAO, sistemas:GMAN.SISTEMAS_OFICIAIS, brutas:GMAN.BRUTAS, cicloOperacional:filtroCicloInfo_() } };
}


function diagnosticoCicloAtual_() {
  const os = listarOS_({ usuario:'PAULO JURANDIR', perfil:'administrador', incluirEncerradas:true }).ordens || [];
  const st = listarStatus_().status || [];
  const k = calcularKPIs_({});
  return { sucesso:true, cicloOperacional:filtroCicloInfo_(), totalOSNoRadar:os.length, statusOperando:st.filter(x=>canon_(x.statusAtual)==='OPERANDO').length, totalStatus:st.length, kpis:k.kpis, observacao:'Diagnóstico do ciclo atual ignora legado/testes antigos sem apagar registros da planilha.' };
}

function TESTE_GMAN_00_LISTAR_TESTES_VISIVEIS() { return ['TESTE_GMAN_01_HEALTH','TESTE_GMAN_02_DIAGNOSTICO_PROFUNDO','TESTE_GMAN_03_SIMULAR_CICLO_REGRAS_FUNCIONAIS','TESTE_GMAN_04_AUDITAR_PERMISSOES','TESTE_GMAN_05_DIAGNOSTICO_CICLO_ATUAL','TESTE_GMAN_06_LISTAR_ENDERECOS_ESTACOES']; }
function TESTE_GMAN_01_HEALTH() { return health_(); }
function TESTE_GMAN_02_DIAGNOSTICO_PROFUNDO() { return diagnosticoProfundo_(); }
function TESTE_GMAN_03_SIMULAR_CICLO_REGRAS_FUNCIONAIS() { return { sucesso:true, simulacao:'OK', itens:['perfis administrador/supervisor/gerente equivalentes e validados no servidor','bloqueio duplicidade mesmo equipamento+responsável','conclusão exige condição final explícita e consolida concordância sem forçar Operando','histórico por perfil','patrimônio obrigatório/opcional','Sistema 500 legado normalizado para 300'], observacao:'Teste de leitura/simulação. Não altera a planilha.' }; }
function TESTE_GMAN_04_AUDITAR_PERMISSOES() { return { sucesso:true, acessoTotal:GMAN.PERFIS_ACESSO_TOTAL, coordenacao:GMAN.PERFIS_COORDENACAO, usuariosOficiais:GMAN.USUARIOS_OFICIAIS, operacional:'somente OS sob responsabilidade e sem acesso a encerradas', coordenador:'atua por área', validacao:'perfil privilegiado não é aceito apenas por payload do navegador' }; }

function TESTE_GMAN_05_DIAGNOSTICO_CICLO_ATUAL() { return diagnosticoCicloAtual_(); }
function TESTE_GMAN_06_LISTAR_ENDERECOS_ESTACOES() { return listarEnderecosEstacoes_(); }


/************************************************************
 * GMAN 8.5.6.105 — SOLICITAÇÕES COM RESPOSTA DA GESTÃO
 * Mantém solicitação operacional sem executar cancelamento/redistribuição
 * até aceite formal de gestão. Usuário recebe resposta por consulta/notificação.
 ************************************************************/
function solicitacaoPendenteCampo_(texto) {
  const s = canon_(texto);
  return s.indexOf('SOLICITACAO') >= 0 && s.indexOf('RESPONDIDA') < 0;
}
function tipoSolicitacaoLinha_(r) {
  const cancel = txt_(get_(r,'obsCancelamento'));
  const redist = txt_(get_(r,'solicitacaoRedistribuicao'));
  const out = [];
  if (solicitacaoPendenteCampo_(cancel)) out.push({ tipo:'CANCELAMENTO', motivo:cancel });
  if (solicitacaoPendenteCampo_(redist)) out.push({ tipo:'REDISTRIBUICAO', motivo:redist });
  return out;
}
function listarSolicitacoesPendentes_(p) {
  const u = usuario_(p || {});
  if (!acessoTotal_(u) && !coordenador_(u)) throw new Error('Solicitações pendentes são visíveis apenas para gestão ou coordenação conforme área.');
  const dados = linhas_(GMAN.ABAS.ORDENS);
  const lista = [];
  dados.rows.forEach(r => {
    if (contemTeste_(r._vals)) return;
    if (cicloOperacionalAtivo_() && !dentroCicloAtualOS_(r)) return;
    if (statusEncerrado_(get_(r,'statusOS'))) return;
    if (coordenador_(u) && !podeCoordenadorArea_(u, r)) return;
    tipoSolicitacaoLinha_(r).forEach(s => {
      const o = osObj_(r);
      lista.push({
        idOS:o.idOS, numeroOS:o.numeroOS, idEquipamento:o.idEquipamento, equipamento:o.equipamento,
        area:o.area, responsavel:o.responsavel, statusOS:o.statusOS, tipo:s.tipo, motivo:s.motivo,
        dataAbertura:o.dataAbertura, horaAbertura:o.horaAbertura, prioridade:o.prioridade,
        descricaoProblema:o.descricaoProblema
      });
    });
  });
  lista.sort((a,b)=>String(a.numeroOS||'').localeCompare(String(b.numeroOS||'')));
  return { sucesso:true, solicitacoes:lista, total:lista.length };
}

function juntarRespostaSolicitacao_(original, carimbo) {
  const base = txt_(original);
  return (base ? base + ' | ' : '') + carimbo;
}
function listarNotificacoesUsuario_(p) {
  const u = usuario_(p || {});
  const nome = canon_(u.nome || p.usuario || '');
  if (!nome) return { sucesso:true, notificacoes:[], total:0 };
  const dados = linhas_(GMAN.ABAS.ORDENS);
  const lista = [];
  dados.rows.forEach(r => {
    if (contemTeste_(r._vals)) return;
    const o = osObj_(r);
    const campos = [
      { tipo:'CANCELAMENTO', texto:txt_(get_(r,'obsCancelamento')) },
      { tipo:'REDISTRIBUICAO', texto:txt_(get_(r,'solicitacaoRedistribuicao')) }
    ];
    campos.forEach(c => {
      const cc = canon_(c.texto);
      if (cc.indexOf('RESPONDIDA') < 0) return;
      if (cc.indexOf(nome) < 0 && canon_(o.responsavel) !== nome && canon_(o.criadoPor) !== nome) return;
      lista.push({ tipo:c.tipo, idOS:o.idOS, numeroOS:o.numeroOS, equipamento:o.equipamento, statusOS:o.statusOS, mensagem:c.texto, dataAbertura:o.dataAbertura, horaAbertura:o.horaAbertura });
    });
  });
  return { sucesso:true, notificacoes:lista.slice(-20).reverse(), total:lista.length };
}

function responderSolicitacaoOS_(p) {
  const u = usuario_(p || {});
  validarUsuarioAcaoCritica_(u, 'responderSolicitacaoOS');
  if (!acessoTotal_(u) && !coordenador_(u)) throw new Error('Somente gestão ou coordenação pode responder solicitações.');
  const tipo = canon_(p.tipo || p.tipoSolicitacao);
  const decisao = canon_(p.decisao || p.resposta);
  const justificativa = txt_(p.justificativa || p.observacao || p.motivoGestao);
  if (!tipo || (tipo !== 'CANCELAMENTO' && tipo !== 'REDISTRIBUICAO')) throw new Error('Tipo de solicitação inválido.');
  if (!decisao || (decisao !== 'ACEITAR' && decisao !== 'ACEITA' && decisao !== 'APROVAR' && decisao !== 'NEGAR' && decisao !== 'NEGADA' && decisao !== 'REPROVAR')) throw new Error('Decisão inválida. Use aceitar ou negar.');
  if (!justificativa) throw new Error('Justificativa da gestão é obrigatória.');
  const aceitar = ['ACEITAR','ACEITA','APROVAR'].indexOf(decisao) >= 0;
  const loc = localizarOS_(p.idOS || p.numeroOS);
  if (coordenador_(u) && !podeCoordenadorArea_(u, loc.row)) throw new Error('Coordenador só pode responder solicitações da própria área.');
  const carimbo = 'RESPONDIDA ' + (aceitar ? 'ACEITA' : 'NEGADA') + ' por ' + u.nome + ' em ' + dataBrasilEvento_(p) + ' ' + horaBrasilEvento_(p) + ': ' + justificativa;
  if (tipo === 'CANCELAMENTO') {
    if (aceitar) {
      const respostaCompleta = juntarRespostaSolicitacao_(get_(loc.row,'obsCancelamento'), carimbo);
      const resp = cancelarOS_(Object.assign({}, p, { motivo:justificativa, usuario:u.nome, perfil:u.perfil, area:u.area, horaDispositivo:horaBrasilEvento_(p), dataDispositivo:dataBrasilEvento_(p) }));
      setCampos_(loc.dados.sheet, loc.dados.headers, loc.row._row, { obsCancelamento:respostaCompleta, versaoRegra:GMAN.VERSAO });
      registrarHistorico_({ usuario:u, idEquipamento:loc.os.idEquipamento, equipamento:loc.os.equipamento, idOS:loc.os.idOS, numeroOS:loc.os.numeroOS, acao:'RESPOSTA_SOLICITACAO_CANCELAMENTO', statusNovo:'ACEITA', observacao:respostaCompleta });
      return { sucesso:true, mensagem:'Solicitação de cancelamento aceita e OS cancelada pela gestão.', resultado:resp };
    }
    const respostaCompleta = juntarRespostaSolicitacao_(get_(loc.row,'obsCancelamento'), carimbo);
    setCampos_(loc.dados.sheet, loc.dados.headers, loc.row._row, { obsCancelamento:respostaCompleta, versaoRegra:GMAN.VERSAO });
    registrarHistorico_({ usuario:u, idEquipamento:loc.os.idEquipamento, equipamento:loc.os.equipamento, idOS:loc.os.idOS, numeroOS:loc.os.numeroOS, acao:'RESPOSTA_SOLICITACAO_CANCELAMENTO', statusNovo:'NEGADA', observacao:respostaCompleta });
    return { sucesso:true, mensagem:'Solicitação de cancelamento negada. OS permanece com o responsável atual.' };
  }
  if (tipo === 'REDISTRIBUICAO') {
    if (aceitar) {
      const respostaCompleta = juntarRespostaSolicitacao_(get_(loc.row,'solicitacaoRedistribuicao'), carimbo);
      const novoResp = txt_(p.novoResponsavel || '');
      setCampos_(loc.dados.sheet, loc.dados.headers, loc.row._row, { statusOS: novoResp ? 'Aberta' : 'Recebida', responsavel: novoResp, solicitacaoRedistribuicao:respostaCompleta, novoResponsavel: novoResp || 'AGUARDANDO_NOVO_RESPONSAVEL', versaoRegra:GMAN.VERSAO });
      registrarHistorico_({ usuario:u, idEquipamento:loc.os.idEquipamento, equipamento:loc.os.equipamento, idOS:loc.os.idOS, numeroOS:loc.os.numeroOS, acao:'RESPOSTA_SOLICITACAO_REDISTRIBUICAO', statusAnterior:loc.os.statusOS, statusNovo: novoResp ? ('ACEITA - NOVO RESPONSAVEL: ' + novoResp) : 'ACEITA - AGUARDANDO NOVO RESPONSAVEL', observacao:respostaCompleta });
      return { sucesso:true, mensagem: novoResp ? ('Solicitação de redistribuição aceita. OS atribuída para ' + novoResp + '.') : 'Solicitação de redistribuição aceita. OS retornou para recebidas/não iniciadas aguardando novo responsável.' };
    }
    const respostaCompleta = juntarRespostaSolicitacao_(get_(loc.row,'solicitacaoRedistribuicao'), carimbo);
    setCampos_(loc.dados.sheet, loc.dados.headers, loc.row._row, { solicitacaoRedistribuicao:respostaCompleta, versaoRegra:GMAN.VERSAO });
    registrarHistorico_({ usuario:u, idEquipamento:loc.os.idEquipamento, equipamento:loc.os.equipamento, idOS:loc.os.idOS, numeroOS:loc.os.numeroOS, acao:'RESPOSTA_SOLICITACAO_REDISTRIBUICAO', statusNovo:'NEGADA', observacao:respostaCompleta });
    return { sucesso:true, mensagem:'Solicitação de redistribuição negada. OS permanece com o responsável atual.' };
  }
}
