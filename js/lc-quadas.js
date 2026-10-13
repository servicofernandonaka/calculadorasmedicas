/* QUADAS-2 (Whiting et al., Ann Intern Med 2011;155:529-536) para estudos primários de acurácia diagnóstica.
   Fontes conferidas: formulário oficial "QUADAS-2" (3 p.) e o artigo original (10 p., fase 4 "Judgments on Bias and Applicability" e a
   seção sobre o julgamento global). Regras do artigo: se todas as perguntas de sinalização do domínio são "sim", o risco de viés
   pode ser julgado baixo; se alguma é "não", há potencial de viés e o julgamento segue as orientações específicas da revisão (fase 2);
   "incerto" só quando faltam dados. Global: baixo em todos os domínios = baixo risco / baixa preocupação; alto ou incerto em 1 ou
   mais = "em risco de viés" / "com preocupação de aplicabilidade". O artigo desaconselha escores numéricos. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Quadas2 = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const Q = (id, pt, en) => ({ id, pt, en });
  const DOMINIOS = [
    { id: 'D1', titulo: 'Seleção dos pacientes',
      descR: 'Descreva os métodos de seleção dos pacientes', descA: 'Descreva os pacientes incluídos (testes prévios, apresentação, uso pretendido do teste índice e cenário)',
      perguntas: [Q('1.1', 'Foi incluída uma amostra consecutiva ou aleatória de pacientes?', 'Was a consecutive or random sample of patients enrolled?'), Q('1.2', 'O desenho caso-controle foi evitado?', 'Was a case-control design avoided?'), Q('1.3', 'O estudo evitou exclusões inapropriadas?', 'Did the study avoid inappropriate exclusions?')],
      risco: 'A seleção dos pacientes pode ter introduzido viés?', riscoEn: 'Could the selection of patients have introduced bias?',
      aplic: 'Há preocupação de que os pacientes incluídos não correspondam à pergunta da revisão?', aplicEn: 'Is there concern that the included patients do not match the review question?' },
    { id: 'D2', titulo: 'Teste(s) índice',
      descR: 'Descreva o teste índice e como foi realizado e interpretado', descA: null,
      perguntas: [Q('2.1', 'Os resultados do teste índice foram interpretados sem conhecimento dos resultados do padrão de referência?', 'Were the index test results interpreted without knowledge of the results of the reference standard?'), Q('2.2', 'Se foi usado um ponto de corte, ele foi pré-especificado?', 'If a threshold was used, was it pre-specified?')],
      risco: 'A condução ou a interpretação do teste índice pode ter introduzido viés?', riscoEn: 'Could the conduct or interpretation of the index test have introduced bias?',
      aplic: 'Há preocupação de que o teste índice, sua condução ou interpretação difiram da pergunta da revisão?', aplicEn: 'Is there concern that the index test, its conduct, or interpretation differ from the review question?' },
    { id: 'D3', titulo: 'Padrão de referência',
      descR: 'Descreva o padrão de referência e como foi realizado e interpretado', descA: null,
      perguntas: [Q('3.1', 'É provável que o padrão de referência classifique corretamente a condição-alvo?', 'Is the reference standard likely to correctly classify the target condition?'), Q('3.2', 'Os resultados do padrão de referência foram interpretados sem conhecimento dos resultados do teste índice?', 'Were the reference standard results interpreted without knowledge of the results of the index test?')],
      risco: 'O padrão de referência, sua condução ou sua interpretação pode ter introduzido viés?', riscoEn: 'Could the reference standard, its conduct, or its interpretation have introduced bias?',
      aplic: 'Há preocupação de que a condição-alvo definida pelo padrão de referência não corresponda à pergunta da revisão?', aplicEn: 'Is there concern that the target condition as defined by the reference standard does not match the review question?' },
    { id: 'D4', titulo: 'Fluxo e tempo',
      descR: 'Descreva os pacientes que não receberam o(s) teste(s) índice e/ou o padrão de referência ou que foram excluídos da tabela 2x2 (veja o diagrama de fluxo), e o intervalo de tempo e eventuais intervenções entre o teste índice e o padrão de referência', descA: null,
      perguntas: [Q('4.1', 'Houve intervalo apropriado entre o(s) teste(s) índice e o padrão de referência?', 'Was there an appropriate interval between index test(s) and reference standard?'), Q('4.2', 'Todos os pacientes receberam um padrão de referência?', 'Did all patients receive a reference standard?'), Q('4.3', 'Todos os pacientes receberam o mesmo padrão de referência?', 'Did patients receive the same reference standard?'), Q('4.4', 'Todos os pacientes foram incluídos na análise?', 'Were all patients included in the analysis?')],
      risco: 'O fluxo dos pacientes pode ter introduzido viés?', riscoEn: 'Could the patient flow have introduced bias?', aplic: null, aplicEn: null }
  ];
  const RESP = ['Y', 'N', 'U'];
  const RESP_ROTULO = { Y: 'Sim', N: 'Não', U: 'Incerto' };
  const NIVEL_ROTULO = { baixo: 'Baixo', alto: 'Alto', incerto: 'Incerto' };
  /* Sugestão (não é julgamento) a partir das respostas às perguntas de sinalização de um domínio. r: {id: 'Y'|'N'|'U'}. */
  function sugestaoRisco(dom, r) {
    const d = DOMINIOS.find((x) => x.id === dom);
    const v = d.perguntas.map((q) => (r || {})[q.id]);
    if (v.some((x) => x === 'N')) return 'potencial';
    if (v.every((x) => x === 'Y')) return 'baixo';
    return null;
  }
  /* Julgamento global do estudo (artigo, seção de resumo): baixo em todos = baixo; alto ou incerto em 1 ou mais = em risco. */
  function globalEstudo(j, usarDominios) {
    const v = DOMINIOS.filter((d) => (usarDominios === 'aplic' ? d.aplic : true)).map((d) => (j || {})[d.id]);
    if (v.some((x) => x === 'alto' || x === 'incerto')) return 'em_risco';
    if (v.every((x) => x === 'baixo')) return 'baixo';
    return null;
  }
  /* Resumo por estudo: contagem dos julgamentos. */
  function resumo(jr, ja) {
    const r = DOMINIOS.map((d) => (jr || {})[d.id]), a = DOMINIOS.filter((d) => d.aplic).map((d) => (ja || {})[d.id]);
    const cont = (v, k) => v.filter((x) => x === k).length;
    return { risco: { baixo: cont(r, 'baixo'), alto: cont(r, 'alto'), incerto: cont(r, 'incerto'), faltam: cont(r, undefined) }, aplic: { baixo: cont(a, 'baixo'), alto: cont(a, 'alto'), incerto: cont(a, 'incerto'), faltam: cont(a, undefined) } };
  }
  return { DOMINIOS, RESP, RESP_ROTULO, NIVEL_ROTULO, resumo, sugestaoRisco, globalEstudo };
});
