/* Pedidos de exames especiais: catálogo de exames, critérios (cada um com fonte) e regras de pendência.

   Como ler os dados:
   - Cada critério tem "fonte" (id em fontes do exame) e "v": true quando a recomendação foi lida no texto da fonte
     (texto completo, ou só o resumo, dito na nota da fonte); v: false quando é um critério de uso corrente que ainda
     NÃO foi conferido no texto de uma diretriz. A tela mostra essa diferença.
   - "intervaloMin" (anos) em critérios de seguimento: o motor avisa se o exame anterior é mais recente.
   - Regras (campo "regras") bloqueiam ("alto") ou avisam ("atencao", "info"); ver js/pedidos-engine.js.
   Os CID-10 são sugestões: confirme no seu sistema.
   Dados conferidos em 26/11/2026 (leituras via NCBI/PMC). Nenhum critério foi escrito de memória sem a marca v: false. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PedidosDados = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const C = (id, rotulo, o) => Object.assign({ id, rotulo, frase: rotulo, v: true }, o || {});
  const F = (nome, link, curta, nota, tipo) => ({ nome, link, curta, nota, tipo: tipo || 'primaria' });
  const ids = (ex, ...gs) => ex.grupos.filter((g) => gs.includes(g.id)).flatMap((g) => g.criterios.map((c) => c.id));
  const PMC = (id) => 'https://pmc.ncbi.nlm.nih.gov/articles/' + id + '/';
  const PUBMED = (id) => 'https://pubmed.ncbi.nlm.nih.gov/' + id + '/';
  const OBS_ANTICOAG = 'Informe o fármaco, a dose e a indicação. O ACG-CAG 2022 sugere manter a varfarina em procedimento eletivo, suspender o anticoagulante direto temporariamente (1 a 2 dias) e, na dupla antiagregação, suspender o inibidor de P2Y12 mantendo o AAS. A conduta é do endoscopista junto com o médico que prescreveu.';

  /* ================= Digestivo ================= */
  const eda = {
    id: 'eda', sistema: 'Digestivo', nome: 'Endoscopia digestiva alta (esofagogastroduodenoscopia)', nomeCurto: 'Endoscopia digestiva alta (EDA)',
    cids: [['K30', 'Dispepsia'], ['K21.0', 'Doença do refluxo gastroesofágico com esofagite'], ['K21.9', 'Doença do refluxo gastroesofágico sem esofagite'],
      ['K22.7', 'Esôfago de Barrett'], ['R13', 'Disfagia'], ['R63.4', 'Perda de peso anormal'], ['D50.9', 'Anemia por deficiência de ferro, não especificada'],
      ['K92.0', 'Hematêmese'], ['K92.1', 'Melena'], ['K92.2', 'Hemorragia gastrointestinal, não especificada'], ['K25.9', 'Úlcera gástrica'],
      ['K74.6', 'Outras cirroses do fígado e as não especificadas'], ['K76.6', 'Hipertensão portal'], ['R11', 'Náusea e vômitos']],
    fontes: {
      katz: F('Katz PO et al. ACG Clinical Guideline for the Diagnosis and Management of Gastroesophageal Reflux Disease. Am J Gastroenterol 2022;117(1):27-56', PMC('PMC8754510'), 'ACG 2022 (DRGE)',
        'Texto completo lido. Endoscopia quando sintomas típicos não respondem a 8 semanas de IBP ou voltam ao suspender (recomendação forte); como primeiro exame na disfagia e em outros sinais de alarme, como perda de peso e sangramento (forte); dor torácica sem pirose depois de afastar doença cardíaca (condicional).'),
      shaheen: F('Shaheen NJ et al. ACG Clinical Guideline: Diagnosis and Management of Barrett\'s Esophagus. Am J Gastroenterol 2022;117(4):559-587', PMC('PMC10259184'), 'ACG 2022 (Barrett)',
        'Texto completo lido. Uma endoscopia de rastreio em quem tem DRGE crônica e 3 ou mais fatores de risco (condicional, evidência muito baixa); vigilância sem displasia a cada 5 anos se o segmento for menor que 3 cm e a cada 3 anos se tiver 3 cm ou mais.'),
      moayyedi: F('Moayyedi PM et al. ACG and CAG Clinical Guideline: Management of Dyspepsia. Am J Gastroenterol 2017;112:988-1013', PUBMED('28631728'), 'ACG-CAG 2017 (dispepsia)',
        'Só o resumo foi lido: investigar com endoscopia quem tem 60 anos ou mais, e mais cedo quem tem risco aumentado de câncer gástrico; abaixo de 60, teste e tratamento do H. pylori e depois IBP; sinal de alarme em mais jovem é avaliado caso a caso.'),
      baveno: F('de Franchis R et al. Baveno VII: renewing consensus in portal hypertension. J Hepatol 2022 (PMID 35120736)', PMC('PMC11090185'), 'Baveno VII 2022',
        'Texto completo lido (manuscrito do autor). Recomendações 2.19 (cirrose compensada sem condições de usar betabloqueador), 5.17, 7.3 (ascite) e 8.52 (trombose portal).'),
      abraham: F('Abraham NS et al. ACG-CAG Clinical Practice Guideline: Management of Anticoagulants and Antiplatelets During Acute GI Bleeding and the Periendoscopic Period. Am J Gastroenterol 2022', PMC('PMC8966740'), 'ACG-CAG 2022 (anticoagulantes)',
        'Texto completo lido (recomendações 11 a 14A: varfarina, ponte, anticoagulantes diretos, dupla antiagregação).'),
    },
    grupos: [
      { id: 'alarme', rotulo: 'Sinais de alarme', dica: 'Descreva datas e valores no quadro clínico: o pedido fica mais forte com dado objetivo.', criterios: [
        C('eda_disfagia', 'Disfagia', { fonte: 'katz', detalhe: 'Endoscopia como primeiro exame (ACG 2022)' }),
        C('eda_peso', 'Perda de peso involuntária', { fonte: 'katz', detalhe: 'Informe quanto e em quanto tempo' }),
        C('eda_sangramento', 'Sangramento digestivo alto (hematêmese ou melena)', { fonte: 'katz' }),
        C('eda_vomitos', 'Vômitos persistentes', { fonte: 'katz' }),
        C('eda_anemia', 'Anemia ferropriva', { fonte: 'katz', detalhe: 'Como sinal de alarme. Anexe hemograma e ferritina' }),
      ] },
      { id: 'drge', rotulo: 'Doença do refluxo', criterios: [
        C('eda_drge_refrataria', 'Refluxo típico sem resposta a 8 semanas de IBP, ou que volta ao suspender', { fonte: 'katz',
          frase: 'Sintomas típicos de doença do refluxo sem resposta adequada ao teste terapêutico com IBP por 8 semanas (ou recidiva ao suspender o IBP)' }),
        C('eda_dor_toracica', 'Dor torácica sem pirose, depois de afastar causa cardíaca', { fonte: 'katz',
          frase: 'Dor torácica sem pirose, com avaliação cardíaca adequada que afastou doença cardíaca' }),
      ] },
      { id: 'dispepsia', rotulo: 'Dispepsia', criterios: [
        C('eda_disp_60', 'Dispepsia em paciente com 60 anos ou mais', { fonte: 'moayyedi', frase: 'Dispepsia em paciente com 60 anos ou mais (investigação de lesão orgânica)' }),
        C('eda_disp_risco', 'Dispepsia com risco aumentado de câncer gástrico (história familiar ou origem em região de alto risco)', { fonte: 'moayyedi',
          frase: 'Dispepsia em paciente com risco aumentado de câncer gástrico (história familiar positiva ou origem em região de alto risco)' }),
        C('eda_disp_refrataria', 'Dispepsia que não melhorou com teste e tratamento do H. pylori e com IBP', { fonte: 'moayyedi', v: false,
          detalhe: 'Pedido muito comum, mas o resumo da diretriz não define a endoscopia nesse cenário',
          frase: 'Dispepsia sem resposta ao teste e tratamento do H. pylori e ao IBP' }),
      ] },
      { id: 'barrett', rotulo: 'Esôfago de Barrett', criterios: [
        C('eda_barrett_rastreio', 'Rastreio de Barrett: refluxo crônico (marque abaixo os fatores de risco)', { fonte: 'shaheen', frase: 'Sintomas crônicos de refluxo (rastreio de esôfago de Barrett, com os fatores de risco abaixo)' }),
        C('eda_barrett_curto', 'Barrett sem displasia, segmento menor que 3 cm: vigilância a cada 5 anos', { fonte: 'shaheen', intervaloMin: 5, intervaloFonte: 'ACG 2022 (Barrett)',
          frase: 'Esôfago de Barrett sem displasia, segmento menor que 3 cm: vigilância endoscópica a cada 5 anos' }),
        C('eda_barrett_longo', 'Barrett sem displasia, segmento de 3 cm ou mais: vigilância a cada 3 anos', { fonte: 'shaheen', intervaloMin: 3, intervaloFonte: 'ACG 2022 (Barrett)',
          frase: 'Esôfago de Barrett sem displasia, segmento de 3 cm ou mais: vigilância endoscópica a cada 3 anos' }),
      ] },
      { id: 'barrett_fatores', rotulo: 'Fatores de risco para Barrett (3 ou mais)', soContexto: true, dica: 'A fonte é norte-americana e lista raça branca; marque conforme a sua avaliação.', criterios: [
        C('eda_bf_homem', 'Sexo masculino', { fonte: 'shaheen', frase: 'Fator de risco para Barrett: sexo masculino' }),
        C('eda_bf_idade', 'Idade acima de 50 anos', { fonte: 'shaheen', frase: 'Fator de risco para Barrett: idade acima de 50 anos' }),
        C('eda_bf_branca', 'Raça branca', { fonte: 'shaheen', frase: 'Fator de risco para Barrett: raça branca' }),
        C('eda_bf_fumo', 'Tabagismo', { fonte: 'shaheen', frase: 'Fator de risco para Barrett: tabagismo' }),
        C('eda_bf_obes', 'Obesidade', { fonte: 'shaheen', frase: 'Fator de risco para Barrett: obesidade' }),
        C('eda_bf_fam', 'Parente de 1º grau com Barrett ou adenocarcinoma de esôfago', { fonte: 'shaheen', frase: 'Fator de risco para Barrett: parente de 1º grau com Barrett ou adenocarcinoma de esôfago' }),
      ] },
      { id: 'cirrose', rotulo: 'Cirrose e hipertensão portal (rastreio de varizes)', criterios: [
        C('eda_cirr_compens', 'Cirrose compensada sem condições de usar betabloqueador, com elastografia ≥ 20 kPa ou plaquetas ≤ 150 mil/mm³', { fonte: 'baveno',
          frase: 'Cirrose compensada, sem indicação de iniciar betabloqueador não seletivo (contraindicação ou intolerância), com elastografia ≥ 20 kPa ou plaquetas ≤ 150 mil/mm³ (rastreio de varizes esofagogástricas)' }),
        C('eda_cirr_ascite', 'Cirrose com ascite, sem uso de betabloqueador', { fonte: 'baveno', frase: 'Cirrose com ascite, sem uso de betabloqueador (rastreio de varizes esofagogástricas)' }),
        C('eda_cirr_trombose', 'Trombose portal sem recanalização (EDA em até 6 meses do episódio)', { fonte: 'baveno', frase: 'Trombose portal sem recanalização (rastreio de varizes em até 6 meses do episódio agudo)' }),
      ] },
      { id: 'outras', rotulo: 'Outras indicações usuais', criterios: [
        C('eda_anemia_inv', 'Anemia ferropriva sem causa identificada (investigação)', { v: false }),
        C('eda_ulcera', 'Controle de cicatrização de úlcera gástrica', { v: false }),
        C('eda_celiaca', 'Sorologia positiva para doença celíaca (biópsia duodenal)', { v: false }),
      ] },
    ],
    contra: [C('eda_anticoag', 'Em uso de anticoagulante ou antiagregante', { fonte: 'abraham', frase: 'Em uso de anticoagulante ou antiagregante' })],
    campos: [
      { id: 'ibp', rotulo: 'Tratamento com IBP (dose, tempo de uso e resposta)', rotuloNoTexto: 'Tratamento prévio com IBP',
        exigidoQuando: { criterioAlgum: ['eda_drge_refrataria', 'eda_disp_refrataria'] }, exigidoMsg: 'Informe o IBP usado: dose, tempo de uso e resposta (o teste terapêutico é de 8 semanas).' },
      { id: 'hp', rotulo: 'H. pylori: teste e tratamento realizados', rotuloNoTexto: 'H. pylori',
        exigidoQuando: { criterioAlgum: ['eda_disp_refrataria'] }, exigidoMsg: 'Informe o teste e o tratamento do H. pylori realizados.' },
      { id: 'cardio', rotulo: 'Avaliação cardíaca realizada (exames e resultado)', rotuloNoTexto: 'Avaliação cardíaca',
        exigidoQuando: { criterio: ['eda_dor_toracica'] }, exigidoMsg: 'Informe a avaliação cardíaca que afastou doença cardíaca.' },
      { id: 'anosDesde', rotulo: 'Anos desde a última endoscopia', rotuloNoTexto: 'Última endoscopia há (anos)', tipo: 'numero',
        exigidoQuando: { criterioAlgum: ['eda_barrett_curto', 'eda_barrett_longo'] }, exigidoMsg: 'Informe há quantos anos foi a última endoscopia (vigilância de Barrett).' },
      { id: 'previo', rotulo: 'Endoscopia ou outro exame anterior (data e resultado)', rotuloNoTexto: 'Exame anterior' },
    ],
    regras: [
      { id: 'eda-disp60-jovem', nivel: 'atencao', se: { criterio: ['eda_disp_60'], idadeMenor: 60 },
        aviso: 'O critério marcado vale para 60 anos ou mais. Em paciente mais jovem, precisa de outro critério (sinal de alarme, risco aumentado de câncer gástrico ou falha do tratamento).' },
      { id: 'eda-alarme-jovem', nivel: 'info', se: { criterioAlgum: ['eda_peso', 'eda_sangramento', 'eda_vomitos', 'eda_anemia'], idadeMenor: 60 },
        aviso: 'Em menor de 60 anos, a ACG-CAG 2017 deixa a endoscopia por sinal de alarme da dispepsia para avaliação caso a caso; na doença do refluxo, a ACG 2022 indica a endoscopia assim que possível. Descreva o sinal de forma objetiva (data, hemoglobina, peso).' },
      { id: 'eda-barrett-fatores', nivel: 'atencao', se: { criterio: ['eda_barrett_rastreio'], grupoMenosQue: { grupo: 'barrett_fatores', n: 3 } },
        aviso: 'Rastreio de Barrett: a diretriz sugere refluxo crônico com 3 ou mais fatores de risco. Marque os fatores presentes.' },
      { id: 'eda-barrett-mulher', nivel: 'info', se: { criterio: ['eda_barrett_rastreio'], sexo: 'F' },
        aviso: 'O rastreio de Barrett em mulher tem baixo rendimento; a ACG 2022 admite considerá-lo só com vários fatores de risco.' },
      { id: 'eda-anticoag', nivel: 'info', se: { criterio: ['eda_anticoag'] }, aviso: OBS_ANTICOAG },
    ],
    naoIndicado: [
      'Refluxo típico (azia e regurgitação) sem sinais de alarme: a conduta inicial é teste terapêutico com IBP por 8 semanas, sem endoscopia de entrada (ACG 2022).',
      'Asma, tosse crônica ou laringite sem sintomas típicos: a endoscopia não deve ser usada para estabelecer o refluxo como causa (ACG 2022).',
      'Dispepsia em menor de 60 anos sem alarme: primeiro teste e tratamento do H. pylori e depois IBP (ACG-CAG 2017, resumo).',
      'Cirrose já em uso de betabloqueador não seletivo para prevenir descompensação: não precisa de endoscopia de rastreio de varizes (Baveno VII).',
      'Rastreio de Barrett em mulher: baixo rendimento (ACG 2022).',
    ],
    conferencia: { nivel: 'parcial', data: '2026-11-26', pendencias: [
      'Anemia ferropriva (investigação geral), úlcera gástrica e doença celíaca: sem fonte lida (marcados na tela).',
      'Dispepsia refratária: o resumo da ACG-CAG 2017 não define a endoscopia nesse cenário. O corpo da diretriz não foi lido.',
      'ASGE 2012 e 2015 e as fontes brasileiras (SOBED, protocolos de regulação) não foram acessadas.',
      'Preparo, gravidez e risco cardiopulmonar: sem fonte lida.',
    ] },
  };

  const col_vig = (id, rotulo, fonte, min, intervalo, extra) => C(id, rotulo, Object.assign({ fonte, intervaloMin: min, intervaloFonte: 'US Multi-Society Task Force 2020',
    frase: `Vigilância após exame anterior: ${rotulo.charAt(0).toLowerCase() + rotulo.slice(1)}; intervalo recomendado de ${intervalo}` }, extra || {}));

  const colonoscopia = {
    id: 'colonoscopia', sistema: 'Digestivo', nome: 'Colonoscopia', nomeCurto: 'Colonoscopia',
    cids: [['R19.5', 'Outras anormalidades fecais (inclui sangue oculto nas fezes)'], ['K62.5', 'Hemorragia do ânus e do reto'], ['D50.9', 'Anemia por deficiência de ferro, não especificada'],
      ['R19.4', 'Modificação do hábito intestinal'], ['K63.5', 'Pólipo do cólon'], ['Z12.1', 'Exame especial de rastreamento de neoplasia do intestino'],
      ['Z80.0', 'História familiar de neoplasia maligna dos órgãos digestivos'], ['K51.9', 'Colite ulcerativa, não especificada'], ['K50.9', 'Doença de Crohn, não especificada']],
    fontes: {
      gupta: F('Gupta S et al. Recommendations for Follow-Up After Colonoscopy and Polypectomy: US Multi-Society Task Force on Colorectal Cancer. Gastroenterology 2020;158:1131', PMC('PMC7672705'), 'US Multi-Society Task Force 2020 (vigilância)',
        'Texto completo lido (Tabelas 4 e 5). Intervalos para risco médio e exame de alta qualidade (completo até o ceco e com bom preparo). Não valem para doença inflamatória intestinal, síndromes hereditárias nem câncer prévio.'),
      uspstf: F('USPSTF. Colorectal Cancer: Screening. JAMA 2021;325:1965 (PMID 34003218)', 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/colorectal-cancer-screening', 'USPSTF 2021',
        'Só o resumo foi lido: 50 a 75 anos (grau A), 45 a 49 anos (grau B), 76 a 85 anos de forma seletiva (grau C).'),
      conitec: F('Conitec/MS. Diretrizes Brasileiras do Rastreamento do Câncer de Cólon e Reto: relatório de recomendação (versão preliminar, 2026)', 'https://www.gov.br/conitec/pt-br/midias/consultas/relatorios/2026/relatorio-preliminar-diretrizes-brasileiras-do-rastreamento-do-cancer-de-colon-e-reto-cp-20/@@display-file/file', 'Conitec 2026 (versão preliminar)',
        'De 50 a 75 anos, risco padrão e sem sintomas: FIT com corte de 50 ng/mL, bienal, e colonoscopia se positivo; depois de colonoscopia completa, repetir em 10 anos. Risco aumentado fica fora da diretriz.'),
      portaria: F('Ministério da Saúde. Portaria SAES/MS nº 4.642, de 06/08/2026 (inclui o FIT na tabela SIGTAP), via CONASS', 'https://www.conass.org.br/conass-informa-n-158-2026-publicada-portaria-saes-ms-n-4-642-que-inclui-procedimento-e-altera-atributos-de-procedimento-da-tabela-de-procedimentos-medicamentos-orteses-proteses-e-m/', 'Portaria SAES/MS 4.642/2026',
        'FIT para rastreamento bienal de 50 a 75 anos na atenção básica. Lida na reprodução do CONASS, não no Diário Oficial.', 'secundaria'),
      abraham: eda.fontes.abraham,
    },
    grupos: [
      { id: 'rastreio', rotulo: 'Rastreamento', criterios: [
        C('col_fit_pos', 'Teste imunoquímico fecal (FIT) positivo', { fonte: 'conitec', frase: 'Teste imunoquímico fecal (FIT) positivo no rastreamento do câncer colorretal' }),
        C('col_rastreio_direto', 'Rastreamento em assintomático de risco médio, sem FIT prévio', { fonte: 'uspstf',
          detalhe: 'No SUS o rastreamento começa pelo FIT (veja o aviso)', frase: 'Rastreamento do câncer colorretal em paciente assintomático de risco médio' }),
      ] },
      { id: 'sintomas', rotulo: 'Sintomas e achados', criterios: [
        C('col_hematoquezia', 'Sangramento retal (hematoquezia)', { v: false }),
        C('col_ida', 'Anemia ferropriva sem causa identificada', { v: false }),
        C('col_habito', 'Mudança persistente do hábito intestinal', { v: false }),
        C('col_massa', 'Massa palpável ou achado de imagem suspeito', { v: false }),
      ] },
      { id: 'risco', rotulo: 'Risco aumentado', criterios: [
        C('col_fam', 'Parente de 1º grau com câncer colorretal', { v: false, detalhe: 'Informe parentesco e idade ao diagnóstico' }),
        C('col_sindrome', 'Síndrome hereditária (Lynch, polipose) confirmada ou suspeita', { v: false }),
        C('col_dii', 'Doença inflamatória intestinal (vigilância após 8 anos de doença)', { v: false }),
      ] },
      { id: 'vig', rotulo: 'Vigilância: adenomas (US Multi-Society Task Force 2020)', dica: 'Informe, abaixo, quantos anos se passaram desde o exame anterior.', criterios: [
        col_vig('col_vig_normal', 'Exame anterior normal, completo e com bom preparo', 'gupta', 10, '10 anos'),
        col_vig('col_vig_12', '1 a 2 adenomas tubulares menores que 10 mm', 'gupta', 7, '7 a 10 anos'),
        col_vig('col_vig_34', '3 a 4 adenomas tubulares menores que 10 mm', 'gupta', 3, '3 a 5 anos'),
        col_vig('col_vig_510', '5 a 10 adenomas tubulares menores que 10 mm', 'gupta', 3, '3 anos'),
        col_vig('col_vig_grande', 'Adenoma de 10 mm ou mais', 'gupta', 3, '3 anos'),
        col_vig('col_vig_vilo', 'Adenoma com componente viloso (tubulovilosa ou vilosa)', 'gupta', 3, '3 anos'),
        col_vig('col_vig_hgd', 'Adenoma com displasia de alto grau', 'gupta', 3, '3 anos'),
        col_vig('col_vig_mais10', 'Mais de 10 adenomas em um exame', 'gupta', 1, '1 ano'),
        col_vig('col_vig_piece', 'Ressecção em fragmentos (piecemeal) de adenoma de 20 mm ou mais', 'gupta', 0.5, '6 meses'),
      ] },
      { id: 'vig_serr', rotulo: 'Vigilância: pólipos serrilhados', criterios: [
        col_vig('col_vig_hiper', 'Até 20 pólipos hiperplásicos menores que 10 mm no reto ou sigmoide', 'gupta', 10, '10 anos'),
        col_vig('col_vig_ssp12', '1 a 2 pólipos serrilhados sésseis menores que 10 mm', 'gupta', 5, '5 a 10 anos'),
        col_vig('col_vig_ssp34', '3 a 4 pólipos serrilhados sésseis menores que 10 mm', 'gupta', 3, '3 a 5 anos'),
        col_vig('col_vig_ssp510', '5 a 10 pólipos serrilhados sésseis menores que 10 mm', 'gupta', 3, '3 anos'),
        col_vig('col_vig_sspg', 'Pólipo serrilhado séssil de 10 mm ou mais', 'gupta', 3, '3 anos'),
        col_vig('col_vig_sspd', 'Pólipo serrilhado séssil com displasia', 'gupta', 3, '3 anos'),
      ] },
    ],
    contra: [C('col_anticoag', 'Em uso de anticoagulante ou antiagregante', { fonte: 'abraham' })],
    campos: [
      { id: 'fit', rotulo: 'FIT: data e resultado', rotuloNoTexto: 'FIT', exigidoQuando: { criterio: ['col_fit_pos'] }, exigidoMsg: 'Informe a data e o resultado do FIT.' },
      { id: 'anosDesde', rotulo: 'Anos desde o exame anterior', rotuloNoTexto: 'Exame anterior há (anos)', tipo: 'numero',
        exigidoQuando: { criterioAlgum: 'VIG' }, exigidoMsg: 'Informe há quantos anos foi a colonoscopia anterior.' },
      { id: 'achados', rotulo: 'Achados do exame anterior (data, número, tamanho e histologia dos pólipos; preparo e se chegou ao ceco)', rotuloNoTexto: 'Colonoscopia anterior',
        tipo: 'area', exigidoQuando: { criterioAlgum: 'VIG' }, exigidoMsg: 'Descreva o exame anterior: data, pólipos (número, tamanho, histologia) e qualidade.' },
      { id: 'familia', rotulo: 'Parentesco e idade ao diagnóstico do familiar', rotuloNoTexto: 'Familiar com câncer colorretal', exigidoQuando: { criterio: ['col_fam'] }, exigidoMsg: 'Informe o parentesco e a idade do familiar ao diagnóstico.' },
    ],
    regras: [
      { id: 'col-sus-fit', nivel: 'atencao', se: { criterio: ['col_rastreio_direto'], idadeMaior: 44 },
        aviso: 'No SUS, o rastreamento de risco médio de 50 a 75 anos começa pelo FIT bienal; a colonoscopia entra se o FIT for positivo (Conitec 2026, versão preliminar; Portaria SAES/MS 4.642/2026). Colonoscopia direta, sem FIT, pode ser devolvida.' },
      { id: 'col-idade-jovem', nivel: 'atencao', se: { criterio: ['col_rastreio_direto'], idadeMenor: 45 },
        aviso: 'Abaixo de 45 anos o rastreamento de risco médio não está indicado (USPSTF 2021 começa aos 45).' },
      { id: 'col-idade-idoso', nivel: 'info', se: { criterio: ['col_rastreio_direto'], idadeMaior: 75 },
        aviso: 'Acima de 75 anos o rastreamento é individualizado (USPSTF 2021: 76 a 85 anos, de forma seletiva; a Conitec limita a diretriz a 50 a 75 anos).' },
      { id: 'col-vig-escopo', nivel: 'info', se: { criterioAlgum: 'VIG' },
        aviso: 'Os intervalos valem para risco médio e exame anterior de alta qualidade (completo até o ceco, com bom preparo). Doença inflamatória intestinal, síndromes hereditárias e câncer prévio têm regras próprias.' },
      { id: 'col-anticoag', nivel: 'info', se: { criterio: ['col_anticoag'] }, aviso: OBS_ANTICOAG },
    ],
    naoIndicado: [
      'Rastreamento de risco médio de 50 a 75 anos: no SUS começa pelo FIT bienal; colonoscopia direta pode ser devolvida (Conitec 2026, preliminar; Portaria SAES/MS 4.642/2026).',
      'Repetir a colonoscopia antes do intervalo recomendado (por exemplo, antes de 10 anos após exame normal completo) sem sintoma ou outra indicação (US Multi-Society Task Force 2020).',
      'Os intervalos de vigilância não se aplicam à doença inflamatória intestinal, às síndromes hereditárias nem ao câncer prévio (US Multi-Society Task Force 2020).',
    ],
    conferencia: { nivel: 'parcial', data: '2026-11-26', pendencias: [
      'Sangramento retal, anemia ferropriva, mudança de hábito, massa, história familiar, síndromes hereditárias e vigilância na doença inflamatória intestinal: sem fonte lida (marcados na tela).',
      'USPSTF 2021 e ACG 2021 só no resumo; a diretriz brasileira de rastreamento está em versão preliminar (consulta pública).',
      'Preparo intestinal, gravidez e risco cardiopulmonar: sem fonte lida.',
    ] },
  };

  /* ================= Cardiovascular ================= */
  const SCC = F('Diretriz Brasileira de Síndrome Coronariana Crônica 2025. Arq Bras Cardiol 2025', PMC('PMC13400070'), 'Diretriz Brasileira de Síndrome Coronariana Crônica 2025',
    'Texto completo lido. Tabela 5 (ecocardiograma: indicações, e reavaliação periódica de estáveis sem mudança clínica como Classe III) e Tabela 4 (teste ergométrico).');
  const ecocardiograma = {
    id: 'eco', sistema: 'Cardiovascular', nome: 'Ecocardiograma transtorácico', nomeCurto: 'Ecocardiograma transtorácico',
    cids: [['R06.0', 'Dispneia'], ['R07.4', 'Dor torácica, não especificada'], ['R01.1', 'Sopro cardíaco, não especificado'], ['I50.9', 'Insuficiência cardíaca, não especificada'],
      ['I48', 'Flutter e fibrilação atrial'], ['I10', 'Hipertensão essencial (primária)'], ['I05.0', 'Estenose mitral'], ['I34.0', 'Insuficiência (da valva) mitral'],
      ['I35.0', 'Estenose (da valva) aórtica'], ['I35.1', 'Insuficiência (da valva) aórtica'], ['Z95.2', 'Presença de prótese de valva cardíaca'], ['R55', 'Síncope e colapso'], ['I25.9', 'Doença isquêmica crônica do coração, não especificada']],
    fontes: {
      scc: SCC,
      fa: F('Diretrizes Brasileiras de Fibrilação Atrial 2025. Arq Bras Cardiol 2025', PMC('PMC13400077'), 'Diretrizes Brasileiras de Fibrilação Atrial 2025', 'Texto completo lido. Quadro 3: ecocardiograma transtorácico na primeira avaliação (Classe I, nível A).'),
      has: F('Diretrizes Brasileiras de Hipertensão Arterial 2025. Arq Bras Cardiol 2025 (PMID 41294179)', PMC('PMC13671149'), 'Diretrizes Brasileiras de Hipertensão Arterial 2025', 'Texto completo lido. Capítulo 4: avaliação de lesão de órgão-alvo em todo paciente no diagnóstico (inclui ecocardiograma); em criança e adolescente, antes do tratamento medicamentoso.'),
      valv: F('Tarasoutchi F et al. Atualização das Diretrizes Brasileiras de Valvopatias 2020. Arq Bras Cardiol 2020 (PMID 33111877)', PMC('PMC8386977'), 'Atualização das Diretrizes Brasileiras de Valvopatias 2020',
        'Texto completo lido. Ecocardiograma como principal exame para a gravidade das valvopatias e para a disfunção de prótese; quadros de acompanhamento com os intervalos por gravidade (coluna da SBC).'),
      barachi: F('Barachi LB et al. Análise da adequação de pedidos de ecocardiograma transtorácico. Arq Bras Cardiol 2012 (PMID 23117553)', PUBMED('23117553'), 'Barachi 2012', 'Só o resumo foi lido: 7,8% dos pedidos ambulatoriais eram Classe III; o check-up em assintomático é citado como Classe III.', 'secundaria'),
    },
    grupos: [
      { id: 'clinica', rotulo: 'Sintomas e suspeita clínica', criterios: [
        C('eco_dispneia_dor', 'Dor torácica ou dispneia com suspeita de doença valvar, hipertrofia, cardiomiopatia ou derrame pericárdico', { fonte: 'scc',
          frase: 'Dor torácica ou dispneia com suspeita de diagnóstico diferencial cardíaco (doença valvar, hipertrofia, cardiomiopatia ou derrame pericárdico)' }),
        C('eco_scc', 'Suspeita de síndrome coronariana crônica: função do ventrículo esquerdo e estratificação', { fonte: 'scc',
          frase: 'Suspeita de síndrome coronariana crônica, para avaliar função global e segmentar do ventrículo esquerdo e refinar a estratificação de risco' }),
        C('eco_ic', 'Suspeita de insuficiência cardíaca (dispneia, edema, BNP ou NT-proBNP elevado)', { v: false }),
        C('eco_sopro', 'Sopro cardíaco com suspeita de relevância (diastólico, de 3/6 ou mais, contínuo ou com sintomas)', { v: false }),
        C('eco_sincope', 'Síncope com suspeita de causa cardíaca', { v: false }),
        C('eco_avc', 'AVC isquêmico ou embolia sistêmica sem causa definida', { v: false }),
        C('eco_quimio', 'Antes ou durante tratamento cardiotóxico (quimioterapia)', { v: false }),
      ] },
      { id: 'condicoes', rotulo: 'Doenças conhecidas', criterios: [
        C('eco_fa', 'Fibrilação atrial: avaliação inicial', { fonte: 'fa', frase: 'Fibrilação atrial, para avaliação inicial (ecocardiograma na primeira avaliação)' }),
        C('eco_has', 'Hipertensão arterial: avaliação de lesão de órgão-alvo no diagnóstico', { fonte: 'has', frase: 'Hipertensão arterial, para avaliação de lesão de órgão-alvo (hipertrofia ventricular esquerda) no diagnóstico' }),
        C('eco_has_crianca', 'Hipertensão em criança ou adolescente, antes do tratamento medicamentoso', { fonte: 'has' }),
        C('eco_valvopatia', 'Valvopatia conhecida ou suspeita: gravidade e acompanhamento', { fonte: 'valv', frase: 'Valvopatia conhecida ou suspeita, para definição da gravidade e acompanhamento' }),
        C('eco_protese', 'Suspeita de disfunção de prótese valvar', { fonte: 'valv' }),
      ] },
      { id: 'seguimento', rotulo: 'Seguimento de valvopatia (intervalos da diretriz brasileira 2020)', dica: 'Informe, abaixo, quantos anos se passaram desde o último ecocardiograma.', criterios: [
        ...[
          ['eco_seg_em_i', 'Estenose mitral importante, assintomática', 0.5, '6 a 12 meses'],
          ['eco_seg_em_n', 'Estenose mitral não importante', 1, '1 ano'],
          ['eco_seg_im_i', 'Insuficiência mitral primária importante, assintomática', 0.5, '6 meses a 1 ano'],
          ['eco_seg_im_m', 'Insuficiência mitral moderada', 1, '1 a 2 anos'],
          ['eco_seg_im_d', 'Insuficiência mitral discreta', 2, '2 a 3 anos'],
          ['eco_seg_ea_i', 'Estenose aórtica importante, assintomática', 0.5, '6 meses'],
          ['eco_seg_ea_m', 'Estenose aórtica moderada', 1, '1 ano'],
          ['eco_seg_ea_d', 'Estenose aórtica discreta', 2, '2 a 3 anos'],
          ['eco_seg_ia_i', 'Insuficiência aórtica importante, assintomática', 0.5, '6 meses a 1 ano'],
          ['eco_seg_ia_m', 'Insuficiência aórtica moderada', 1, '1 a 2 anos'],
          ['eco_seg_ia_d', 'Insuficiência aórtica discreta', 3, '3 a 5 anos'],
        ].map(([id, r, min, iv]) => C(id, r, { fonte: 'valv', intervaloMin: min, intervaloFonte: 'Diretriz Brasileira de Valvopatias 2020',
          frase: `Seguimento de valvopatia: ${r.charAt(0).toLowerCase() + r.slice(1)}; reavaliação recomendada a cada ${iv}` })),
      ] },
    ],
    contra: [],
    campos: [
      { id: 'anosDesde', rotulo: 'Anos desde o último ecocardiograma', rotuloNoTexto: 'Último ecocardiograma há (anos)', tipo: 'numero',
        exigidoQuando: { criterioAlgum: 'SEG' }, exigidoMsg: 'Informe há quantos anos foi o último ecocardiograma.' },
      { id: 'ultimo', rotulo: 'Último ecocardiograma (data, fração de ejeção e gravidade da lesão)', rotuloNoTexto: 'Ecocardiograma anterior', tipo: 'area',
        exigidoQuando: { criterioAlgum: 'SEG_VALV' }, exigidoMsg: 'Descreva o ecocardiograma anterior: data, fração de ejeção e gravidade da lesão valvar.' },
      { id: 'sintomas', rotulo: 'Sintomas e classe funcional', rotuloNoTexto: 'Sintomas e classe funcional' },
      { id: 'exames', rotulo: 'ECG, BNP ou radiografia realizados (resultado)', rotuloNoTexto: 'Exames complementares' },
    ],
    regras: [
      { id: 'eco-seg-escopo', nivel: 'info', se: { criterioAlgum: 'SEG' },
        aviso: 'Intervalos da coluna da SBC da diretriz de 2020. Na insuficiência mitral moderada o texto cita ecocardiograma a cada 2 anos e o quadro, 1 a 2 anos; o motor usa 1 ano como piso.' },
    ],
    naoIndicado: [
      'Reavaliação periódica de paciente estável com síndrome coronariana crônica, sem mudança clínica: Classe III (Diretriz de Síndrome Coronariana Crônica 2025).',
      'Check-up em assintomático e pedidos sem indicação clínica estão entre os mais reprovados em estudos de adequação (Barachi 2012, resumo).',
    ],
    conferencia: { nivel: 'parcial', data: '2026-11-26', pendencias: [
      'Sopro, insuficiência cardíaca suspeita, síncope, AVC e quimioterapia: sem fonte lida (marcados na tela). Os critérios de adequação ASE/ACC (AUC 2011 e 2019) e as diretrizes ACC/AHA e ESC só tiveram o resumo acessível.',
      'Os intervalos de valvopatia vêm da diretriz brasileira de 2020; pode haver versão mais nova.',
    ] },
  };

  const ergometrico = {
    id: 'ergometrico', sistema: 'Cardiovascular', nome: 'Teste ergométrico', nomeCurto: 'Teste ergométrico',
    cids: [['I25.9', 'Doença isquêmica crônica do coração, não especificada'], ['R07.4', 'Dor torácica, não especificada'], ['R07.2', 'Dor precordial'], ['Z82.4', 'História familiar de doença isquêmica do coração e outras doenças do aparelho circulatório'],
      ['E11.9', 'Diabetes mellitus não insulino-dependente, sem complicações'], ['I10', 'Hipertensão essencial (primária)'], ['R00.2', 'Palpitações'], ['I49.9', 'Arritmia cardíaca, não especificada'],
      ['Z95.5', 'Presença de implante e enxerto de angioplastia coronariana'], ['Z13.6', 'Exame especial de rastreamento de doenças cardiovasculares']],
    fontes: {
      ergo: F('Carvalho T et al. Diretriz Brasileira de Ergometria em População Adulta 2024. Arq Bras Cardiol 2024', PMC('PMC11656589'), 'Diretriz Brasileira de Ergometria 2024',
        'Texto completo lido. Tabelas 1 e 2 (indicações, com grau de recomendação e nível de evidência), Quadro 1 (contraindicações absolutas) e Tabela 10 (relativas).'),
      scc: SCC,
    },
    grupos: [
      { id: 'dac', rotulo: 'Doença arterial coronariana (sintomáticos)', criterios: [
        C('te_prob_inter', 'Probabilidade pré-teste intermediária de DAC (inclui BRD ou infra de ST < 1 mm no ECG de repouso)', { fonte: 'ergo', detalhe: 'Classe I, nível A', frase: 'Probabilidade pré-teste intermediária de doença arterial coronariana (Classe I, nível A)' }),
        C('te_dor_baixo', 'Dor torácica em paciente estável de baixo risco, sem isquemia no ECG e com marcadores de necrose normais', { fonte: 'ergo', detalhe: 'Classe I, nível A', frase: 'Dor torácica em paciente estável de baixo risco, sem sinais de isquemia no ECG e com marcadores de necrose normais (Classe I, nível A)' }),
        C('te_dm_sint', 'Diabético sintomático, com ECG de repouso interpretável', { fonte: 'ergo', detalhe: 'Classe I, nível B', frase: 'Paciente diabético sintomático com ECG de repouso interpretável, para investigação de DAC (Classe I, nível B)' }),
        C('te_prognostico', 'Avaliação prognóstica de DAC estável', { fonte: 'ergo', detalhe: 'Classe I, nível B; pode ser anual conforme a condição clínica', frase: 'Avaliação prognóstica de doença arterial coronariana estável (Classe I, nível B)' }),
        C('te_reab', 'Prescrição de exercício e avaliação em reabilitação cardiovascular', { fonte: 'ergo', detalhe: 'Classe I, nível A', frase: 'Prescrição de exercício e avaliação seriada em reabilitação cardiovascular (Classe I, nível A)' }),
        C('te_atipico', 'Sintomas atípicos ou alteração no ECG de repouso (interpretável), para liberar atividade física de alta intensidade', { fonte: 'ergo', detalhe: 'Classe I, nível A' }),
        C('te_posrevasc', 'Pós-revascularização, sintomático ou assintomático', { fonte: 'ergo', detalhe: 'Classe IIa' }),
        C('te_preop', 'Pré-operatório de risco intermediário ou alto', { fonte: 'ergo', detalhe: 'Classe IIa, nível C' }),
      ] },
      { id: 'assint', rotulo: 'Sem sintomas', criterios: [
        C('te_hf_precoce', 'História familiar de DAC precoce (mulheres < 65 anos, homens < 55 anos): ao menos um teste até os 40 anos', { fonte: 'ergo', detalhe: 'Classe I, nível B' }),
        C('te_morte_subita', 'Morte súbita em familiar de 1º grau', { fonte: 'ergo', detalhe: 'Classe IIa, nível B' }),
        C('te_3fatores', 'Três ou mais fatores de risco clássicos', { fonte: 'ergo', detalhe: 'Classe IIa, nível B' }),
        C('te_framingham', 'Alto risco pelo escore de Framingham', { fonte: 'ergo', detalhe: 'Classe IIa, nível B' }),
        C('te_dm_sedent', 'Diabético sedentário, para prescrição de exercício', { fonte: 'ergo', detalhe: 'Classe IIa, nível B' }),
        C('te_ocupacao', 'Ocupação de alto risco (piloto, motorista profissional, militar, policial, bombeiro)', { fonte: 'ergo', detalhe: 'Classe IIa, nível B' }),
        C('te_atividade60', 'Pré-participação em atividade física recreativa, a partir dos 60 anos', { fonte: 'ergo', detalhe: 'Classe IIa, nível C' }),
      ] },
      { id: 'outros', rotulo: 'Hipertensão, arritmia e valvopatia', criterios: [
        C('te_has_sint', 'Hipertenso sintomático com ECG normal, para investigar DAC', { fonte: 'ergo', detalhe: 'Classe I, nível B' }),
        C('te_arritmia_esf', 'Palpitação, síncope, pré-síncope ou mal-estar relacionado ao esforço', { fonte: 'ergo', detalhe: 'Classe I, nível B' }),
        C('te_arritmia_assint', 'Arritmia assintomática detectada, para avaliar o comportamento ao esforço', { fonte: 'ergo', detalhe: 'Classe I, nível B' }),
        C('te_valv', 'Valvopatia leve ou moderada: confirmar ausência de sintomas, esclarecer sintomas ou avaliar capacidade funcional', { fonte: 'ergo', detalhe: 'Classe I, nível B' }),
      ] },
    ],
    contra: [
      C('te_c_ecg', 'ECG de repouso com BRE, WPW, ritmo de marca-passo, infra de ST ≥ 1 mm ou uso de digitálico', { detalhe: 'Não recomendado para diagnóstico de DAC (Classe III)' }),
      C('te_c_iam', 'IAM com menos de 5 dias ou complicado', { detalhe: 'Contraindicação absoluta' }),
      C('te_c_angina', 'Angina instável', { detalhe: 'Contraindicação absoluta' }),
      C('te_c_arritmia', 'Arritmia não controlada ou bloqueio AV de alto risco (Mobitz II, 2:1, avançado, total)', { detalhe: 'Contraindicação absoluta' }),
      C('te_c_ea', 'Estenose aórtica grave sintomática', { detalhe: 'Contraindicação absoluta' }),
      C('te_c_ic', 'Insuficiência cardíaca descompensada', { detalhe: 'Contraindicação absoluta' }),
      C('te_c_embolia', 'Embolia pulmonar aguda', { detalhe: 'Contraindicação absoluta' }),
      C('te_c_perimio', 'Miocardite ou pericardite agudas', { detalhe: 'Contraindicação absoluta' }),
      C('te_c_aorta', 'Dissecção aguda da aorta ou aneurisma com indicação de intervenção', { detalhe: 'Contraindicação absoluta' }),
      C('te_c_pa', 'PA de repouso ≥ 180 mmHg (sistólica) ou > 110 mmHg (diastólica), ou crise hipertensiva', { detalhe: 'Contraindicação absoluta' }),
      C('te_c_aguda', 'Doença aguda, febril ou grave', { detalhe: 'Contraindicação absoluta' }),
      C('te_c_pulm', 'Doença pulmonar descompensada ou SpO2 ≤ 92% em ar ambiente', { detalhe: 'Contraindicação absoluta' }),
      C('te_c_metab', 'Distúrbio hidroeletrolítico ou metabólico não corrigido, ou diabetes descompensado', { detalhe: 'Contraindicação absoluta' }),
      C('te_c_incapaz', 'Incapacidade física ou mental de realizar esforço adequado', { detalhe: 'Contraindicação absoluta' }),
      C('te_r_valv', 'Estenose ou insuficiência valvar grave em assintomático', { detalhe: 'Contraindicação relativa: risco e benefício' }),
      C('te_r_cdi', 'Cardiodesfibrilador implantável', { detalhe: 'Contraindicação relativa' }),
      C('te_r_dialise', 'Paciente em diálise', { detalhe: 'Contraindicação relativa' }),
      C('te_r_anemia', 'Anemia grave (hemoglobina < 8 g/dL)', { detalhe: 'Contraindicação relativa' }),
      C('te_r_ic3', 'Insuficiência cardíaca classe III (NYHA)', { detalhe: 'Contraindicação relativa' }),
      C('te_r_avc', 'AVC ou AIT há menos de 2 meses', { detalhe: 'Contraindicação relativa' }),
      C('te_r_gravidez', 'Gravidez', { detalhe: 'Contraindicação relativa: não recomendado como exame de rotina' }),
    ],
    contraConfirmacao: 'Contraindicações absolutas e relativas ao teste ergométrico revisadas: nenhuma presente',
    campos: [
      { id: 'ecg', rotulo: 'ECG de repouso: data e achados (interpretável?)', rotuloNoTexto: 'ECG de repouso', exigidoQuando: { criterioAlgum: 'DAC' },
        exigidoMsg: 'Informe o ECG de repouso (data e achados): ele define se o teste só com ECG serve para diagnóstico de DAC.' },
      { id: 'medicacoes', rotulo: 'Medicações em uso (digitálico, betabloqueador)', rotuloNoTexto: 'Medicações em uso' },
      { id: 'previo', rotulo: 'Teste anterior ou outro exame cardiológico (data e resultado)', rotuloNoTexto: 'Exame anterior' },
    ],
    regras: [
      { id: 'te-absoluta', nivel: 'alto', se: { criterioAlgum: ['te_c_iam', 'te_c_angina', 'te_c_arritmia', 'te_c_ea', 'te_c_ic', 'te_c_embolia', 'te_c_perimio', 'te_c_aorta', 'te_c_pa', 'te_c_aguda', 'te_c_pulm', 'te_c_metab', 'te_c_incapaz'] },
        aviso: 'Há contraindicação absoluta marcada (Diretriz Brasileira de Ergometria 2024, Quadro 1). Não solicite o teste agora: trate ou estabilize a condição, ou considere outro exame.' },
      { id: 'te-ecg-diag', nivel: 'alto', se: { criterio: ['te_c_ecg'], criterioAlgum: 'DIAG' },
        aviso: 'Com BRE, WPW, marca-passo, infra de ST ≥ 1 mm ou digitálico no ECG de repouso, o teste só com ECG não é recomendado para diagnóstico de DAC (Classe III; Diretriz de Ergometria 2024 e Diretriz de Síndrome Coronariana Crônica 2025). Considere teste de estresse com imagem.' },
      { id: 'te-ecg-outras', nivel: 'info', se: { criterio: ['te_c_ecg'] },
        aviso: 'O ECG de repouso alterado limita o teste para diagnóstico de DAC; para outras finalidades (arritmia ao esforço, capacidade funcional, pressão arterial), o teste pode continuar útil.' },
      { id: 'te-relativa', nivel: 'atencao', se: { criterioAlgum: ['te_r_valv', 'te_r_cdi', 'te_r_dialise', 'te_r_anemia', 'te_r_ic3', 'te_r_avc', 'te_r_gravidez'] },
        aviso: 'Contraindicação relativa marcada: pese risco e benefício e informe no pedido; alguns casos pedem ambiente hospitalar (Diretriz de Ergometria 2024, Tabela 10).' },
      { id: 'te-assint-jovem', nivel: 'atencao', se: { criterioAlgum: 'ASSINT', idadeMenor: 35 },
        aviso: 'Em assintomático com menos de 35 anos e sem fator de risco, o teste para iniciar atividade leve ou moderada é Classe III (Diretriz de Ergometria 2024).' },
    ],
    naoIndicado: [
      'Diagnóstico de DAC com BRE, WPW, marca-passo, infra de ST ≥ 1 mm ou digitálico no ECG de repouso: Classe III. Use estresse com imagem (Diretriz de Ergometria 2024; Diretriz de Síndrome Coronariana Crônica 2025).',
      'Síndrome coronariana aguda instável ou sem normalização dos marcadores: Classe III.',
      'Assintomático com menos de 35 anos e sem fator de risco, para iniciar atividade leve ou moderada: Classe III.',
      'A Diretriz de Síndrome Coronariana Crônica 2025 recomenda o teste quando houver perspectiva de que mude a conduta diagnóstica ou o manejo.',
    ],
    conferencia: { nivel: 'primaria', data: '2026-11-26', pendencias: [
      'Texto lido: Diretriz Brasileira de Ergometria 2024 e Diretriz de Síndrome Coronariana Crônica 2025. As diretrizes AHA/ACC 2021 (dor torácica) e ESC 2023 não foram lidas.',
      'A lista de contraindicações é a do Quadro 1 e da Tabela 10; confirme itens específicos no texto antes de contestar uma recusa.',
    ] },
  };
  // Marcadores de grupos para regras: "DAC", "ASSINT", "DIAG" viram listas de ids
  const ergoDiag = ['te_prob_inter', 'te_dor_baixo', 'te_dm_sint', 'te_3fatores', 'te_framingham', 'te_hf_precoce'];

  const holter = {
    id: 'holter', sistema: 'Cardiovascular', nome: 'Holter de 24 horas (eletrocardiograma ambulatorial)', nomeCurto: 'Holter 24 horas',
    cids: [['R00.2', 'Palpitações'], ['R55', 'Síncope e colapso'], ['I49.9', 'Arritmia cardíaca, não especificada'], ['I48', 'Flutter e fibrilação atrial'],
      ['I63.9', 'Infarto cerebral, não especificado'], ['I49.3', 'Despolarização ventricular prematura'], ['I49.1', 'Despolarização atrial prematura']],
    fontes: {
      fa: F('Diretrizes Brasileiras de Fibrilação Atrial 2025. Arq Bras Cardiol 2025', PMC('PMC13400077'), 'Diretrizes Brasileiras de Fibrilação Atrial 2025',
        'Texto completo lido. Quadro 4: ECG e Holter de 24 a 72 h na avaliação de AVC isquêmico ou embolia sistêmica com fatores de risco para FA (Classe I, nível B); monitorização prolongada no AVC criptogênico (IIa, B); o Holter quantifica a frequência média em 24 h.'),
      jhrs: F('Consenso JHRS/JCS 2025 sobre o uso apropriado de ECG ambulatorial e vestível. J Arrhythm 2025', PMC('PMC12099069'), 'Consenso JHRS/JCS 2025',
        'Texto completo lido. É um documento japonês, não uma norma da SBC. Escolha do aparelho pela frequência dos sintomas: Holter clássico se ocorrem ao menos 1 vez por dia; patch se a cada 1 a 2 semanas; monitor de eventos externo se menos de 1 vez por mês; implantável se mais raro.', 'secundaria'),
    },
    grupos: [
      { id: 'freq', rotulo: 'Frequência dos sintomas', soContexto: true, dica: 'Define o aparelho mais adequado. O Holter de 24 h só costuma registrar o evento se ele ocorre quase todo dia.', criterios: [
        C('h_freq_dia', 'Sintomas todos os dias ou quase', { fonte: 'jhrs', frase: 'Sintomas com frequência diária' }),
        C('h_freq_sem', 'Sintomas a cada 1 ou 2 semanas', { fonte: 'jhrs', frase: 'Sintomas a cada 1 a 2 semanas' }),
        C('h_freq_rara', 'Sintomas raros (menos de 1 vez por mês)', { fonte: 'jhrs', frase: 'Sintomas raros (menos de 1 vez por mês)' }),
      ] },
      { id: 'ind', rotulo: 'Indicação', criterios: [
        C('h_sintoma_diario', 'Palpitação, pré-síncope ou síncope com episódios diários', { fonte: 'jhrs', frase: 'Palpitação, pré-síncope ou síncope com episódios diários, em que o Holter de 24 horas tem chance de registrar o evento' }),
        C('h_avc', 'AVC isquêmico ou embolia sistêmica com fatores de risco para fibrilação atrial', { fonte: 'fa', detalhe: 'Classe I, nível B' }),
        C('h_avc_cripto', 'AVC isquêmico criptogênico (a diretriz prefere monitorização prolongada)', { fonte: 'fa', detalhe: 'Classe IIa, nível B, para monitor de eventos externo ou implantável' }),
        C('h_fa_fc', 'Fibrilação atrial em controle de frequência: frequência cardíaca média em 24 h', { fonte: 'fa' }),
        C('h_sincope_arr', 'Síncope sem causa definida e com suspeita de arritmia', { v: false }),
        C('h_extrassistoles', 'Extrassístoles frequentes ou arritmia ventricular conhecida (quantificar a carga)', { v: false }),
        C('h_antiarritmico', 'Avaliar resposta a antiarritmico ou pós-ablação', { v: false }),
      ] },
    ],
    contra: [],
    campos: [
      { id: 'sintoma', rotulo: 'Sintoma, frequência e duração dos episódios', rotuloNoTexto: 'Sintomas', tipo: 'area',
        exigidoQuando: { criterioAlgum: ['h_sintoma_diario', 'h_sincope_arr'] }, exigidoMsg: 'Descreva o sintoma, a frequência e a duração dos episódios.' },
      { id: 'ecg', rotulo: 'ECG de repouso (data e resultado)', rotuloNoTexto: 'ECG de repouso' },
      { id: 'eco', rotulo: 'Ecocardiograma ou outra avaliação estrutural (resultado)', rotuloNoTexto: 'Avaliação estrutural' },
      { id: 'medicacoes', rotulo: 'Medicações em uso', rotuloNoTexto: 'Medicações em uso' },
    ],
    regras: [
      { id: 'h-pouco-freq', nivel: 'atencao', se: { criterioAlgum: ['h_freq_sem', 'h_freq_rara'] },
        aviso: 'Com sintomas menos frequentes que diários, o Holter de 24 h tem baixo rendimento: o consenso JHRS/JCS 2025 sugere patch (a cada 1 a 2 semanas), monitor de eventos externo (menos de 1 vez por mês) ou implantável (mais raro). Justifique a escolha do Holter ou considere outro monitor.' },
      { id: 'h-avc-cripto', nivel: 'atencao', se: { criterio: ['h_avc_cripto'] },
        aviso: 'No AVC criptogênico, a diretriz brasileira de FA 2025 sugere monitorização prolongada com monitor de eventos externo ou implantável (IIa, B), não Holter de 24 horas.' },
      { id: 'h-sem-freq', nivel: 'info', se: { criterioAlgum: ['h_sintoma_diario', 'h_sincope_arr'], semGrupo: ['freq'] },
        aviso: 'Informe a frequência dos sintomas: é o dado que justifica o Holter de 24 horas em vez de outro monitor.' },
    ],
    naoIndicado: [
      'Sintomas raros (menos de 1 vez por semana): baixo rendimento do Holter de 24 h; considere patch ou monitor de eventos (consenso JHRS/JCS 2025).',
      'AVC isquêmico criptogênico: monitorização prolongada com monitor de eventos externo ou implantável (Diretrizes Brasileiras de Fibrilação Atrial 2025).',
      'Smartwatch e smartphone não substituem o exame na investigação de síncope (consenso JHRS/JCS 2025).',
    ],
    conferencia: { nivel: 'parcial', data: '2026-11-26', pendencias: [
      'Não foi encontrada diretriz brasileira específica de Holter. As fontes lidas são a diretriz brasileira de fibrilação atrial 2025 e um consenso japonês (JHRS/JCS 2025), que não é norma da SBC.',
      'Síncope, extrassístoles, antiarrítmico e pós-ablação: sem fonte lida (marcados na tela). As diretrizes ESC 2018 e ACC/AHA/HRS 2017 de síncope só tiveram o resumo acessível.',
    ] },
  };

  const mapa = {
    id: 'mapa', sistema: 'Cardiovascular', nome: 'Monitorização ambulatorial da pressão arterial de 24 horas (MAPA)', nomeCurto: 'MAPA 24 horas',
    cids: [['I10', 'Hipertensão essencial (primária)'], ['R03.0', 'Valor elevado da pressão arterial, sem diagnóstico de hipertensão']],
    fontes: {
      has: F('Diretrizes Brasileiras de Hipertensão Arterial 2025. Arq Bras Cardiol 2025 (PMID 41294179)', PMC('PMC13671149'), 'Diretrizes Brasileiras de Hipertensão Arterial 2025',
        'Texto completo lido. Quadro 3.5 (indicações da MAPA e da MRPA), Quadro 3.4 (valores de referência) e recomendações por população (resistente, diabetes, idosos, diálise, crianças).'),
    },
    grupos: [
      { id: 'dx', rotulo: 'Diagnóstico (Quadro 3.5 da diretriz)', criterios: [
        C('m_avental', 'Suspeita de efeito do avental branco', { fonte: 'has', frase: 'Suspeita de hipertensão do avental branco' }),
        C('m_mascarada', 'Suspeita de hipertensão mascarada', { fonte: 'has', frase: 'Suspeita de hipertensão mascarada (efeito de mascaramento)' }),
        C('m_pre', 'PA de consultório na faixa de pré-hipertensão (130 a 139 e/ou 85 a 89 mmHg)', { fonte: 'has' }),
        C('m_normal_loa', 'PA de consultório < 140/90 mmHg com lesão de órgão-alvo e alto risco cardiovascular', { fonte: 'has' }),
        C('m_est1', 'Hipertensão estágio 1 no consultório (140 a 159 e/ou 90 a 99 mmHg)', { fonte: 'has' }),
        C('m_baixo_rcv', 'PA ≥ 140/90 mmHg no consultório, sem lesão de órgão-alvo e com baixo risco cardiovascular', { fonte: 'has' }),
        C('m_isolada', 'Hipertensão sistólica isolada ou diastólica isolada no consultório', { fonte: 'has' }),
      ] },
      { id: 'trat', rotulo: 'Tratamento', criterios: [
        C('m_resistente', 'Hipertensão resistente: confirmação diagnóstica (MAPA preferencial)', { fonte: 'has', detalhe: 'Recomendação forte, certeza moderada' }),
        C('m_nao_controlada', 'Identificar hipertensão não controlada ou redução excessiva da PA', { fonte: 'has' }),
        C('m_ajuste', 'Ajustar ou assegurar o controle do tratamento anti-hipertensivo', { fonte: 'has' }),
      ] },
      { id: 'so_mapa', rotulo: 'Indicações em que a MAPA é preferível à MRPA', criterios: [
        C('m_sono', 'Avaliar a PA durante o sono e nas 24 horas', { fonte: 'has' }),
        C('m_hipotensao', 'Suspeita de hipotensão (ortostática, pós-prandial), disautonomia ou sintomas de hipotensão', { fonte: 'has' }),
      ] },
      { id: 'pop', rotulo: 'Populações específicas', criterios: [
        C('m_diabetes', 'Diabetes: avaliação da PA fora do consultório', { fonte: 'has', detalhe: 'Recomendação forte, certeza moderada' }),
        C('m_idoso', 'Idoso: no diagnóstico e anualmente, ou ao mudar a estratégia', { fonte: 'has', detalhe: 'Recomendação fraca, certeza baixa' }),
        C('m_dialise', 'Paciente em diálise', { fonte: 'has', detalhe: 'Recomendação fraca, certeza baixa' }),
        C('m_crianca', 'Criança ou adolescente com PA limítrofe ou estágio 1 persistente', { fonte: 'has', detalhe: 'Recomendação fraca, certeza baixa' }),
        C('m_gestante', 'Gestante com PA elevada ou suspeita de pré-eclâmpsia', { fonte: 'has' }),
      ] },
    ],
    contra: [],
    campos: [
      { id: 'pa', rotulo: 'PA de consultório (valores e datas das medidas)', rotuloNoTexto: 'PA de consultório', tipo: 'area', obrigatorio: true, exigidoMsg: 'Informe os valores e as datas da PA de consultório.' },
      { id: 'anti', rotulo: 'Anti-hipertensivos em uso (nomes e doses)', rotuloNoTexto: 'Anti-hipertensivos em uso' },
      { id: 'loa', rotulo: 'Lesão de órgão-alvo ou doença cardiovascular conhecida', rotuloNoTexto: 'Lesão de órgão-alvo/doença cardiovascular' },
    ],
    regras: [
      { id: 'm-mrpa', nivel: 'info', se: { semGrupo: ['so_mapa'], criterioAlgum: 'NAO_RES' },
        aviso: 'Para esta indicação, o Quadro 3.5 aceita MAPA ou MRPA. A MAPA é exclusiva quando se precisa avaliar sono, hipotensão ou disautonomia. Se a MAPA for negada, justifique a necessidade ou considere a MRPA (a diretriz condiciona a medida fora do consultório ao que for viável logística e economicamente).' },
    ],
    naoIndicado: [
      'Para a maioria das indicações, MAPA e MRPA são equivalentes no Quadro 3.5; a MAPA é exclusiva para sono, hipotensão e disautonomia (Diretrizes de Hipertensão 2025).',
      'A diretriz admite dispensar a medida fora do consultório para confirmar o diagnóstico em quem já tem lesão de órgão-alvo ou doença cardiovascular estabelecida.',
    ],
    conferencia: { nivel: 'primaria', data: '2026-11-26', pendencias: [
      'Só a Diretriz Brasileira de Hipertensão 2025 foi lida; ESH 2023, ACC/AHA 2017 e as diretrizes brasileiras de MAPA/MRPA de 2020 não foram acessadas.',
      'Contraindicações e intervalo de repetição em adultos: sem fonte lida.',
    ] },
  };

  /* ================= Tomografia computadorizada ================= */
  const NICE = (n) => 'https://www.nice.org.uk/guidance/' + n;
  const FONTES_CONTRASTE = {
    acrnkf: F('Davenport MS et al. Use of Intravenous Iodinated Contrast Media in Patients with Kidney Disease: Consensus Statements from the ACR and the NKF. Radiology 2020;294:660-668 (Kidney Med 2020;2:85-93)', PMC('PMC7525144'), 'ACR-NKF 2020 (contraste e rim)',
      'Texto completo lido. Risco de lesão renal pelo contraste próximo de 0% com eGFR ≥ 45, 0 a 2% com eGFR de 30 a 44 e 0 a 17% com eGFR < 30. Com lesão renal aguda ou eGFR < 30 (sem diálise de manutenção), discutir risco e benefício e indicar hidratação com soro fisiológico; sem indicação de profilaxia com eGFR estável ≥ 30. Doença renal grave não dialítica é contraindicação relativa, e o contraste não deve ser negado se o diagnóstico é de risco de vida. Metformina: suspender com lesão renal aguda ou eGFR < 30.'),
    esur: F('van der Molen AJ et al. ESUR Contrast Media Safety Committee guidelines on post-contrast acute kidney injury, Part 2. Eur Radiol 2018;28:2856-2869', PMC('PMC5986837'), 'ESUR 2018 (lesão renal e metformina)',
      'Texto completo lido. Medir eGFR até 7 dias antes se doença aguda, piora de doença crônica ou internado, e até 3 meses antes nos demais. Metformina: com eGFR > 30 e sem lesão renal aguda, manter; com eGFR < 30 ou lesão renal aguda, suspender a partir do contraste e medir eGFR em 48 h.'),
    esur_hs: F('van der Molen AJ et al. ESUR Contrast Media Safety Committee guidelines on hypersensitivity reactions to iodinated contrast media, Part 1. Eur Radiol 2025;35:6798-6810', PMC('PMC12559081'), 'ESUR 2025 (reações ao contraste)',
      'Texto completo lido. O fator mais consistente para nova reação é a reação prévia ao contraste iodado (OR 27,6 a 198,8); alergia a outros fármacos pesa bem menos (OR 1,21 a 6,8). Se houve reação, identificar o agente e, se a injeção for obrigatória, escolher outro contraste. A parte 2 (prevenção e premedicação) não foi lida.'),
    acog: F('ACOG Committee Opinion No. 723: Guidelines for Diagnostic Imaging During Pregnancy and Lactation. Obstet Gynecol 2017;130:e210-e216 (PMID 28937575)', PUBMED('28937575'), 'ACOG 2017 (imagem na gestação)',
      'Só o resumo foi lido: ultrassom e ressonância são as técnicas de escolha na gestação; com poucas exceções, a radiação da radiografia e da tomografia fica bem abaixo da que causa dano fetal e, se necessárias, não devem ser negadas.', 'secundaria'),
  };
  const grupoContraste = (p) => ({ id: 'contraste', rotulo: 'Contraste e segurança', soContexto: true, dica: 'Marque o que se aplica. Sem contraste, deixe em branco.', criterios: [
    C(`${p}_c_cont`, 'Pedido com contraste iodado', { frase: 'Exame solicitado com contraste iodado' }),
    C(`${p}_c_renal`, 'Doença renal conhecida, lesão renal aguda ou eGFR < 30 mL/min/1,73 m²', { fonte: 'acrnkf' }),
    C(`${p}_c_met`, 'Em uso de metformina', { fonte: 'esur' }),
    C(`${p}_c_reac`, 'Reação prévia a contraste iodado', { fonte: 'esur_hs' }),
    C(`${p}_c_gest`, 'Gestação confirmada ou possível', { fonte: 'acog' }),
  ] });
  const campoCreatinina = (p) => ({ id: 'creatinina', rotulo: 'Creatinina ou eGFR (valor e data)', rotuloNoTexto: 'Função renal', exigidoQuando: { criterio: [`${p}_c_cont`] },
    exigidoMsg: 'Informe a creatinina ou o eGFR (valor e data): a ESUR 2018 pede o exame até 7 dias antes se há doença aguda e até 3 meses antes nos demais pacientes.' });
  const regrasContraste = (p) => [
    { id: `${p}-renal`, nivel: 'atencao', se: { criterio: [`${p}_c_cont`, `${p}_c_renal`] },
      aviso: 'Com lesão renal aguda ou eGFR < 30 (sem diálise de manutenção), o ACR-NKF 2020 pede que o solicitante e o radiologista discutam risco e benefício e indica hidratação com soro fisiológico. Doença renal grave não dialítica é contraindicação relativa, e o contraste não deve ser negado se o diagnóstico é de risco de vida.' },
    { id: `${p}-metformina`, nivel: 'info', se: { criterio: [`${p}_c_cont`, `${p}_c_met`] },
      aviso: 'ESUR 2018: com eGFR > 30 e sem lesão renal aguda, manter a metformina; com eGFR < 30 ou lesão renal aguda, suspender a partir do contraste e medir o eGFR em 48 h. O ACR-NKF cita a orientação da FDA de suspender com eGFR de 30 a 59, a critério de quem solicita.' },
    { id: `${p}-reacao`, nivel: 'atencao', se: { criterio: [`${p}_c_cont`, `${p}_c_reac`] },
      aviso: 'A reação prévia ao contraste é o principal fator para nova reação (ESUR 2025). Registre o agente e a data; se a injeção for obrigatória, escolha outro contraste. Os esquemas de premedicação não foram verificados neste site.' },
    { id: `${p}-gestacao`, nivel: 'atencao', se: { criterio: [`${p}_c_gest`] },
      aviso: 'Na gestação, ultrassom e ressonância são as técnicas de escolha; a radiação da tomografia costuma ficar abaixo da que causa dano fetal e o exame não deve ser negado se necessário (ACOG 2017, resumo). Na cólica renal e na apendicite, a primeira escolha é o ultrassom.' },
  ];

  const tcCranio = {
    id: 'tc_cranio', sistema: 'Tomografia', nome: 'Tomografia computadorizada de crânio', nomeCurto: 'TC de crânio',
    cids: [['R51', 'Cefaleia'], ['S06.9', 'Traumatismo intracraniano, não especificado'], ['R56.8', 'Outras convulsões e as não especificadas'], ['F03', 'Demência não especificada'],
      ['R41.8', 'Outros sintomas e sinais relativos à função cognitiva e à consciência'], ['R29.8', 'Outros sintomas e sinais especificados relativos aos sistemas nervoso e osteomuscular'], ['I64', 'Acidente vascular cerebral, não especificado como hemorrágico ou isquêmico']],
    fontes: Object.assign({
      cg150: F('NICE CG150. Headaches in over 12s: diagnosis and management (2012)', NICE('cg150'), 'NICE CG150 (cefaleia)', 'Texto lido. 1.1.1 e 1.1.2: cefaleia com sinais de alarme exige avaliar a necessidade de investigação ou encaminhamento (não manda pedir tomografia). 1.3.3: não encaminhar para neuroimagem só para tranquilizar quem tem cefaleia primária.'),
      ng232: F('NICE NG232. Head injury: assessment and early management (2023)', NICE('ng232'), 'NICE NG232 (traumatismo craniano)', 'Texto lido. 1.5.8 a 1.5.13: critérios de tomografia em adultos e crianças. 1.3.19: não encaminhar traumatismo craniano para neuroimagem por acesso direto da comunidade. 1.2.4: sinais que levam o paciente ao pronto-socorro.'),
      ng12: F('NICE NG12. Suspected cancer: recognition and referral', NICE('ng12'), 'NICE NG12 (suspeita de câncer)', 'Texto lido. 1.9.1: considerar ressonância de crânio (ou tomografia, se a ressonância for contraindicada) em adulto com perda progressiva e subaguda de função neurológica central.'),
      ng128: F('NICE NG128. Stroke and transient ischaemic attack in over 16s (2019)', NICE('ng128'), 'NICE NG128 (AVC)', 'Texto lido. 1.3.2: tomografia sem contraste imediata em suspeita de AVC agudo com indicação de trombólise, anticoagulação, rebaixamento de consciência e outros. 1.2.1: não pedir tomografia em suspeita de AIT, salvo diagnóstico alternativo que ela detecte.'),
      ng97: F('NICE NG97. Dementia: assessment, management and support (2018)', NICE('ng97'), 'NICE NG97 (demência)', 'Texto lido. 1.2.13: oferecer imagem estrutural para excluir causas reversíveis de declínio cognitivo e ajudar no subtipo, exceto se a demência já está estabelecida e o subtipo é claro.'),
      abn: F('Consenso da Academia Brasileira de Neurologia sobre diagnóstico de demência. Dement Neuropsychol 2022 (PMID 36533157)', PMC('PMC9745995'), 'Academia Brasileira de Neurologia 2022', 'Texto lido. A tomografia é um exame útil, mais disponível e de menor custo, que pode ser usado na atenção primária para excluir hematoma subdural, tumores e hidrocefalia; a ressonância tem melhor resolução.'),
      acep: F('ACEP Clinical Policy: Mild Traumatic Brain Injury. Ann Emerg Med 2023;81:e63 (PMID 37085214)', PMC('PMC10617828'), 'ACEP 2023 (traumatismo craniano leve)', 'Texto lido. Usar a Canadian CT Head Rule como apoio à decisão em adultos com traumatismo craniano leve; as regras de decisão não excluem a tomografia em quem usa anticoagulante ou antiagregante (exceto AAS isolado).'),
      acrcrise: F('ACR Appropriateness Criteria: Seizures and Epilepsy. J Am Coll Radiol 2020;17:S293 (PMID 32370973)', PUBMED('32370973'), 'ACR 2020 (crises e epilepsia)', 'Só o resumo foi lido: a ressonância de crânio costuma ser apropriada em cada cenário; na emergência, a tomografia sem contraste também costuma ser apropriada.', 'secundaria'),
    }, FONTES_CONTRASTE),
    grupos: [
      { id: 'cefaleia', rotulo: 'Cefaleia com sinal de alarme (NICE CG150)', dica: 'A diretriz manda avaliar a necessidade de investigação ou de encaminhamento; não diz que toda cefaleia com alarme precisa de tomografia.', criterios: [
        C('tc_cef_febre', 'Cefaleia piorando, com febre', { fonte: 'cg150' }),
        C('tc_cef_subita', 'Cefaleia de início súbito, com intensidade máxima em até 5 minutos', { fonte: 'cg150', detalhe: 'Em geral é urgência: encaminhe ao pronto-socorro' }),
        C('tc_cef_deficit', 'Déficit neurológico novo', { fonte: 'cg150' }),
        C('tc_cef_cogn', 'Disfunção cognitiva ou mudança de personalidade novas', { fonte: 'cg150' }),
        C('tc_cef_consc', 'Rebaixamento do nível de consciência', { fonte: 'cg150' }),
        C('tc_cef_trauma', 'Traumatismo craniano recente (nos últimos 3 meses)', { fonte: 'cg150' }),
        C('tc_cef_valsalva', 'Cefaleia desencadeada por tosse, Valsalva, espirro ou exercício, ou que piora em pé', { fonte: 'cg150' }),
        C('tc_cef_mudanca', 'Mudança substancial nas características da cefaleia', { fonte: 'cg150' }),
        C('tc_cef_imuno', 'Cefaleia nova em imunossuprimido (por exemplo, HIV)', { fonte: 'cg150' }),
        C('tc_cef_neoplasia', 'Cefaleia nova com neoplasia que dá metástase para o cérebro, ou menor de 20 anos com história de neoplasia', { fonte: 'cg150' }),
        C('tc_cef_vomito', 'Cefaleia nova com vômitos sem outra causa', { fonte: 'cg150' }),
      ] },
      { id: 'neuro', rotulo: 'Outras indicações neurológicas', criterios: [
        C('tc_tumor', 'Perda progressiva e subaguda de função neurológica central (suspeita de tumor)', { fonte: 'ng12', detalhe: 'A diretriz prefere ressonância; tomografia se a ressonância for contraindicada' }),
        C('tc_cogn', 'Declínio cognitivo: imagem estrutural para excluir causa reversível', { fonte: 'ng97', detalhe: 'A tomografia é aceita na atenção primária (Academia Brasileira de Neurologia 2022)' }),
        C('tc_crise', 'Primeira crise convulsiva', { fonte: 'acrcrise', detalhe: 'Fora da emergência, o ACR prefere ressonância' }),
        C('tc_avc', 'Suspeita de AVC agudo (urgência)', { fonte: 'ng128', detalhe: 'Tomografia sem contraste imediata; é pedido de pronto-socorro' }),
      ] },
      { id: 'tce', rotulo: 'Traumatismo craniano (urgência)', dica: 'A NICE NG232 não recomenda encaminhar traumatismo craniano para neuroimagem por acesso direto da comunidade.', criterios: [
        C('tc_tce_alto', 'Adulto com fator de alto risco: Glasgow ≤ 12, Glasgow < 15 após 2 horas, suspeita de fratura aberta ou com afundamento, sinal de fratura de base, convulsão pós-traumática, déficit focal ou mais de 1 vômito', { fonte: 'ng232', detalhe: 'Tomografia em até 1 hora (NICE NG232, 1.5.8)',
          frase: 'Traumatismo craniano em adulto com fator de alto risco (NICE NG232, 1.5.8): tomografia em até 1 hora' }),
        C('tc_tce_perda', 'Adulto com perda de consciência ou amnésia e idade ≥ 65 anos, distúrbio de coagulação, mecanismo perigoso ou amnésia retrógrada > 30 minutos', { fonte: 'ng232', detalhe: 'Tomografia em até 8 horas (NICE NG232, 1.5.9)' }),
        C('tc_tce_anticoag', 'Adulto em uso de anticoagulante ou antiagregante (exceto AAS isolado), sem outro critério', { fonte: 'ng232', detalhe: 'A NICE diz "considerar" tomografia em até 8 horas (1.5.13)' }),
        C('tc_tce_crianca', 'Criança (menor de 16 anos) com critério da NICE NG232', { fonte: 'ng232', detalhe: 'Critérios 1.5.10 a 1.5.12: detalhe no quadro clínico' }),
      ] },
      grupoContraste('tcc'),
    ],
    contra: [],
    campos: [
      Object.assign(campoCreatinina('tcc')),
      { id: 'neuro', rotulo: 'Exame neurológico (consciência, força, sensibilidade, pares cranianos)', rotuloNoTexto: 'Exame neurológico', tipo: 'area',
        exigidoQuando: { criterioAlgum: ['tc_cef_deficit', 'tc_cef_consc', 'tc_tumor', 'tc_crise', 'tc_avc'] }, exigidoMsg: 'Descreva o exame neurológico.' },
      { id: 'trauma', rotulo: 'Traumatismo: data e hora, mecanismo, Glasgow, perda de consciência, amnésia e número de vômitos', rotuloNoTexto: 'Traumatismo', tipo: 'area',
        exigidoQuando: { criterioAlgum: ['tc_tce_alto', 'tc_tce_perda', 'tc_tce_anticoag', 'tc_tce_crianca', 'tc_cef_trauma'] }, exigidoMsg: 'Descreva o traumatismo: data e hora, mecanismo, Glasgow, perda de consciência, amnésia e vômitos.' },
      { id: 'cognicao', rotulo: 'Avaliação cognitiva (teste usado, resultado e tempo de evolução)', rotuloNoTexto: 'Avaliação cognitiva', tipo: 'area',
        exigidoQuando: { criterio: ['tc_cogn'] }, exigidoMsg: 'Informe a avaliação cognitiva: teste usado, resultado e tempo de evolução.' },
      { id: 'anticoag', rotulo: 'Anticoagulante ou antiagregante em uso (nome e dose)', rotuloNoTexto: 'Anticoagulante/antiagregante', exigidoQuando: { criterioAlgum: ['tc_tce_anticoag'] }, exigidoMsg: 'Informe o anticoagulante ou antiagregante em uso.' },
      { id: 'previo', rotulo: 'Exame de imagem anterior (data e resultado)', rotuloNoTexto: 'Imagem anterior' },
    ],
    regras: [
      { id: 'tcc-tce-urgencia', nivel: 'atencao', se: { criterioAlgum: ['tc_tce_alto', 'tc_tce_perda', 'tc_tce_anticoag', 'tc_tce_crianca'] },
        aviso: 'Traumatismo craniano agudo é caso de pronto-socorro: a NICE NG232 (1.3.19) não recomenda encaminhar para neuroimagem por acesso direto da comunidade e lista os sinais que levam o paciente à emergência (1.2.4).' },
      { id: 'tcc-urgencia', nivel: 'atencao', se: { criterioAlgum: ['tc_cef_subita', 'tc_avc'] },
        aviso: 'Cefaleia súbita e suspeita de AVC agudo são urgências: não entram em fila de regulação eletiva. Encaminhe ao pronto-socorro.' },
      { id: 'tcc-cefaleia-nice', nivel: 'info', se: { criterioAlgum: ['tc_cef_febre', 'tc_cef_deficit', 'tc_cef_cogn', 'tc_cef_consc', 'tc_cef_trauma', 'tc_cef_valsalva', 'tc_cef_mudanca', 'tc_cef_imuno', 'tc_cef_neoplasia', 'tc_cef_vomito'] },
        aviso: 'A NICE CG150 manda avaliar a necessidade de investigação ou de encaminhamento diante desses sinais, sem determinar a tomografia. Descreva o sinal, desde quando e por que a imagem muda a conduta.' },
      { id: 'tcc-tumor-rm', nivel: 'info', se: { criterio: ['tc_tumor'] },
        aviso: 'Na suspeita de tumor de sistema nervoso central, a NICE NG12 prefere ressonância; a tomografia vale se a ressonância for contraindicada ou não estiver disponível. Justifique.' },
      { id: 'tcc-crise-rm', nivel: 'info', se: { criterio: ['tc_crise'] },
        aviso: 'Fora da emergência, o ACR 2020 (resumo) prefere ressonância na primeira crise convulsiva.' },
      ...regrasContraste('tcc'),
    ],
    naoIndicado: [
      'Cefaleia primária (enxaqueca, tensional, em salvas ou por uso excessivo de analgésico) só para tranquilizar: não encaminhar para neuroimagem (NICE CG150, 1.3.3).',
      'Suspeita de AIT, sem suspeita de diagnóstico alternativo que a tomografia detecte: não pedir tomografia (NICE NG128, 1.2.1).',
      'Traumatismo craniano agudo: não pedir por acesso direto da comunidade (NICE NG232, 1.3.19).',
      'Demência já estabelecida e com subtipo claro: a imagem estrutural não é necessária (NICE NG97, 1.2.13).',
    ],
    conferencia: { nivel: 'parcial', data: '2026-11-26', pendencias: [
      'ACR de cefaleia e de traumatismo craniano, ACEP de cefaleia, diretriz da Sociedade Brasileira de Cefaleia, síncope e perda auditiva súbita: sem fonte lida. Nenhum critério de regulação do SUS ou de operadoras foi acessado.',
      'Contraste, gestação e função renal: itens compartilhados com as demais tomografias; premedicação e doses de radiação não foram verificadas.',
      'A NICE é do Reino Unido: o fluxo de acesso direto e as condutas podem diferir do SUS.',
    ] },
  };

  const tcTorax = {
    id: 'tc_torax', sistema: 'Tomografia', nome: 'Tomografia computadorizada de tórax', nomeCurto: 'TC de tórax',
    cids: [['Z12.2', 'Exame especial de rastreamento de neoplasia do aparelho respiratório'], ['R91', 'Achados anormais em exames para diagnóstico por imagem do pulmão'], ['R04.2', 'Hemoptise'],
      ['R05', 'Tosse'], ['R06.0', 'Dispneia'], ['I26.9', 'Embolia pulmonar sem menção de cor pulmonale agudo'], ['J84.1', 'Outras doenças pulmonares intersticiais com fibrose'], ['J84.9', 'Doença pulmonar intersticial, não especificada']],
    fontes: Object.assign({
      lcs: F('Pereira LFF et al. Rastreamento do câncer de pulmão com tomografia de baixa dose: consenso SBCT/SBPT/CBR. J Bras Pneumol 2024;50(1):e20230233 (PMID 38536982)', PMC('PMC11095927'), 'Consenso brasileiro de rastreamento do câncer de pulmão 2024',
        'Texto completo lido. Fumante ou ex-fumante com 50 anos ou mais, mais de 20 maços-ano, que parou há até 15 anos; interromper aos 80 anos ou após 15 anos sem fumar; excluir sintomas muito sugestivos de câncer de pulmão, história de câncer de pulmão e quem não tem condição de tratamento curativo; exame anual se sem achados; decisão compartilhada. O texto em inglês tem uma inconsistência na lista de inclusão: usei a formulação da tabela.'),
      uspstf: F('USPSTF. Screening for Lung Cancer. JAMA 2021;325:962 (PMID 33687470)', PUBMED('33687470'), 'USPSTF 2021 (câncer de pulmão)', 'Só o resumo foi lido: tomografia de baixa dose anual de 50 a 80 anos, com 20 maços-ano, fumantes ou que pararam há até 15 anos (recomendação B).', 'secundaria'),
      ng12: F('NICE NG12. Suspected cancer: recognition and referral', NICE('ng12'), 'NICE NG12 (suspeita de câncer)', 'Texto lido. 1.1.1 a 1.1.3: na suspeita de câncer de pulmão, a radiografia de tórax vem primeiro; hemoptise inexplicada com 40 anos ou mais vai para a via de suspeita de câncer. A NG12 não cita tomografia nessas recomendações.'),
      ng158: F('NICE NG158. Venous thromboembolic diseases: diagnosis, management and thrombophilia testing (2020, atualizada 2023)', NICE('ng158'), 'NICE NG158 (tromboembolismo)', 'Texto lido. 1.1.15: radiografia de tórax para excluir outras causas; 1.1.17 a 1.1.21: escore de Wells; com Wells > 4 (embolia provável), angiotomografia imediata ou, se alergia a contraste, clearance < 30 mL/min ou alto risco pela radiação, avaliar cintilografia V/Q; com Wells ≤ 4, D-dímero.'),
      cg163: F('NICE CG163. Idiopathic pulmonary fibrosis in adults: diagnosis and management (2013)', NICE('cg163'), 'NICE CG163 (fibrose pulmonar idiopática)', 'Texto lido. 1.1.1: atentar à fibrose pulmonar em maiores de 45 anos com dispneia aos esforços e tosse persistentes, crepitações inspiratórias bilaterais e baqueteamento; 1.2.1: espirometria, difusão, radiografia de tórax e tomografia de tórax com cortes de alta resolução.'),
      acrhemo: F('ACR Appropriateness Criteria: Hemoptysis. J Am Coll Radiol 2020;17:S148 (PMID 32370959)', PUBMED('32370959'), 'ACR 2020 (hemoptise)', 'Só o resumo foi lido: na hemoptise não maciça, radiografia de tórax e tomografia com contraste ou angiotomografia.', 'secundaria'),
      fleischner: F('MacMahon H et al. Guidelines for Management of Incidental Pulmonary Nodules Detected on CT Images: From the Fleischner Society 2017. Radiology 2017;284:228 (PMID 28240562)', PUBMED('28240562'), 'Fleischner 2017 (nódulos)', 'Só o resumo foi lido: o tamanho mínimo para seguimento de rotina aumentou e os intervalos agora são faixas. A tabela de condutas por tamanho e risco não foi lida no original (só em transcrição secundária), então este site não calcula o intervalo.', 'secundaria'),
    }, FONTES_CONTRASTE),
    grupos: [
      { id: 'rastreio', rotulo: 'Rastreamento do câncer de pulmão (tomografia de baixa dose)', criterios: [
        C('tc_t_rastreio', 'Fumante ou ex-fumante com 50 anos ou mais e mais de 20 maços-ano, que parou há até 15 anos', { fonte: 'lcs', intervaloMin: 1, intervaloFonte: 'consenso brasileiro 2024 e USPSTF 2021',
          frase: 'Rastreamento do câncer de pulmão com tomografia de baixa dose: fumante ou ex-fumante com 50 anos ou mais, com mais de 20 maços-ano, que parou há até 15 anos' }),
      ] },
      { id: 'excl_rastreio', rotulo: 'Impede o rastreamento (marque se presente)', soContexto: true, criterios: [
        C('tc_t_ex_sint', 'Sintomas muito sugestivos de câncer de pulmão', { fonte: 'lcs' }),
        C('tc_t_ex_ca', 'História de câncer de pulmão', { fonte: 'lcs' }),
        C('tc_t_ex_cond', 'Condição clínica que impede tratamento com intenção curativa', { fonte: 'lcs' }),
      ] },
      { id: 'sintomas', rotulo: 'Sintomas e achados', criterios: [
        C('tc_t_hemoptise', 'Hemoptise (radiografia de tórax e tomografia com contraste)', { fonte: 'acrhemo', detalhe: 'Com 40 anos ou mais e hemoptise inexplicada, a NICE NG12 manda encaminhar pela via de suspeita de câncer' }),
        C('tc_t_dpi', 'Suspeita de fibrose pulmonar: mais de 45 anos, dispneia aos esforços e tosse persistentes, crepitações inspiratórias bilaterais ou baqueteamento', { fonte: 'cg163', detalhe: 'Tomografia de alta resolução' }),
        C('tc_t_rx_cancer', 'Radiografia de tórax com achado que sugere câncer de pulmão', { fonte: 'ng12', v: false, detalhe: 'A NICE NG12 manda encaminhar pela via de suspeita; o papel da tomografia nessa via não foi lido' }),
        C('tc_t_rx_alt', 'Alteração persistente na radiografia (massa, derrame, consolidação) sem diagnóstico', { v: false }),
        C('tc_t_tosse', 'Tosse crônica com radiografia normal ou inconclusiva', { v: false }),
        C('tc_t_estad', 'Estadiamento ou seguimento de neoplasia conhecida', { v: false }),
      ] },
      { id: 'ep', rotulo: 'Embolia pulmonar (urgência)', criterios: [
        C('tc_t_ep', 'Suspeita de embolia pulmonar com Wells > 4 (provável), ou D-dímero positivo com Wells ≤ 4', { fonte: 'ng158', detalhe: 'Angiotomografia; é pedido de pronto-socorro' }),
      ] },
      { id: 'nodulo', rotulo: 'Nódulo pulmonar incidental', criterios: [
        C('tc_t_nodulo', 'Seguimento de nódulo pulmonar encontrado em outro exame (Fleischner)', { fonte: 'fleischner', v: false, detalhe: 'A tabela de intervalos por tamanho e risco não foi lida no original' }),
      ] },
      grupoContraste('tct'),
    ],
    contra: [],
    campos: [
      campoCreatinina('tct'),
      { id: 'tabagismo', rotulo: 'Tabagismo: maços-ano, idade de início e tempo desde que parou', rotuloNoTexto: 'Tabagismo', exigidoQuando: { criterio: ['tc_t_rastreio'] },
        exigidoMsg: 'Informe o tabagismo: maços-ano e tempo desde que parou (o rastreamento exige mais de 20 maços-ano e parada há até 15 anos).' },
      { id: 'anosDesde', rotulo: 'Anos desde a última tomografia de baixa dose (se já fez)', rotuloNoTexto: 'Última tomografia de baixa dose há (anos)', tipo: 'numero' },
      { id: 'rx', rotulo: 'Radiografia de tórax (data e resultado)', rotuloNoTexto: 'Radiografia de tórax',
        exigidoQuando: { criterioAlgum: ['tc_t_rx_cancer', 'tc_t_hemoptise', 'tc_t_dpi', 'tc_t_ep', 'tc_t_rx_alt', 'tc_t_tosse'] }, exigidoMsg: 'Informe a radiografia de tórax (data e resultado): as diretrizes lidas (NICE NG12, NG158 e CG163, ACR) a colocam antes da tomografia.' },
      { id: 'wells', rotulo: 'Escore de Wells (pontos) e D-dímero', rotuloNoTexto: 'Probabilidade clínica de embolia', exigidoQuando: { criterio: ['tc_t_ep'] }, exigidoMsg: 'Informe o escore de Wells e o D-dímero.' },
      { id: 'sintomas', rotulo: 'Sintomas (tosse, dispneia, dor torácica, perda de peso, hemoptise) e tempo de evolução', rotuloNoTexto: 'Sintomas', tipo: 'area', exigidoQuando: { criterioAlgum: ['tc_t_hemoptise', 'tc_t_dpi', 'tc_t_tosse'] }, exigidoMsg: 'Descreva os sintomas e o tempo de evolução.' },
      { id: 'nodulo', rotulo: 'Nódulo: tamanho, tipo (sólido, vidro fosco, parcialmente sólido), data e exame que o achou', rotuloNoTexto: 'Nódulo', tipo: 'area', exigidoQuando: { criterio: ['tc_t_nodulo'] }, exigidoMsg: 'Descreva o nódulo: tamanho, tipo, data e exame que o achou.' },
      { id: 'previo', rotulo: 'Tomografia ou outro exame anterior (data e resultado)', rotuloNoTexto: 'Exame anterior' },
    ],
    regras: [
      { id: 'tct-rast-idade-menor', nivel: 'atencao', se: { criterio: ['tc_t_rastreio'], idadeMenor: 50 }, aviso: 'O rastreamento é indicado a partir dos 50 anos (consenso brasileiro 2024; USPSTF 2021).' },
      { id: 'tct-rast-idade-maior', nivel: 'atencao', se: { criterio: ['tc_t_rastreio'], idadeMaior: 80 }, aviso: 'O rastreamento é interrompido aos 80 anos (consenso brasileiro 2024; USPSTF 2021: de 50 a 80 anos).' },
      { id: 'tct-rast-excl', nivel: 'alto', se: { criterio: ['tc_t_rastreio'], criterioAlgum: ['tc_t_ex_sint', 'tc_t_ex_ca', 'tc_t_ex_cond'] },
        aviso: 'Com sintomas muito sugestivos de câncer de pulmão, história de câncer de pulmão ou condição que impede tratamento curativo, não se trata de rastreamento (consenso brasileiro 2024). Com sintomas, investigue pelo caminho diagnóstico (comece pela radiografia de tórax, NICE NG12).' },
      { id: 'tct-rast-sus', nivel: 'info', se: { criterio: ['tc_t_rastreio'] },
        aviso: 'O consenso brasileiro de 2024 trata o rastreamento como discussão ainda incipiente no país, e não foi encontrado protocolo de regulação do SUS para ele. O rastreamento exige decisão compartilhada e não substitui a cessação do tabagismo.' },
      { id: 'tct-ep-urgencia', nivel: 'atencao', se: { criterio: ['tc_t_ep'] },
        aviso: 'Suspeita de embolia pulmonar é urgência: não entra em fila de regulação eletiva. A NICE NG158 pede radiografia de tórax, escore de Wells e, com Wells ≤ 4, D-dímero antes da imagem.' },
      { id: 'tct-ep-vq', nivel: 'info', se: { criterio: ['tc_t_ep'], criterioAlgum: ['tct_c_renal', 'tct_c_reac'] },
        aviso: 'NICE NG158 (1.1.18): com alergia ao contraste, comprometimento renal grave (clearance < 30 mL/min) ou alto risco pela radiação, avalie a cintilografia V/Q (SPECT) como alternativa à angiotomografia.' },
      { id: 'tct-cancer-rx', nivel: 'info', se: { criterioAlgum: ['tc_t_rx_cancer', 'tc_t_tosse'] },
        aviso: 'Na suspeita de câncer de pulmão na atenção primária, a NICE NG12 começa pela radiografia de tórax e encaminha pela via de suspeita; ela não cita a tomografia nessas recomendações.' },
      ...regrasContraste('tct'),
    ],
    naoIndicado: [
      'Suspeita de câncer de pulmão por sintomas na atenção primária: começar pela radiografia de tórax (NICE NG12, 1.1.2 e 1.1.3).',
      'Suspeita de embolia pulmonar com Wells ≤ 4 e D-dímero negativo: sem imagem (NICE NG158, 1.1.21).',
      'Rastreamento com sintomas muito sugestivos de câncer, história de câncer de pulmão ou sem condição de tratamento curativo (consenso brasileiro 2024).',
      'O rastreamento é anual enquanto o exame vier sem achados (consenso brasileiro 2024); repetir antes do prazo sem indicação não é rastreamento.',
    ],
    conferencia: { nivel: 'parcial', data: '2026-11-26', pendencias: [
      'Fleischner 2017: só o resumo; a tabela de intervalos por tamanho e risco só foi vista em transcrição secundária, por isso o site não calcula o seguimento de nódulos. Fleischner 2022 (subsólidos), ESC 2019 (embolia), diretrizes de tosse crônica e a diretriz brasileira de fibrose pulmonar não foram lidas.',
      'Tosse crônica, derrame pleural, trauma torácico, estadiamento e alteração persistente na radiografia: sem fonte lida (marcados na tela). Critérios de regulação do SUS e de operadoras não foram acessados.',
      'Tabela do consenso de rastreamento (Lung-RADS 3 e 4): intervalos não lidos.',
    ] },
  };

  const tcAbdome = {
    id: 'tc_abdome', sistema: 'Tomografia', nome: 'Tomografia computadorizada de abdome', nomeCurto: 'TC de abdome',
    cids: [['R10.4', 'Outras dores abdominais e as não especificadas'], ['R10.3', 'Dor localizada em outras partes inferiores do abdome'], ['K57.3', 'Doença diverticular do intestino grosso sem perfuração ou abscesso'],
      ['K35.8', 'Apendicite aguda, outra e não especificada'], ['K85.9', 'Pancreatite aguda, não especificada'], ['N23', 'Cólica renal, não especificada'], ['N10', 'Nefrite túbulo-intersticial aguda (pielonefrite aguda)'],
      ['R19.0', 'Tumoração ou massa intra-abdominal e pélvica'], ['R17', 'Icterícia, não especificada'], ['R63.4', 'Perda de peso anormal'], ['I71.4', 'Aneurisma da aorta abdominal, sem menção de ruptura'], ['K43.9', 'Hérnia ventral sem obstrução ou gangrena']],
    fontes: Object.assign({
      wsesapp: F('Di Saverio S et al. Diagnosis and treatment of acute appendicitis: 2020 update of the WSES Jerusalem guidelines. World J Emerg Surg 2020;15:27', PMC('PMC7386163'), 'WSES 2020 (apendicite)',
        'Texto completo lido. Ultrassom como primeiro exame se houver indicação de imagem (1.10); imagem sistemática no risco intermediário (1.8); imagem transversal antes da cirurgia na dor em fossa ilíaca direita que não resolve (1.12); a tomografia pode ser dispensada em homens e mulheres jovens de alto risco clínico (1.9).'),
      wsesdiv: F('Sartelli M et al. 2020 update of the WSES guidelines for the management of acute colonic diverticulitis in the emergency setting. World J Emerg Surg 2020;15:32', PMC('PMC7206757'), 'WSES 2020 (diverticulite)',
        'Texto completo lido. Na suspeita de diverticulite aguda, sugere-se tomografia de abdome com contraste como exame de primeira escolha (fraca, 2B); o ultrassom por operador experiente pode vir antes, com tomografia se inconclusivo.'),
      acgpan: F('Tenner S et al. American College of Gastroenterology Guidelines: Management of Acute Pancreatitis. Am J Gastroenterol 2024;119:419-437', PMC('PMC13221274'), 'ACG 2024 (pancreatite aguda)',
        'Texto completo lido. Sem tomografia de rotina na admissão para avaliar gravidade; reservar para quem tem diagnóstico incerto ou não melhora em 48 a 72 horas de hidratação.'),
      ng12: F('NICE NG12. Suspected cancer: recognition and referral', NICE('ng12'), 'NICE NG12 (suspeita de câncer)',
        'Texto lido. 1.2.5: considerar tomografia direta (ou ultrassom, se não houver tomografia) para câncer de pâncreas em pessoas de 60 anos ou mais com perda de peso e diarreia, dor lombar, dor abdominal, náusea ou vômito; massa abdominal alta compatível com fígado ou vesícula aumentados: ultrassom.'),
      ng118: F('NICE NG118. Renal and ureteric stones: assessment and management (2019)', NICE('ng118'), 'NICE NG118 (litíase)', 'Texto lido. 1.1.1: tomografia de baixa dose, sem contraste, em até 24 horas na suspeita de cólica renal em adultos; na gestante, ultrassom. 1.1.2: em crianças, ultrassom primeiro.'),
      ng156: F('NICE NG156. Abdominal aortic aneurysm: diagnosis and management (2020)', NICE('ng156'), 'NICE NG156 (aneurisma de aorta)', 'Texto lido. Ultrassom da aorta na suspeita de aneurisma à palpação; angiotomografia de cortes finos em fase arterial na avaliação para reparo eletivo.'),
      acrdor: F('ACR Appropriateness Criteria: Acute Nonlocalized Abdominal Pain. J Am Coll Radiol 2018;15(11S):S217 (PMID 30392591)', PUBMED('30392591'), 'ACR 2018 (dor abdominal aguda)', 'Só o resumo foi lido: a tomografia costuma ser o exame de primeira linha; é cenário de urgência.', 'secundaria'),
      acrpielo: F('ACR Appropriateness Criteria: Acute Pyelonephritis, 2022 update. J Am Coll Radiol 2022;19(11S):S224 (PMID 36436954)', PUBMED('36436954'), 'ACR 2022 (pielonefrite)', 'Só o resumo foi lido: imagem em geral não é apropriada no primeiro episódio de pielonefrite suspeita em paciente não complicado; é considerada em alto risco (diabetes, litíase, obstrução, gestação, idoso, imunossupressão, falha de tratamento).', 'secundaria'),
      acrmassa: F('ACR Appropriateness Criteria: Palpable Abdominal Mass. J Am Coll Radiol 2019;16(11S):S384 (PMID 31685106)', PUBMED('31685106'), 'ACR 2019 (massa abdominal)', 'Só o resumo foi lido: na massa intra-abdominal, a tomografia com contraste e o ultrassom têm acurácia demonstrada.', 'secundaria'),
      acrhernia: F('ACR Appropriateness Criteria: Hernia, 2022 update. J Am Coll Radiol (PMID 36436960)', PUBMED('36436960'), 'ACR 2022 (hérnia)', 'Só o resumo foi lido: tomografia e ultrassom costumam ser os exames de primeira linha; a radiografia em geral não é indicada para o diagnóstico inicial.', 'secundaria'),
    }, FONTES_CONTRASTE),
    grupos: [
      { id: 'dor', rotulo: 'Dor abdominal', criterios: [
        C('tc_a_div', 'Dor em fossa ilíaca esquerda com suspeita de diverticulite aguda', { fonte: 'wsesdiv' }),
        C('tc_a_apend', 'Dor em fossa ilíaca direita com suspeita de apendicite, com ultrassom inconclusivo ou risco intermediário', { fonte: 'wsesapp', detalhe: 'Conduta de pronto-socorro ou cirurgia' }),
        C('tc_a_nao_loc', 'Dor abdominal aguda não localizada', { fonte: 'acrdor', detalhe: 'Cenário de urgência' }),
        C('tc_a_pancreatite', 'Pancreatite aguda com diagnóstico incerto ou sem melhora em 48 a 72 horas', { fonte: 'acgpan' }),
        C('tc_a_colica', 'Suspeita de cólica renal (tomografia de baixa dose, sem contraste)', { fonte: 'ng118' }),
        C('tc_a_pielo', 'Pielonefrite de alto risco ou sem resposta ao tratamento', { fonte: 'acrpielo' }),
        C('tc_a_hernia', 'Hérnia abdominal para avaliação (tomografia ou ultrassom)', { fonte: 'acrhernia' }),
      ] },
      { id: 'neoplasia', rotulo: 'Suspeita de neoplasia', criterios: [
        C('tc_a_pancreas', 'Suspeita de câncer de pâncreas: 60 anos ou mais e perda de peso, com diarreia, dor lombar, dor abdominal, náusea ou vômito', { fonte: 'ng12', detalhe: 'NICE NG12 1.2.5 (lista parcialmente lida)' }),
        C('tc_a_massa', 'Massa abdominal palpável', { fonte: 'acrmassa' }),
        C('tc_a_ictericia', 'Icterícia', { fonte: 'ng12', v: false, detalhe: 'A NICE NG12 manda encaminhar (40 anos ou mais); o papel da tomografia nessa via não foi lido' }),
        C('tc_a_incidental', 'Lesão hepática, renal ou adrenal encontrada em outro exame, para caracterizar', { v: false }),
        C('tc_a_estad', 'Estadiamento ou seguimento de neoplasia conhecida', { v: false }),
      ] },
      { id: 'aorta', rotulo: 'Aorta', criterios: [
        C('tc_a_aaa', 'Aneurisma de aorta abdominal em avaliação para reparo eletivo (angiotomografia)', { fonte: 'ng156', detalhe: 'Na suspeita à palpação, o primeiro exame é o ultrassom' }),
      ] },
      grupoContraste('tca'),
    ],
    contra: [],
    campos: [
      campoCreatinina('tca'),
      { id: 'us', rotulo: 'Ultrassonografia realizada (data e resultado)', rotuloNoTexto: 'Ultrassonografia', dica: 'Várias diretrizes colocam o ultrassom antes da tomografia (apendicite, diverticulite, massa de fígado ou vesícula, aneurisma, gestante, criança).' },
      { id: 'peso', rotulo: 'Perda de peso (quanto e em quanto tempo) e sintomas associados', rotuloNoTexto: 'Perda de peso e sintomas', exigidoQuando: { criterio: ['tc_a_pancreas'] }, exigidoMsg: 'Informe a perda de peso (quanto e em quanto tempo) e o sintoma associado.' },
      { id: 'evolucao', rotulo: 'Dias de evolução e resposta à hidratação', rotuloNoTexto: 'Evolução', exigidoQuando: { criterio: ['tc_a_pancreatite'] }, exigidoMsg: 'Informe os dias de evolução e a resposta à hidratação (a tomografia é reservada para quem não melhora em 48 a 72 horas).' },
      { id: 'alto_risco', rotulo: 'Fator de alto risco (diabetes, litíase, obstrução, gestação, idoso, imunossupressão) ou falha do tratamento', rotuloNoTexto: 'Fator de alto risco', exigidoQuando: { criterio: ['tc_a_pielo'] }, exigidoMsg: 'Informe o fator de alto risco ou a falha do tratamento.' },
      { id: 'exame', rotulo: 'Exame físico e laboratório relevantes (leucócitos, PCR, amilase ou lipase, urina)', rotuloNoTexto: 'Exame físico e laboratório' },
      { id: 'previo', rotulo: 'Tomografia ou outra imagem anterior (data e resultado)', rotuloNoTexto: 'Imagem anterior' },
    ],
    regras: [
      { id: 'tca-urgencia', nivel: 'atencao', se: { criterioAlgum: ['tc_a_div', 'tc_a_apend', 'tc_a_nao_loc', 'tc_a_pancreatite', 'tc_a_colica'] },
        aviso: 'Dor abdominal aguda é cenário de urgência: o pedido costuma ser feito no pronto-socorro, e não por regulação eletiva.' },
      { id: 'tca-apend-us', nivel: 'atencao', se: { criterio: ['tc_a_apend'] },
        aviso: 'A WSES 2020 recomenda ultrassom como primeiro exame quando há indicação de imagem (1.10) e dispensa a tomografia em jovens de alto risco clínico (1.9). Informe o ultrassom ou explique por que não foi possível.' },
      { id: 'tca-div-us', nivel: 'info', se: { criterio: ['tc_a_div'] },
        aviso: 'Na diverticulite, a WSES 2020 admite ultrassom por operador experiente antes da tomografia, com tomografia se o resultado for inconclusivo.' },
      { id: 'tca-colica-sem', nivel: 'atencao', se: { criterio: ['tc_a_colica', 'tca_c_cont'] },
        aviso: 'Na suspeita de cólica renal, a NICE NG118 indica tomografia de baixa dose SEM contraste.' },
      { id: 'tca-colica-crianca', nivel: 'atencao', se: { criterio: ['tc_a_colica'], idadeMenor: 18 },
        aviso: 'Em crianças e jovens com suspeita de cólica renal, a NICE NG118 indica ultrassom como primeiro exame.' },
      { id: 'tca-colica-gest', nivel: 'atencao', se: { criterio: ['tc_a_colica', 'tca_c_gest'] },
        aviso: 'Na gestante com suspeita de cólica renal, a NICE NG118 indica ultrassom em vez de tomografia.' },
      { id: 'tca-pielo', nivel: 'info', se: { criterio: ['tc_a_pielo'] },
        aviso: 'O ACR 2022 (resumo) não considera apropriada a imagem no primeiro episódio de pielonefrite não complicada; informe o fator de alto risco ou a falha do tratamento.' },
      { id: 'tca-pancreas', nivel: 'info', se: { criterio: ['tc_a_pancreas'] },
        aviso: 'A NICE NG12 cita tomografia direta ou, se ela não estiver disponível, ultrassom. Em icterícia com 40 anos ou mais, o caminho é o encaminhamento por suspeita de câncer.' },
      { id: 'tca-massa-figado', nivel: 'info', se: { criterio: ['tc_a_massa'] },
        aviso: 'Se a massa é alta e compatível com fígado ou vesícula aumentados, a NICE NG12 indica ultrassom direto.' },
      { id: 'tca-aaa', nivel: 'info', se: { criterio: ['tc_a_aaa'] },
        aviso: 'Para suspeita de aneurisma de aorta, o primeiro exame é o ultrassom (NICE NG156); a angiotomografia é para planejar o reparo.' },
      ...regrasContraste('tca'),
    ],
    naoIndicado: [
      'Suspeita de apendicite: ultrassom primeiro; a tomografia pode ser dispensada em jovens de alto risco clínico (WSES 2020, 1.9 e 1.10).',
      'Pancreatite aguda: sem tomografia de rotina na admissão; só se o diagnóstico é incerto ou se não melhora em 48 a 72 horas (ACG 2024).',
      'Suspeita de aneurisma de aorta à palpação: ultrassom primeiro (NICE NG156).',
      'Suspeita de cólica renal em gestante ou criança: ultrassom (NICE NG118).',
      'Primeiro episódio de pielonefrite em paciente não complicado: imagem em geral não indicada (ACR 2022, resumo).',
      'Massa abdominal alta compatível com fígado ou vesícula aumentados: ultrassom (NICE NG12).',
    ],
    conferencia: { nivel: 'parcial', data: '2026-11-26', pendencias: [
      'Todos os ACR Appropriateness Criteria foram lidos só nos resumos (a nota de adequação por cenário não foi vista).',
      'Icterícia, lesão incidental (fígado, rim, adrenal), estadiamento e seguimento, dor abdominal crônica inespecífica: sem fonte lida (marcados na tela ou sem critério).',
      'A lista de sintomas do câncer de pâncreas (NICE NG12 1.2.5) foi lida só em parte. A NG12 teve atualização em 2026 em partes do texto: confirme a versão.',
      'Não foram encontrados critérios brasileiros (CBR, AMB) nem de regulação do SUS ou de operadoras.',
    ] },
  };

  const tcPelve = {
    id: 'tc_pelve', sistema: 'Tomografia', nome: 'Tomografia computadorizada de pelve', nomeCurto: 'TC de pelve',
    cids: [['R10.2', 'Dor pélvica e perineal'], ['N83.2', 'Outros cistos ovarianos e os não especificados'], ['R19.0', 'Tumoração ou massa intra-abdominal e pélvica']],
    fontes: Object.assign({
      acrdor: F('ACR Appropriateness Criteria: Acute Pelvic Pain in the Reproductive Age Group, 2023 update. J Am Coll Radiol 2024;21(6S):S3 (PMID 38823952)', PUBMED('38823952'), 'ACR 2024 (dor pélvica aguda)',
        'Só o resumo foi lido: ultrassom transabdominal e transvaginal com Doppler como exame inicial em todas as pacientes; tomografia de abdome e pelve costuma ser apropriada se há suspeita de causa não ginecológica com β-hCG negativo.', 'secundaria'),
      acrpos: F('ACR Appropriateness Criteria: Postmenopausal Subacute or Chronic Pelvic Pain (PMID 41784596)', PUBMED('41784596'), 'ACR (dor pélvica na pós-menopausa)', 'Só o resumo foi lido: ultrassom é o exame inicial; ressonância ou tomografia de pelve em casos selecionados, se o ultrassom for inconclusivo.', 'secundaria'),
      ng12: F('NICE NG12. Suspected cancer: recognition and referral', NICE('ng12'), 'NICE NG12 (suspeita de câncer)', 'Texto lido. 1.5.1 a 1.5.9: na suspeita de câncer de ovário, o exame de imagem da atenção primária é o ultrassom de abdome e pelve (com CA125 a partir dos 40 anos), não a tomografia.'),
    }, FONTES_CONTRASTE),
    grupos: [
      { id: 'ind', rotulo: 'Indicação', criterios: [
        C('tc_p_dor_aguda', 'Dor pélvica aguda em mulher em idade reprodutiva, com ultrassom feito, β-hCG negativo e suspeita de causa não ginecológica', { fonte: 'acrdor' }),
        C('tc_p_posmenop', 'Dor pélvica subaguda ou crônica na pós-menopausa, com ultrassom inconclusivo', { fonte: 'acrpos' }),
        C('tc_p_massa', 'Massa pélvica ou anexial que o ultrassom não caracterizou', { v: false }),
        C('tc_p_estad', 'Estadiamento ou seguimento de neoplasia pélvica (reto, bexiga, colo do útero, próstata)', { v: false }),
      ] },
      grupoContraste('tcp'),
    ],
    contra: [],
    campos: [
      campoCreatinina('tcp'),
      { id: 'us', rotulo: 'Ultrassonografia pélvica (data e resultado)', rotuloNoTexto: 'Ultrassonografia pélvica',
        exigidoQuando: { criterioAlgum: ['tc_p_dor_aguda', 'tc_p_posmenop', 'tc_p_massa'] }, exigidoMsg: 'Informe o ultrassom pélvico (data e resultado): ele é o exame inicial nas diretrizes lidas (ACR; NICE NG12).' },
      { id: 'bhcg', rotulo: 'β-hCG (data e resultado)', rotuloNoTexto: 'β-hCG', exigidoQuando: { criterio: ['tc_p_dor_aguda'] }, exigidoMsg: 'Informe o β-hCG: o ACR usa o resultado para escolher a tomografia.' },
      { id: 'ca125', rotulo: 'CA125 (se feito; 40 anos ou mais)', rotuloNoTexto: 'CA125' },
      { id: 'previo', rotulo: 'Tomografia ou outra imagem anterior (data e resultado)', rotuloNoTexto: 'Imagem anterior' },
    ],
    regras: [
      { id: 'tcp-sexo', nivel: 'info', se: { criterio: ['tc_p_dor_aguda'], sexo: 'M' },
        aviso: 'Este critério é para mulher em idade reprodutiva. Para homem, as fontes lidas não trazem critério de tomografia de pelve.' },
      { id: 'tcp-abdome-pelve', nivel: 'info', se: { criterioAlgum: ['tc_p_dor_aguda', 'tc_p_posmenop', 'tc_p_massa', 'tc_p_estad'] },
        aviso: 'O ACR trata "tomografia de abdome e pelve" como uma unidade; não foi encontrada fonte que sustente a tomografia de pelve isolada como rotina. Se a dúvida inclui o abdome, considere pedir a tomografia de abdome e pelve.' },
      { id: 'tcp-ovario', nivel: 'info', se: { criterioAlgum: ['tc_p_massa'] },
        aviso: 'Na suspeita de câncer de ovário, a NICE NG12 usa CA125 (a partir dos 40 anos) e ultrassom de abdome e pelve; ascite ou massa pélvica ao exame vão para a via de suspeita de câncer.' },
      ...regrasContraste('tcp'),
    ],
    naoIndicado: [
      'Dor pélvica de mulher em idade reprodutiva: ultrassom transabdominal e transvaginal com Doppler primeiro (ACR 2024, resumo).',
      'Dor pélvica na pós-menopausa: ultrassom primeiro (ACR, resumo).',
      'Suspeita de câncer de ovário: CA125 (a partir dos 40 anos) e ultrassom de abdome e pelve, não tomografia primeiro (NICE NG12, 1.5.6 a 1.5.9).',
    ],
    conferencia: { nivel: 'parcial', data: '2026-11-26', pendencias: [
      'Os ACR foram lidos só nos resumos. Dor pélvica ou escrotal no homem, massa anexial, estadiamento (reto, bexiga, colo, próstata): sem critério de tomografia lido (marcados na tela).',
      'Não foi encontrada fonte para tomografia de pelve isolada; as fontes usam abdome e pelve juntos. Critérios brasileiros e de regulação não foram acessados.',
    ] },
  };

  /* ================= Sono ================= */
  const psg = {
    id: 'psg', sistema: 'Sono', nome: 'Polissonografia', nomeCurto: 'Polissonografia',
    cids: [['G47.3', 'Apneia do sono'], ['G47.1', 'Hipersonia'], ['R06.8', 'Outras anormalidades da respiração (inclui ronco)']],
    fontes: {
      aasm: F('Kapur VK et al. Clinical Practice Guideline for Diagnostic Testing for Adult Obstructive Sleep Apnea. J Clin Sleep Med 2017;13(3):479-504', PMC('PMC5337595'), 'AASM 2017 (apneia obstrutiva)',
        'Só o resumo das recomendações (cerca de 1 página) está no PMC. Polissonografia é o teste padrão quando há suspeita de apneia após avaliação clínica completa do sono; polissonografia ou teste domiciliar no adulto não complicado de risco aumentado para apneia moderada a grave; polissonografia em vez de teste domiciliar em doença cardiorrespiratória significativa, fraqueza respiratória neuromuscular, hipoventilação, opioide crônico, AVC prévio ou insônia grave (todas fortes).'),
      sbpt: F('Duarte RLM et al. Consenso da SBPT sobre Distúrbios Respiratórios do Sono. J Bras Pneumol 2022;48(4):e20220106', PMC('PMC9262434'), 'SBPT 2022 (distúrbios respiratórios do sono)',
        'Texto completo lido. Alta probabilidade pré-teste: sonolência diurna excessiva e 2 de 3 (ronco alto e frequente; apneias observadas ou engasgos; hipertensão). Teste tipo 3 não é indicado sem alta probabilidade pré-teste. Baixo risco: laboratório; alto risco: casa ou laboratório. STOP-Bang ≥ 3: alto risco.'),
    },
    grupos: [
      { id: 'ind', rotulo: 'Indicação', criterios: [
        C('ps_suspeita', 'Suspeita de apneia obstrutiva do sono, após avaliação clínica completa do sono', { fonte: 'aasm' }),
        C('ps_risco', 'Alto risco: sonolência diurna excessiva e 2 de 3 (ronco alto e frequente; apneias observadas ou engasgos; hipertensão)', { fonte: 'sbpt' }),
      ] },
      { id: 'triagem', rotulo: 'Triagem (apoio, não diagnóstico)', soContexto: true, criterios: [
        C('ps_stopbang', 'STOP-Bang de 3 ou mais (alto risco)', { fonte: 'sbpt', detalhe: 'Serve para triagem e priorização; não dispensa o exame (AASM 2017)' }),
      ] },
      { id: 'lab', rotulo: 'Motivo para polissonografia em laboratório, em vez de teste domiciliar', criterios: [
        C('ps_cardiopneumo', 'Doença cardiorrespiratória significativa (por exemplo, insuficiência cardíaca ou DPOC)', { fonte: 'aasm' }),
        C('ps_neuromuscular', 'Fraqueza respiratória por doença neuromuscular', { fonte: 'aasm' }),
        C('ps_hipoventilacao', 'Hipoventilação em vigília ou suspeita de hipoventilação relacionada ao sono', { fonte: 'aasm' }),
        C('ps_opioide', 'Uso crônico de opioide', { fonte: 'aasm' }),
        C('ps_avc', 'Antecedente de AVC', { fonte: 'aasm' }),
        C('ps_insonia', 'Insônia grave', { fonte: 'aasm' }),
        C('ps_dpoc', 'DPOC com suspeita de apneia, complicação hipoxêmica ou hipertensão pulmonar desproporcional', { fonte: 'sbpt' }),
        C('ps_htsat', 'Teste domiciliar negativo, inconclusivo ou tecnicamente inadequado', { fonte: 'aasm' }),
        C('ps_psg_neg', 'Primeira polissonografia negativa com suspeita clínica mantida', { fonte: 'aasm', detalhe: 'Recomendação fraca' }),
        C('ps_outros', 'Suspeita de outro distúrbio do sono (hipersonolência central, parassonia, movimentos do sono)', { fonte: 'sbpt' }),
      ] },
    ],
    contra: [],
    campos: [
      { id: 'avaliacao', rotulo: 'Avaliação clínica do sono (sintomas, tempo, Epworth, exame físico)', rotuloNoTexto: 'Avaliação clínica do sono', tipo: 'area', obrigatorio: true,
        exigidoMsg: 'Resuma a avaliação clínica do sono: o teste deve ser feito junto com uma avaliação completa (AASM 2017).' },
      { id: 'comorb', rotulo: 'Comorbidades relevantes (hipertensão, IMC, cardiopatia, pneumopatia)', rotuloNoTexto: 'Comorbidades' },
    ],
    regras: [
      { id: 'ps-sem-lab', nivel: 'atencao', se: { criterioAlgum: ['ps_suspeita', 'ps_risco'], semGrupo: ['lab'] },
        aviso: 'Sem um motivo para polissonografia em laboratório, a AASM 2017 aceita, no adulto não complicado de risco aumentado para apneia moderada a grave, o teste domiciliar. O regulador pode propor o teste domiciliar; se há motivo (doença cardiorrespiratória, neuromuscular, opioide, AVC, insônia grave), marque-o.' },
      { id: 'ps-stopbang-sozinho', nivel: 'atencao', se: { criterio: ['ps_stopbang'], semGrupo: ['ind', 'lab'] },
        aviso: 'Questionário ou escore sozinho não diagnostica apneia (AASM 2017). Descreva a avaliação clínica e marque a indicação.' },
    ],
    naoIndicado: [
      'Questionário, escore ou algoritmo sozinho não diagnostica apneia obstrutiva do sono (AASM 2017, recomendação forte).',
      'Teste domiciliar tipo 3 não é indicado sem alta probabilidade pré-teste de apneia moderada a grave (SBPT 2022); em baixo risco, o teste é em laboratório.',
    ],
    conferencia: { nivel: 'primaria', data: '2026-11-26', pendencias: [
      'O texto completo da AASM 2017 não está no PMC (só o resumo das recomendações); o consenso da SBPT 2022 foi lido inteiro e reproduz as recomendações.',
      'Contraindicações e critérios de regulação do SUS ou da ANS: não pesquisados.',
    ] },
  };

  const exames = [eda, colonoscopia, ecocardiograma, ergometrico, holter, mapa, tcCranio, tcTorax, tcAbdome, tcPelve, psg];

  /* Listas de ids usadas por regras e campos ("criterioAlgum: 'VIG'" etc.) */
  const SET = {
    VIG: ids(colonoscopia, 'vig', 'vig_serr'),
    SEG: ids(ecocardiograma, 'seguimento'),
    SEG_VALV: ids(ecocardiograma, 'seguimento').concat(['eco_valvopatia', 'eco_protese']),
    DAC: ids(ergometrico, 'dac', 'assint'),
    ASSINT: ids(ergometrico, 'assint'),
    DIAG: ergoDiag,
    NAO_RES: mapa.grupos.flatMap((g) => g.criterios.map((c) => c.id)).filter((id) => id !== 'm_resistente'),
  };
  const resolve = (x) => {
    if (x && typeof x === 'object' && !Array.isArray(x)) { for (const k of Object.keys(x)) x[k] = resolve(x[k]); return x; }
    return typeof x === 'string' && SET[x] ? SET[x] : x;
  };
  for (const ex of exames) {
    (ex.campos || []).forEach((c) => { if (c.exigidoQuando) resolve(c.exigidoQuando); });
    (ex.regras || []).forEach((r) => resolve(r.se));
  }

  return { versao: '0.1.0', atualizadoEm: '2026-11-26', exames };
});
