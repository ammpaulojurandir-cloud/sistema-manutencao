const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname);
const modeloPath = path.resolve(baseDir, '..', '_PREPARACAO_MODELAGEM_HIDRAULICA_GMAN_2026_05_13', '03_MODELAGEM', 'MODELO_DADOS_HIDRAULICO_PROPOSTO.json');
const outputJsonPath = path.join(baseDir, 'RESULTADO_SANDBOX_LEITURA_HIDRAULICA.json');
const outputCsvPath = path.join(baseDir, 'CHECKLIST_SANDBOX_LEITURA_HIDRAULICA.csv');
const outputTxtPath = path.join(baseDir, 'RELATORIO_SANDBOX_LEITURA_HIDRAULICA.txt');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalize(value) {
  return String(value || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function findAny(list, term, keys) {
  const search = normalize(term);
  return list.some(item => keys.some(key => normalize(item[key] || '').includes(search)));
}

function getMatches(list, term, keys) {
  const search = normalize(term);
  return list.filter(item => keys.some(key => normalize(item[key] || '').includes(search)));
}

function recordTest(id, descricao, resultado, evidencia) {
  return {
    ID_TESTE: id,
    DESCRICAO: descricao,
    RESULTADO: resultado ? 'APROVADO' : 'REPROVADO',
    EVIDENCIA: evidencia,
  };
}

function buildCsv(tests) {
  const header = ['TEST_ID', 'DESCRICAO', 'RESULTADO', 'EVIDENCIA'];
  const lines = tests.map(test => [test.ID_TESTE, test.DESCRICAO, test.RESULTADO, test.EVIDENCIA.replace(/\n/g, ' ')].map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
  return [header.join(','), ...lines].join('\n');
}

function buildReport(tests, summary) {
  const passed = tests.filter(t => t.RESULTADO === 'APROVADO').length;
  const failed = tests.length - passed;
  return [
    'RELATÓRIO SANDBOX DE LEITURA HIDRÁULICA — GMAN DMAE',
    'Fonte técnica: MODELO_DADOS_HIDRAULICO_PROPOSTO.json',
    '',
    `Total de testes executados: ${tests.length}`,
    `Testes aprovados: ${passed}`,
    `Testes reprovados: ${failed}`,
    '',
    `Sistemas oficiais validados: ${summary.sistemasOficiais.join(', ')}`,
    `Reservatórios físicos: ${summary.reservatoriosFisicos}`,
    `Unidades operacionais: ${summary.unidadesOperacionais}`,
    `Relações FLUXO_NORMAL: ${summary.relacoesFluxoNormal}`,
    `Interligações de emergência: ${summary.interligacoesEmergencia}`,
    '',
    'Conclusão objetiva:',
    failed === 0
      ? 'Sandbox de leitura aprovado; a modelagem hidráulica técnica está consistente com os totais finais da ORDEM 04 e sem integração ao app oficial.'
      : 'Sandbox de leitura identificou inconsistências que devem ser revisadas antes de qualquer integração futura.',
    '',
    'Confirmação de preservação do app/index/API: nenhum arquivo oficial foi alterado durante esta execução.',
    'Próxima recomendação: manter a modelagem como base técnica separada e usar este sandbox apenas para leitura e validação de consistência.',
  ].join('\n');
}

function safeNumber(value) {
  return Number.isFinite(value) ? value : Number(value) || 0;
}

function main() {
  const modelo = readJson(modeloPath);
  const summary = {
    sistemas: modelo.sistemasHidraulicos.length,
    sistemasOficiais: modelo.sistemasHidraulicos.map(s => s.SISTEMA).sort(),
    reservatoriosFisicos: modelo.reservatorios.length,
    unidadesOperacionais: modelo.unidades.length,
    relacoesFluxoNormal: modelo.relacoes.filter(r => normalize(r.FLUXO) === 'FLUXO_NORMAL').length,
    interligacoesEmergencia: modelo.relacoes.filter(r => normalize(r.FLUXO) === 'INTERLIGACAO_EMERGENCIA').length,
    bloqueantesRestantes: modelo.ordem04 && modelo.ordem04.bloqueantesRestantes != null ? safeNumber(modelo.ordem04.bloqueantesRestantes) : null,
  };

  const tests = [];

  tests.push(recordTest('T001', 'Sistemas oficiais = 100,200,300,400,600,700', summary.sistemas === 6 && summary.sistemasOficiais.join(',') === '100,200,300,400,600,700', `Encontrados: ${summary.sistemasOficiais.join(',')}`));
  tests.push(recordTest('T002', 'Sistema 500 ausente', !modelo.sistemasHidraulicos.some(s => normalize(s.SISTEMA) === '500'), `Presença de 500: ${modelo.sistemasHidraulicos.some(s => normalize(s.SISTEMA) === '500') ? 'SIM' : 'NÃO'}`));
  tests.push(recordTest('T003', 'Reservatórios físicos = 97', summary.reservatoriosFisicos === 97, `Encontrados: ${summary.reservatoriosFisicos}`));
  tests.push(recordTest('T004', 'Unidades operacionais = 89', summary.unidadesOperacionais === 89, `Encontrados: ${summary.unidadesOperacionais}`));
  tests.push(recordTest('T005', 'Relações de fluxo normal = 142', summary.relacoesFluxoNormal === 142, `Encontrados: ${summary.relacoesFluxoNormal}`));
  tests.push(recordTest('T006', 'Interligações de emergência = 2', summary.interligacoesEmergencia === 2, `Encontrados: ${summary.interligacoesEmergencia}`));
  tests.push(recordTest('T007', 'VRP fora da base principal', !findAny(modelo.sistemasHidraulicos.concat(modelo.conjuntos, modelo.unidades, modelo.reservatorios, modelo.relacoes), 'VRP', ['ID_UNIDADE','ID_CONJUNTO','ID_RESERVATORIO','ID_RELACAO','NOME_RESERVATORIO','NOME_UNIDADE','NOME_CONJUNTO','ORIGEM_NOME','DESTINO_NOME','OBSERVACAO','FUNCAO_RELACAO']), 'Nenhum VRP encontrado em unidades, conjuntos, reservatórios ou relações.'));
  tests.push(recordTest('T008', 'IN LINE fora de reservatórios físicos', !findAny(modelo.reservatorios, 'IN LINE', ['TIPO_RESERVATORIO','NOME_RESERVATORIO','OBSERVACAO','ORIGEM_DESENHO']), `IN LINE em reservatórios: ${findAny(modelo.reservatorios, 'IN LINE', ['TIPO_RESERVATORIO','NOME_RESERVATORIO','OBSERVACAO','ORIGEM_DESENHO']) ? 'SIM' : 'NÃO'}`));
  const emergencyRelations = modelo.relacoes.filter(r => normalize(r.FLUXO) === 'INTERLIGACAO_EMERGENCIA' || normalize(r.TIPO_RELACAO).includes('INTERLIG') || normalize(r.FUNCAO_RELACAO).includes('EMERGENCIA'));
  const emergencyInFlowNormal = emergencyRelations.filter(r => normalize(r.FLUXO) === 'FLUXO_NORMAL').length;
  tests.push(recordTest('T009', 'Interligações de emergência fora de FLUXO_NORMAL', emergencyInFlowNormal === 0, `Emergências encontradas: ${emergencyRelations.length}; emergências em FLUXO_NORMAL: ${emergencyInFlowNormal}`));
  tests.push(recordTest('T010', 'ETA/RES como conjunto', modelo.conjuntos.filter(c => normalize(c.TIPO_CONJUNTO) === 'ETA/RES').every(c => normalize(c.TEM_ETA) === 'SIM' && normalize(c.TEM_RES) === 'SIM'), `Conjuntos ETA/RES encontrados: ${modelo.conjuntos.filter(c => normalize(c.TIPO_CONJUNTO) === 'ETA/RES').length}`));
  tests.push(recordTest('T011', 'EBAT/RES como conjunto', modelo.conjuntos.filter(c => normalize(c.TIPO_CONJUNTO) === 'EBAT/RES').every(c => normalize(c.TEM_EBAT) === 'SIM' && normalize(c.TEM_RES) === 'SIM'), `Conjuntos EBAT/RES encontrados: ${modelo.conjuntos.filter(c => normalize(c.TIPO_CONJUNTO) === 'EBAT/RES').length}`));

  const sjv = getMatches(modelo.reservatorios, 'SAO JOSE V', ['NOME_RESERVATORIO','NOME_OPERACIONAL','OBSERVACAO'])[0];
  const sjvOk = sjv && safeNumber(sjv.CAPACIDADE_M3) === 530 && safeNumber(sjv.QUANTIDADE_FISICA) === 2 && safeNumber(sjv.CAPACIDADE_TOTAL_M3) === 1060;
  tests.push(recordTest('T012', 'RES SÃO JOSÉ V = 2 x 530 m³, total 1060 m³', sjvOk, sjv ? `Encontrado: capacidade ${sjv.CAPACIDADE_M3}, quantidade física ${sjv.QUANTIDADE_FISICA}, total ${sjv.CAPACIDADE_TOTAL_M3}` : 'Registro não encontrado')); 

  const beloR1 = getMatches(modelo.reservatorios, 'BELEM NOVO R1', ['NOME_RESERVATORIO','NOME_OPERACIONAL','OBSERVACAO'])[0];
  tests.push(recordTest('T013', 'BELÉM NOVO R1 = 2500 m³', beloR1 && safeNumber(beloR1.CAPACIDADE_M3) === 2500 && safeNumber(beloR1.QUANTIDADE_FISICA) === 1, beloR1 ? `Encontrado: ${beloR1.CAPACIDADE_M3} m³` : 'Registro não encontrado'));

  const beloR2 = getMatches(modelo.reservatorios, 'BELEM NOVO R2', ['NOME_RESERVATORIO','NOME_OPERACIONAL','OBSERVACAO'])[0];
  tests.push(recordTest('T014', 'BELÉM NOVO R2 = 1500 m³', beloR2 && safeNumber(beloR2.CAPACIDADE_M3) === 1500 && safeNumber(beloR2.QUANTIDADE_FISICA) === 1, beloR2 ? `Encontrado: ${beloR2.CAPACIDADE_M3} m³` : 'Registro não encontrado'));

  const dolores = getMatches(modelo.reservatorios, 'DOLORES DURAN II', ['NOME_RESERVATORIO','NOME_OPERACIONAL','OBSERVACAO'])[0];
  const DoloresFluxoNormal = modelo.relacoes.some(r => normalize(r.FLUXO) === 'FLUXO_NORMAL' && normalize(r.ORIGEM_NOME).includes('DOLORES DURAN II') || normalize(r.DESTINO_NOME).includes('DOLORES DURAN II') || normalize(r.ORIGEM_ID).includes('DOLORES-DURAN-II') || normalize(r.DESTINO_ID).includes('DOLORES-DURAN-II'));
  const doloresOk = dolores && normalize(dolores.SISTEMA) === '300' && safeNumber(dolores.CAPACIDADE_M3) === 5000 && DoloresFluxoNormal;
  tests.push(recordTest('T015', 'RES DOLORES DURAN II = sistema 300, 5000 m³, fluxo normal', doloresOk, dolores ? `Sistema ${dolores.SISTEMA}, capacidade ${dolores.CAPACIDADE_M3}, fluxo normal ${DoloresFluxoNormal ? 'SIM' : 'NÃO'}` : 'Registro não encontrado'));
  tests.push(recordTest('T016', 'Bloqueantes restantes = 0', summary.bloqueantesRestantes === 0, `bloqueantesRestantes = ${summary.bloqueantesRestantes}`));

  const result = {
    data: new Date().toISOString(),
    source: 'sandbox_hidraulica/LEITOR_MODELAGEM_HIDRAULICA_SANDBOX.js',
    modelo: modeloPath,
    summary,
    tests,
    totals: {
      total: tests.length,
      aprovados: tests.filter(t => t.RESULTADO === 'APROVADO').length,
      reprovados: tests.filter(t => t.RESULTADO === 'REPROVADO').length,
      falhasCriticas: tests.filter(t => t.RESULTADO === 'REPROVADO').length,
    },
  };

  fs.writeFileSync(outputJsonPath, JSON.stringify(result, null, 2), 'utf8');
  fs.writeFileSync(outputCsvPath, buildCsv(tests), 'utf8');
  fs.writeFileSync(outputTxtPath, buildReport(tests, summary), 'utf8');

  console.log('Sandbox de leitura executado. Resultados escritos em:');
  console.log('- ' + outputJsonPath);
  console.log('- ' + outputCsvPath);
  console.log('- ' + outputTxtPath);
  console.log(`Total de testes: ${tests.length}, aprovados: ${result.totals.aprovados}, reprovados: ${result.totals.reprovados}`);
}

main();
