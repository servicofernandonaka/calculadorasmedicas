/* AMSTAR 2 (Shea et al., BMJ 2017;358:j4008) para revisões sistemáticas de intervenções.
   Fontes conferidas: checklist oficial (4 p.), resumo do NCCMT (5 p.) e o artigo original (BMJ 2017;358:j4008, Caixas 1 e 2).
   O instrumento não deve ser pontuado ("strongly recommend that individual item ratings are not combined to create an overall score").
   A Caixa 2 propõe, em caráter consultivo, uma classificação de confiança a partir de falhas em itens críticos (2, 4, 7, 9, 11, 13, 15). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Amstar2 = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  /* Cada critério: [id, pt, en]. Estrutura de um item:
     py: critérios que, todos juntos, dão "Sim parcial" (opcional)
     yes: lista de alternativas; cada alternativa é uma lista de critérios que, todos juntos, dão "Sim" (junto com py, se houver)
     ma: item só se aplica se houve meta-análise (resposta extra "Sem meta-análise")
     design: 'rct' | 'nrsi' (itens 9 e 11 avaliam por tipo de desenho) */
  const C = (id, pt, en) => ({ id, pt, en });
  const ITENS = [
    { n: 1, crit: false, pt: 'As perguntas de pesquisa e os critérios de inclusão incluíram os componentes do PICO?', en: 'Did the research questions and inclusion criteria for the review include the components of PICO?',
      criterios: [C('p', 'População', 'Population'), C('i', 'Intervenção', 'Intervention'), C('c', 'Grupo comparador', 'Comparator group'), C('o', 'Desfecho', 'Outcome'), C('t', 'Opcional (recomendado): tempo de seguimento', 'Optional (recommended): Timeframe for follow-up')],
      yes: [['p', 'i', 'c', 'o']] },
    { n: 2, crit: false, pt: 'O relato da revisão traz declaração explícita de que os métodos foram estabelecidos antes da condução da revisão, e justifica desvios significativos do protocolo?', en: 'Did the report of the review contain an explicit statement that the review methods were established prior to the conduct of the review and did the report justify any significant deviations from the protocol?',
      criterios: [C('q', 'Protocolo escrito com a(s) pergunta(s) da revisão', 'Written protocol/guide included: review question(s)'), C('s', 'Protocolo escrito com a estratégia de busca', '… a search strategy'), C('e', 'Protocolo escrito com critérios de inclusão/exclusão', '… inclusion/exclusion criteria'), C('r', 'Protocolo escrito com avaliação do risco de viés', '… a risk of bias assessment'),
        C('reg', 'Protocolo registrado', 'The protocol should be registered'), C('ma', 'Plano de meta-análise/síntese, se apropriado', 'a meta-analysis/synthesis plan, if appropriate'), C('het', 'Plano para investigar causas de heterogeneidade', 'a plan for investigating causes of heterogeneity'), C('dev', 'Justificativa para quaisquer desvios do protocolo', 'justification for any deviations from the protocol')],
      py: ['q', 's', 'e', 'r'], yes: [['reg', 'ma', 'het', 'dev']] },
    { n: 3, crit: false, pt: 'Os autores explicaram a seleção dos desenhos de estudo incluídos na revisão?', en: 'Did the review authors explain their selection of the study designs for inclusion in the review?',
      criterios: [C('x', 'Explicou a inclusão apenas de ECRs, OU apenas de estudos não randomizados, OU de ambos', 'Explanation for including only RCTs OR only NRSI OR both RCTs and NRSI')], yes: [['x']] },
    { n: 4, crit: false, pt: 'Os autores usaram estratégia de busca abrangente na literatura?', en: 'Did the review authors use a comprehensive literature search strategy?',
      criterios: [C('db', 'Pelo menos 2 bases de dados (relevantes para a pergunta)', 'searched at least 2 databases (relevant to research question)'), C('kw', 'Apresentou palavras-chave e/ou estratégia de busca', 'provided key word and/or search strategy'), C('rs', 'Justificou restrições de publicação (por exemplo, idioma)', 'justified publication restrictions (e.g. language)'),
        C('ref', 'Buscou nas listas de referências/bibliografias dos estudos incluídos', 'searched the reference lists / bibliographies of included studies'), C('reg', 'Buscou em registros de ensaios/estudos', 'searched trial/study registries'), C('exp', 'Consultou especialistas da área', 'included/consulted content experts in the field'), C('gl', 'Quando relevante, buscou literatura cinzenta', 'where relevant, searched for grey literature'), C('m24', 'Busca conduzida até 24 meses antes da conclusão da revisão', 'conducted search within 24 months of completion of the review')],
      py: ['db', 'kw', 'rs'], yes: [['ref', 'reg', 'exp', 'gl', 'm24']] },
    { n: 5, crit: false, pt: 'Os autores fizeram a seleção dos estudos em duplicata?', en: 'Did the review authors perform study selection in duplicate?',
      criterios: [C('a', 'Pelo menos dois revisores concordaram de forma independente na seleção dos estudos elegíveis e chegaram a consenso sobre quais incluir', 'at least two reviewers independently agreed on selection of eligible studies and achieved consensus on which studies to include'), C('b', 'OU dois revisores selecionaram uma amostra de estudos com boa concordância (pelo menos 80%) e o restante foi selecionado por um revisor', 'OR two reviewers selected a sample of eligible studies and achieved good agreement (at least 80 percent), with the remainder selected by one reviewer')],
      yes: [['a'], ['b']] },
    { n: 6, crit: false, pt: 'Os autores fizeram a extração de dados em duplicata?', en: 'Did the review authors perform data extraction in duplicate?',
      criterios: [C('a', 'Pelo menos dois revisores chegaram a consenso sobre quais dados extrair dos estudos incluídos', 'at least two reviewers achieved consensus on which data to extract from included studies'), C('b', 'OU dois revisores extraíram dados de uma amostra de estudos com boa concordância (pelo menos 80%) e o restante foi extraído por um revisor', 'OR two reviewers extracted data from a sample of eligible studies and achieved good agreement (at least 80 percent), with the remainder extracted by one reviewer')],
      yes: [['a'], ['b']] },
    { n: 7, crit: false, pt: 'Os autores forneceram a lista de estudos excluídos e justificaram as exclusões?', en: 'Did the review authors provide a list of excluded studies and justify the exclusions?',
      criterios: [C('l', 'Lista de todos os estudos potencialmente relevantes lidos em texto completo e excluídos', 'provided a list of all potentially relevant studies that were read in full-text form but excluded from the review'), C('j', 'Justificou a exclusão de cada estudo potencialmente relevante', 'Justified the exclusion from the review of each potentially relevant study')],
      py: ['l'], yes: [['j']] },
    { n: 8, crit: false, pt: 'Os autores descreveram os estudos incluídos com detalhe adequado?', en: 'Did the review authors describe the included studies in adequate detail?',
      criterios: [C('p', 'Descreveu populações', 'described populations'), C('i', 'Descreveu intervenções', 'described interventions'), C('c', 'Descreveu comparadores', 'described comparators'), C('o', 'Descreveu desfechos', 'described outcomes'), C('d', 'Descreveu desenhos de pesquisa', 'described research designs'),
        C('pd', 'Descreveu a população em detalhe', 'described population in detail'), C('id', 'Descreveu a intervenção em detalhe (incluindo doses, quando relevante)', 'described intervention in detail (including doses where relevant)'), C('cd', 'Descreveu o comparador em detalhe (incluindo doses, quando relevante)', 'described comparator in detail (including doses where relevant)'), C('se', 'Descreveu o cenário do estudo', 'described study’s setting'), C('tf', 'Descreveu o tempo de seguimento', 'timeframe for follow-up')],
      py: ['p', 'i', 'c', 'o', 'd'], yes: [['pd', 'id', 'cd', 'se', 'tf']] },
    { n: 9, crit: false, porDesenho: true, pt: 'Os autores usaram técnica satisfatória para avaliar o risco de viés (RoB) dos estudos individuais incluídos?', en: 'Did the review authors use a satisfactory technique for assessing the risk of bias (RoB) in individual studies that were included in the review?',
      rct: { criterios: [C('ac', 'Avaliou ocultação da alocação (alocação não oculta)', 'unconcealed allocation'), C('bl', 'Avaliou ausência de cegamento de pacientes e avaliadores na aferição dos desfechos (desnecessário para desfechos objetivos, como mortalidade por todas as causas)', 'lack of blinding of patients and assessors when assessing outcomes (unnecessary for objective outcomes such as all-cause mortality)'),
          C('sq', 'Avaliou sequência de alocação não verdadeiramente aleatória', 'allocation sequence that was not truly random'), C('sr', 'Avaliou seleção do resultado relatado entre múltiplas medidas ou análises de um desfecho especificado', 'selection of the reported result from among multiple measurements or analyses of a specified outcome')],
        py: ['ac', 'bl'], yes: [['sq', 'sr']] },
      nrsi: { criterios: [C('cf', 'Avaliou confusão', 'confounding'), C('sb', 'Avaliou viés de seleção', 'selection bias'),
          C('ex', 'Avaliou os métodos usados para aferir exposições e desfechos', 'methods used to ascertain exposures and outcomes'), C('sr', 'Avaliou seleção do resultado relatado entre múltiplas medidas ou análises de um desfecho especificado', 'selection of the reported result from among multiple measurements or analyses of a specified outcome')],
        py: ['cf', 'sb'], yes: [['ex', 'sr']] } },
    { n: 10, crit: false, pt: 'Os autores relataram as fontes de financiamento dos estudos incluídos na revisão?', en: 'Did the review authors report on the sources of funding for the studies included in the review?',
      criterios: [C('f', 'Relatou as fontes de financiamento de cada estudo incluído (vale relatar que os revisores buscaram a informação e ela não constava nos estudos)', 'Must have reported on the sources of funding for individual studies included in the review. Note: Reporting that the reviewers looked for this information but it was not reported by study authors also qualifies')], yes: [['f']] },
    { n: 11, crit: false, ma: true, porDesenho: true, pt: 'Se houve meta-análise, os autores usaram métodos apropriados para combinar estatisticamente os resultados?', en: 'If meta-analysis was performed did the review authors use appropriate methods for statistical combination of results?',
      rct: { criterios: [C('j', 'Justificou combinar os dados em meta-análise', 'The authors justified combining the data in a meta-analysis'), C('w', 'Usou técnica ponderada apropriada e ajustou para heterogeneidade, se presente', 'AND they used an appropriate weighted technique to combine study results and adjusted for heterogeneity if present'), C('h', 'Investigou as causas de qualquer heterogeneidade', 'AND investigated the causes of any heterogeneity')], yes: [['j', 'w', 'h']] },
      nrsi: { criterios: [C('j', 'Justificou combinar os dados em meta-análise', 'The authors justified combining the data in a meta-analysis'), C('w', 'Usou técnica ponderada apropriada, ajustando para heterogeneidade, se presente', 'AND they used an appropriate weighted technique to combine study results, adjusting for heterogeneity if present'),
          C('aj', 'Combinou estimativas de efeito ajustadas para confusão (não dados brutos), ou justificou combinar dados brutos quando não havia estimativas ajustadas', 'AND they statistically combined effect estimates from NRSI that were adjusted for confounding, rather than combining raw data, or justified combining raw data when adjusted effect estimates were not available'),
          C('sp', 'Se a revisão incluiu ECRs e estudos não randomizados, relatou estimativas-resumo separadas para cada tipo', 'AND they reported separate summary estimates for RCTs and NRSI separately when both were included in the review')], yes: [['j', 'w', 'aj', 'sp']] } },
    { n: 12, crit: false, ma: true, pt: 'Se houve meta-análise, os autores avaliaram o impacto potencial do risco de viés dos estudos individuais nos resultados da meta-análise ou de outra síntese?', en: 'If meta-analysis was performed, did the review authors assess the potential impact of RoB in individual studies on the results of the meta-analysis or other evidence synthesis?',
      criterios: [C('lo', 'Incluiu apenas ECRs de baixo risco de viés', 'included only low risk of bias RCTs'), C('an', 'OU, se a estimativa combinada se baseou em ECRs e/ou estudos não randomizados de risco de viés variável, fez análises para investigar o possível impacto do risco de viés nas estimativas-resumo', 'OR, if the pooled estimate was based on RCTs and/or NRSI at variable RoB, the authors performed analyses to investigate possible impact of RoB on summary estimates of effect')], yes: [['lo'], ['an']] },
    { n: 13, crit: false, pt: 'Os autores levaram em conta o risco de viés dos estudos individuais ao interpretar/discutir os resultados da revisão?', en: 'Did the review authors account for RoB in individual studies when interpreting/ discussing the results of the review?',
      criterios: [C('lo', 'Incluiu apenas ECRs de baixo risco de viés', 'included only low risk of bias RCTs'), C('di', 'OU, se incluiu ECRs de risco moderado/alto ou estudos não randomizados, discutiu o provável impacto do risco de viés nos resultados', 'OR, if RCTs with moderate or high RoB, or NRSI were included the review provided a discussion of the likely impact of RoB on the results')], yes: [['lo'], ['di']] },
    { n: 14, crit: false, pt: 'Os autores deram explicação satisfatória e discutiram qualquer heterogeneidade observada nos resultados?', en: 'Did the review authors provide a satisfactory explanation for, and discussion of, any heterogeneity observed in the results of the review?',
      criterios: [C('sh', 'Não houve heterogeneidade significativa nos resultados', 'There was no significant heterogeneity in the results'), C('iv', 'OU, havendo heterogeneidade, investigou suas fontes e discutiu o impacto nos resultados da revisão', 'OR if heterogeneity was present the authors performed an investigation of sources of any heterogeneity in the results and discussed the impact of this on the results of the review')], yes: [['sh'], ['iv']] },
    { n: 15, crit: false, ma: true, pt: 'Se houve síntese quantitativa, os autores investigaram adequadamente o viés de publicação (viés de estudos pequenos) e discutiram seu provável impacto?', en: 'If they performed quantitative synthesis did the review authors carry out an adequate investigation of publication bias (small study bias) and discuss its likely impact on the results of the review?',
      criterios: [C('t', 'Fez testes gráficos ou estatísticos de viés de publicação e discutiu a probabilidade e a magnitude do impacto', 'performed graphical or statistical tests for publication bias and discussed the likelihood and magnitude of impact of publication bias')], yes: [['t']] },
    { n: 16, crit: false, pt: 'Os autores relataram possíveis fontes de conflito de interesses, incluindo o financiamento recebido para conduzir a revisão?', en: 'Did the review authors report any potential sources of conflict of interest, including any funding they received for conducting the review?',
      criterios: [C('nc', 'Relataram ausência de conflitos de interesse', 'The authors reported no competing interests'), C('fm', 'OU descreveram suas fontes de financiamento e como manejaram os possíveis conflitos', 'OR The authors described their funding sources and how they managed potential conflicts of interest')], yes: [['nc'], ['fm']] }
  ];
  const ROTULO = { yes: 'Sim', partial: 'Sim parcial', no: 'Não', nma: 'Sem meta-análise', incompleto: 'Sem resposta' };

  const todos = (ids, m) => (ids || []).every((i) => m && m[i]);
  /* Resultado de um conjunto de critérios (py/yes). Retorna 'yes' | 'partial' | 'no'. */
  function nivel(spec, m) {
    const pyOk = todos(spec.py, m);
    if (pyOk && spec.yes.some((alt) => todos(alt, m))) return 'yes';
    if (spec.py && pyOk) return 'partial';
    return 'no';
  }
  /* estado: { desenho: 'rct'|'nrsi'|'ambos', ma: true|false|null (houve meta-análise),
       marcas: { [n]: {critério: true} } (itens simples), marcasRct / marcasNrsi: { [n]: {...} } (itens 9 e 11) }.
     Retorna por item: { n, resultado, partes } — partes só para itens por desenho. */
  function avaliar(est) {
    est = est || {};
    const des = est.desenho || null;
    const sem = est.ma === false;
    return ITENS.map((it) => {
      if (it.ma && sem) return { n: it.n, resultado: 'nma' };
      if (it.porDesenho) {
        if (!des) return { n: it.n, resultado: 'incompleto' };
        const tipos = des === 'ambos' ? ['rct', 'nrsi'] : [des];
        const partes = {};
        tipos.forEach((t) => {
          const spec = it[t];
          let m = ((t === 'rct' ? est.marcasRct : est.marcasNrsi) || {})[it.n] || {};
          if (it.n === 11 && t === 'nrsi' && des !== 'ambos') m = Object.assign({}, m, { sp: true }); // exigência só vale quando a revisão incluiu os dois tipos
          partes[t] = nivel(spec, m);
        });
        const r = tipos.length === 1 ? partes[tipos[0]] : null;
        return { n: it.n, resultado: r, partes };
      }
      const m = (est.marcas || {})[it.n] || {};
      return { n: it.n, resultado: nivel(it, m) };
    });
  }
  /* Caixas 1 e 2 do artigo. Itens críticos: 2, 4, 7, 9, 11, 13, 15.
     O artigo não define o que conta como "falha"/"fraqueza": aqui "Não" conta; "Sim parcial" só conta se opts.parcialFalha.
     Itens "Sem meta-análise" ou sem resposta não contam. Em itens por desenho (9 e 11), basta uma parte com falha. */
  const CRITICOS = [2, 4, 7, 9, 11, 13, 15];
  const NIVEL_GERAL = { alta: 'Alta', moderada: 'Moderada', baixa: 'Baixa', criticamente_baixa: 'Criticamente baixa' };
  function confianca(out, opts) {
    const pf = !!(opts && opts.parcialFalha);
    const falha = (r) => {
      const vs = r.partes ? Object.values(r.partes) : [r.resultado];
      return vs.some((v) => v === 'no' || (pf && v === 'partial'));
    };
    let crit = 0, nao = 0, pend = 0;
    out.forEach((r) => {
      if (r.resultado === 'incompleto') { pend++; return; }
      if (r.resultado === 'nma') return;
      if (falha(r)) { if (CRITICOS.includes(r.n)) crit++; else nao++; }
    });
    const notas = [];
    let nivel;
    if (crit > 1) nivel = 'criticamente_baixa';
    else if (crit === 1) nivel = 'baixa';
    else if (nao > 1) { nivel = 'moderada'; notas.push('Várias fraquezas não críticas podem diminuir a confiança; o artigo admite rebaixar de moderada para baixa. Decisão do avaliador.'); }
    else nivel = 'alta';
    return { nivel, criticas: crit, naoCriticas: nao, pendentes: pend, provisorio: pend > 0, notas };
  }
  return { ITENS, ROTULO, avaliar, nivel, CRITICOS, NIVEL_GERAL, confianca };
});
