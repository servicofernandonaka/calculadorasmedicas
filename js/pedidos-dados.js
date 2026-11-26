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

  /* ================= Musculoesquelético ================= */
  const rmLombar = {
    id: 'rm_lombar', sistema: 'Musculoesquelético', nome: 'Ressonância magnética da coluna lombar', nomeCurto: 'Ressonância da coluna lombar',
    cids: [['M54.5', 'Dor lombar baixa'], ['M54.4', 'Lumbago com ciática'], ['M54.3', 'Ciática'], ['M54.1', 'Radiculopatia'], ['M51.1', 'Transtornos de discos lombares e de outros discos com radiculopatia'],
      ['M48.0', 'Estenose espinhal'], ['G83.4', 'Síndrome da cauda equina']],
    fontes: {
      chou07: F('Chou R et al. Diagnostic imaging for low back pain: advice for high-value health care from the ACP. Ann Intern Med 2011;154:181 e Chou R et al. Ann Intern Med 2007;147:478 (PMID 17909209, 21282698)', PUBMED('17909209'), 'ACP (Chou 2007 e 2011)',
        'Só os resumos foram lidos. Não pedir imagem de rotina na dor lombar inespecífica (forte); imagem se déficit neurológico grave ou progressivo ou doença grave suspeita (forte); em radiculopatia ou estenose persistente, RM só se candidato a cirurgia ou infiltração epidural (forte).'),
      acr: F('ACR Appropriateness Criteria: Low Back Pain, 2021 update. J Am Coll Radiol 2021;18(11S):S361 (PMID 34794594)', PUBMED('34794594'), 'ACR 2021 (lombalgia)',
        'Só o resumo foi lido: imagem é considerada após até 6 semanas de tratamento clínico e fisioterapia sem melhora, ou com sinais de alarme (cauda equina, neoplasia, fratura, infecção). A dor lombar aguda não complicada não precisa de imagem.'),
      nice: F('NICE NG59. Low back pain and sciatica in over 16s: assessment and management', 'https://www.nice.org.uk/guidance/ng59', 'NICE NG59',
        'Texto lido. 1.1.4: não oferecer imagem de rotina em serviço não especializado. 1.1.6: considerar imagem em serviço especializado apenas se o resultado puder mudar a conduta.'),
    },
    grupos: [
      { id: 'alarme', rotulo: 'Déficit neurológico ou suspeita de doença grave', criterios: [
        C('rl_deficit', 'Déficit neurológico grave ou progressivo', { fonte: 'chou07' }),
        C('rl_cauda', 'Suspeita de síndrome da cauda equina', { fonte: 'acr' }),
        C('rl_neoplasia', 'Suspeita de neoplasia', { fonte: 'acr' }),
        C('rl_infeccao', 'Suspeita de infecção', { fonte: 'acr' }),
        C('rl_fratura', 'Suspeita de fratura', { fonte: 'acr' }),
      ] },
      { id: 'radic', rotulo: 'Radiculopatia ou estenose', criterios: [
        C('rl_radic_cirurgia', 'Dor lombar persistente com sinais de radiculopatia ou estenose, em candidato a cirurgia ou infiltração epidural', { fonte: 'chou07' }),
        C('rl_especializado', 'Avaliação em serviço especializado, com RM que provavelmente mudará a conduta', { fonte: 'nice' }),
      ] },
      { id: 'tempo', rotulo: 'Falha do tratamento clínico', criterios: [
        C('rl_6sem', 'Sem melhora após até 6 semanas de tratamento clínico e fisioterapia', { fonte: 'acr', detalhe: 'O ACR admite imagem nesse cenário; a ACP e o NICE não recomendam imagem de rotina na dor lombar inespecífica' }),
      ] },
    ],
    contra: [C('rl_implante', 'Marca-passo, desfibrilador ou outro implante', { frase: 'Portador de dispositivo implantado (conferir compatibilidade com ressonância)' })],
    campos: [
      { id: 'neuro', rotulo: 'Exame neurológico (força, reflexos, sensibilidade)', rotuloNoTexto: 'Exame neurológico', tipo: 'area',
        exigidoQuando: { criterioAlgum: ['rl_deficit', 'rl_cauda', 'rl_radic_cirurgia'] }, exigidoMsg: 'Descreva o exame neurológico (força, reflexos, sensibilidade).' },
      { id: 'tratamento', rotulo: 'Tratamento clínico e fisioterapia realizados (o que e por quanto tempo)', rotuloNoTexto: 'Tratamento já realizado', tipo: 'area',
        exigidoQuando: { criterioAlgum: ['rl_radic_cirurgia', 'rl_6sem', 'rl_especializado'] }, exigidoMsg: 'Informe o tratamento clínico e a fisioterapia já realizados e por quanto tempo.' },
      { id: 'previo', rotulo: 'Exames de imagem anteriores (data e resultado)', rotuloNoTexto: 'Exames de imagem anteriores' },
    ],
    regras: [
      { id: 'rl-inespecifica', nivel: 'atencao', se: { criterio: ['rl_6sem'], semGrupo: ['alarme', 'radic'] },
        aviso: 'Dor lombar sem déficit, sinal de alarme nem candidatura a cirurgia ou infiltração: a ACP (Chou) e o NICE NG59 não recomendam imagem de rotina; só o ACR 2021 admite após 6 semanas sem melhora. Detalhe o tratamento feito e a repercussão funcional.' },
      { id: 'rl-implante', nivel: 'info', se: { criterio: ['rl_implante'] },
        aviso: 'Confira se o dispositivo é compatível com ressonância (consenso HRS 2017 para dispositivos cardíacos; Manual de Segurança em RM do ACR). Os critérios de segurança não foram lidos neste site.' },
    ],
    naoIndicado: [
      'Dor lombar inespecífica sem sinais de alarme: não pedir imagem de rotina (ACP, recomendação forte).',
      'Dor lombar aguda e radiculopatia não complicadas são benignas e autolimitadas, e não justificam imagem (ACR 2021).',
      'Em serviço não especializado, o NICE NG59 não recomenda imagem de rotina; em serviço especializado, só se o resultado puder mudar a conduta.',
    ],
    conferencia: { nivel: 'parcial', data: '2026-11-26', pendencias: [
      'ACP e ACR foram lidos só nos resumos; os níveis de adequação por cenário do ACR não foram lidos.',
      'Não foi encontrada fonte brasileira nem critérios do Rol da ANS ou de protocolos de regulação do SUS. Exigência de radiografia prévia: sem fonte.',
      'Contraindicações da RM (marca-passo, implantes, claustrofobia): critérios não lidos.',
    ] },
  };

  const rmJoelho = {
    id: 'rm_joelho', sistema: 'Musculoesquelético', nome: 'Ressonância magnética do joelho', nomeCurto: 'Ressonância do joelho',
    cids: [['M25.5', 'Dor articular'], ['M23.2', 'Transtorno do menisco devido a ruptura ou lesão antiga'], ['M23.3', 'Outros transtornos do menisco'], ['M23.5', 'Instabilidade crônica do joelho'],
      ['S83.2', 'Ruptura do menisco, atual'], ['S83.5', 'Entorse e distensão que envolvem o ligamento cruzado do joelho'], ['M17.9', 'Gonartrose, não especificada'], ['M87.0', 'Necrose asséptica idiopática do osso']],
    fontes: {
      acr: F('ACR Appropriateness Criteria: Chronic Knee Pain, 2026 update. J Am Coll Radiol 2026;23(8):1799 (PMID 42340275)', PUBMED('42340275'), 'ACR 2026 (dor crônica no joelho)',
        'Só o resumo foi lido: a radiografia é o exame inicial na dor crônica do joelho; outras causas além da artrose incluem lesão osteocondral, fratura de insuficiência subcondral, mau alinhamento patelofemoral e alterações crônicas de tendão, menisco ou ligamento.'),
      nice: F('NICE NG226. Osteoarthritis in over 16s: diagnosis and management', 'https://www.nice.org.uk/guidance/ng226', 'NICE NG226',
        'Texto lido. 1.1.1: diagnóstico clínico, sem imagem, em quem tem 45 anos ou mais, dor ao esforço e rigidez matinal de até 30 minutos. 1.1.2: não usar imagem de rotina, a menos que haja características atípicas ou sugestivas de outro diagnóstico. 1.5.4: sem imagem de rotina no seguimento.'),
      duong: F('Duong V et al. Diagnosis and Management of Knee Osteoarthritis. JAMA 2023;330:1568 (PMID 37874571)', PUBMED('37874571'), 'JAMA 2023 (gonartrose)',
        'Só o resumo foi lido: na lesão meniscal degenerativa, o exercício é o tratamento de primeira linha e a cirurgia não é indicada, mesmo com sintomas mecânicos.', 'secundaria'),
    },
    grupos: [
      { id: 'ind', rotulo: 'Indicação', dica: 'A radiografia é o primeiro exame (ACR 2026). Os critérios abaixo são os usuais; poucos foram conferidos no texto.', criterios: [
        C('rj_atipico', 'Dor no joelho com características atípicas ou que sugerem outro diagnóstico além da artrose', { fonte: 'nice' }),
        C('rj_rx_nao_explica', 'Radiografia em ortostatismo realizada e que não explica o quadro', { fonte: 'acr', v: false, detalhe: 'O resumo do ACR 2026 não detalha quando a RM é indicada depois da radiografia' }),
        C('rj_mecanicos', 'Sintomas mecânicos (bloqueio, travamento) com suspeita de lesão meniscal', { v: false }),
        C('rj_ligamento', 'Suspeita de lesão ligamentar após trauma', { v: false }),
        C('rj_osteo', 'Suspeita de osteonecrose, fratura de insuficiência ou lesão osteocondral', { v: false }),
        C('rj_tumor', 'Suspeita de tumor ou infecção', { v: false }),
      ] },
    ],
    contra: [C('rj_implante', 'Marca-passo, desfibrilador ou outro implante', { frase: 'Portador de dispositivo implantado (conferir compatibilidade com ressonância)' })],
    campos: [
      { id: 'radiografia', rotulo: 'Radiografia do joelho (data e resultado)', rotuloNoTexto: 'Radiografia do joelho', obrigatorio: true, exigidoMsg: 'Informe a radiografia do joelho (data e resultado): ela é o exame inicial.' },
      { id: 'tratamento', rotulo: 'Tratamento conservador realizado (o que e por quanto tempo)', rotuloNoTexto: 'Tratamento conservador', dica: 'A duração mínima não tem fonte lida; alguns reguladores pedem.' },
    ],
    regras: [
      { id: 'rj-artrose', nivel: 'info', se: { criterio: ['rj_mecanicos'], idadeMaior: 44 },
        aviso: 'A partir dos 45 anos, o diagnóstico de artrose é clínico (NICE NG226). Na lesão meniscal degenerativa, o exercício é a primeira linha, mesmo com sintomas mecânicos (JAMA 2023, resumo). Descreva por que a RM mudaria a conduta.' },
      { id: 'rj-implante', nivel: 'info', se: { criterio: ['rj_implante'] },
        aviso: 'Confira se o dispositivo é compatível com ressonância (consenso HRS 2017; Manual de Segurança em RM do ACR). Os critérios de segurança não foram lidos neste site.' },
    ],
    naoIndicado: [
      'Artrose típica diagnosticada clinicamente (45 anos ou mais, dor ao esforço, rigidez matinal de até 30 minutos): sem imagem (NICE NG226, 1.1.1).',
      'Não usar imagem de rotina para diagnosticar artrose, a menos que haja características atípicas, nem no seguimento (NICE NG226, 1.1.2 e 1.5.4).',
      'Radiografia é o exame inicial na dor crônica do joelho (ACR 2026).',
      'Lesão meniscal degenerativa: exercício como primeira linha, e cirurgia não indicada mesmo com sintomas mecânicos (JAMA 2023, resumo).',
    ],
    conferencia: { nivel: 'parcial', data: '2026-11-26', pendencias: [
      'É o exame com menos critérios conferidos: o ACR 2026 e o JAMA 2023 foram lidos só nos resumos, e o ACR de trauma agudo do joelho não foi localizado.',
      'Lesão meniscal com sintomas mecânicos, lesão ligamentar, osteonecrose, tumor e infecção: sem fonte lida (marcados na tela). Tempo mínimo de tratamento conservador: sem fonte.',
      'Não foi encontrada fonte brasileira, nem critérios do Rol da ANS ou de protocolos de regulação do SUS.',
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

  const exames = [eda, colonoscopia, ecocardiograma, ergometrico, holter, mapa, rmLombar, rmJoelho, psg];

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
