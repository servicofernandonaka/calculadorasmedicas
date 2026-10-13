/* ROBINS-I (Sterne et al., BMJ 2016;355:i4919) para coortes e outros estudos não randomizados de intervenções.
   Fonte conferida: "ROBINS-I detailed guidance", atualizado em 20 de outubro de 2016 (PDF oficial, 53 p.).
   O guia define os julgamentos por domínio (Tabelas 5 a 11) em termos descritivos, não como algoritmo das respostas.
   Por isso a ferramenta NÃO calcula o julgamento de domínio: mostra as perguntas do caminho e os critérios oficiais,
   e o avaliador escolhe. Só o julgamento global (Tabela 2) é "algoritmo programável", segundo o próprio guia. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RobinsI = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const POS = (v) => v === 'Y' || v === 'PY';
  const NEG = (v) => v === 'N' || v === 'PN';
  const Q = (id, pt, en, extra) => Object.assign({ id, pt, en }, extra || {});
  const SEM_NI = { ni: false }, COM_NA = { na: true };

  const DOMINIOS = [
    { id: 'D1', titulo: 'Viés por confusão', perguntas: [
      Q('1.1', 'Há potencial de confusão no efeito da intervenção neste estudo?', 'Is there potential for confounding of the effect of intervention in this study?', SEM_NI),
      Q('1.2', 'A análise se baseou em dividir o tempo de seguimento conforme a intervenção recebida?', 'Was the analysis based on splitting participants’ follow up time according to intervention received?', COM_NA),
      Q('1.3', 'As interrupções ou trocas de intervenção provavelmente se relacionaram a fatores prognósticos do desfecho?', 'Were intervention discontinuations or switches likely to be related to factors that are prognostic for the outcome?', COM_NA),
      Q('1.4', 'Os autores usaram método de análise apropriado que controlou todos os domínios de confusão importantes?', 'Did the authors use an appropriate analysis method that controlled for all the important confounding domains?', COM_NA),
      Q('1.5', 'Se sim/provavelmente sim em 1.4: os domínios de confusão controlados foram medidos de forma válida e confiável pelas variáveis disponíveis?', 'If Y/PY to 1.4: Were confounding domains that were controlled for measured validly and reliably by the variables available in this study?', COM_NA),
      Q('1.6', 'Os autores controlaram variáveis pós-intervenção que poderiam ter sido afetadas pela intervenção?', 'Did the authors control for any post-intervention variables that could have been affected by the intervention?', COM_NA),
      Q('1.7', 'Os autores usaram método apropriado que controlou todos os domínios de confusão importantes e a confusão variável no tempo?', 'Did the authors use an appropriate analysis method that controlled for all the important confounding domains and for time-varying confounding?', COM_NA),
      Q('1.8', 'Se sim/provavelmente sim em 1.7: os domínios controlados foram medidos de forma válida e confiável?', 'If Y/PY to 1.7: Were confounding domains that were controlled for measured validly and reliably by the variables available in this study?', COM_NA)
    ], criterios: {
      baixo: 'Não se espera confusão.',
      moderado: '(i) Confusão esperada, todos os domínios importantes conhecidos foram medidos e controlados adequadamente; e (ii) a confiabilidade e a validade da medida foram suficientes para não esperarmos confusão residual séria.',
      grave: '(i) Pelo menos um domínio importante conhecido não foi medido de forma apropriada ou não foi controlado; ou (ii) a confiabilidade ou validade da medida de um domínio importante foi baixa o bastante para esperarmos confusão residual séria.',
      critico: '(i) Confusão inerentemente não controlável; ou (ii) o uso de controles negativos sugere fortemente confusão não medida.',
      ni: 'Não há informação sobre se pode haver confusão.' },
      criterios_en: {
        baixo: 'No confounding expected.',
        moderado: '(i) Confounding expected, all known important confounding domains appropriately measured and controlled for; and (ii) Reliability and validity of measurement of important domains were sufficient, such that we do not expect serious residual confounding.',
        grave: '(i) At least one known important domain was not appropriately measured, or not controlled for; or (ii) Reliability or validity of measurement of an important domain was low enough that we expect serious residual confounding.',
        critico: '(i) Confounding inherently not controllable or (ii) The use of negative controls strongly suggests unmeasured confounding.',
        ni: 'No information on whether confounding might be present.' } },
    { id: 'D2', titulo: 'Viés na seleção dos participantes para o estudo', perguntas: [
      Q('2.1', 'A seleção dos participantes para o estudo (ou para a análise) baseou-se em características observadas depois do início da intervenção?', 'Was selection of participants into the study (or into the analysis) based on participant characteristics observed after the start of intervention?'),
      Q('2.2', 'Se sim/provavelmente sim em 2.1: as variáveis pós-intervenção que influenciaram a seleção provavelmente estavam associadas à intervenção?', 'If Y/PY to 2.1: Were the post-intervention variables that influenced selection likely to be associated with intervention?', COM_NA),
      Q('2.3', 'Se sim/provavelmente sim em 2.2: essas variáveis provavelmente foram influenciadas pelo desfecho ou por uma causa do desfecho?', 'If Y/PY to 2.2: Were the post-intervention variables that influenced selection likely to be influenced by the outcome or a cause of the outcome?', COM_NA),
      Q('2.4', 'O início do seguimento e o início da intervenção coincidem para a maioria dos participantes?', 'Do start of follow-up and start of intervention coincide for most participants?'),
      Q('2.5', 'Se sim/provavelmente sim em 2.2 e 2.3, ou não/provavelmente não em 2.4: foram usadas técnicas de ajuste com probabilidade de corrigir o viés de seleção?', 'If Y/PY to 2.2 and 2.3, or N/PN to 2.4: Were adjustment techniques used that are likely to correct for the presence of selection biases?', COM_NA)
    ], criterios: {
      baixo: '(i) Todos os participantes elegíveis para o ensaio-alvo foram incluídos; e (ii) para cada participante, início do seguimento e início da intervenção coincidiram.',
      moderado: '(i) A seleção pode ter se relacionado à intervenção e ao desfecho, e os autores usaram métodos apropriados de ajuste; ou (ii) início do seguimento e da intervenção não coincidem para todos, e (a) a proporção foi pequena demais para induzir viés importante, ou (b) os autores usaram métodos apropriados de ajuste, ou (c) os autores da revisão têm confiança de que a razão de taxas (hazard) é constante no tempo.',
      grave: '(i) A seleção se relacionou (mas não muito fortemente) à intervenção e ao desfecho e isso não pôde ser ajustado; ou (ii) início do seguimento e da intervenção não coincidem, uma quantidade potencialmente importante de seguimento está ausente da análise e a razão de taxas não é constante no tempo.',
      critico: '(i) A seleção se relacionou muito fortemente à intervenção e ao desfecho e isso não pôde ser ajustado; ou (ii) é provável que uma quantidade substancial de seguimento esteja ausente da análise e a razão de taxas não é constante no tempo.',
      ni: 'Nada é relatado sobre a seleção dos participantes nem sobre a coincidência entre início do seguimento e da intervenção.' },
      criterios_en: {
        baixo: '(i) All participants who would have been eligible for the target trial were included in the study; and (ii) For each participant, start of follow up and start of intervention coincided.',
        moderado: '(i) Selection into the study may have been related to intervention and outcome; and The authors used appropriate methods to adjust for the selection bias; or (ii) Start of follow up and start of intervention do not coincide for all participants; and (a) the proportion of participants for which this was the case was too low to induce important bias; or (b) the authors used appropriate methods to adjust for the selection bias; or (c) the review authors are confident that the rate (hazard) ratio for the effect of intervention remains constant over time.',
        grave: '(i) Selection into the study was related (but not very strongly) to intervention and outcome; and This could not be adjusted for in analyses; or (ii) Start of follow up and start of intervention do not coincide; and A potentially important amount of follow-up time is missing from analyses; and The rate ratio is not constant over time.',
        critico: '(i) Selection into the study was very strongly related to intervention and outcome; and This could not be adjusted for in analyses; or (ii) A substantial amount of follow-up time is likely to be missing from analyses; and The rate ratio is not constant over time.',
        ni: 'No information is reported about selection of participants into the study or whether start of follow up and start of intervention coincide.' } },
    { id: 'D3', titulo: 'Viés na classificação das intervenções', perguntas: [
      Q('3.1', 'Os grupos de intervenção foram claramente definidos?', 'Were intervention groups clearly defined?'),
      Q('3.2', 'A informação usada para definir os grupos foi registrada no início da intervenção?', 'Was the information used to define intervention groups recorded at the start of the intervention?'),
      Q('3.3', 'A classificação do status de intervenção poderia ter sido afetada pelo conhecimento do desfecho ou do risco do desfecho?', 'Could classification of intervention status have been affected by knowledge of the outcome or risk of the outcome?')
    ], criterios: {
      baixo: '(i) O status de intervenção é bem definido; e (ii) a definição se baseia somente em informação coletada no momento da intervenção.',
      moderado: '(i) O status de intervenção é bem definido; e (ii) alguns aspectos da atribuição do status foram determinados retrospectivamente.',
      grave: '(i) O status de intervenção não é bem definido; ou (ii) aspectos importantes da atribuição foram determinados de modo que podem ter sido afetados pelo conhecimento do desfecho.',
      critico: '(Incomum) Quantidade extremamente alta de classificação errada da intervenção, por exemplo por viés de memória excepcionalmente forte.',
      ni: 'Não há definição da intervenção nem explicação da fonte da informação sobre o status de intervenção.' },
      criterios_en: {
        baixo: '(i) Intervention status is well defined; and (ii) Intervention definition is based solely on information collected at the time of intervention.',
        moderado: '(i) Intervention status is well defined; and (ii) Some aspects of the assignments of intervention status were determined retrospectively.',
        grave: '(i) Intervention status is not well defined; or (ii) Major aspects of the assignments of intervention status were determined in a way that could have been affected by knowledge of the outcome.',
        critico: '(Unusual) An extremely high amount of misclassification of intervention status, e.g. because of unusually strong recall biases.',
        ni: 'No definition of intervention or no explanation of the source of information about intervention status is reported.' } },
    { id: 'D4', titulo: 'Viés por desvios das intervenções pretendidas', perguntas: [
      Q('4.1', 'Houve desvios da intervenção pretendida além do esperado na prática usual?', 'Were there deviations from the intended intervention beyond what would be expected in usual practice?', { aim: 'assignment' }),
      Q('4.2', 'Se sim/provavelmente sim em 4.1: esses desvios foram desbalanceados entre os grupos e provavelmente afetaram o desfecho?', 'If Y/PY to 4.1: Were these deviations from intended intervention unbalanced between groups and likely to have affected the outcome?', { aim: 'assignment', na: true }),
      Q('4.3', 'As co-intervenções importantes foram balanceadas entre os grupos?', 'Were important co-interventions balanced across intervention groups?', { aim: 'adhering' }),
      Q('4.4', 'A intervenção foi implementada com sucesso para a maioria dos participantes?', 'Was the intervention implemented successfully for most participants?', { aim: 'adhering' }),
      Q('4.5', 'Os participantes aderiram ao regime de intervenção designado?', 'Did study participants adhere to the assigned intervention regimen?', { aim: 'adhering' }),
      Q('4.6', 'Se não/provavelmente não em 4.3, 4.4 ou 4.5: foi usada análise apropriada para estimar o efeito de iniciar e aderir à intervenção?', 'If N/PN to 4.3, 4.4 or 4.5: Was an appropriate analysis used to estimate the effect of starting and adhering to the intervention?', { aim: 'adhering', na: true })
    ], criterios: {
      baixo: 'Efeito da designação: (i) os desvios refletiram a prática usual; ou (ii) os desvios da prática usual provavelmente não afetaram o desfecho. Efeito de iniciar e aderir: as co-intervenções importantes foram balanceadas e não houve desvios (de implementação ou adesão) que provavelmente afetassem o desfecho.',
      moderado: 'Efeito da designação: houve desvios da prática usual, mas o impacto esperado no desfecho é pequeno. Efeito de iniciar e aderir: (i) houve desvios, mas o impacto esperado é pequeno; ou (ii) as co-intervenções não foram balanceadas ou houve desvios que provavelmente afetaram o desfecho, e a análise foi apropriada para estimar o efeito de iniciar e aderir.',
      grave: 'Efeito da designação: houve desvios da prática usual desbalanceados entre os grupos e que provavelmente afetaram o desfecho. Efeito de iniciar e aderir: (i) co-intervenções não balanceadas ou desvios que provavelmente afetaram o desfecho; e (ii) a análise não foi apropriada para estimar o efeito de iniciar e aderir.',
      critico: 'Efeito da designação: desvios substanciais da prática usual, desbalanceados e que provavelmente afetaram o desfecho. Efeito de iniciar e aderir: (i) desbalanço substancial de co-intervenções importantes ou desvios substanciais que provavelmente afetaram o desfecho; e (ii) análise não apropriada.',
      ni: 'Não há informação sobre se houve desvio da intervenção pretendida.' },
      criterios_en: {
        baixo: 'Effect of assignment: (i) Any deviations from intended intervention reflected usual practice; or (ii) Any deviations from usual practice were unlikely to impact on the outcome. Effect of starting and adhering: The important co-interventions were balanced across intervention groups, and there were no deviations from the intended interventions (in terms of implementation or adherence) that were likely to impact on the outcome.',
        moderado: 'Effect of assignment: There were deviations from usual practice, but their impact on the outcome is expected to be slight. Effect of starting and adhering: (i) There were deviations from intended intervention, but their impact on the outcome is expected to be slight; or (ii) The important co-interventions were not balanced across intervention groups, or there were deviations from the intended interventions that were likely to impact on the outcome; and The analysis was appropriate to estimate the effect of starting and adhering to intervention.',
        grave: 'Effect of assignment: There were deviations from usual practice that were unbalanced between the intervention groups and likely to have affected the outcome. Effect of starting and adhering: (i) The important co-interventions were not balanced across intervention groups, or there were deviations from the intended interventions that were likely to impact on the outcome; and (ii) The analysis was not appropriate to estimate the effect of starting and adhering to intervention.',
        critico: 'Effect of assignment: There were substantial deviations from usual practice that were unbalanced between the intervention groups and likely to have affected the outcome. Effect of starting and adhering: (i) There were substantial imbalances in important co-interventions across intervention groups, or there were substantial deviations from the intended interventions that were likely to impact on the outcome; and (ii) The analysis was not appropriate to estimate the effect of starting and adhering to intervention.',
        ni: 'No information is reported on whether there is deviation from the intended intervention.' } },
    { id: 'D5', titulo: 'Viés por dados faltantes', perguntas: [
      Q('5.1', 'Havia dados do desfecho para todos ou quase todos os participantes?', 'Were outcome data available for all, or nearly all, participants?'),
      Q('5.2', 'Participantes foram excluídos por falta de dado sobre o status de intervenção?', 'Were participants excluded due to missing data on intervention status?'),
      Q('5.3', 'Participantes foram excluídos por falta de dado em outras variáveis necessárias à análise?', 'Were participants excluded due to missing data on other variables needed for the analysis?'),
      Q('5.4', 'Se não/provavelmente não em 5.1, ou sim/provavelmente sim em 5.2 ou 5.3: a proporção de participantes com dados faltantes e os motivos são semelhantes entre as intervenções?', 'If PN/N to 5.1, or Y/PY to 5.2 or 5.3: Are the proportion of participants and reasons for missing data similar across interventions?', COM_NA),
      Q('5.5', 'Mesma condição de 5.4: há evidência de que os resultados são robustos à presença de dados faltantes?', 'If PN/N to 5.1, or Y/PY to 5.2 or 5.3: Is there evidence that results were robust to the presence of missing data?', COM_NA)
    ], criterios: {
      baixo: '(i) Os dados estavam razoavelmente completos; ou (ii) proporções e motivos de perda foram semelhantes entre os grupos; ou (iii) a análise tratou os dados faltantes e provavelmente removeu qualquer risco de viés.',
      moderado: '(i) Proporções e motivos de perda diferem pouco entre os grupos; e (ii) é improvável que a análise tenha removido o risco de viés decorrente dos dados faltantes.',
      grave: '(i) Proporções de perdas diferem substancialmente entre as intervenções, ou os motivos diferem substancialmente; e (ii) é improvável que a análise tenha removido o risco de viés, ou os dados faltantes foram tratados de forma inadequada, ou a natureza dos dados faltantes impede remover o viés por análise apropriada.',
      critico: '(i) (Incomum) Houve diferenças críticas entre as intervenções nos participantes com dados faltantes; e (ii) os dados faltantes não foram ou não puderam ser tratados por análise apropriada.',
      ni: 'Nada é relatado sobre dados faltantes ou sobre o potencial de haver dados faltantes.' },
      criterios_en: {
        baixo: '(i) Data were reasonably complete; or (ii) Proportions of and reasons for missing participants were similar across intervention groups; or (iii) The analysis addressed missing data and is likely to have removed any risk of bias.',
        moderado: '(i) Proportions of and reasons for missing participants differ slightly across intervention groups; and (ii) The analysis is unlikely to have removed the risk of bias arising from the missing data.',
        grave: '(i) Proportions of missing participants differ substantially across interventions; or Reasons for missingness differ substantially across interventions; and (ii) The analysis is unlikely to have removed the risk of bias arising from the missing data; or Missing data were addressed inappropriately in the analysis; or The nature of the missing data means that the risk of bias cannot be removed through appropriate analysis.',
        critico: '(i) (Unusual) There were critical differences between interventions in participants with missing data; and (ii) Missing data were not, or could not, be addressed through appropriate analysis.',
        ni: 'No information is reported about missing data or the potential for data to be missing.' } },
    { id: 'D6', titulo: 'Viés na mensuração dos desfechos', perguntas: [
      Q('6.1', 'A medida do desfecho poderia ter sido influenciada pelo conhecimento da intervenção recebida?', 'Could the outcome measure have been influenced by knowledge of the intervention received?'),
      Q('6.2', 'Os avaliadores do desfecho sabiam qual intervenção os participantes receberam?', 'Were outcome assessors aware of the intervention received by study participants?'),
      Q('6.3', 'Os métodos de avaliação do desfecho foram comparáveis entre os grupos?', 'Were the methods of outcome assessment comparable across intervention groups?'),
      Q('6.4', 'Algum erro sistemático na medida do desfecho esteve relacionado à intervenção recebida?', 'Were any systematic errors in measurement of the outcome related to intervention received?')
    ], criterios: {
      baixo: '(i) Os métodos de avaliação foram comparáveis entre os grupos; e (ii) a medida é pouco provável de ser influenciada pelo conhecimento da intervenção (é objetiva) ou os avaliadores desconheciam a intervenção; e (iii) qualquer erro de medida não se relaciona ao status de intervenção.',
      moderado: '(i) Métodos de avaliação comparáveis; e (ii) a medida é apenas minimamente influenciada pelo conhecimento da intervenção; e (iii) qualquer erro de medida só minimamente se relaciona ao status de intervenção.',
      grave: '(i) Métodos de avaliação não comparáveis entre os grupos; ou (ii) medida subjetiva (vulnerável à influência do conhecimento da intervenção) e avaliada por quem conhecia a intervenção; ou (iii) o erro de medida se relacionou ao status de intervenção.',
      critico: 'Os métodos de avaliação do desfecho foram tão diferentes que não podem ser razoavelmente comparados entre os grupos.',
      ni: 'Nada é relatado sobre os métodos de avaliação do desfecho.' },
      criterios_en: {
        baixo: '(i) The methods of outcome assessment were comparable across intervention groups; and (ii) The outcome measure was unlikely to be influenced by knowledge of the intervention received by study participants (i.e. is objective) or the outcome assessors were unaware of the intervention received by study participants; and (iii) Any error in measuring the outcome is unrelated to intervention status.',
        moderado: '(i) The methods of outcome assessment were comparable across intervention groups; and (ii) The outcome measure is only minimally influenced by knowledge of the intervention received by study participants; and (iii) Any error in measuring the outcome is only minimally related to intervention status.',
        grave: '(i) The methods of outcome assessment were not comparable across intervention groups; or (ii) The outcome measure was subjective (i.e. vulnerable to influence by knowledge of the intervention received by study participants); and The outcome was assessed by assessors aware of the intervention received by study participants; or (iii) Error in measuring the outcome was related to intervention status.',
        critico: 'The methods of outcome assessment were so different that they cannot reasonably be compared across intervention groups.',
        ni: 'No information is reported about the methods of outcome assessment.' } },
    { id: 'D7', titulo: 'Viés na seleção do resultado relatado', perguntas: [
      Q('7.1', 'O resultado relatado provavelmente foi selecionado, com base nos resultados, entre várias medidas do desfecho dentro do mesmo domínio de desfecho?', 'Is the reported effect estimate likely to be selected, on the basis of the results, from multiple outcome measurements within the outcome domain?'),
      Q('7.2', '… entre várias análises da relação intervenção-desfecho?', '… from multiple analyses of the intervention-outcome relationship?'),
      Q('7.3', '… entre diferentes subgrupos?', '… from different subgroups?')
    ], criterios: {
      baixo: 'Há evidência clara (geralmente pelo protocolo pré-registrado ou plano de análise estatística) de que todos os resultados relatados correspondem a todos os desfechos, análises e subcoortes pretendidos.',
      moderado: '(i) As medidas e análises do desfecho são consistentes com um plano a priori, ou claramente definidas e consistentes interna e externamente; e (ii) não há indício de seleção da análise relatada entre várias; e (iii) não há indício de seleção da coorte ou de subgrupos com base nos resultados.',
      grave: '(i) Desfechos definidos de modos diferentes em métodos e resultados, ou em diferentes publicações do estudo; ou (ii) alto risco de relato seletivo entre várias análises; ou (iii) a coorte ou subgrupo foi selecionado de um estudo maior e parece relatado com base nos resultados.',
      critico: '(i) Há evidência ou forte suspeita de relato seletivo; e (ii) os resultados não relatados provavelmente diferem substancialmente dos relatados.',
      ni: 'Há pouca informação para julgar (por exemplo, se só o resumo estiver disponível).' },
      criterios_en: {
        baixo: 'There is clear evidence (usually through examination of a pre-registered protocol or statistical analysis plan) that all reported results correspond to all intended outcomes, analyses and sub-cohorts.',
        moderado: '(i) The outcome measurements and analyses are consistent with an a priori plan; or are clearly defined and both internally and externally consistent; and (ii) There is no indication of selection of the reported analysis from among multiple analyses; and (iii) There is no indication of selection of the cohort or subgroups for analysis and reporting on the basis of the results.',
        grave: '(i) Outcomes are defined in different ways in the methods and results sections, or in different publications of the study; or (ii) There is a high risk of selective reporting from among multiple analyses; or (iii) The cohort or subgroup is selected from a larger study for analysis and appears to be reported on the basis of the results.',
        critico: '(i) There is evidence or strong suspicion of selective reporting of results; and (ii) The unreported results are likely to be substantially different from the reported results.',
        ni: 'There is too little information to make a judgement (for example if only an abstract is available for the study).' } }
  ];

  const NIVEIS = ['baixo', 'moderado', 'grave', 'critico', 'ni'];
  const ROTULO = { baixo: 'Baixo risco', moderado: 'Risco moderado', grave: 'Risco grave', critico: 'Risco crítico', ni: 'Sem informação' };

  /* Opções de resposta de cada pergunta (conforme as Caixas 4 a 10 do guia). */
  function opcoes(q) {
    const o = [];
    if (q.na) o.push('NA');
    o.push('Y', 'PY', 'PN', 'N');
    if (q.ni !== false) o.push('NI');
    return o;
  }

  /* Perguntas que devem ser respondidas, na ordem, conforme os desvios (skip logic) das Caixas 4 a 10.
     aim: 'assignment' (efeito da designação) ou 'adhering' (efeito de iniciar e aderir). */
  function visiveis(dom, r, aim) {
    r = r || {};
    const has = (id) => r[id] != null;
    const out = [];
    const add = (id) => out.push(id);
    if (dom === 'D1') {
      add('1.1');
      if (POS(r['1.1'])) {
        add('1.2');
        let base = false, tv = false;
        if (NEG(r['1.2'])) base = true;
        else if (POS(r['1.2'])) {
          add('1.3');
          if (NEG(r['1.3'])) base = true;
          else if (POS(r['1.3'])) tv = true;
          else if (has('1.3')) { base = true; tv = true; } // NI/NA: o guia não diz; mostra os dois blocos
        } else if (has('1.2')) { base = true; tv = true; } // NI/NA em 1.2
        if (base) { add('1.4'); if (POS(r['1.4'])) add('1.5'); add('1.6'); }
        if (tv) { add('1.7'); if (POS(r['1.7'])) add('1.8'); }
      }
    } else if (dom === 'D2') {
      add('2.1');
      if (has('2.1')) {
        let ok = true;
        if (POS(r['2.1'])) { add('2.2'); ok = has('2.2'); if (ok && POS(r['2.2'])) { add('2.3'); ok = has('2.3'); } }
        if (ok) {
          add('2.4');
          if ((POS(r['2.2']) && POS(r['2.3'])) || NEG(r['2.4'])) add('2.5');
        }
      }
    } else if (dom === 'D3') ['3.1', '3.2', '3.3'].forEach(add);
    else if (dom === 'D4') {
      if (aim === 'adhering') { ['4.3', '4.4', '4.5'].forEach(add); if (NEG(r['4.3']) || NEG(r['4.4']) || NEG(r['4.5'])) add('4.6'); }
      else { add('4.1'); if (POS(r['4.1'])) add('4.2'); }
    } else if (dom === 'D5') {
      ['5.1', '5.2', '5.3'].forEach(add);
      if (NEG(r['5.1']) || POS(r['5.2']) || POS(r['5.3'])) { add('5.4'); add('5.5'); }
    } else if (dom === 'D6') ['6.1', '6.2', '6.3', '6.4'].forEach(add);
    else if (dom === 'D7') ['7.1', '7.2', '7.3'].forEach(add);
    return out;
  }

  /* Tabela 2 do guia. j: objeto {D1..D7: 'baixo'|'moderado'|'grave'|'critico'|'ni'|undefined}. */
  function global(j) {
    const v = DOMINIOS.map((d) => (j || {})[d.id]);
    const falta = v.filter((x) => !x).length;
    const n = (k) => v.filter((x) => x === k).length;
    const nota = [];
    let g = null;
    if (n('critico')) g = 'critico';
    else if (n('grave')) g = 'grave';
    if (g) { if (falta) nota.push('Há domínios ainda sem julgamento, mas o nível já está definido pelo pior domínio.'); }
    else if (falta) g = null;
    else if (n('ni')) { g = 'ni'; nota.push('Sem indicação clara de risco grave ou crítico, mas faltam informações em domínio(s) importante(s): o guia pede um julgamento do avaliador.'); }
    else if (n('moderado')) g = 'moderado';
    else g = 'baixo';
    if (g === 'moderado' && n('moderado') >= 2) nota.push('Risco moderado em vários domínios: o guia admite que riscos moderados somados justifiquem julgamento global Grave. Decisão do avaliador.');
    if (g === 'grave' && n('grave') >= 2) nota.push('Risco grave em vários domínios: o guia admite que riscos graves somados justifiquem julgamento global Crítico. Decisão do avaliador.');
    if (g === 'baixo' && v[0] === 'baixo') nota.push('Baixo risco por confusão é raro em estudo não randomizado: revise a resposta 1.1.');
    return { global: g, faltam: falta, notas: nota };
  }

  /* Sugestão trivial que o guia dá explicitamente: sem potencial de confusão (1.1 N/PN) = baixo risco no domínio 1. */
  function sugestaoDominio(dom, r) {
    if (dom === 'D1' && NEG((r || {})['1.1'])) return 'baixo';
    return null;
  }
  return { DOMINIOS, NIVEIS, ROTULO, opcoes, visiveis, global, sugestaoDominio };
});
