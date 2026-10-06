/*
 * Definições das calculadoras.
 * Cada calculadora: { id, name, short, tabs, category, keywords, fields, compute, ref }
 * Tipos de campo: number, select, check (pontos), date.
 * compute(v) retorna { main, sub, level: 'low'|'mod'|'high'|'info', details? }
 */
(function () {
  'use strict';

  const ln = Math.log;
  const fmt = (n, d = 1) =>
    Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pct = (p, d = 1) => fmt(p * 100, d) + '%';
  const yes = { v: '1', t: 'Sim' };
  const no = { v: '0', t: 'Não' };
  const yn = [no, yes];
  const sexOpts = [
    { v: 'f', t: 'Feminino' },
    { v: 'm', t: 'Masculino' },
  ];

  // Soma os pontos dos campos "check" e "select" com valores numéricos
  function sumPoints(calc, v) {
    let s = 0;
    for (const f of calc.fields) {
      if (f.type === 'check' && v[f.id]) s += f.points;
      if (f.type === 'select' && f.scored) s += Number(v[f.id] || 0);
    }
    return s;
  }

  function addDays(date, days) {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }
  const fmtDate = (d) => d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const parseDate = (s) => (s ? new Date(s + 'T00:00:00Z') : null);
  const todayUTC = () => {
    const n = new Date();
    return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
  };
  const weeksDays = (days) => `${Math.floor(days / 7)} semanas e ${days % 7} dia(s)`;

  const C = [];

  /* ============================== CLÍNICA ============================== */

  C.push({
    id: 'framingham',
    name: 'Escore de Risco Global (Framingham)',
    short: 'Risco de evento cardiovascular em 10 anos — recomendado pela SBC.',
    tabs: ['clinica'],
    category: 'Cardiovascular',
    keywords: 'risco cardiovascular framingham erg infarto avc coração colesterol prevenção primária sbc',
    fields: [
      { id: 'sex', label: 'Sexo', type: 'select', options: sexOpts },
      { id: 'age', label: 'Idade', type: 'number', unit: 'anos', min: 30, max: 74 },
      { id: 'tc', label: 'Colesterol total', type: 'number', unit: 'mg/dL', min: 100, max: 405 },
      { id: 'hdl', label: 'HDL-colesterol', type: 'number', unit: 'mg/dL', min: 10, max: 150 },
      { id: 'sbp', label: 'Pressão sistólica', type: 'number', unit: 'mmHg', min: 80, max: 250 },
      { id: 'treated', label: 'Em uso de anti-hipertensivo', type: 'select', options: yn },
      { id: 'smoker', label: 'Tabagista atual', type: 'select', options: yn },
      { id: 'dm', label: 'Diabetes', type: 'select', options: yn },
    ],
    compute(v) {
      const t = v.treated === '1';
      let r;
      if (v.sex === 'f') {
        const s =
          2.32888 * ln(v.age) + 1.20904 * ln(v.tc) - 0.70833 * ln(v.hdl) +
          (t ? 2.82263 : 2.76157) * ln(v.sbp) + 0.52873 * +v.smoker + 0.69154 * +v.dm;
        r = 1 - Math.pow(0.95012, Math.exp(s - 26.1931));
      } else {
        const s =
          3.06117 * ln(v.age) + 1.1237 * ln(v.tc) - 0.93263 * ln(v.hdl) +
          (t ? 1.99881 : 1.93303) * ln(v.sbp) + 0.65451 * +v.smoker + 0.57367 * +v.dm;
        r = 1 - Math.pow(0.88936, Math.exp(s - 23.9802));
      }
      const hiCut = v.sex === 'f' ? 0.1 : 0.2;
      let level, sub;
      if (r < 0.05) { level = 'low'; sub = 'Baixo risco'; }
      else if (r <= hiCut) { level = 'mod'; sub = 'Risco intermediário'; }
      else { level = 'high'; sub = 'Alto risco'; }
      return {
        main: pct(r),
        sub: sub + ' (10 anos)',
        level,
        details:
          'Corte SBC: baixo < 5%; intermediário 5–' + (v.sex === 'f' ? '10' : '20') +
          '%; alto > ' + (v.sex === 'f' ? '10' : '20') + '%. ' +
          'História familiar precoce, síndrome metabólica e marcadores (PCR-us, escore de cálcio) podem ' +
          'reclassificar o risco intermediário.',
        warn: 'O escore não se aplica a quem já é de alto ou muito alto risco: doença aterosclerótica estabelecida, ' +
          'aterosclerose subclínica significativa, DRC, LDL ≥ 190 mg/dL ou diabetes com estratificadores de risco. ' +
          'Nesses casos, trate como alto/muito alto risco independentemente do resultado.',
      };
    },
    ref: "D'Agostino RB et al. Circulation 2008; Diretriz Brasileira de Dislipidemias e Prevenção da Aterosclerose (SBC).",
  });

  C.push({
    id: 'ascvd',
    name: 'ASCVD 10 anos (Pooled Cohort Equations)',
    short: 'Risco de doença cardiovascular aterosclerótica (ACC/AHA 2013).',
    tabs: ['clinica'],
    category: 'Cardiovascular',
    keywords: 'ascvd pooled cohort acc aha risco cardiovascular estatina',
    fields: [
      { id: 'sex', label: 'Sexo', type: 'select', options: sexOpts },
      {
        id: 'race', label: 'Grupo populacional', type: 'select',
        options: [{ v: 'w', t: 'Branco / outros' }, { v: 'b', t: 'Negro (afro-americano)' }],
      },
      { id: 'age', label: 'Idade', type: 'number', unit: 'anos', min: 40, max: 79 },
      { id: 'tc', label: 'Colesterol total', type: 'number', unit: 'mg/dL', min: 130, max: 320 },
      { id: 'hdl', label: 'HDL-colesterol', type: 'number', unit: 'mg/dL', min: 20, max: 100 },
      { id: 'sbp', label: 'Pressão sistólica', type: 'number', unit: 'mmHg', min: 90, max: 200 },
      { id: 'treated', label: 'Em uso de anti-hipertensivo', type: 'select', options: yn },
      { id: 'smoker', label: 'Tabagista atual', type: 'select', options: yn },
      { id: 'dm', label: 'Diabetes', type: 'select', options: yn },
    ],
    compute(v) {
      const la = ln(v.age), lt = ln(v.tc), lh = ln(v.hdl), ls = ln(v.sbp);
      const t = v.treated === '1', sm = +v.smoker, dm = +v.dm;
      let s, s0, mean;
      if (v.sex === 'f' && v.race === 'w') {
        s = -29.799 * la + 4.884 * la * la + 13.54 * lt - 3.114 * la * lt - 13.578 * lh +
          3.149 * la * lh + (t ? 2.019 : 1.957) * ls + 7.574 * sm - 1.665 * la * sm + 0.661 * dm;
        s0 = 0.9665; mean = -29.18;
      } else if (v.sex === 'f') {
        s = 17.114 * la + 0.94 * lt - 18.92 * lh + 4.475 * la * lh +
          (t ? 29.291 * ls - 6.432 * la * ls : 27.82 * ls - 6.087 * la * ls) + 0.691 * sm + 0.874 * dm;
        s0 = 0.9533; mean = 86.61;
      } else if (v.race === 'w') {
        s = 12.344 * la + 11.853 * lt - 2.664 * la * lt - 7.99 * lh + 1.769 * la * lh +
          (t ? 1.797 : 1.764) * ls + 7.837 * sm - 1.795 * la * sm + 0.658 * dm;
        s0 = 0.9144; mean = 61.18;
      } else {
        s = 2.469 * la + 0.302 * lt - 0.307 * lh + (t ? 1.916 : 1.809) * ls + 0.549 * sm + 0.645 * dm;
        s0 = 0.8954; mean = 19.54;
      }
      const r = 1 - Math.pow(s0, Math.exp(s - mean));
      let level, sub;
      if (r < 0.05) { level = 'low'; sub = 'Baixo risco (< 5%)'; }
      else if (r < 0.075) { level = 'mod'; sub = 'Risco limítrofe (5–7,4%)'; }
      else if (r < 0.2) { level = 'mod'; sub = 'Risco intermediário (7,5–19,9%)'; }
      else { level = 'high'; sub = 'Alto risco (≥ 20%)'; }
      return {
        main: pct(r), sub, level,
        details: 'Equação derivada de coortes norte-americanas; pode superestimar o risco em algumas populações. ' +
          'No Brasil, a SBC recomenda o Escore de Risco Global (Framingham).',
        warn: 'Não use em quem já tem doença aterosclerótica, LDL ≥ 190 mg/dL ou diabetes (40–75 anos): ' +
          'nesses grupos a estatina está indicada independentemente do risco calculado.',
      };
    },
    ref: 'Goff DC et al. 2013 ACC/AHA Guideline on the Assessment of Cardiovascular Risk.',
  });

  C.push({
    id: 'pa_class',
    name: 'Classificação da Pressão Arterial',
    short: 'Classifica a PA de consultório em adultos.',
    tabs: ['clinica'],
    category: 'Cardiovascular',
    keywords: 'pressão arterial hipertensão classificação estágio pa has',
    fields: [
      { id: 'sbp', label: 'Pressão sistólica', type: 'number', unit: 'mmHg', min: 60, max: 300 },
      { id: 'dbp', label: 'Pressão diastólica', type: 'number', unit: 'mmHg', min: 30, max: 200 },
    ],
    compute(v) {
      const cat = (s, d) => {
        if (s >= 180 || d >= 110) return 5;
        if (s >= 160 || d >= 100) return 4;
        if (s >= 140 || d >= 90) return 3;
        if (s >= 120 || d >= 80) return 2;
        return 1;
      };
      const labels = {
        1: ['PA normal', 'low'],
        2: ['Pré-hipertensão', 'mod'],
        3: ['Hipertensão estágio 1', 'high'],
        4: ['Hipertensão estágio 2', 'high'],
        5: ['Hipertensão estágio 3', 'high'],
      };
      const c = cat(v.sbp, v.dbp);
      const iso = v.sbp >= 140 && v.dbp < 90 ? ' — hipertensão sistólica isolada' : '';
      return {
        main: `${v.sbp}/${v.dbp} mmHg`,
        sub: labels[c][0] + iso,
        level: labels[c][1],
        details:
          'O diagnóstico exige medidas repetidas com técnica adequada e, idealmente, confirmação fora do consultório ' +
          '(MRPA ou MAPA). Quando sistólica e diastólica caem em categorias diferentes, vale a maior.',
        warn: c === 5 ? 'PA ≥ 180/110: pesquise sintomas e lesão aguda de órgão-alvo (dor torácica, déficit neurológico, ' +
          'dispneia, alteração visual). Se presentes, é emergência hipertensiva e requer avaliação imediata.' : undefined,
        edu: 'has-oque',
      };
    },
    ref: 'Diretrizes Brasileiras de Hipertensão Arterial (SBC/SBH/SBN).',
  });

  C.push({
    id: 'cha2ds2vasc',
    name: 'CHA₂DS₂-VASc',
    short: 'Risco de AVC na fibrilação atrial não valvar.',
    tabs: ['clinica'],
    category: 'Cardiovascular',
    keywords: 'fibrilação atrial fa avc anticoagulação cha2ds2vasc chads',
    fields: [
      { id: 'chf', label: 'Insuficiência cardíaca / disfunção de VE', type: 'check', points: 1 },
      { id: 'htn', label: 'Hipertensão', type: 'check', points: 1 },
      {
        id: 'age', label: 'Idade', type: 'select', scored: true,
        options: [{ v: '0', t: '< 65 anos' }, { v: '1', t: '65–74 anos' }, { v: '2', t: '≥ 75 anos' }],
      },
      { id: 'dm', label: 'Diabetes', type: 'check', points: 1 },
      { id: 'stroke', label: 'AVC / AIT / tromboembolismo prévio', type: 'check', points: 2 },
      { id: 'vasc', label: 'Doença vascular (IAM prévio, DAP, placa aórtica)', type: 'check', points: 1 },
      { id: 'female', label: 'Sexo feminino', type: 'check', points: 1 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const nonSex = s - (v.female ? 1 : 0);
      let level, sub;
      if (nonSex === 0) { level = 'low'; sub = 'Baixo risco — anticoagulação geralmente não indicada'; }
      else if (nonSex === 1) { level = 'mod'; sub = 'Considerar anticoagulação oral'; }
      else { level = 'high'; sub = 'Anticoagulação oral recomendada (se sem contraindicação)'; }
      return {
        main: s + ' ponto(s)', sub, level,
        warn: 'Não se aplica a FA com estenose mitral moderada/grave ou prótese valvar mecânica: ' +
          'nesses casos a anticoagulação (varfarina) está indicada independentemente do escore.',
        details: 'O sexo feminino isoladamente é modificador de risco, não indicação. Avalie também o risco de ' +
          'sangramento (HAS-BLED) — escore alto pede correção de fatores modificáveis, não contraindica por si só.',
      };
    },
    ref: 'Lip GY et al. Chest 2010; ESC 2020/2024 AF Guidelines.',
  });

  C.push({
    id: 'hasbled',
    name: 'HAS-BLED',
    short: 'Risco de sangramento maior em anticoagulados.',
    tabs: ['clinica'],
    category: 'Cardiovascular',
    keywords: 'sangramento anticoagulação hasbled varfarina fibrilação',
    fields: [
      { id: 'h', label: 'Hipertensão não controlada (PAS > 160 mmHg)', type: 'check', points: 1 },
      { id: 'ar', label: 'Função renal alterada (diálise, transplante, Cr ≥ 2,26 mg/dL)', type: 'check', points: 1 },
      { id: 'al', label: 'Função hepática alterada (cirrose ou bilirrubina > 2× / TGO-TGP > 3×)', type: 'check', points: 1 },
      { id: 's', label: 'AVC prévio', type: 'check', points: 1 },
      { id: 'b', label: 'Sangramento prévio ou predisposição (anemia)', type: 'check', points: 1 },
      { id: 'l', label: 'RNI lábil (TTR < 60%)', type: 'check', points: 1 },
      { id: 'e', label: 'Idade > 65 anos', type: 'check', points: 1 },
      { id: 'd', label: 'Drogas (antiplaquetário/AINE)', type: 'check', points: 1 },
      { id: 'a', label: 'Álcool (≥ 8 doses/semana)', type: 'check', points: 1 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const high = s >= 3;
      return {
        main: s + ' ponto(s)',
        sub: high ? 'Alto risco de sangramento' : 'Risco baixo a moderado',
        level: high ? 'high' : s === 2 ? 'mod' : 'low',
        details: 'Escore ≥ 3 indica seguimento mais próximo e correção de fatores modificáveis (PA, álcool, AINEs, RNI lábil).',
      };
    },
    ref: 'Pisters R et al. Chest 2010.',
  });

  C.push({
    id: 'ldl',
    name: 'LDL-colesterol (Friedewald)',
    short: 'Estima o LDL a partir do perfil lipídico.',
    tabs: ['clinica'],
    category: 'Metabólico',
    keywords: 'ldl colesterol friedewald dislipidemia lipidograma',
    fields: [
      { id: 'tc', label: 'Colesterol total', type: 'number', unit: 'mg/dL', min: 50, max: 600 },
      { id: 'hdl', label: 'HDL-colesterol', type: 'number', unit: 'mg/dL', min: 5, max: 200 },
      { id: 'tg', label: 'Triglicerídeos', type: 'number', unit: 'mg/dL', min: 10, max: 2000 },
    ],
    compute(v) {
      const nonhdl = v.tc - v.hdl;
      if (v.tg >= 400) {
        return {
          main: 'Não-HDL: ' + fmt(nonhdl, 0) + ' mg/dL',
          sub: 'Friedewald inválido com TG ≥ 400 mg/dL',
          level: 'info',
          details: 'Use LDL direto ou a equação de Martin/Sampson. O colesterol não-HDL permanece válido.',
        };
      }
      const ldl = v.tc - v.hdl - v.tg / 5;
      return {
        main: fmt(ldl, 0) + ' mg/dL',
        sub: 'Não-HDL: ' + fmt(nonhdl, 0) + ' mg/dL',
        level: ldl >= 190 ? 'high' : ldl >= 130 ? 'mod' : 'low',
        details: 'As metas de LDL dependem da categoria de risco cardiovascular. LDL ≥ 190 mg/dL sugere hipercolesterolemia ' +
          'grave (investigar causa familiar). Friedewald perde acurácia com LDL baixo ou TG elevados.',
      };
    },
    ref: 'Friedewald WT et al. Clin Chem 1972.',
  });

  C.push({
    id: 'imc',
    name: 'IMC e circunferência abdominal',
    short: 'Índice de massa corporal e risco metabólico.',
    tabs: ['clinica', 'gineco'],
    category: 'Metabólico',
    keywords: 'imc obesidade peso altura sobrepeso cintura circunferência abdominal',
    fields: [
      { id: 'w', label: 'Peso', type: 'number', unit: 'kg', min: 2, max: 400, step: 0.1 },
      { id: 'h', label: 'Altura', type: 'number', unit: 'cm', min: 40, max: 250 },
      { id: 'sex', label: 'Sexo', type: 'select', options: sexOpts },
      { id: 'waist', label: 'Circunferência abdominal (opcional)', type: 'number', unit: 'cm', min: 30, max: 250, optional: true },
    ],
    compute(v) {
      const bmi = v.w / Math.pow(v.h / 100, 2);
      let sub, level;
      if (bmi < 18.5) { sub = 'Baixo peso'; level = 'mod'; }
      else if (bmi < 25) { sub = 'Eutrofia'; level = 'low'; }
      else if (bmi < 30) { sub = 'Sobrepeso'; level = 'mod'; }
      else if (bmi < 35) { sub = 'Obesidade grau I'; level = 'high'; }
      else if (bmi < 40) { sub = 'Obesidade grau II'; level = 'high'; }
      else { sub = 'Obesidade grau III'; level = 'high'; }
      let details = '';
      if (v.waist) {
        const [a, b] = v.sex === 'f' ? [80, 88] : [94, 102];
        const w = v.waist >= b ? 'muito aumentado' : v.waist >= a ? 'aumentado' : 'sem aumento';
        details = `Circunferência abdominal ${v.waist} cm: risco metabólico ${w} (cortes OMS: ≥ ${a} aumentado, ≥ ${b} muito aumentado). `;
      }
      details += 'Em idosos, atletas e gestantes, o IMC tem interpretação própria.';
      return { main: fmt(bmi) + ' kg/m²', sub, level, details };
    },
    ref: 'OMS — classificação do estado nutricional.',
  });

  C.push({
    id: 'findrisc',
    name: 'FINDRISC',
    short: 'Risco de desenvolver diabetes tipo 2 em 10 anos.',
    tabs: ['clinica'],
    category: 'Metabólico',
    keywords: 'diabetes risco findrisc pré-diabetes rastreamento glicemia',
    fields: [
      { id: 'age', label: 'Idade', type: 'select', scored: true, options: [
        { v: '0', t: '< 45 anos' }, { v: '2', t: '45–54 anos' }, { v: '3', t: '55–64 anos' }, { v: '4', t: '> 64 anos' }] },
      { id: 'bmi', label: 'IMC', type: 'select', scored: true, options: [
        { v: '0', t: '< 25 kg/m²' }, { v: '1', t: '25–30 kg/m²' }, { v: '3', t: '> 30 kg/m²' }] },
      { id: 'waist', label: 'Circunferência abdominal', type: 'select', scored: true, options: [
        { v: '0', t: 'H < 94 cm / M < 80 cm' }, { v: '3', t: 'H 94–102 cm / M 80–88 cm' }, { v: '4', t: 'H > 102 cm / M > 88 cm' }] },
      { id: 'pa', label: 'Faz ≥ 30 min de atividade física por dia?', type: 'select', scored: true, options: [
        { v: '0', t: 'Sim' }, { v: '2', t: 'Não' }] },
      { id: 'veg', label: 'Come verduras/frutas todos os dias?', type: 'select', scored: true, options: [
        { v: '0', t: 'Sim' }, { v: '1', t: 'Não' }] },
      { id: 'htn', label: 'Já usou remédio para pressão alta', type: 'check', points: 2 },
      { id: 'glu', label: 'Já teve glicemia alta (exame, doença, gestação)', type: 'check', points: 5 },
      { id: 'fam', label: 'Familiares com diabetes', type: 'select', scored: true, options: [
        { v: '0', t: 'Não' }, { v: '3', t: 'Sim: avós, tios ou primos' }, { v: '5', t: 'Sim: pais, irmãos ou filhos' }] },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      let sub, level;
      if (s < 7) { sub = 'Risco baixo (~1%)'; level = 'low'; }
      else if (s <= 11) { sub = 'Risco levemente elevado (~4%)'; level = 'low'; }
      else if (s <= 14) { sub = 'Risco moderado (~17%)'; level = 'mod'; }
      else if (s <= 20) { sub = 'Risco alto (~33%)'; level = 'high'; }
      else { sub = 'Risco muito alto (~50%)'; level = 'high'; }
      return {
        main: s + ' ponto(s)', sub: sub + ' em 10 anos', level,
        details: 'Escore ≥ 12 sugere rastreamento com glicemia de jejum/HbA1c e intervenção intensiva em estilo de vida.',
      };
    },
    ref: 'Lindström J, Tuomilehto J. Diabetes Care 2003.',
  });

  C.push({
    id: 'homa',
    name: 'HOMA-IR',
    short: 'Estimativa de resistência insulínica.',
    tabs: ['clinica', 'gineco'],
    category: 'Metabólico',
    keywords: 'homa resistência insulínica insulina glicemia sop',
    fields: [
      { id: 'g', label: 'Glicemia de jejum', type: 'number', unit: 'mg/dL', min: 30, max: 600 },
      { id: 'i', label: 'Insulina de jejum', type: 'number', unit: 'µU/mL', min: 0.5, max: 300, step: 0.1 },
    ],
    compute(v) {
      const h = (v.g * v.i) / 405;
      return {
        main: fmt(h, 2),
        sub: h >= 2.7 ? 'Sugere resistência insulínica' : 'Sem resistência insulínica significativa',
        level: h >= 2.7 ? 'mod' : 'low',
        details: 'Pontos de corte variam por população e laboratório (2,5–2,7 é usado em adultos brasileiros). Não é critério diagnóstico de diabetes.',
      };
    },
    ref: 'Matthews DR et al. Diabetologia 1985; Geloneze B et al. 2006.',
  });

  C.push({
    id: 'ckdepi',
    name: 'TFG — CKD-EPI 2021',
    short: 'Taxa de filtração glomerular estimada (sem coeficiente racial).',
    tabs: ['clinica', 'cirurgia'],
    category: 'Renal',
    keywords: 'tfg ckd epi creatinina rim função renal drc clearance',
    fields: [
      { id: 'sex', label: 'Sexo', type: 'select', options: sexOpts },
      { id: 'age', label: 'Idade', type: 'number', unit: 'anos', min: 18, max: 110 },
      { id: 'cr', label: 'Creatinina sérica', type: 'number', unit: 'mg/dL', min: 0.1, max: 20, step: 0.01 },
    ],
    compute(v) {
      const f = v.sex === 'f';
      const k = f ? 0.7 : 0.9, a = f ? -0.241 : -0.302;
      const r = v.cr / k;
      const g = 142 * Math.pow(Math.min(r, 1), a) * Math.pow(Math.max(r, 1), -1.2) *
        Math.pow(0.9938, v.age) * (f ? 1.012 : 1);
      let st, level;
      if (g >= 90) { st = 'G1 — normal ou alta'; level = 'low'; }
      else if (g >= 60) { st = 'G2 — levemente diminuída'; level = 'low'; }
      else if (g >= 45) { st = 'G3a — leve a moderadamente diminuída'; level = 'mod'; }
      else if (g >= 30) { st = 'G3b — moderada a gravemente diminuída'; level = 'mod'; }
      else if (g >= 15) { st = 'G4 — gravemente diminuída'; level = 'high'; }
      else { st = 'G5 — falência renal'; level = 'high'; }
      return {
        main: fmt(g, 0) + ' mL/min/1,73m²', sub: 'KDIGO ' + st, level,
        details: 'DRC requer alteração persistente por > 3 meses; estadie também a albuminúria (A1–A3).',
        warn: 'Não use em lesão renal aguda (creatinina instável): a TFG estimada superestima a função renal ' +
          'e pode levar a doses inadequadas de medicamentos.',
      };
    },
    ref: 'Inker LA et al. N Engl J Med 2021; KDIGO 2024.',
  });

  C.push({
    id: 'cockcroft',
    name: 'Clearance de creatinina (Cockcroft-Gault)',
    short: 'Útil para ajuste de dose de medicamentos.',
    tabs: ['clinica', 'cirurgia'],
    category: 'Renal',
    keywords: 'cockcroft gault clearance creatinina ajuste dose medicamento',
    fields: [
      { id: 'sex', label: 'Sexo', type: 'select', options: sexOpts },
      { id: 'age', label: 'Idade', type: 'number', unit: 'anos', min: 18, max: 110 },
      { id: 'w', label: 'Peso', type: 'number', unit: 'kg', min: 20, max: 300, step: 0.1 },
      { id: 'cr', label: 'Creatinina sérica', type: 'number', unit: 'mg/dL', min: 0.1, max: 20, step: 0.01 },
    ],
    compute(v) {
      const c = ((140 - v.age) * v.w) / (72 * v.cr) * (v.sex === 'f' ? 0.85 : 1);
      return {
        main: fmt(c, 0) + ' mL/min', sub: 'Clearance de creatinina estimado',
        level: c < 30 ? 'high' : c < 60 ? 'mod' : 'low',
        details: 'Em obesos, considere o peso ajustado. Consulte a bula para os cortes de ajuste de cada fármaco.',
      };
    },
    ref: 'Cockcroft DW, Gault MH. Nephron 1976.',
  });

  C.push({
    id: 'ost',
    name: 'OST — Osteoporosis Self-Assessment Tool',
    short: 'Triagem rápida de risco de osteoporose (peso e idade).',
    tabs: ['clinica', 'gineco'],
    category: 'Osso e fraturas',
    keywords: 'osteoporose fratura densitometria ost menopausa osso',
    fields: [
      { id: 'age', label: 'Idade', type: 'number', unit: 'anos', min: 40, max: 110 },
      { id: 'w', label: 'Peso', type: 'number', unit: 'kg', min: 25, max: 250, step: 0.1 },
    ],
    compute(v) {
      const s = Math.trunc((v.w - v.age) * 0.2);
      let sub, level;
      if (s < -4) { sub = 'Alto risco de osteoporose'; level = 'high'; }
      else if (s <= -1) { sub = 'Risco moderado'; level = 'mod'; }
      else { sub = 'Baixo risco'; level = 'low'; }
      return {
        main: 'Escore ' + s, sub, level,
        details: 'Validado principalmente em mulheres na pós-menopausa. Risco moderado/alto: considerar densitometria óssea. ' +
          'Para probabilidade de fratura em 10 anos, use o FRAX Brasil.',
      };
    },
    ref: 'Koh LK et al. Osteoporos Int 2001.',
  });

  C.push({
    id: 'orai',
    name: 'ORAI',
    short: 'Indica quem deve fazer densitometria (mulheres pós-menopausa).',
    tabs: ['clinica', 'gineco'],
    category: 'Osso e fraturas',
    keywords: 'orai osteoporose densitometria menopausa',
    fields: [
      { id: 'age', label: 'Idade', type: 'select', scored: true, options: [
        { v: '0', t: '< 55 anos' }, { v: '5', t: '55–64 anos' }, { v: '9', t: '65–74 anos' }, { v: '15', t: '≥ 75 anos' }] },
      { id: 'w', label: 'Peso', type: 'select', scored: true, options: [
        { v: '0', t: '≥ 70 kg' }, { v: '3', t: '60–69,9 kg' }, { v: '9', t: '< 60 kg' }] },
      { id: 'est', label: 'NÃO usa estrogênio atualmente', type: 'check', points: 2 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      return {
        main: s + ' ponto(s)',
        sub: s >= 9 ? 'Densitometria indicada' : 'Baixo risco pelo ORAI',
        level: s >= 9 ? 'high' : 'low',
        details: 'Escore ≥ 9 identifica mulheres com maior probabilidade de baixa densidade mineral óssea.',
      };
    },
    ref: 'Cadarette SM et al. CMAJ 2000.',
  });

  C.push({
    id: 'frax_fatores',
    name: 'Fatores de risco de fratura (FRAX)',
    short: 'Checklist dos fatores clínicos do FRAX + acesso à ferramenta oficial.',
    tabs: ['clinica', 'gineco'],
    category: 'Osso e fraturas',
    keywords: 'frax fratura osteoporose quadril risco fratura corticoide',
    fields: [
      { id: 'age', label: 'Idade', type: 'number', unit: 'anos', min: 40, max: 90 },
      { id: 'w', label: 'Peso', type: 'number', unit: 'kg', min: 25, max: 250, step: 0.1 },
      { id: 'h', label: 'Altura', type: 'number', unit: 'cm', min: 100, max: 220 },
      { id: 'prev', label: 'Fratura prévia por fragilidade', type: 'check', points: 1 },
      { id: 'parent', label: 'Pai ou mãe com fratura de quadril', type: 'check', points: 1 },
      { id: 'smk', label: 'Tabagismo atual', type: 'check', points: 1 },
      { id: 'gc', label: 'Glicocorticoide ≥ 5 mg/dia de prednisolona por ≥ 3 meses', type: 'check', points: 1 },
      { id: 'ra', label: 'Artrite reumatoide', type: 'check', points: 1 },
      { id: 'sec', label: 'Osteoporose secundária (DM1, hipertireoidismo, hipogonadismo, má absorção…)', type: 'check', points: 1 },
      { id: 'alc', label: 'Álcool ≥ 3 doses/dia', type: 'check', points: 1 },
    ],
    compute(v) {
      const n = sumPoints(this, v);
      const bmi = v.w / Math.pow(v.h / 100, 2);
      const lowBmi = bmi < 20;
      const total = n + (lowBmi ? 1 : 0) + (v.age >= 65 ? 1 : 0);
      const level = v.prev || total >= 3 ? 'high' : total >= 1 ? 'mod' : 'low';
      return {
        main: total + ' fator(es)',
        sub: v.prev ? 'Fratura por fragilidade prévia: alto risco' : level === 'high' ? 'Múltiplos fatores de risco' : level === 'mod' ? 'Há fatores de risco presentes' : 'Sem fatores clínicos maiores',
        level,
        details: `IMC ${fmt(bmi)} kg/m²${lowBmi ? ' (baixo — fator de risco)' : ''}. ` +
          'O FRAX calcula a probabilidade de fratura maior e de quadril em 10 anos — o algoritmo é proprietário, por isso use a ferramenta oficial (Brasil) com estes dados. ' +
          'No Brasil, os limiares de intervenção são ajustados por idade (NOGG/ABRASSO).',
        link: { href: 'https://frax.shef.ac.uk/FRAX/tool.aspx?lang=pr', text: 'Abrir FRAX oficial' },
      };
    },
    ref: 'Kanis JA et al. FRAX® (Universidade de Sheffield); Zerbini CAF et al. Arch Osteoporos 2015 (FRAX Brasil).',
  });

  C.push({
    id: 'curb65',
    name: 'CURB-65',
    short: 'Gravidade da pneumonia adquirida na comunidade.',
    tabs: ['clinica'],
    category: 'Pneumologia e infecção',
    keywords: 'pneumonia curb65 pac internação gravidade',
    fields: [
      { id: 'c', label: 'Confusão mental', type: 'check', points: 1 },
      { id: 'u', label: 'Ureia > 43 mg/dL (> 7 mmol/L)', type: 'check', points: 1 },
      { id: 'r', label: 'Frequência respiratória ≥ 30 irpm', type: 'check', points: 1 },
      { id: 'b', label: 'PAS < 90 ou PAD ≤ 60 mmHg', type: 'check', points: 1 },
      { id: 'a', label: 'Idade ≥ 65 anos', type: 'check', points: 1 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const m = ['0,6%', '2,7%', '6,8%', '14%', '27,8%', '27,8%'][s];
      let sub, level;
      if (s <= 1) { sub = 'Baixo risco — considerar tratamento ambulatorial'; level = 'low'; }
      else if (s === 2) { sub = 'Risco intermediário — considerar internação'; level = 'mod'; }
      else { sub = 'Alto risco — internação; avaliar UTI se 4–5'; level = 'high'; }
      return { main: s + ' ponto(s)', sub, level, details: 'Mortalidade em 30 dias aproximada: ' + m + '.' };
    },
    ref: 'Lim WS et al. Thorax 2003.',
  });

  C.push({
    id: 'qsofa',
    name: 'qSOFA',
    short: 'Triagem à beira-leito de pior prognóstico na suspeita de sepse.',
    tabs: ['clinica', 'cirurgia'],
    category: 'Pneumologia e infecção',
    keywords: 'sepse qsofa infecção choque',
    fields: [
      { id: 'rr', label: 'Frequência respiratória ≥ 22 irpm', type: 'check', points: 1 },
      { id: 'ms', label: 'Alteração do estado mental (Glasgow < 15)', type: 'check', points: 1 },
      { id: 'sbp', label: 'PAS ≤ 100 mmHg', type: 'check', points: 1 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      return {
        main: s + ' ponto(s)',
        sub: s >= 2 ? 'Positivo — maior risco de desfecho desfavorável' : 'Negativo',
        level: s >= 2 ? 'high' : 'low',
        details: 'qSOFA não é critério diagnóstico de sepse e tem baixa sensibilidade.',
        warn: s < 2 ? 'qSOFA negativo não exclui sepse: se houver suspeita clínica, não atrase antibiótico, culturas e lactato.' : undefined,
      };
    },
    ref: 'Seymour CW et al. JAMA 2016 (Sepsis-3).',
  });

  C.push({
    id: 'wells_tep',
    name: 'Wells — Tromboembolismo pulmonar',
    short: 'Probabilidade clínica pré-teste de TEP.',
    tabs: ['clinica', 'cirurgia', 'gineco'],
    category: 'Tromboembolismo',
    keywords: 'tep embolia pulmonar wells dímero d trombose',
    fields: [
      { id: 'dvt', label: 'Sinais clínicos de TVP', type: 'check', points: 3 },
      { id: 'alt', label: 'TEP é o diagnóstico mais provável', type: 'check', points: 3 },
      { id: 'hr', label: 'FC > 100 bpm', type: 'check', points: 1.5 },
      { id: 'imm', label: 'Imobilização ≥ 3 dias ou cirurgia nas últimas 4 semanas', type: 'check', points: 1.5 },
      { id: 'prev', label: 'TVP/TEP prévio', type: 'check', points: 1.5 },
      { id: 'hem', label: 'Hemoptise', type: 'check', points: 1 },
      { id: 'ca', label: 'Câncer ativo', type: 'check', points: 1 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const two = s > 4 ? 'TEP provável' : 'TEP improvável';
      let three, level;
      if (s < 2) { three = 'baixa'; level = 'low'; }
      else if (s <= 6) { three = 'intermediária'; level = 'mod'; }
      else { three = 'alta'; level = 'high'; }
      return {
        main: fmt(s) + ' ponto(s)', sub: two + ' — probabilidade ' + three, level,
        details: 'TEP improvável: dosar D-dímero (considere PERC se probabilidade muito baixa). TEP provável: angiotomografia de tórax.',
      };
    },
    ref: 'Wells PS et al. Thromb Haemost 2000.',
  });

  C.push({
    id: 'wells_tvp',
    name: 'Wells — Trombose venosa profunda',
    short: 'Probabilidade clínica pré-teste de TVP.',
    tabs: ['clinica', 'cirurgia', 'gineco'],
    category: 'Tromboembolismo',
    keywords: 'tvp trombose venosa profunda wells perna edema',
    fields: [
      { id: 'ca', label: 'Câncer ativo', type: 'check', points: 1 },
      { id: 'par', label: 'Paralisia, paresia ou imobilização gessada recente de MMII', type: 'check', points: 1 },
      { id: 'bed', label: 'Acamado > 3 dias ou cirurgia maior nas últimas 12 semanas', type: 'check', points: 1 },
      { id: 'tend', label: 'Dor à palpação no trajeto venoso profundo', type: 'check', points: 1 },
      { id: 'leg', label: 'Edema de todo o membro', type: 'check', points: 1 },
      { id: 'calf', label: 'Panturrilha > 3 cm maior que a contralateral', type: 'check', points: 1 },
      { id: 'pit', label: 'Edema depressível no membro sintomático', type: 'check', points: 1 },
      { id: 'col', label: 'Veias superficiais colaterais (não varicosas)', type: 'check', points: 1 },
      { id: 'prev', label: 'TVP prévia documentada', type: 'check', points: 1 },
      { id: 'alt', label: 'Diagnóstico alternativo tão ou mais provável', type: 'check', points: -2 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const likely = s >= 2;
      return {
        main: s + ' ponto(s)', sub: likely ? 'TVP provável' : 'TVP improvável',
        level: likely ? 'high' : 'low',
        details: likely ? 'Solicitar ultrassom Doppler venoso.' : 'Dosar D-dímero; se negativo, TVP é improvável.',
      };
    },
    ref: 'Wells PS et al. N Engl J Med 2003.',
  });

  C.push({
    id: 'padua',
    name: 'Escore de Pádua',
    short: 'Risco de TEV em pacientes clínicos internados.',
    tabs: ['clinica'],
    category: 'Tromboembolismo',
    keywords: 'padua profilaxia tev internação clínico heparina',
    fields: [
      { id: 'ca', label: 'Câncer ativo', type: 'check', points: 3 },
      { id: 'vte', label: 'TEV prévio (exceto trombose superficial)', type: 'check', points: 3 },
      { id: 'mob', label: 'Mobilidade reduzida (≥ 3 dias)', type: 'check', points: 3 },
      { id: 'thr', label: 'Trombofilia conhecida', type: 'check', points: 3 },
      { id: 'tr', label: 'Trauma e/ou cirurgia recente (≤ 1 mês)', type: 'check', points: 2 },
      { id: 'age', label: 'Idade ≥ 70 anos', type: 'check', points: 1 },
      { id: 'hf', label: 'Insuficiência cardíaca e/ou respiratória', type: 'check', points: 1 },
      { id: 'mi', label: 'IAM ou AVC isquêmico agudo', type: 'check', points: 1 },
      { id: 'inf', label: 'Infecção aguda e/ou doença reumatológica', type: 'check', points: 1 },
      { id: 'ob', label: 'Obesidade (IMC ≥ 30)', type: 'check', points: 1 },
      { id: 'hor', label: 'Terapia hormonal em curso', type: 'check', points: 1 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const high = s >= 4;
      return {
        main: s + ' ponto(s)', sub: high ? 'Alto risco de TEV' : 'Baixo risco de TEV',
        level: high ? 'high' : 'low',
        details: high ? 'Profilaxia farmacológica indicada se não houver contraindicação (avaliar risco de sangramento).' :
          'Profilaxia farmacológica geralmente não necessária; estimular deambulação.',
      };
    },
    ref: 'Barbar S et al. J Thromb Haemost 2010.',
  });

  C.push({
    id: 'childpugh',
    name: 'Child-Pugh',
    short: 'Classificação de gravidade da cirrose.',
    tabs: ['clinica', 'cirurgia'],
    category: 'Hepatologia',
    keywords: 'child pugh cirrose fígado hepatopatia',
    fields: [
      { id: 'bili', label: 'Bilirrubina total', type: 'select', scored: true, options: [
        { v: '1', t: '< 2 mg/dL' }, { v: '2', t: '2–3 mg/dL' }, { v: '3', t: '> 3 mg/dL' }] },
      { id: 'alb', label: 'Albumina', type: 'select', scored: true, options: [
        { v: '1', t: '> 3,5 g/dL' }, { v: '2', t: '2,8–3,5 g/dL' }, { v: '3', t: '< 2,8 g/dL' }] },
      { id: 'inr', label: 'RNI', type: 'select', scored: true, options: [
        { v: '1', t: '< 1,7' }, { v: '2', t: '1,7–2,3' }, { v: '3', t: '> 2,3' }] },
      { id: 'asc', label: 'Ascite', type: 'select', scored: true, options: [
        { v: '1', t: 'Ausente' }, { v: '2', t: 'Leve / controlada' }, { v: '3', t: 'Moderada a grave' }] },
      { id: 'enc', label: 'Encefalopatia', type: 'select', scored: true, options: [
        { v: '1', t: 'Ausente' }, { v: '2', t: 'Grau 1–2' }, { v: '3', t: 'Grau 3–4' }] },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const [cls, level, surv] = s <= 6 ? ['A', 'low', '~100% / 85%'] : s <= 9 ? ['B', 'mod', '~80% / 60%'] : ['C', 'high', '~45% / 35%'];
      return {
        main: 'Classe ' + cls + ' (' + s + ' pts)', sub: 'Sobrevida em 1 / 2 anos: ' + surv, level,
        details: 'Para priorização de transplante e risco cirúrgico, complemente com o MELD.',
      };
    },
    ref: 'Pugh RN et al. Br J Surg 1973.',
  });

  C.push({
    id: 'meld',
    name: 'MELD / MELD-Na',
    short: 'Mortalidade em 90 dias na hepatopatia crônica.',
    tabs: ['clinica', 'cirurgia'],
    category: 'Hepatologia',
    keywords: 'meld sódio cirrose transplante hepático fígado',
    fields: [
      { id: 'bili', label: 'Bilirrubina total', type: 'number', unit: 'mg/dL', min: 0.1, max: 80, step: 0.1 },
      { id: 'inr', label: 'RNI', type: 'number', min: 0.5, max: 15, step: 0.01 },
      { id: 'cr', label: 'Creatinina', type: 'number', unit: 'mg/dL', min: 0.1, max: 20, step: 0.01 },
      { id: 'na', label: 'Sódio', type: 'number', unit: 'mEq/L', min: 100, max: 170 },
      { id: 'hd', label: 'Diálise ≥ 2× na última semana', type: 'select', options: yn },
    ],
    compute(v) {
      const c = (x) => Math.max(1, x);
      const cr = v.hd === '1' ? 4 : Math.min(4, c(v.cr));
      let meld = 10 * (0.957 * ln(cr) + 0.378 * ln(c(v.bili)) + 1.12 * ln(c(v.inr)) + 0.643);
      meld = Math.round(meld * 10) / 10;
      let res = meld;
      if (meld > 11) {
        const na = Math.min(137, Math.max(125, v.na));
        res = meld + 1.32 * (137 - na) - 0.033 * meld * (137 - na);
      }
      res = Math.min(40, Math.round(res));
      let mort, level;
      if (res < 10) { mort = '~2%'; level = 'low'; }
      else if (res < 20) { mort = '~6%'; level = 'mod'; }
      else if (res < 30) { mort = '~20%'; level = 'high'; }
      else if (res < 40) { mort = '~53%'; level = 'high'; }
      else { mort = '~71%'; level = 'high'; }
      return {
        main: 'MELD-Na ' + res, sub: 'Mortalidade estimada em 90 dias: ' + mort, level,
        details: 'MELD clássico: ' + Math.round(meld) + '. Valores < 1 são ajustados para 1; creatinina limitada a 4 mg/dL.',
      };
    },
    ref: 'Kamath PS et al. Hepatology 2001; Kim WR et al. N Engl J Med 2008.',
  });

  /* ============================== CIRÚRGICA ============================== */

  C.push({
    id: 'rcri',
    name: 'Índice de Lee (RCRI)',
    short: 'Risco cardíaco perioperatório em cirurgia não cardíaca.',
    tabs: ['cirurgia', 'clinica'],
    category: 'Avaliação pré-operatória',
    keywords: 'lee rcri risco cirúrgico pré-operatório cardíaco perioperatório',
    fields: [
      { id: 'surg', label: 'Cirurgia de alto risco (intraperitoneal, intratorácica, vascular suprainguinal)', type: 'check', points: 1 },
      { id: 'ihd', label: 'Doença arterial coronariana', type: 'check', points: 1 },
      { id: 'hf', label: 'Insuficiência cardíaca', type: 'check', points: 1 },
      { id: 'cvd', label: 'Doença cerebrovascular (AVC/AIT)', type: 'check', points: 1 },
      { id: 'ins', label: 'Diabetes em uso de insulina', type: 'check', points: 1 },
      { id: 'cr', label: 'Creatinina pré-operatória > 2 mg/dL', type: 'check', points: 1 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const risk = ['3,9%', '6,0%', '10,1%', '15,0%'][Math.min(s, 3)];
      return {
        main: s + ' ponto(s)', sub: 'Risco de eventos cardíacos maiores em 30 dias: ' + risk,
        level: s === 0 ? 'low' : s === 1 ? 'mod' : 'high',
        details: 'Taxas atualizadas (Duceppe, 2017): morte, IAM ou PCR em 30 dias. ' +
          'Considere capacidade funcional (≥ 4 METs), BNP/NT-proBNP e troponina pós-operatória nos pacientes de maior risco.',
      };
    },
    ref: 'Lee TH et al. Circulation 1999; Duceppe E et al. Can J Cardiol 2017.',
  });

  C.push({
    id: 'asa',
    name: 'Classificação ASA',
    short: 'Estado físico do paciente antes da anestesia.',
    tabs: ['cirurgia'],
    category: 'Avaliação pré-operatória',
    keywords: 'asa anestesia estado físico pré-operatório',
    fields: [
      { id: 'asa', label: 'Condição do paciente', type: 'select', options: [
        { v: '1', t: 'Saudável, sem doença sistêmica' },
        { v: '2', t: 'Doença sistêmica leve (HAS/DM controlados, tabagista, gestante, IMC 30–40)' },
        { v: '3', t: 'Doença sistêmica grave (DM/HAS mal controlados, DPOC, IMC ≥ 40, diálise…)' },
        { v: '4', t: 'Doença sistêmica grave com ameaça constante à vida (IAM/AVC < 3 meses, sepse…)' },
        { v: '5', t: 'Moribundo, sem expectativa de sobrevida sem a cirurgia' },
        { v: '6', t: 'Morte encefálica — doador de órgãos' },
      ] },
      { id: 'e', label: 'Cirurgia de emergência', type: 'select', options: yn },
    ],
    compute(v) {
      const r = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][+v.asa];
      const n = +v.asa;
      return {
        main: 'ASA ' + r + (v.e === '1' ? 'E' : ''),
        sub: n <= 2 ? 'Baixo risco anestésico' : n === 3 ? 'Risco moderado' : 'Risco elevado',
        level: n <= 2 ? 'low' : n === 3 ? 'mod' : 'high',
        details: 'A classificação ASA é descritiva e deve ser combinada a escores específicos (Lee, Caprini, STOP-BANG).',
      };
    },
    ref: 'American Society of Anesthesiologists — ASA Physical Status Classification (2020).',
  });

  C.push({
    id: 'caprini',
    name: 'Escore de Caprini',
    short: 'Risco de tromboembolismo venoso em pacientes cirúrgicos.',
    tabs: ['cirurgia', 'gineco'],
    category: 'Tromboembolismo',
    keywords: 'caprini profilaxia tev cirurgia trombose heparina',
    fields: [
      { id: 'age', label: 'Idade', type: 'select', scored: true, options: [
        { v: '0', t: '≤ 40 anos' }, { v: '1', t: '41–60 anos' }, { v: '2', t: '61–74 anos' }, { v: '3', t: '≥ 75 anos' }] },
      { id: 'surg', label: 'Tipo de cirurgia', type: 'select', scored: true, options: [
        { v: '0', t: 'Nenhuma / não se aplica' }, { v: '1', t: 'Cirurgia menor' },
        { v: '2', t: 'Cirurgia maior (> 45 min), laparoscópica > 45 min ou artroscópica' },
        { v: '5', t: 'Artroplastia eletiva de membro inferior' }] },
      { id: 'bmi', label: 'IMC > 25 kg/m²', type: 'check', points: 1 },
      { id: 'legs', label: 'Edema de membros inferiores', type: 'check', points: 1 },
      { id: 'vv', label: 'Varizes', type: 'check', points: 1 },
      { id: 'preg', label: 'Gestação ou pós-parto', type: 'check', points: 1 },
      { id: 'abort', label: 'Abortos recorrentes / natimorto inexplicado', type: 'check', points: 1 },
      { id: 'ocp', label: 'Anticoncepcional ou terapia hormonal', type: 'check', points: 1 },
      { id: 'sepsis', label: 'Sepse (< 1 mês)', type: 'check', points: 1 },
      { id: 'lung', label: 'Doença pulmonar grave / pneumonia (< 1 mês) ou espirometria alterada', type: 'check', points: 1 },
      { id: 'ami', label: 'IAM', type: 'check', points: 1 },
      { id: 'chf', label: 'Insuficiência cardíaca (< 1 mês)', type: 'check', points: 1 },
      { id: 'ibd', label: 'Doença inflamatória intestinal', type: 'check', points: 1 },
      { id: 'bedmed', label: 'Paciente clínico acamado', type: 'check', points: 1 },
      { id: 'ca', label: 'Neoplasia (atual ou prévia)', type: 'check', points: 2 },
      { id: 'bed72', label: 'Restrito ao leito > 72 h', type: 'check', points: 2 },
      { id: 'cast', label: 'Imobilização gessada', type: 'check', points: 2 },
      { id: 'cvc', label: 'Acesso venoso central', type: 'check', points: 2 },
      { id: 'vte', label: 'História de TEV', type: 'check', points: 3 },
      { id: 'fam', label: 'História familiar de TEV', type: 'check', points: 3 },
      { id: 'thr', label: 'Trombofilia (fator V Leiden, protrombina, anticoagulante lúpico, HIT…)', type: 'check', points: 3 },
      { id: 'stroke', label: 'AVC (< 1 mês)', type: 'check', points: 5 },
      { id: 'frac', label: 'Fratura de quadril, pelve ou perna', type: 'check', points: 5 },
      { id: 'sci', label: 'Lesão medular aguda (< 1 mês)', type: 'check', points: 5 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      let sub, level, det;
      if (s === 0) { sub = 'Risco muito baixo (< 0,5%)'; level = 'low'; det = 'Deambulação precoce.'; }
      else if (s <= 2) { sub = 'Baixo risco (~1,5%)'; level = 'low'; det = 'Profilaxia mecânica (compressão pneumática intermitente).'; }
      else if (s <= 4) { sub = 'Risco moderado (~3%)'; level = 'mod'; det = 'Profilaxia farmacológica (HBPM/HNF) ou mecânica se alto risco de sangramento.'; }
      else { sub = 'Alto risco (~6%)'; level = 'high'; det = 'Profilaxia farmacológica + mecânica; considerar profilaxia estendida em cirurgia oncológica.'; }
      return { main: s + ' ponto(s)', sub, level, details: det };
    },
    ref: 'Caprini JA. Dis Mon 2005; Gould MK et al. Chest 2012 (ACCP).',
  });

  C.push({
    id: 'stopbang',
    name: 'STOP-BANG',
    short: 'Rastreio de apneia obstrutiva do sono no pré-operatório.',
    tabs: ['cirurgia', 'clinica'],
    category: 'Avaliação pré-operatória',
    keywords: 'apneia sono stop bang ronco via aérea anestesia',
    fields: [
      { id: 's', label: 'Ronco alto', type: 'check', points: 1 },
      { id: 't', label: 'Cansaço / sonolência diurna', type: 'check', points: 1 },
      { id: 'o', label: 'Apneia observada durante o sono', type: 'check', points: 1 },
      { id: 'p', label: 'Hipertensão arterial', type: 'check', points: 1 },
      { id: 'b', label: 'IMC > 35 kg/m²', type: 'check', points: 1 },
      { id: 'a', label: 'Idade > 50 anos', type: 'check', points: 1 },
      { id: 'n', label: 'Circunferência cervical > 40 cm', type: 'check', points: 1 },
      { id: 'g', label: 'Sexo masculino', type: 'check', points: 1 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const [sub, level] = s <= 2 ? ['Baixo risco de AOS', 'low'] : s <= 4 ? ['Risco intermediário de AOS', 'mod'] : ['Alto risco de AOS', 'high'];
      return { main: s + ' / 8', sub, level, details: 'Risco alto: planejar via aérea, minimizar opioides/sedativos e considerar polissonografia.' };
    },
    ref: 'Chung F et al. Anesthesiology 2008.',
  });

  C.push({
    id: 'apfel',
    name: 'Escore de Apfel (NVPO)',
    short: 'Risco de náusea e vômito pós-operatórios.',
    tabs: ['cirurgia', 'gineco'],
    category: 'Avaliação pré-operatória',
    keywords: 'apfel náusea vômito pós-operatório nvpo anestesia',
    fields: [
      { id: 'f', label: 'Sexo feminino', type: 'check', points: 1 },
      { id: 'ns', label: 'Não tabagista', type: 'check', points: 1 },
      { id: 'h', label: 'História de NVPO ou cinetose', type: 'check', points: 1 },
      { id: 'o', label: 'Uso previsto de opioide no pós-operatório', type: 'check', points: 1 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const r = ['~10%', '~20%', '~40%', '~60%', '~80%'][s];
      return {
        main: s + ' ponto(s)', sub: 'Risco de NVPO: ' + r,
        level: s <= 1 ? 'low' : s === 2 ? 'mod' : 'high',
        details: 'Profilaxia multimodal proporcional ao número de fatores de risco (ex.: 1–2 antieméticos para risco moderado, ≥ 3 para alto).',
      };
    },
    ref: 'Apfel CC et al. Anesthesiology 1999.',
  });

  C.push({
    id: 'alvarado',
    name: 'Escore de Alvarado',
    short: 'Probabilidade de apendicite aguda.',
    tabs: ['cirurgia'],
    category: 'Abdome agudo',
    keywords: 'apendicite alvarado abdome agudo dor fossa ilíaca',
    fields: [
      { id: 'mig', label: 'Dor migratória para fossa ilíaca direita', type: 'check', points: 1 },
      { id: 'ano', label: 'Anorexia', type: 'check', points: 1 },
      { id: 'nv', label: 'Náuseas / vômitos', type: 'check', points: 1 },
      { id: 'ten', label: 'Dor à palpação em FID', type: 'check', points: 2 },
      { id: 'reb', label: 'Descompressão brusca dolorosa', type: 'check', points: 1 },
      { id: 'fev', label: 'Temperatura ≥ 37,3 °C', type: 'check', points: 1 },
      { id: 'leu', label: 'Leucocitose > 10.000/mm³', type: 'check', points: 2 },
      { id: 'shift', label: 'Desvio à esquerda (> 75% neutrófilos)', type: 'check', points: 1 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      let sub, level;
      if (s <= 4) { sub = 'Apendicite improvável'; level = 'low'; }
      else if (s <= 6) { sub = 'Apendicite possível — considerar imagem'; level = 'mod'; }
      else if (s <= 8) { sub = 'Apendicite provável'; level = 'high'; }
      else { sub = 'Apendicite muito provável'; level = 'high'; }
      return { main: s + ' / 10', sub, level, details: 'Em mulheres em idade fértil e crianças, complemente com USG/TC e β-hCG.' };
    },
    ref: 'Alvarado A. Ann Emerg Med 1986.',
  });

  C.push({
    id: 'glasgow',
    name: 'Escala de Coma de Glasgow',
    short: 'Nível de consciência no trauma e em doenças agudas.',
    tabs: ['cirurgia', 'clinica'],
    category: 'Trauma e emergência',
    keywords: 'glasgow coma consciência trauma tce neurológico',
    fields: [
      { id: 'o', label: 'Abertura ocular', type: 'select', scored: true, options: [
        { v: '4', t: '4 — Espontânea' }, { v: '3', t: '3 — Ao som' }, { v: '2', t: '2 — À pressão' }, { v: '1', t: '1 — Nenhuma' }] },
      { id: 'v', label: 'Resposta verbal', type: 'select', scored: true, options: [
        { v: '5', t: '5 — Orientada' }, { v: '4', t: '4 — Confusa' }, { v: '3', t: '3 — Palavras' }, { v: '2', t: '2 — Sons' }, { v: '1', t: '1 — Nenhuma' }] },
      { id: 'm', label: 'Resposta motora', type: 'select', scored: true, options: [
        { v: '6', t: '6 — Obedece comandos' }, { v: '5', t: '5 — Localiza' }, { v: '4', t: '4 — Flexão normal' },
        { v: '3', t: '3 — Flexão anormal' }, { v: '2', t: '2 — Extensão' }, { v: '1', t: '1 — Nenhuma' }] },
      { id: 'p', label: 'Reatividade pupilar (Glasgow-P)', type: 'select', options: [
        { v: '0', t: 'Ambas reativas' }, { v: '1', t: 'Uma pupila sem reação' }, { v: '2', t: 'Nenhuma reage' }] },
    ],
    compute(v) {
      const s = +v.o + +v.v + +v.m;
      const gp = s - +v.p;
      const [sub, level] = s >= 13 ? ['TCE leve', 'low'] : s >= 9 ? ['TCE moderado', 'mod'] : ['TCE grave — considerar via aérea definitiva', 'high'];
      return { main: 'GCS ' + s + ' (O' + v.o + 'V' + v.v + 'M' + v.m + ')', sub, level, details: 'Glasgow-P (com pupilas): ' + gp + '.' };
    },
    ref: 'Teasdale G, Jennett B. Lancet 1974; Brennan PM et al. 2018 (GCS-P).',
  });

  C.push({
    id: 'parkland',
    name: 'Fórmula de Parkland (queimados)',
    short: 'Reposição volêmica nas primeiras 24 h.',
    tabs: ['cirurgia'],
    category: 'Trauma e emergência',
    keywords: 'queimadura parkland reposição volêmica ringer superfície corporal',
    fields: [
      { id: 'w', label: 'Peso', type: 'number', unit: 'kg', min: 3, max: 300, step: 0.1 },
      { id: 'sc', label: 'Superfície corporal queimada (2º e 3º graus)', type: 'number', unit: '%', min: 1, max: 100 },
      { id: 'h', label: 'Horas desde a queimadura', type: 'number', unit: 'h', min: 0, max: 24, optional: true },
    ],
    compute(v) {
      const total = 4 * v.w * v.sc;
      const first = total / 2;
      const elapsed = v.h || 0;
      const rem8 = Math.max(0, 8 - elapsed);
      const rate1 = rem8 > 0 ? first / rem8 : 0;
      return {
        main: fmt(total / 1000, 2) + ' L em 24 h',
        sub: `${fmt(first, 0)} mL nas primeiras 8 h; ${fmt(first, 0)} mL nas 16 h seguintes`,
        level: 'info',
        details: (rem8 > 0 ? `Considerando ${elapsed} h decorridas: ~${fmt(rate1, 0)} mL/h até completar 8 h. ` : '') +
          'Ringer lactato. A fórmula é ponto de partida — titule pela diurese (0,5 mL/kg/h em adultos; 1 mL/kg/h em crianças < 30 kg) ' +
          'e evite hiper-ressuscitação (alguns protocolos atuais iniciam com 2 mL/kg/%SCQ).',
      };
    },
    ref: 'Baxter CR. 1968; ATLS 10ª ed.; ABA guidelines.',
  });

  C.push({
    id: 'shock_index',
    name: 'Índice de choque',
    short: 'FC ÷ PAS — sinal precoce de hipovolemia.',
    tabs: ['cirurgia', 'gineco'],
    category: 'Trauma e emergência',
    keywords: 'índice de choque hemorragia hipovolemia trauma hemorragia pós-parto',
    fields: [
      { id: 'hr', label: 'Frequência cardíaca', type: 'number', unit: 'bpm', min: 20, max: 250 },
      { id: 'sbp', label: 'Pressão sistólica', type: 'number', unit: 'mmHg', min: 30, max: 260 },
    ],
    compute(v) {
      const si = v.hr / v.sbp;
      let sub, level;
      if (si < 0.7) { sub = 'Normal'; level = 'low'; }
      else if (si < 0.9) { sub = 'Limítrofe'; level = 'mod'; }
      else { sub = 'Elevado — sugere instabilidade hemodinâmica'; level = 'high'; }
      return {
        main: fmt(si, 2), sub, level,
        details: 'Na hemorragia pós-parto, IC ≥ 0,9 sugere perda importante e ≥ 1,4 indica necessidade de transfusão e intervenção urgente (OPAS).',
      };
    },
    ref: 'Allgöwer M, Burri C. 1967; OPAS — Recomendações para hemorragia pós-parto.',
  });

  /* ======================= GINECOLOGIA E OBSTETRÍCIA ======================= */

  C.push({
    id: 'ig_dum',
    name: 'Idade gestacional e DPP pela DUM',
    short: 'Regra de Naegele a partir da data da última menstruação.',
    tabs: ['gineco'],
    category: 'Pré-natal',
    keywords: 'idade gestacional dum dpp data provável do parto naegele gravidez semanas',
    fields: [
      { id: 'dum', label: 'Data da última menstruação (DUM)', type: 'date' },
      { id: 'ref', label: 'Data de referência (padrão: hoje)', type: 'date', optional: true },
    ],
    compute(v) {
      const dum = parseDate(v.dum);
      const ref = parseDate(v.ref) || todayUTC();
      const days = Math.round((ref - dum) / 86400000);
      const dpp = addDays(dum, 280);
      if (days < 0) return { main: '—', sub: 'A DUM é posterior à data de referência', level: 'info' };
      const tri = days < 14 * 7 ? '1º trimestre' : days < 28 * 7 ? '2º trimestre' : '3º trimestre';
      let extra = '';
      if (days > 42 * 7) extra = 'IG > 42 semanas — verifique as datas. ';
      return {
        main: weeksDays(days), sub: 'DPP: ' + fmtDate(dpp) + ' • ' + tri, level: 'info',
        details: extra + 'Termo: 37s0d – 41s6d (' + fmtDate(addDays(dum, 259)) + ' a ' + fmtDate(addDays(dum, 293)) + '). ' +
          'A datação pela USG de 1º trimestre (CCN) é a mais precisa e prevalece se divergir > 7 dias da DUM.',
      };
    },
    ref: 'ACOG Committee Opinion 700 — Methods for Estimating the Due Date.',
  });

  C.push({
    id: 'ig_usg',
    name: 'Idade gestacional pela ultrassonografia',
    short: 'IG atual e DPP a partir de um exame de USG.',
    tabs: ['gineco'],
    category: 'Pré-natal',
    keywords: 'idade gestacional ultrassom usg dpp datação',
    fields: [
      { id: 'date', label: 'Data do exame', type: 'date' },
      { id: 'w', label: 'IG no exame — semanas', type: 'number', unit: 'sem', min: 4, max: 42 },
      { id: 'd', label: 'IG no exame — dias', type: 'number', unit: 'dias', min: 0, max: 6 },
      { id: 'ref', label: 'Data de referência (padrão: hoje)', type: 'date', optional: true },
    ],
    compute(v) {
      const ex = parseDate(v.date);
      const ref = parseDate(v.ref) || todayUTC();
      const ga0 = v.w * 7 + v.d;
      const dum = addDays(ex, -ga0);
      const days = Math.round((ref - dum) / 86400000);
      const dpp = addDays(dum, 280);
      return {
        main: weeksDays(days), sub: 'DPP: ' + fmtDate(dpp), level: 'info',
        details: 'DUM corrigida (estimada): ' + fmtDate(dum) + '. Quanto mais precoce a USG, mais precisa a datação (CCN entre 7 e 13s6d).',
      };
    },
    ref: 'ACOG Committee Opinion 700.',
  });

  C.push({
    id: 'ganho_peso',
    name: 'Ganho de peso gestacional',
    short: 'Meta de ganho de peso conforme o IMC pré-gestacional.',
    tabs: ['gineco'],
    category: 'Pré-natal',
    keywords: 'ganho de peso gestação gravidez imc pré-gestacional nutrição',
    fields: [
      { id: 'w0', label: 'Peso pré-gestacional', type: 'number', unit: 'kg', min: 30, max: 250, step: 0.1 },
      { id: 'h', label: 'Altura', type: 'number', unit: 'cm', min: 120, max: 210 },
      { id: 'w1', label: 'Peso atual (opcional)', type: 'number', unit: 'kg', min: 30, max: 300, step: 0.1, optional: true },
    ],
    compute(v) {
      const bmi = v.w0 / Math.pow(v.h / 100, 2);
      let range, cat;
      if (bmi < 18.5) { range = [12.5, 18]; cat = 'Baixo peso'; }
      else if (bmi < 25) { range = [11.5, 16]; cat = 'Eutrofia'; }
      else if (bmi < 30) { range = [7, 11.5]; cat = 'Sobrepeso'; }
      else { range = [5, 9]; cat = 'Obesidade'; }
      let det = '';
      if (v.w1) det = `Ganho até agora: ${fmt(v.w1 - v.w0)} kg. `;
      det += 'Gestação única. No 2º e 3º trimestres, o ganho semanal esperado é de ~0,2–0,5 kg conforme a categoria.';
      return {
        main: `${fmt(range[0])} – ${fmt(range[1])} kg`, sub: `IMC pré-gestacional ${fmt(bmi)} kg/m² (${cat})`,
        level: 'info', details: det,
      };
    },
    ref: 'Institute of Medicine (IOM) 2009 — Weight Gain During Pregnancy.',
  });

  C.push({
    id: 'pe_risco',
    name: 'Risco de pré-eclâmpsia (indicação de AAS)',
    short: 'Fatores clínicos para profilaxia com ácido acetilsalicílico.',
    tabs: ['gineco'],
    category: 'Pré-natal',
    hidePoints: true,
    keywords: 'pré-eclâmpsia aas aspirina hipertensão gestacional profilaxia cálcio',
    fields: [
      { id: 'h1', label: 'ALTO: pré-eclâmpsia em gestação anterior', type: 'check', points: 10 },
      { id: 'h2', label: 'ALTO: gestação múltipla', type: 'check', points: 10 },
      { id: 'h3', label: 'ALTO: hipertensão crônica', type: 'check', points: 10 },
      { id: 'h4', label: 'ALTO: diabetes tipo 1 ou 2 pré-gestacional', type: 'check', points: 10 },
      { id: 'h5', label: 'ALTO: doença renal crônica', type: 'check', points: 10 },
      { id: 'h6', label: 'ALTO: doença autoimune (LES, síndrome antifosfolípide)', type: 'check', points: 10 },
      { id: 'm1', label: 'Moderado: nuliparidade', type: 'check', points: 1 },
      { id: 'm2', label: 'Moderado: obesidade (IMC > 30)', type: 'check', points: 1 },
      { id: 'm3', label: 'Moderado: mãe ou irmã com pré-eclâmpsia', type: 'check', points: 1 },
      { id: 'm4', label: 'Moderado: idade ≥ 35 anos', type: 'check', points: 1 },
      { id: 'm5', label: 'Moderado: intervalo interpartal > 10 anos', type: 'check', points: 1 },
      { id: 'm6', label: 'Moderado: gestação por reprodução assistida', type: 'check', points: 1 },
      { id: 'm7', label: 'Moderado: desfecho adverso prévio (RN PIG, baixo peso)', type: 'check', points: 1 },
      { id: 'm8', label: 'Moderado: vulnerabilidade socioeconômica / mulher negra', type: 'check', points: 1 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const hi = Math.floor(s / 10), mod = s % 10;
      const ind = hi >= 1 || mod >= 2;
      return {
        main: `${hi} alto / ${mod} moderado(s)`,
        sub: ind ? 'AAS em baixa dose recomendado' : mod === 1 ? 'Avaliar caso a caso' : 'Sem indicação de AAS por fatores clínicos',
        level: ind ? 'high' : mod === 1 ? 'mod' : 'low',
        details: 'Indicação: ≥ 1 fator alto ou ≥ 2 moderados. AAS 100–150 mg/noite, iniciar idealmente entre 12 e 16 semanas (até 28) e manter até 36 semanas. ' +
          'Suplementar cálcio (1–2 g/dia) se baixa ingesta. Rastreamento combinado (fatores maternos + Doppler de uterinas + PlGF) no 1º trimestre melhora a predição.',
      };
    },
    ref: 'USPSTF 2021; ACOG 2018/2021; FEBRASGO — Protocolo de pré-eclâmpsia.',
  });

  C.push({
    id: 'dmg',
    name: 'Diagnóstico de diabetes gestacional',
    short: 'Interpreta glicemia de jejum e TOTG 75 g.',
    tabs: ['gineco'],
    category: 'Pré-natal',
    keywords: 'diabetes gestacional dmg totg glicemia curva glicêmica',
    fields: [
      { id: 'g0', label: 'Glicemia de jejum', type: 'number', unit: 'mg/dL', min: 40, max: 400 },
      { id: 'g1', label: 'TOTG 75 g — 1 hora (opcional)', type: 'number', unit: 'mg/dL', min: 40, max: 500, optional: true },
      { id: 'g2', label: 'TOTG 75 g — 2 horas (opcional)', type: 'number', unit: 'mg/dL', min: 40, max: 500, optional: true },
    ],
    compute(v) {
      if (v.g0 >= 126 || (v.g2 && v.g2 >= 200)) {
        return {
          main: 'Diabetes franco', sub: 'Critério de diabetes diagnosticado na gestação', level: 'high',
          details: 'Jejum ≥ 126 mg/dL ou 2 h ≥ 200 mg/dL. Encaminhar para pré-natal de alto risco.',
        };
      }
      const alt = [];
      if (v.g0 >= 92) alt.push('jejum ≥ 92');
      if (v.g1 && v.g1 >= 180) alt.push('1 h ≥ 180');
      if (v.g2 && v.g2 >= 153) alt.push('2 h ≥ 153');
      if (alt.length) {
        return { main: 'Diabetes gestacional', sub: 'Valor(es) alterado(s): ' + alt.join(', '), level: 'high',
          details: 'Um único valor alterado já confirma DMG. Iniciar orientação nutricional, atividade física e automonitorização.' };
      }
      return {
        main: 'Sem critério de DMG', sub: (v.g1 || v.g2) ? 'TOTG normal' : 'Jejum normal (< 92 mg/dL)', level: 'low',
        details: (v.g1 || v.g2) ? 'Manter seguimento pré-natal habitual.' : 'Realizar TOTG 75 g entre 24 e 28 semanas.',
      };
    },
    ref: 'IADPSG 2010; OPAS/MS/FEBRASGO/SBD 2017 — Rastreamento e diagnóstico de DMG no Brasil.',
  });

  C.push({
    id: 'bishop',
    name: 'Índice de Bishop',
    short: 'Favorabilidade do colo para indução do parto.',
    tabs: ['gineco'],
    category: 'Parto',
    keywords: 'bishop colo indução parto maturação cervical',
    fields: [
      { id: 'dil', label: 'Dilatação', type: 'select', scored: true, options: [
        { v: '0', t: 'Fechado' }, { v: '1', t: '1–2 cm' }, { v: '2', t: '3–4 cm' }, { v: '3', t: '≥ 5 cm' }] },
      { id: 'eff', label: 'Esvaecimento', type: 'select', scored: true, options: [
        { v: '0', t: '0–30%' }, { v: '1', t: '40–50%' }, { v: '2', t: '60–70%' }, { v: '3', t: '≥ 80%' }] },
      { id: 'sta', label: 'Altura da apresentação (De Lee)', type: 'select', scored: true, options: [
        { v: '0', t: '−3' }, { v: '1', t: '−2' }, { v: '2', t: '−1 / 0' }, { v: '3', t: '+1 / +2' }] },
      { id: 'con', label: 'Consistência', type: 'select', scored: true, options: [
        { v: '0', t: 'Firme' }, { v: '1', t: 'Média' }, { v: '2', t: 'Amolecida' }] },
      { id: 'pos', label: 'Posição', type: 'select', scored: true, options: [
        { v: '0', t: 'Posterior' }, { v: '1', t: 'Intermediária' }, { v: '2', t: 'Anterior' }] },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const [sub, level] = s >= 8 ? ['Colo favorável — indução com ocitocina tende ao sucesso', 'low'] :
        s >= 7 ? ['Colo intermediário', 'mod'] : ['Colo desfavorável — considerar preparo cervical', 'high'];
      return { main: s + ' / 13', sub, level, details: 'Preparo cervical: misoprostol, dinoprostona ou sonda de Foley, conforme protocolo institucional.' };
    },
    ref: 'Bishop EH. Obstet Gynecol 1964.',
  });

  C.push({
    id: 'apgar',
    name: 'Escore de Apgar',
    short: 'Avaliação do recém-nascido no 1º e 5º minutos.',
    tabs: ['gineco'],
    category: 'Parto',
    keywords: 'apgar recém-nascido rn neonatal vitalidade',
    fields: [
      { id: 'a', label: 'Cor', type: 'select', scored: true, options: [
        { v: '0', t: 'Cianose/palidez generalizada' }, { v: '1', t: 'Extremidades cianóticas' }, { v: '2', t: 'Rosada' }] },
      { id: 'p', label: 'Frequência cardíaca', type: 'select', scored: true, options: [
        { v: '0', t: 'Ausente' }, { v: '1', t: '< 100 bpm' }, { v: '2', t: '≥ 100 bpm' }] },
      { id: 'g', label: 'Irritabilidade reflexa', type: 'select', scored: true, options: [
        { v: '0', t: 'Sem resposta' }, { v: '1', t: 'Careta' }, { v: '2', t: 'Choro / espirro / tosse' }] },
      { id: 'ac', label: 'Tônus muscular', type: 'select', scored: true, options: [
        { v: '0', t: 'Flácido' }, { v: '1', t: 'Alguma flexão' }, { v: '2', t: 'Movimentos ativos' }] },
      { id: 'r', label: 'Respiração', type: 'select', scored: true, options: [
        { v: '0', t: 'Ausente' }, { v: '1', t: 'Irregular / fraca' }, { v: '2', t: 'Choro forte' }] },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const [sub, level] = s >= 7 ? ['Normal', 'low'] : s >= 4 ? ['Moderadamente anormal', 'mod'] : ['Baixo', 'high'];
      return {
        main: s + ' / 10', sub, level,
        details: 'O Apgar não deve ser usado para decidir o início da reanimação — esta segue o fluxograma do PRN-SBP (respiração, tônus e FC).',
      };
    },
    ref: 'Apgar V. 1953; AAP/ACOG 2015; Programa de Reanimação Neonatal SBP.',
  });

  C.push({
    id: 'hadlock',
    name: 'Peso fetal estimado (Hadlock)',
    short: 'Estimativa do peso fetal por biometria ultrassonográfica.',
    tabs: ['gineco'],
    category: 'Pré-natal',
    keywords: 'peso fetal hadlock biometria ultrassom crescimento fetal',
    fields: [
      { id: 'hc', label: 'Circunferência cefálica (CC)', type: 'number', unit: 'cm', min: 5, max: 45, step: 0.1 },
      { id: 'ac', label: 'Circunferência abdominal (CA)', type: 'number', unit: 'cm', min: 5, max: 45, step: 0.1 },
      { id: 'fl', label: 'Comprimento do fêmur (CF)', type: 'number', unit: 'cm', min: 1, max: 9, step: 0.01 },
    ],
    compute(v) {
      const lg = 1.326 - 0.00326 * v.ac * v.fl + 0.0107 * v.hc + 0.0438 * v.ac + 0.158 * v.fl;
      const w = Math.pow(10, lg);
      return {
        main: fmt(w, 0) + ' g', sub: 'Hadlock (CC, CA, CF)', level: 'info',
        details: 'Erro esperado de ±10–15%. Interprete o percentil conforme a IG e a curva adotada (ex.: Hadlock, Intergrowth-21st, OMS).',
      };
    },
    ref: 'Hadlock FP et al. Am J Obstet Gynecol 1985.',
  });

  C.push({
    id: 'fertil',
    name: 'Período fértil',
    short: 'Estimativa da janela fértil e da próxima menstruação.',
    tabs: ['gineco'],
    category: 'Ginecologia',
    keywords: 'período fértil ovulação ciclo menstrual planejamento',
    fields: [
      { id: 'dum', label: 'Primeiro dia da última menstruação', type: 'date' },
      { id: 'cyc', label: 'Duração média do ciclo', type: 'number', unit: 'dias', min: 21, max: 45 },
    ],
    compute(v) {
      const d = parseDate(v.dum);
      const ov = addDays(d, v.cyc - 14);
      return {
        main: fmtDate(addDays(ov, -5)) + ' a ' + fmtDate(addDays(ov, 1)),
        sub: 'Ovulação provável: ' + fmtDate(ov) + ' • Próxima menstruação: ' + fmtDate(addDays(d, v.cyc)),
        level: 'info',
        details: 'Estimativa baseada em fase lútea de 14 dias; ciclos irregulares reduzem muito a precisão. Não é método contraceptivo confiável.',
      };
    },
    ref: 'Wilcox AJ et al. N Engl J Med 1995.',
  });

  window.CALCS = C;
  window.CALC_UTILS = { sumPoints, fmt };
})();
