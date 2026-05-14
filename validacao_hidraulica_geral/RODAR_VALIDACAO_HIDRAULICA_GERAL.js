const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname);
const sandboxHidraulicaPath = path.join(baseDir, '..', 'sandbox_hidraulica', 'RESULTADO_SANDBOX_LEITURA_HIDRAULICA.json');
const sandboxCompatibilidadePath = path.join(baseDir, '..', 'sandbox_compatibilidade', 'RESULTADO_COMPATIBILIDADE_BASES_HIDRAULICAS.json');
const sandboxConsultaPath = path.join(baseDir, '..', 'sandbox_consulta_hidraulica', 'RESULTADO_SIMULADOR_CONSULTA_HIDRAULICA.json');
const outputJsonPath = path.join(baseDir, 'RESULTADO_VALIDACAO_HIDRAULICA_GERAL.json');
const outputTxtPath = path.join(baseDir, 'RELATORIO_VALIDACAO_HIDRAULICA_GERAL.txt');
const outputCsvPath = path.join(baseDir, 'CHECKLIST_VALIDACAO_HIDRAULICA_GERAL.csv');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalize(value) {
  return String(value || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function findTestByDescription(result, term) {
  return result.tests.find(test => normalize(test.DESCRICAO).includes(normalize(term)));
}

function buildCsv(items) {
  const header = ['CRITÉRIO', 'RESULTADO', 'EVIDÊNCIA'];
  const lines = items.map(item => [item.criterio, item.resultado, item.evidencia].map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
  return [header.join(','), ...lines].join('\n');
}

function buildReport(summary, validations) {
  return [
    'RELATÓRIO VALIDAÇÃO HIDRÁULICA GERAL — GMAN DMAE',
    `Data da validação: ${summary.data}`,
    '',
    `Total de testes consolidados: ${summary.total}`,
    `Aprovados: ${summary.aprovados}`,
    `Reprovados: ${summary.reprovados}`,
    `Falhas críticas: ${summary.falhasCriticas}`,
    '',
    `Conclusão final: ${summary.conclusao}`,
    '',
    'Validações obrigatórias:',
    ...validations.map(v => `- ${v.criterio}: ${v.resultado} (${v.evidencia})`),
    '',
    'Fontes consideradas: sandbox_hidraulica, sandbox_compatibilidade, sandbox_consulta_hidraulica.',
    'Nenhuma alteração foi feita em index.html, dados_unidades_hidraulicas_gman.js, apps_script/Código.js, app, API ou produção.',
  ].join('\n');
}

function evaluateValidation(result, terms) {
  for (const term of terms) {
    const test = findTestByDescription(result, term);
    if (test) return { found: true, result: test.RESULTADO, evidence: test.EVIDENCIA };
  }
  return { found: false, result: 'NÃO ENCONTRADO', evidence: 'Sem evidência de teste' };
}

function main() {
  const sandboxHidraulica = readJson(sandboxHidraulicaPath);
  const sandboxCompatibilidade = readJson(sandboxCompatibilidadePath);
  const sandboxConsulta = readJson(sandboxConsultaPath);

  const allTests = [
    ...sandboxHidraulica.tests.map(test => ({ source: 'sandbox_hidraulica', ...test })),
    ...sandboxCompatibilidade.tests.map(test => ({ source: 'sandbox_compatibilidade', ...test })),
    ...sandboxConsulta.tests.map(test => ({ source: 'sandbox_consulta_hidraulica', ...test })),
  ];

  const totalTests = allTests.length;
  const approvedTests = allTests.filter(test => test.RESULTADO === 'APROVADO').length;
  const failedTests = totalTests - approvedTests;
  const criticalFailures = failedTests;

  const mandatoryValidations = [
    {
      criterio: 'sistema 500 ausente',
      ...evaluateValidation(sandboxConsulta, ['sistema 500 ausente']),
    },
    {
      criterio: 'VRP fora da base principal',
      ...evaluateValidation(sandboxHidraulica, ['VRP fora da base principal']),
    },
    {
      criterio: 'IN LINE fora de reservatórios físicos',
      ...evaluateValidation(sandboxHidraulica, ['IN LINE fora de reservatorios fisicos', 'IN LINE fora de reservatarios fisicos', 'IN LINE em reservatorios']),
    },
    {
      criterio: '97 reservatórios físicos',
      result: sandboxHidraulica.summary.reservatoriosFisicos === 97 ? 'APROVADO' : 'REPROVADO',
      evidence: `Encontrados: ${sandboxHidraulica.summary.reservatoriosFisicos}`,
    },
    {
      criterio: '89 unidades operacionais',
      result: sandboxHidraulica.summary.unidadesOperacionais === 89 ? 'APROVADO' : 'REPROVADO',
      evidence: `Encontrados: ${sandboxHidraulica.summary.unidadesOperacionais}`,
    },
    {
      criterio: '142 relações normais',
      result: sandboxHidraulica.summary.relacoesFluxoNormal === 142 ? 'APROVADO' : 'REPROVADO',
      evidence: `Encontrados: ${sandboxHidraulica.summary.relacoesFluxoNormal}`,
    },
    {
      criterio: '2 interligações de emergência',
      result: sandboxHidraulica.summary.interligacoesEmergencia === 2 ? 'APROVADO' : 'REPROVADO',
      evidence: `Encontrados: ${sandboxHidraulica.summary.interligacoesEmergencia}`,
    },
    {
      criterio: 'bloqueantes restantes = 0',
      result: sandboxHidraulica.summary.bloqueantesRestantes === 0 ? 'APROVADO' : 'REPROVADO',
      evidence: `Encontrados: ${sandboxHidraulica.summary.bloqueantesRestantes}`,
    },
  ];

  const mandatoryFailures = mandatoryValidations.filter(v => v.result !== 'APROVADO').length;
  const conclusion = mandatoryFailures > 0 ? 'REPROVADO' : (failedTests > 0 ? 'APROVADO COM RESSALVA' : 'APROVADO');

  const result = {
    data: new Date().toISOString(),
    source: 'validacao_hidraulica_geral/RODAR_VALIDACAO_HIDRAULICA_GERAL.js',
    totals: {
      total: totalTests,
      aprovados: approvedTests,
      reprovados: failedTests,
      falhasCriticas: criticalFailures,
    },
    conclusion,
    mandatoryValidations,
    sources: {
      sandboxHidraulica: sandboxHidraulicaPath,
      sandboxCompatibilidade: sandboxCompatibilidadePath,
      sandboxConsulta: sandboxConsultaPath,
    },
  };
  const reportSummary = {
    data: result.data,
    total: result.totals.total,
    aprovados: result.totals.aprovados,
    reprovados: result.totals.reprovados,
    falhasCriticas: result.totals.falhasCriticas,
    conclusao: result.conclusion,
  };

  fs.writeFileSync(outputJsonPath, JSON.stringify(result, null, 2), 'utf8');
  fs.writeFileSync(outputCsvPath, buildCsv(mandatoryValidations.map(v => ({ criterio: v.criterio, resultado: v.result, evidencia: v.evidence }))), 'utf8');
  fs.writeFileSync(outputTxtPath, buildReport(reportSummary, mandatoryValidations.map(v => ({ criterio: v.criterio, resultado: v.result, evidencia: v.evidence }))), 'utf8');

  console.log('Validação hidráulica geral executada. Resultados escritos em:');
  console.log('- ' + outputJsonPath);
  console.log('- ' + outputCsvPath);
  console.log('- ' + outputTxtPath);
  console.log(`Total de testes: ${totalTests}, aprovados: ${approvedTests}, reprovados: ${failedTests}, falhas críticas: ${criticalFailures}`);
  console.log(`Conclusão final: ${conclusion}`);
}

main();