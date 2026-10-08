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


  /* PREVENT (AHA 2023) — modelo base, 10 anos. Coeficientes: Khan SS et al. Circulation 2024;149:430-449,
     extraídos do pacote R preventr (CRAN, MIT) — base_10yr. */
  const PREVENT_KEYS = ["age", "nonhdl", "hdl", "sbp_lt110", "sbp_ge110", "dm", "smoking", "bmi_lt30", "bmi_ge30", "egfr_lt60", "egfr_ge60", "bptx", "statin", "bptx_sbp", "statin_nonhdl", "age_nonhdl", "age_hdl", "age_sbp", "age_dm", "age_smoking", "age_bmi", "age_egfr", "const"];
  const PREVENT_B = {"female": {"cvd": [0.793933, 0.030524, -0.160686, -0.2394, 0.360078, 0.86676, 0.536074, 0.0, 0.0, 0.604592, 0.043377, 0.315167, -0.147765, -0.066361, 0.119788, -0.081972, 0.030677, -0.094635, -0.27057, -0.078715, 0.0, -0.163781, -3.307728], "ascvd": [0.719883, 0.117697, -0.151185, -0.083536, 0.359285, 0.834858, 0.483108, 0.0, 0.0, 0.486462, 0.039778, 0.226531, -0.059237, -0.039576, 0.084442, -0.056784, 0.032569, -0.103598, -0.241754, -0.079114, 0.0, -0.167149, -3.819975], "hf": [0.899823, 0.0, 0.0, -0.455977, 0.35765, 1.038346, 0.583916, -0.007229, 0.299771, 0.745164, 0.055709, 0.353444, 0.0, -0.098151, 0.0, 0.0, 0.0, -0.094666, -0.358104, -0.115945, -0.003878, -0.188429, -4.310409]}, "male": {"cvd": [0.768853, 0.073617, -0.095443, -0.434735, 0.336266, 0.769286, 0.438687, 0.0, 0.0, 0.537898, 0.016483, 0.288879, -0.133735, -0.047592, 0.150273, -0.051787, 0.019117, -0.104948, -0.225195, -0.089507, 0.0, -0.15437, -3.031168], "ascvd": [0.709985, 0.165866, -0.114429, -0.283721, 0.323998, 0.71896, 0.395697, 0.0, 0.0, 0.369007, 0.020362, 0.203652, -0.086558, -0.032292, 0.114563, -0.03, 0.023275, -0.092702, -0.201852, -0.097053, 0.0, -0.121708, -3.500655], "hf": [0.897264, 0.0, 0.0, -0.681147, 0.363446, 0.923776, 0.502374, -0.048584, 0.372693, 0.692692, 0.025183, 0.298092, 0.0, -0.049773, 0.0, 0.0, 0.0, -0.12892, -0.304092, -0.140169, 0.006813, -0.179778, -3.946391]}};
  function preventRisk(v) {
    const age = (v.age - 55) / 10;
    const nonhdl = (v.tc - v.hdl) * 0.02586 - 3.5;
    const hdl = (v.hdl * 0.02586 - 1.3) / 0.3;
    const sbpLt = (Math.min(v.sbp, 110) - 110) / 20;
    const sbpGe = (Math.max(v.sbp, 110) - 130) / 20;
    const bmi = v.w / Math.pow(v.h / 100, 2);
    const bmiLt = (Math.min(bmi, 30) - 25) / 5;
    const bmiGe = (Math.max(bmi, 30) - 30) / 5;
    const egfrLt = (Math.min(v.egfr, 60) - 60) / -15;
    const egfrGe = (Math.max(v.egfr, 60) - 90) / -15;
    const dm = +v.dm, sm = +v.smoker, bp = +v.treated, st = +v.statin;
    const x = {
      age, nonhdl, hdl, sbp_lt110: sbpLt, sbp_ge110: sbpGe, dm, smoking: sm, bmi_lt30: bmiLt, bmi_ge30: bmiGe,
      egfr_lt60: egfrLt, egfr_ge60: egfrGe, bptx: bp, statin: st, bptx_sbp: bp * sbpGe, statin_nonhdl: st * nonhdl,
      age_nonhdl: age * nonhdl, age_hdl: age * hdl, age_sbp: age * sbpGe, age_dm: age * dm, age_smoking: age * sm,
      age_bmi: age * bmiGe, age_egfr: age * egfrLt, const: 1,
    };
    const b = PREVENT_B[v.sex === 'f' ? 'female' : 'male'];
    const risk = (m) => { const lo = PREVENT_KEYS.reduce((acc, k, i) => acc + b[m][i] * x[k], 0); return Math.exp(lo) / (1 + Math.exp(lo)); };
    return { cvd: risk('cvd'), ascvd: risk('ascvd'), hf: risk('hf'), bmi };
  }

  C.push({
    id: 'prevent',
    name: 'PREVENT — risco cardiovascular em 10 anos',
    short: 'Escore recomendado pela SBC (Diretriz de Dislipidemias 2025) para prevenção primária, 30–79 anos.',
    tabs: ['clinica', 'geriatria'],
    category: 'Cardiovascular',
    keywords: 'prevent risco cardiovascular aha sbc 2025 dislipidemia prevenção primária infarto avc insuficiência cardíaca estatina',
    fields: [
      { id: 'sex', label: 'Sexo', type: 'select', options: sexOpts },
      { id: 'age', label: 'Idade', type: 'number', unit: 'anos', min: 30, max: 79 },
      { id: 'tc', label: 'Colesterol total', type: 'number', unit: 'mg/dL', min: 130, max: 320 },
      { id: 'hdl', label: 'HDL-colesterol', type: 'number', unit: 'mg/dL', min: 20, max: 100 },
      { id: 'sbp', label: 'Pressão sistólica', type: 'number', unit: 'mmHg', min: 90, max: 180 },
      { id: 'egfr', label: 'TFG estimada (CKD-EPI 2021)', type: 'number', unit: 'mL/min/1,73m²', min: 15, max: 140 },
      { id: 'w', label: 'Peso', type: 'number', unit: 'kg', min: 30, max: 250, step: 0.1 },
      { id: 'h', label: 'Altura', type: 'number', unit: 'cm', min: 120, max: 220 },
      { id: 'treated', label: 'Em uso de anti-hipertensivo', type: 'select', options: yn },
      { id: 'statin', label: 'Em uso de estatina', type: 'select', options: yn },
      { id: 'dm', label: 'Diabetes', type: 'select', options: yn },
      { id: 'smoker', label: 'Tabagista atual', type: 'select', options: yn },
    ],
    compute(v) {
      const r = preventRisk(v);
      const a = r.ascvd;
      let level, sub;
      if (a < 0.05) { level = 'low'; sub = 'Baixo risco'; }
      else if (a < 0.2) { level = 'mod'; sub = 'Risco intermediário'; }
      else { level = 'high'; sub = 'Alto risco'; }
      const bmiNote = r.bmi < 18.5 || r.bmi >= 40 ? ` O IMC calculado (${fmt(r.bmi)} kg/m²) está fora da faixa usada no desenvolvimento do modelo (18,5–39,9).` : '';
      return {
        main: pct(a) + ' (DCVA)',
        sub: sub + ' — doença cardiovascular aterosclerótica em 10 anos',
        level,
        details: `DCV total (inclui insuficiência cardíaca): ${pct(r.cvd)}. Insuficiência cardíaca: ${pct(r.hf)}. ` +
          'Categorias pelo risco de DCVA (SBC 2025): baixo < 5%, intermediário 5% a < 20%, alto ≥ 20%; fatores agravantes ' +
          '(história familiar precoce, Lp(a) elevada, escore de cálcio, entre outros) podem elevar a categoria. Modelo base, ' +
          'sem HbA1c, albuminúria ou índice social. Equações derivadas de coortes dos EUA; o Brasil ainda não tem escore próprio.' + bmiNote,
        warn: 'Não use em quem já tem doença aterosclerótica. Diabetes com estratificadores de risco, DRC, LDL ≥ 190 mg/dL ' +
          'e aterosclerose subclínica significativa já definem alto ou muito alto risco, independentemente do resultado.',
      };
    },
    ref: 'Khan SS et al. Circulation 2024;149:430-449 (PREVENT); Diretriz Brasileira de Dislipidemias e Prevenção da Aterosclerose — 2025 (SBC).',
  });

  C.push({
    id: 'framingham',
    name: 'Escore de Risco Global (Framingham) — versão anterior',
    short: 'Risco cardiovascular em 10 anos (SBC 2017). Substituído pelo PREVENT na diretriz SBC 2025.',
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
          'Para decisões atuais, use o PREVENT (diretriz SBC 2025). Cortes da diretriz anterior (2017): baixo < 5%; intermediário 5–' + (v.sex === 'f' ? '10' : '20') +
          '%; alto > ' + (v.sex === 'f' ? '10' : '20') + '%. ' +
          'História familiar precoce, síndrome metabólica e marcadores (PCR-us, escore de cálcio) podem ' +
          'reclassificar o risco intermediário.',
        warn: 'O escore não se aplica a quem já é de alto ou muito alto risco: doença aterosclerótica estabelecida, ' +
          'aterosclerose subclínica significativa, DRC, LDL ≥ 190 mg/dL ou diabetes com estratificadores de risco. ' +
          'Nesses casos, trate como alto/muito alto risco independentemente do resultado.',
      };
    },
    ref: "D'Agostino RB et al. Circulation 2008; Faludi AA et al. Atualização da Diretriz Brasileira de Dislipidemias e Prevenção da Aterosclerose — 2017. Arq Bras Cardiol 2017.",
  });

  C.push({
    id: 'ascvd',
    name: 'ASCVD 10 anos (Pooled Cohort Equations)',
    short: 'Risco de doença aterosclerótica (ACC/AHA 2013). Substituída pelo PREVENT (AHA 2023; SBC 2025).',
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
          'A AHA substituiu as PCE pelo PREVENT (2023), e a SBC adotou o PREVENT na diretriz de dislipidemias de 2025.',
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
    tabs: ['clinica', 'geriatria'],
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
        grade: c >= 3 ? c - 2 : undefined,
        scale: { step: c, labels: ['Normal', 'Pré-HAS', 'Est. 1', 'Est. 2', 'Est. 3'], names: [1, 2, 3, 4, 5].map((k) => labels[k][0]) },
        details:
          'O diagnóstico exige medidas repetidas com técnica adequada e, idealmente, confirmação fora do consultório ' +
          '(MRPA ou MAPA). Quando sistólica e diastólica caem em categorias diferentes, vale a maior. Na pré-hipertensão, ' +
          'a diretriz recomenda MRPA ou MAPA para investigar hipertensão mascarada. Meta de tratamento: < 130/80 mmHg para a maioria.',
        warn: c === 5 ? 'PA ≥ 180/110: pesquise sintomas e lesão aguda de órgão-alvo (dor torácica, déficit neurológico, ' +
          'dispneia, alteração visual). Se presentes, é emergência hipertensiva e requer avaliação imediata.' : undefined,
        edu: 'has-oque',
      };
    },
    ref: 'Brandão AA et al. Diretriz Brasileira de Hipertensão Arterial — 2025 (SBC/SBH/SBN). Arq Bras Cardiol 2025;122(9). doi:10.36660/abc.20250624.',
  });

  C.push({
    id: 'cha2ds2vasc',
    name: 'CHA₂DS₂-VA',
    short: 'Risco de AVC na fibrilação atrial — versão ESC 2024, sem o critério sexo (antigo CHA₂DS₂-VASc).',
    tabs: ['clinica', 'geriatria'],
    category: 'Cardiovascular',
    keywords: 'fibrilação atrial fa avc anticoagulação cha2ds2va cha2ds2vasc chads',
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
    ],
    compute(v) {
      const s = sumPoints(this, v);
      let level, sub;
      if (s === 0) { level = 'low'; sub = 'Baixo risco — anticoagulação geralmente não indicada'; }
      else if (s === 1) { level = 'mod'; sub = 'Considerar anticoagulação oral (decisão compartilhada)'; }
      else { level = 'high'; sub = 'Anticoagulação oral recomendada (se sem contraindicação)'; }
      return {
        main: s + ' ponto(s)', sub, level,
        warn: 'Não se aplica a FA com estenose mitral moderada/grave ou prótese valvar mecânica: ' +
          'nesses casos a anticoagulação (varfarina) está indicada independentemente do escore.',
        details: 'A ESC 2024 retirou o sexo do escore: os mesmos cortes valem para homens e mulheres (≥ 2 recomenda, 1 considera). ' +
          'Avalie também fatores de risco de sangramento modificáveis; risco alto de sangramento não contraindica a anticoagulação por si só.',
      };
    },
    ref: 'Van Gelder IC et al. 2024 ESC Guidelines for the management of atrial fibrillation. Eur Heart J 2024; Lip GY et al. Chest 2010 (CHA₂DS₂-VASc).',
  });

  C.push({
    id: 'hasbled',
    name: 'HAS-BLED',
    short: 'Risco de sangramento maior em anticoagulados.',
    tabs: ['clinica', 'geriatria'],
    category: 'Cardiovascular',
    keywords: 'sangramento anticoagulação hasbled varfarina fibrilação',
    groups: [
      { legend: 'Condições clínicas (1 ponto cada)', ids: ['h', 'ar', 'al', 's', 'b', 'e'], hidePts: true },
      { legend: 'Tratamento e hábitos (1 ponto cada)', ids: ['l', 'd', 'a'], hidePts: true },
    ],
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
    name: 'LDL-colesterol (Sampson e Friedewald)',
    short: 'Estima o LDL a partir do perfil lipídico; Sampson é mais preciso com TG altos ou LDL baixo.',
    tabs: ['clinica'],
    category: 'Metabólico',
    keywords: 'ldl colesterol sampson friedewald martin dislipidemia lipidograma',
    fields: [
      { id: 'tc', label: 'Colesterol total', type: 'number', unit: 'mg/dL', min: 50, max: 600 },
      { id: 'hdl', label: 'HDL-colesterol', type: 'number', unit: 'mg/dL', min: 5, max: 200 },
      { id: 'tg', label: 'Triglicerídeos', type: 'number', unit: 'mg/dL', min: 10, max: 2000 },
    ],
    compute(v) {
      const nonhdl = v.tc - v.hdl;
      if (v.tg > 800) {
        return {
          main: 'Não-HDL: ' + fmt(nonhdl, 0) + ' mg/dL',
          sub: 'LDL calculado não se aplica com TG > 800 mg/dL',
          level: 'info',
          details: 'Use LDL medido diretamente. O colesterol não-HDL continua válido para estratificação e metas.',
        };
      }
      const ldl = v.tc / 0.948 - v.hdl / 0.971 - (v.tg / 8.56 + (v.tg * nonhdl) / 2140 - (v.tg * v.tg) / 16100) - 9.44;
      const fried = v.tg < 400 ? `Friedewald: ${fmt(v.tc - v.hdl - v.tg / 5, 0)} mg/dL. ` : 'Friedewald não se aplica (TG ≥ 400 mg/dL). ';
      return {
        main: fmt(ldl, 0) + ' mg/dL (Sampson)',
        sub: 'Não-HDL: ' + fmt(nonhdl, 0) + ' mg/dL',
        level: ldl >= 190 ? 'high' : ldl >= 130 ? 'mod' : 'low',
        details: fried + 'A diretriz SBC 2025 considera Martin/Hopkins e Sampson mais precisos que Friedewald, sobretudo com LDL baixo ' +
          'ou TG elevados; Sampson é válido até TG 800 mg/dL. As metas de LDL dependem da categoria de risco. ' +
          'LDL ≥ 190 mg/dL sugere hipercolesterolemia grave (investigar causa familiar).',
        edu: 'dlp-oque',
      };
    },
    ref: 'Sampson M et al. JAMA Cardiol 2020;5(5):540-548; Friedewald WT et al. Clin Chem 1972; Diretriz Brasileira de Dislipidemias — 2025 (SBC).',
  });

  C.push({
    id: 'imc',
    name: 'IMC e circunferência abdominal',
    short: 'Índice de massa corporal e risco metabólico.',
    tabs: ['clinica', 'gineco', 'geriatria'],
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
      const idx = bmi < 18.5 ? 1 : bmi < 25 ? 2 : bmi < 30 ? 3 : bmi < 35 ? 4 : bmi < 40 ? 5 : 6;
      let details = '';
      if (v.waist) {
        const [a, b] = v.sex === 'f' ? [80, 88] : [94, 102];
        const w = v.waist >= b ? 'muito aumentado' : v.waist >= a ? 'aumentado' : 'sem aumento';
        details = `Circunferência abdominal ${v.waist} cm: risco metabólico ${w} (cortes OMS: ≥ ${a} aumentado, ≥ ${b} muito aumentado). `;
      }
      details += 'Em idosos, atletas e gestantes, o IMC tem interpretação própria.';
      return {
        main: fmt(bmi) + ' kg/m²', sub, level, details,
        grade: idx >= 4 ? idx - 3 : undefined,
        scale: { step: idx, fill: false, labels: ['Baixo', 'Normal', 'Sobre\u00adpeso', 'Ob. I', 'Ob. II', 'Ob. III'],
          names: ['Baixo peso', 'Eutrofia', 'Sobrepeso', 'Obesidade grau I', 'Obesidade grau II', 'Obesidade grau III'] },
      };
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
        edu: 'dm-oque',
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
    ref: 'Matthews DR et al. Diabetologia 1985; Geloneze B et al. Diabetes Res Clin Pract 2006; Geloneze B et al. Arq Bras Endocrinol Metab 2009 (BRAMS: HOMA-IR > 2,7).',
  });

  C.push({
    id: 'ckdepi',
    name: 'TFG — CKD-EPI 2021',
    short: 'Taxa de filtração glomerular estimada (sem coeficiente racial).',
    tabs: ['clinica', 'cirurgia', 'geriatria'],
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
      const step = g >= 90 ? 1 : g >= 60 ? 2 : g >= 45 ? 3 : g >= 30 ? 4 : g >= 15 ? 5 : 6;
      return {
        main: fmt(g, 0) + ' mL/min/1,73m²', sub: 'KDIGO ' + st, level,
        grade: step === 5 ? 2 : step === 6 ? 3 : undefined,
        scale: { step, labels: ['G1', 'G2', 'G3a', 'G3b', 'G4', 'G5'] },
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
    tabs: ['clinica', 'cirurgia', 'geriatria'],
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
    short: 'Triagem por peso e idade para decidir quem fazer densitometria.',
    tabs: ['clinica', 'gineco', 'geriatria'],
    category: 'Osso e fraturas',
    keywords: 'osteoporose fratura densitometria ost osta menopausa osso',
    fields: [
      { id: 'age', label: 'Idade', type: 'number', unit: 'anos', min: 40, max: 110 },
      { id: 'w', label: 'Peso', type: 'number', unit: 'kg', min: 25, max: 250, step: 0.1 },
      { id: 'pop', label: 'População de referência', type: 'select', options: [
        { v: 'nonasian', t: 'Não asiática (Brasil, Américas, Europa)' }, { v: 'asian', t: 'Asiática' }] },
    ],
    compute(v) {
      const s = Math.trunc((v.w - v.age) * 0.2);
      let sub, level;
      if (v.pop === 'asian') {
        if (s < -4) { sub = 'Alto risco (OSTA < −4) — densitometria indicada'; level = 'high'; }
        else if (s <= -1) { sub = 'Risco moderado (OSTA −1 a −4) — densitometria indicada'; level = 'mod'; }
        else { sub = 'Baixo risco (OSTA > −1)'; level = 'low'; }
      } else if (s < 2) { sub = 'Densitometria indicada (OST < 2)'; level = 'mod'; }
      else { sub = 'Densitometria não indicada pelo OST (≥ 2)'; level = 'low'; }
      return {
        main: 'Escore ' + s, sub, level,
        details: 'O OST é triagem para densitometria, não diagnóstico nem estimativa de risco de fratura. Os cortes −1/−4 (Koh, 2001) ' +
          'foram feitos para mulheres asiáticas; em populações não asiáticas o corte validado é < 2 (Geusens, 2002; também testado ' +
          'na Argentina). Não localizamos validação brasileira. A indicação de densitometria também depende da idade e de outros ' +
          'fatores de risco; para probabilidade de fratura, use o FRAX Brasil.',
      };
    },
    ref: 'Koh LK et al. Osteoporos Int 2001 (OSTA); Geusens P et al. Mayo Clin Proc 2002 (OST em caucasianas).',
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
    name: 'Checklist dos fatores do FRAX',
    short: 'Reúne os dados pedidos pelo FRAX. Não calcula o risco de fratura.',
    tabs: ['clinica', 'gineco', 'geriatria'],
    category: 'Osso e fraturas',
    keywords: 'frax fratura osteoporose quadril risco fratura corticoide checklist',
    fields: [
      { id: 'sex', label: 'Sexo', type: 'select', options: sexOpts },
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
    checkLegend: 'Fatores clínicos usados pelo FRAX',
    compute(v) {
      const n = sumPoints(this, v);
      const bmi = v.w / Math.pow(v.h / 100, 2);
      return {
        main: n + ' fator(es) marcado(s)',
        sub: 'Lista de verificação — não é um escore',
        level: 'info',
        note: 'Esta lista não é um escore: ela apenas conta os fatores marcados, e esse número não foi validado para estimar fratura. ' +
          'Para a probabilidade de fratura maior e de quadril em 10 anos, use o FRAX oficial (modelo Brasil) com estes mesmos dados ' +
          'e, se houver, a densidade mineral do colo do fêmur.',
        warn: v.prev ? 'Fratura prévia por fragilidade, sobretudo de quadril ou vértebra, já indica alto risco de nova fratura: ' +
          'avalie tratamento independentemente do FRAX.' : undefined,
        details: `Dados para o FRAX: sexo ${v.sex === 'f' ? 'feminino' : 'masculino'}, idade ${v.age} anos, peso ${fmt(v.w)} kg, altura ${v.h} cm (IMC ${fmt(bmi)} kg/m²). ` +
          'No Brasil, os limiares de intervenção do FRAX são ajustados por idade (Zerbini 2015; ABRASSO).',
        link: { href: 'https://frax.shef.ac.uk/FRAX/tool.aspx?lang=pr', text: 'Calcular no FRAX oficial (Brasil)', primary: true },
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
      { id: 'u', label: 'Ureia > 42 mg/dL (> 7 mmol/L)', type: 'check', points: 1 },
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
    ref: 'Seymour CW et al. JAMA 2016 (Sepsis-3); Evans L et al. Surviving Sepsis Campaign 2021 — desaconselha o qSOFA isolado como triagem.',
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
    tabs: ['clinica', 'geriatria'],
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
      const [cls, level, desc] = s <= 6 ? ['A', 'low', 'Doença bem compensada'] : s <= 9 ? ['B', 'mod', 'Comprometimento funcional significativo'] : ['C', 'high', 'Doença descompensada'];
      return {
        main: 'Classe ' + cls + ' (' + s + ' pts)', sub: desc, level,
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
        details: 'MELD clássico: ' + Math.round(meld) + '. Valores < 1 são ajustados para 1; creatinina limitada a 4 mg/dL. ' +
          'Mortalidade por faixa segundo Wiesner et al. (2003). Existe o MELD 3.0 (2021), que inclui sexo e albumina; para ' +
          'alocação de transplante, siga a regra vigente do Sistema Nacional de Transplantes.',
      };
    },
    ref: 'Kamath PS et al. Hepatology 2001; Wiesner R et al. Gastroenterology 2003; Kim WR et al. N Engl J Med 2008 (MELD-Na).',
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
      { id: 'msurg', label: 'Cirurgia maior prévia (< 1 mês)', type: 'check', points: 1 },
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
      { id: 'trauma', label: 'Politrauma (< 1 mês)', type: 'check', points: 5 },
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
    tabs: ['cirurgia', 'clinica', 'geriatria'],
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
      const stop = ['s', 't', 'o', 'p'].filter((k) => v[k]).length;
      const upgrade = s >= 3 && s <= 4 && stop >= 2 && (v.g || v.b || v.n);
      const [sub, level] = s <= 2 ? ['Baixo risco de AOS', 'low'] : s <= 4 && !upgrade ? ['Risco intermediário de AOS', 'mod'] :
        [upgrade ? 'Alto risco de AOS (STOP ≥ 2 + sexo masculino, IMC > 35 ou pescoço > 40 cm)' : 'Alto risco de AOS', 'high'];
      return { main: s + ' / 8', sub, level, details: 'Cortes: 0–2 baixo, 3–4 intermediário, 5–8 alto. Com 3–4 pontos, STOP ≥ 2 associado a sexo masculino, ' +
        'IMC > 35 ou pescoço > 40 cm também indica alto risco (Chung, 2016). ' +
        'Risco alto: planejar via aérea, minimizar opioides/sedativos e considerar polissonografia.' };
    },
    ref: 'Chung F et al. Anesthesiology 2008; Chung F et al. Chest 2016;149(3):631-8.',
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
    name: 'Reposição volêmica em queimados (ATLS / Parkland)',
    short: 'Volume de Ringer lactato nas primeiras 24 h conforme o tipo de queimadura.',
    tabs: ['cirurgia'],
    category: 'Trauma e emergência',
    keywords: 'queimadura parkland atls brooke reposição volêmica ringer superfície corporal',
    fields: [
      { id: 'w', label: 'Peso', type: 'number', unit: 'kg', min: 3, max: 300, step: 0.1 },
      { id: 'sc', label: 'Superfície corporal queimada (2º e 3º graus)', type: 'number', unit: '%', min: 1, max: 100 },
      { id: 'type', label: 'Tipo de queimadura', type: 'select', options: [
        { v: 'adult', t: 'Térmica — adulto (≥ 14 anos): 2 mL/kg/%' },
        { v: 'child', t: 'Térmica — criança (< 14 anos): 3 mL/kg/%' },
        { v: 'elec', t: 'Elétrica: 4 mL/kg/%' }] },
      { id: 'h', label: 'Horas desde a queimadura', type: 'number', unit: 'h', min: 0, max: 24, optional: true },
    ],
    compute(v) {
      const k = { adult: 2, child: 3, elec: 4 }[v.type];
      const urine = { adult: '0,5 mL/kg/h (~30–50 mL/h)', child: '1 mL/kg/h', elec: '1–1,5 mL/kg/h até o clareamento da urina' }[v.type];
      const total = k * v.w * v.sc;
      const first = total / 2;
      const elapsed = v.h || 0;
      const rem8 = Math.max(0, 8 - elapsed);
      const rate1 = rem8 > 0 ? first / rem8 : 0;
      return {
        main: fmt(total / 1000, 2) + ' L em 24 h',
        sub: `${k} mL/kg/% · ${fmt(first, 0)} mL nas primeiras 8 h e ${fmt(first, 0)} mL nas 16 h seguintes`,
        level: 'info',
        details: (rem8 > 0 ? `Considerando ${elapsed} h decorridas: ~${fmt(rate1, 0)} mL/h até completar 8 h. ` : '') +
          `Ringer lactato. O volume é ponto de partida: titule pela diurese (meta ${urine}). ` +
          'A fórmula de Parkland clássica usa 4 mL/kg/% para todos; a recomendação atual para queimadura térmica em adulto é iniciar com 2 mL/kg/% ' +
          'para evitar hiper-ressuscitação. Crianças < 30 kg também precisam de soro de manutenção com glicose.',
      };
    },
    ref: 'ATLS — Advanced Trauma Life Support, 10ª ed. (ACS, 2018); American Burn Association; Baxter CR 1968 (Parkland).',
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
    ref: 'Allgöwer M, Burri C. 1967; OPAS — Recomendações assistenciais para prevenção, diagnóstico e tratamento da hemorragia obstétrica (2018).',
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
          'A datação pela USG de 1º trimestre (CCN) é a mais precisa e prevalece se divergir da DUM em > 5 dias (antes de 9 semanas) ' +
          'ou > 7 dias (9s0d a 13s6d).',
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
    short: 'Faixa recomendada pelo Ministério da Saúde (curvas brasileiras), conforme o IMC pré-gestacional.',
    tabs: ['gineco'],
    category: 'Pré-natal',
    keywords: 'ganho de peso gestação gravidez imc pré-gestacional nutrição caderneta gestante',
    fields: [
      { id: 'w0', label: 'Peso pré-gestacional', type: 'number', unit: 'kg', min: 30, max: 250, step: 0.1 },
      { id: 'h', label: 'Altura', type: 'number', unit: 'cm', min: 120, max: 210 },
      { id: 'w1', label: 'Peso atual (opcional)', type: 'number', unit: 'kg', min: 30, max: 300, step: 0.1, optional: true },
    ],
    compute(v) {
      const bmi = v.w0 / Math.pow(v.h / 100, 2);
      let range, cat;
      if (bmi < 18.5) { range = [9.7, 12.2]; cat = 'Baixo peso'; }
      else if (bmi < 25) { range = [8, 12]; cat = 'Eutrofia'; }
      else if (bmi < 30) { range = [7, 9]; cat = 'Sobrepeso'; }
      else { range = [5, 7.2]; cat = 'Obesidade'; }
      let det = '';
      if (v.w1) det = `Ganho até agora: ${fmt(v.w1 - v.w0)} kg. `;
      det += 'Faixas totais para gestação única adotadas pelo Ministério da Saúde em 2022 (Caderneta da Gestante), a partir de dados ' +
        'brasileiros. Acompanhe semana a semana pelas curvas da Caderneta. As faixas do IOM 2009 (EUA) são mais altas e não são mais ' +
        'a referência nacional.';
      return {
        main: `${fmt(range[0])} – ${fmt(range[1])} kg`, sub: `IMC pré-gestacional ${fmt(bmi)} kg/m² (${cat})`,
        level: 'info', details: det,
      };
    },
    ref: 'Kac G et al. Am J Clin Nutr 2021;113(5):1351-60; Ministério da Saúde — Caderneta da Gestante (2022).',
  });

  C.push({
    id: 'pe_risco',
    name: 'Risco de pré-eclâmpsia (indicação de AAS)',
    short: 'Fatores clínicos para profilaxia com ácido acetilsalicílico.',
    tabs: ['gineco'],
    category: 'Pré-natal',
    hidePoints: true,
    groups: [
      { legend: 'Fatores de alto risco (basta 1 para indicar AAS)', ids: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
      { legend: 'Fatores de risco moderado (2 ou mais indicam AAS)', ids: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'] },
    ],
    keywords: 'pré-eclâmpsia aas aspirina hipertensão gestacional profilaxia cálcio',
    fields: [
      { id: 'h1', label: 'Pré-eclâmpsia em gestação anterior', type: 'check', points: 10 },
      { id: 'h2', label: 'Gestação múltipla', type: 'check', points: 10 },
      { id: 'h3', label: 'Hipertensão crônica', type: 'check', points: 10 },
      { id: 'h4', label: 'Diabetes tipo 1 ou 2 pré-gestacional', type: 'check', points: 10 },
      { id: 'h5', label: 'Doença renal crônica', type: 'check', points: 10 },
      { id: 'h6', label: 'Doença autoimune (LES, síndrome antifosfolípide)', type: 'check', points: 10 },
      { id: 'm1', label: 'Nuliparidade', type: 'check', points: 1 },
      { id: 'm2', label: 'Obesidade (IMC > 30)', type: 'check', points: 1 },
      { id: 'm3', label: 'Mãe ou irmã com pré-eclâmpsia', type: 'check', points: 1 },
      { id: 'm4', label: 'Idade ≥ 35 anos', type: 'check', points: 1 },
      { id: 'm5', label: 'Intervalo interpartal > 10 anos', type: 'check', points: 1 },
      { id: 'm6', label: 'Gestação por reprodução assistida', type: 'check', points: 1 },
      { id: 'm7', label: 'Desfecho adverso prévio (RN PIG, baixo peso)', type: 'check', points: 1 },
      { id: 'm8', label: 'Vulnerabilidade socioeconômica / mulher negra', type: 'check', points: 1 },
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
          'A suplementação de cálcio não é mais recomendada para prevenir pré-eclâmpsia (FEBRASGO/RBEHG, 2026). ' +
          'Rastreamento combinado (fatores maternos + Doppler de uterinas + PlGF) no 1º trimestre melhora a predição.',
      };
    },
    ref: 'USPSTF 2021; ACOG 2018 (reafirmado 2021); FEBRASGO — Protocolo de pré-eclâmpsia (2020); FEBRASGO/RBEHG — posicionamento sobre cálcio na gestação (2026).',
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
      const [sub, level] = s > 8 ? ['Colo favorável — indução com ocitocina tende ao sucesso', 'low'] :
        s >= 7 ? ['Colo intermediário', 'mod'] : ['Colo desfavorável — considerar preparo cervical', 'high'];
      return { main: s + ' / 13', sub, level, details: 'Cortes do ACOG: ≤ 6 desfavorável; > 8 favorável (chance de parto vaginal semelhante à do trabalho de parto espontâneo). ' +
        'Preparo cervical: misoprostol, dinoprostona ou sonda de Foley, conforme protocolo institucional.' };
    },
    ref: 'Bishop EH. Obstet Gynecol 1964; ACOG Practice Bulletin 107 (2009) — Induction of labor.',
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

  /* ============================== GERIATRIA ============================== */

  // Pergunta Sim/Não pontuada (o valor de cada opção é a sua pontuação)
  const ynq = (id, label, yesPts, noPts) => ({
    id, label, type: 'select', scored: true,
    options: [{ v: String(yesPts), t: 'Sim' }, { v: String(noPts), t: 'Não' }],
  });

  C.push({
    id: 'ivcf20',
    name: 'IVCF-20',
    short: 'Índice de Vulnerabilidade Clínico-Funcional: rastreio de fragilidade na atenção primária.',
    tabs: ['geriatria'],
    category: 'Avaliação geriátrica ampla',
    keywords: 'ivcf ivcf-20 vulnerabilidade fragilidade idoso geriatria rastreio atenção primária',
    groups: [
      { legend: 'Atividades de vida diária instrumentais (máximo de 4 pontos)', ids: ['aivd1', 'aivd2', 'aivd3'] },
      { legend: 'Atividade de vida diária básica', ids: ['abvd'] },
      { legend: 'Cognição', ids: ['cog1', 'cog2', 'cog3'] },
      { legend: 'Humor', ids: ['hum1', 'hum2'] },
      { legend: 'Mobilidade: alcance, preensão e pinça', ids: ['mob1', 'mob2'] },
      { legend: 'Capacidade aeróbica e/ou muscular', ids: ['cap'] },
      { legend: 'Marcha', ids: ['mar1', 'mar2'] },
      { legend: 'Continência esfincteriana', ids: ['cont'] },
      { legend: 'Comunicação', ids: ['vis', 'aud'] },
      { legend: 'Comorbidades múltiplas', ids: ['com'] },
    ],
    fields: [
      { id: 'age', label: 'Idade', type: 'select', scored: true, options: [
        { v: '0', t: '60–74 anos' }, { v: '1', t: '75–84 anos' }, { v: '3', t: '≥ 85 anos' }] },
      { id: 'self', label: 'Autopercepção de saúde, comparada a outras pessoas da mesma idade', type: 'select', scored: true, options: [
        { v: '0', t: 'Excelente, muito boa ou boa' }, { v: '1', t: 'Regular ou ruim' }] },
      { id: 'aivd1', label: 'Deixou de fazer compras por causa da saúde ou condição física', type: 'check', points: 4 },
      { id: 'aivd2', label: 'Deixou de controlar o dinheiro, gastos ou contas', type: 'check', points: 4 },
      { id: 'aivd3', label: 'Deixou de fazer pequenos trabalhos domésticos', type: 'check', points: 4 },
      { id: 'abvd', label: 'Deixou de tomar banho sozinho', type: 'check', points: 6 },
      { id: 'cog1', label: 'Familiar ou amigo relata esquecimento', type: 'check', points: 1 },
      { id: 'cog2', label: 'Esquecimento piorou nos últimos meses', type: 'check', points: 1 },
      { id: 'cog3', label: 'Esquecimento impede alguma atividade do cotidiano', type: 'check', points: 2 },
      { id: 'hum1', label: 'Desânimo, tristeza ou desesperança no último mês', type: 'check', points: 2 },
      { id: 'hum2', label: 'Perda de interesse ou prazer em atividades no último mês', type: 'check', points: 2 },
      { id: 'mob1', label: 'Incapaz de elevar os braços acima do nível do ombro', type: 'check', points: 1 },
      { id: 'mob2', label: 'Incapaz de manusear ou segurar pequenos objetos', type: 'check', points: 1 },
      { id: 'cap', label: 'Perda de peso não intencional, IMC < 22, panturrilha < 31 cm ou marcha de 4 m > 5 s', type: 'check', points: 2 },
      { id: 'mar1', label: 'Dificuldade para caminhar que impede alguma atividade', type: 'check', points: 2 },
      { id: 'mar2', label: 'Duas ou mais quedas no último ano', type: 'check', points: 2 },
      { id: 'cont', label: 'Perde urina ou fezes sem querer', type: 'check', points: 2 },
      { id: 'vis', label: 'Problema de visão que impede alguma atividade', type: 'check', points: 2 },
      { id: 'aud', label: 'Problema de audição que impede alguma atividade', type: 'check', points: 2 },
      { id: 'com', label: '≥ 5 doenças crônicas, ≥ 5 medicamentos/dia ou internação nos últimos 6 meses', type: 'check', points: 4 },
    ],
    compute(v) {
      // As três AIVD somam no máximo 4 pontos
      const aivd = v.aivd1 || v.aivd2 || v.aivd3 ? 4 : 0;
      const s = sumPoints(this, v) - (v.aivd1 ? 4 : 0) - (v.aivd2 ? 4 : 0) - (v.aivd3 ? 4 : 0) + aivd;
      let sub, level;
      if (s <= 6) { sub = 'Idoso robusto — baixa vulnerabilidade'; level = 'low'; }
      else if (s <= 14) { sub = 'Risco de fragilização — vulnerabilidade moderada'; level = 'mod'; }
      else { sub = 'Idoso frágil — alta vulnerabilidade'; level = 'high'; }
      return {
        main: s + ' / 40', sub, level,
        details: 'Classificação (Moraes et al., 2016): 0–6 baixa vulnerabilidade, 7–14 vulnerabilidade moderada (risco de ' +
          'fragilização), ≥ 15 alta vulnerabilidade (idoso frágil). As três perguntas de AIVD somam no máximo 4 pontos. ' +
          'O IVCF-20 é rastreio: aprofunde com avaliação geriátrica ampla conforme o protocolo do serviço.',
      };
    },
    ref: 'Moraes EN et al. Rev Saúde Pública 2016 — IVCF-20.',
  });

  C.push({
    id: 'cfs',
    name: 'Escala Clínica de Fragilidade (CFS)',
    short: 'Classificação de Rockwood, de 1 (muito em forma) a 9 (doente terminal).',
    tabs: ['geriatria', 'clinica', 'paliativos'],
    category: 'Fragilidade e sarcopenia',
    keywords: 'cfs rockwood fragilidade clinical frailty scale idoso geriatria',
    fields: [
      { id: 'cfs', label: 'Situação nas 2 semanas antes da doença atual', type: 'select', options: [
        { v: '1', t: '1 — Muito em forma: robusto, ativo, se exercita regularmente' },
        { v: '2', t: '2 — Em forma: sem doença ativa, mas menos em forma que o nível 1' },
        { v: '3', t: '3 — Bem: problemas de saúde bem controlados, não se exercita além de caminhar' },
        { v: '4', t: '4 — Vivendo com doença muito leve: sintomas limitam atividades, “mais lento”' },
        { v: '5', t: '5 — Fragilidade leve: precisa de ajuda em AIVD (finanças, transporte, casa)' },
        { v: '6', t: '6 — Fragilidade moderada: ajuda em todas as AIVD e no banho' },
        { v: '7', t: '7 — Fragilidade grave: totalmente dependente para cuidados pessoais' },
        { v: '8', t: '8 — Fragilidade muito grave: dependente, aproximando-se do fim da vida' },
        { v: '9', t: '9 — Doente terminal: expectativa de vida < 6 meses' },
      ] },
    ],
    compute(v) {
      const n = +v.cfs;
      const [sub, level] = n <= 3 ? ['Não frágil', 'low'] : n === 4 ? ['Vulnerável (pré-fragilidade)', 'mod'] : ['Frágil', 'high'];
      return {
        main: 'CFS ' + n, sub, level,
        details: 'Classifique pelo estado basal (cerca de 2 semanas antes do quadro agudo). A CFS foi validada para ≥ 65 anos; ' +
          'não use isoladamente em jovens ou em deficiência estável.',
        warn: n >= 7 ? 'CFS ≥ 7: discuta prognóstico, metas de cuidado e diretivas antecipadas antes de intervenções invasivas.' : undefined,
      };
    },
    ref: 'Rockwood K et al. CMAJ 2005; Clinical Frailty Scale v2.0 (2020).',
  });

  C.push({
    id: 'frail',
    name: 'Escala FRAIL',
    short: 'Rastreio rápido de fragilidade em 5 perguntas.',
    tabs: ['geriatria'],
    category: 'Fragilidade e sarcopenia',
    keywords: 'frail fragilidade fadiga idoso geriatria',
    fields: [
      { id: 'f', label: 'Fadiga: sente-se cansado a maior parte ou todo o tempo', type: 'check', points: 1 },
      { id: 'r', label: 'Resistência: tem dificuldade para subir um lance de escadas', type: 'check', points: 1 },
      { id: 'a', label: 'Deambulação: tem dificuldade para andar um quarteirão (~100 m)', type: 'check', points: 1 },
      { id: 'i', label: 'Doenças: tem 5 ou mais doenças crônicas', type: 'check', points: 1 },
      { id: 'l', label: 'Perda de peso > 5% no último ano', type: 'check', points: 1 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const [sub, level] = s === 0 ? ['Robusto', 'low'] : s <= 2 ? ['Pré-frágil', 'mod'] : ['Frágil', 'high'];
      return { main: s + ' / 5', sub, level, details: 'Pré-frágil ou frágil: avaliação geriátrica ampla, revisão de medicamentos, exercício resistido e avaliação nutricional.' };
    },
    ref: 'Morley JE et al. J Nutr Health Aging 2012.',
  });

  C.push({
    id: 'sarcf',
    name: 'SARC-F',
    short: 'Rastreio de sarcopenia.',
    tabs: ['geriatria'],
    category: 'Fragilidade e sarcopenia',
    keywords: 'sarcopenia sarc-f força muscular idoso geriatria',
    fields: [
      { id: 's', label: 'Dificuldade para levantar e carregar 4,5 kg', type: 'select', scored: true, options: [
        { v: '0', t: 'Nenhuma' }, { v: '1', t: 'Alguma' }, { v: '2', t: 'Muita ou não consegue' }] },
      { id: 'a', label: 'Dificuldade para atravessar um cômodo andando', type: 'select', scored: true, options: [
        { v: '0', t: 'Nenhuma' }, { v: '1', t: 'Alguma' }, { v: '2', t: 'Muita, usa apoio ou não consegue' }] },
      { id: 'r', label: 'Dificuldade para levantar de uma cama ou cadeira', type: 'select', scored: true, options: [
        { v: '0', t: 'Nenhuma' }, { v: '1', t: 'Alguma' }, { v: '2', t: 'Muita ou não consegue sem ajuda' }] },
      { id: 'c', label: 'Dificuldade para subir 10 degraus', type: 'select', scored: true, options: [
        { v: '0', t: 'Nenhuma' }, { v: '1', t: 'Alguma' }, { v: '2', t: 'Muita ou não consegue' }] },
      { id: 'f', label: 'Quedas no último ano', type: 'select', scored: true, options: [
        { v: '0', t: 'Nenhuma' }, { v: '1', t: '1 a 3 quedas' }, { v: '2', t: '4 ou mais quedas' }] },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const pos = s >= 4;
      return {
        main: s + ' / 10', sub: pos ? 'Sugestivo de sarcopenia' : 'Rastreio negativo',
        level: pos ? 'high' : 'low',
        details: pos ? 'Confirme com força de preensão (< 27 kg H / < 16 kg M) ou teste de sentar-levantar 5× (> 15 s) e, se possível, massa muscular (EWGSOP2).' :
          'Rastreio negativo; repita anualmente ou se houver queda de desempenho.',
      };
    },
    ref: 'Malmstrom TK, Morley JE. JAMDA 2013; Cruz-Jentoft AJ et al. Age Ageing 2019 (EWGSOP2).',
  });

  C.push({
    id: 'marcha',
    name: 'Velocidade de marcha (4 m)',
    short: 'Desempenho físico: risco de quedas, sarcopenia grave e mortalidade.',
    tabs: ['geriatria'],
    category: 'Fragilidade e sarcopenia',
    keywords: 'velocidade de marcha caminhada desempenho físico sarcopenia queda idoso',
    fields: [
      { id: 'd', label: 'Distância percorrida', type: 'number', unit: 'm', min: 2, max: 20, step: 0.1 },
      { id: 't', label: 'Tempo', type: 'number', unit: 's', min: 0.5, max: 120, step: 0.1 },
    ],
    compute(v) {
      const s = v.d / v.t;
      let sub, level;
      if (s <= 0.8) { sub = 'Lenta (≤ 0,8 m/s) — baixo desempenho físico'; level = 'high'; }
      else if (s < 1.0) { sub = 'Intermediária (> 0,8 e < 1,0 m/s)'; level = 'mod'; }
      else { sub = 'Normal (≥ 1,0 m/s)'; level = 'low'; }
      return {
        main: fmt(s, 2) + ' m/s', sub, level,
        details: 'Use marcha habitual, com 1–2 m de aceleração antes do trecho cronometrado. Velocidade ≤ 0,8 m/s indica sarcopenia grave ' +
          '(se massa e força baixas) e maior risco de quedas, hospitalização e morte.',
      };
    },
    ref: 'Cruz-Jentoft AJ et al. Age Ageing 2019 (EWGSOP2); Studenski S et al. JAMA 2011.',
  });

  C.push({
    id: 'tug',
    name: 'Timed Up and Go (TUG)',
    short: 'Mobilidade e risco de quedas.',
    tabs: ['geriatria'],
    category: 'Quedas e mobilidade',
    keywords: 'tug timed up and go queda mobilidade equilíbrio idoso',
    fields: [
      { id: 't', label: 'Tempo para levantar, andar 3 m, voltar e sentar', type: 'number', unit: 's', min: 3, max: 300, step: 0.1 },
    ],
    compute(v) {
      let sub, level;
      if (v.t < 12) { sub = 'Mobilidade preservada'; level = 'low'; }
      else if (v.t <= 20) { sub = 'Risco aumentado de quedas (≥ 12 s)'; level = 'mod'; }
      else { sub = 'Mobilidade muito reduzida (> 20 s) — alto risco de quedas'; level = 'high'; }
      return {
        main: fmt(v.t) + ' s', sub, level,
        details: 'Use o calçado e o dispositivo de marcha habituais. TUG ≥ 12 s pede avaliação multifatorial de quedas ' +
          '(medicamentos, visão, hipotensão postural, pés e calçados, ambiente doméstico).',
        edu: 'queda-oque',
      };
    },
    ref: 'Podsiadlo D, Richardson S. J Am Geriatr Soc 1991; CDC STEADI.',
  });

  C.push({
    id: 'morse',
    name: 'Escala de Morse',
    short: 'Risco de queda em pacientes internados.',
    tabs: ['geriatria', 'clinica', 'cirurgia'],
    category: 'Quedas e mobilidade',
    keywords: 'morse queda internação enfermagem segurança do paciente idoso',
    fields: [
      { id: 'h', label: 'Histórico de queda (internação atual ou últimos 3 meses)', type: 'select', scored: true, options: [
        { v: '0', t: 'Não' }, { v: '25', t: 'Sim' }] },
      { id: 'd', label: 'Mais de um diagnóstico', type: 'select', scored: true, options: [
        { v: '0', t: 'Não' }, { v: '15', t: 'Sim' }] },
      { id: 'a', label: 'Auxílio na deambulação', type: 'select', scored: true, options: [
        { v: '0', t: 'Nenhum, acamado ou auxiliado pela enfermagem' }, { v: '15', t: 'Muletas, bengala ou andador' }, { v: '30', t: 'Apoia-se nos móveis' }] },
      { id: 'iv', label: 'Terapia endovenosa / dispositivo venoso salinizado', type: 'select', scored: true, options: [
        { v: '0', t: 'Não' }, { v: '20', t: 'Sim' }] },
      { id: 'g', label: 'Marcha', type: 'select', scored: true, options: [
        { v: '0', t: 'Normal, acamado ou cadeira de rodas' }, { v: '10', t: 'Fraca' }, { v: '20', t: 'Comprometida / cambaleante' }] },
      { id: 'm', label: 'Estado mental', type: 'select', scored: true, options: [
        { v: '0', t: 'Orientado sobre a própria capacidade' }, { v: '15', t: 'Superestima a capacidade / esquece limitações' }] },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const [sub, level] = s < 25 ? ['Baixo risco de queda', 'low'] : s < 45 ? ['Risco moderado de queda', 'mod'] : ['Alto risco de queda', 'high'];
      return { main: s + ' pontos', sub, level, details: 'Risco moderado/alto: sinalização, cama baixa com grades conforme protocolo, calçado adequado, acompanhante e revisão de sedativos.' };
    },
    ref: 'Morse JM et al. Can J Aging 1989; Urbanetto JS et al. Rev Gaúcha Enferm 2013 (versão brasileira).',
  });

  C.push({
    id: 'braden',
    name: 'Escala de Braden',
    short: 'Risco de lesão por pressão.',
    tabs: ['geriatria', 'clinica', 'cirurgia'],
    category: 'Cuidados e funcionalidade',
    keywords: 'braden lesão por pressão úlcera escara enfermagem acamado idoso',
    fields: [
      { id: 'se', label: 'Percepção sensorial', type: 'select', scored: true, options: [
        { v: '1', t: '1 — Totalmente limitada' }, { v: '2', t: '2 — Muito limitada' }, { v: '3', t: '3 — Levemente limitada' }, { v: '4', t: '4 — Nenhuma limitação' }] },
      { id: 'mo', label: 'Umidade', type: 'select', scored: true, options: [
        { v: '1', t: '1 — Constantemente úmida' }, { v: '2', t: '2 — Muito úmida' }, { v: '3', t: '3 — Ocasionalmente úmida' }, { v: '4', t: '4 — Raramente úmida' }] },
      { id: 'ac', label: 'Atividade', type: 'select', scored: true, options: [
        { v: '1', t: '1 — Acamado' }, { v: '2', t: '2 — Confinado à cadeira' }, { v: '3', t: '3 — Anda ocasionalmente' }, { v: '4', t: '4 — Anda frequentemente' }] },
      { id: 'mb', label: 'Mobilidade', type: 'select', scored: true, options: [
        { v: '1', t: '1 — Totalmente imóvel' }, { v: '2', t: '2 — Bastante limitada' }, { v: '3', t: '3 — Levemente limitada' }, { v: '4', t: '4 — Sem limitação' }] },
      { id: 'nu', label: 'Nutrição', type: 'select', scored: true, options: [
        { v: '1', t: '1 — Muito pobre' }, { v: '2', t: '2 — Provavelmente inadequada' }, { v: '3', t: '3 — Adequada' }, { v: '4', t: '4 — Excelente' }] },
      { id: 'fr', label: 'Fricção e cisalhamento', type: 'select', scored: true, options: [
        { v: '1', t: '1 — Problema' }, { v: '2', t: '2 — Problema potencial' }, { v: '3', t: '3 — Nenhum problema aparente' }] },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      let sub, level;
      if (s <= 9) { sub = 'Risco muito alto'; level = 'high'; }
      else if (s <= 12) { sub = 'Risco alto'; level = 'high'; }
      else if (s <= 14) { sub = 'Risco moderado'; level = 'mod'; }
      else if (s <= 18) { sub = 'Risco leve'; level = 'mod'; }
      else { sub = 'Sem risco'; level = 'low'; }
      return {
        main: s + ' / 23', sub, level,
        details: 'Escore ≤ 18 indica medidas preventivas: mudança de decúbito programada, superfície de redistribuição de pressão, ' +
          'cuidado com a pele e umidade, e otimização nutricional.',
      };
    },
    ref: 'Bergstrom N et al. Nurs Res 1987; Paranhos WY, Santos VL. Rev Esc Enferm USP 1999 (versão brasileira).',
  });

  C.push({
    id: 'katz',
    name: 'Índice de Katz (ABVD)',
    short: 'Independência nas atividades básicas de vida diária.',
    tabs: ['geriatria'],
    category: 'Cuidados e funcionalidade',
    keywords: 'katz abvd atividades básicas vida diária funcionalidade dependência idoso',
    checkLegend: 'Marque as atividades feitas sem ajuda',
    fields: [
      { id: 'b', label: 'Banho: independente (ajuda só para uma parte do corpo)', type: 'check', points: 1 },
      { id: 'v', label: 'Vestir-se: pega as roupas e se veste sem ajuda (exceto amarrar sapatos)', type: 'check', points: 1 },
      { id: 'h', label: 'Higiene pessoal: vai ao banheiro, se limpa e se arruma sem ajuda', type: 'check', points: 1 },
      { id: 't', label: 'Transferência: deita/levanta da cama e da cadeira sem ajuda', type: 'check', points: 1 },
      { id: 'c', label: 'Continência: controle completo de urina e fezes', type: 'check', points: 1 },
      { id: 'a', label: 'Alimentação: leva a comida do prato à boca sem ajuda', type: 'check', points: 1 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const [sub, level] = s === 6 ? ['Independente nas ABVD', 'low'] : s >= 3 ? ['Dependência parcial', 'mod'] : ['Dependência importante', 'high'];
      return {
        main: s + ' / 6 independentes', sub, level,
        details: 'Marque apenas as atividades realizadas sem ajuda de outra pessoa. A perda costuma seguir a ordem banho → vestir → higiene → transferência → continência → alimentação.',
      };
    },
    ref: 'Katz S et al. JAMA 1963; Lino VTS et al. Cad Saúde Pública 2008 (adaptação brasileira).',
  });

  C.push({
    id: 'lawton',
    name: 'Escala de Lawton-Brody (AIVD)',
    short: 'Independência nas atividades instrumentais de vida diária.',
    tabs: ['geriatria'],
    category: 'Cuidados e funcionalidade',
    keywords: 'lawton aivd atividades instrumentais vida diária funcionalidade idoso',
    fields: ['Usar o telefone', 'Ir a lugares distantes (transporte)', 'Fazer compras', 'Preparar refeições',
      'Arrumar a casa', 'Tomar os remédios na dose e horário certos', 'Cuidar das finanças'].map((t, i) => ({
      id: 'l' + i, label: t, type: 'select', scored: true, options: [
        { v: '3', t: 'Sem ajuda' }, { v: '2', t: 'Com ajuda parcial' }, { v: '1', t: 'Não consegue' }] })),
    compute(v) {
      const s = sumPoints(this, v);
      const [sub, level] = s === 21 ? ['Independente nas AIVD', 'low'] : s > 7 ? ['Dependência parcial', 'mod'] : ['Dependência total', 'high'];
      return {
        main: s + ' / 21', sub, level,
        details: 'As AIVD são as primeiras a se perder no declínio cognitivo e na fragilidade. Considere fatores culturais e de gênero ' +
          '(atividades que a pessoa nunca fez) ao interpretar.',
      };
    },
    ref: 'Lawton MP, Brody EM. Gerontologist 1969; Santos RL, Virtuoso JS. RBPS 2008 (versão brasileira).',
  });

  C.push({
    id: 'meem',
    name: 'Miniexame do Estado Mental (MEEM)',
    short: 'Rastreio cognitivo com nota de corte por escolaridade.',
    tabs: ['geriatria'],
    category: 'Cognição, humor e delirium',
    keywords: 'meem mini mental mmse cognição demência memória escolaridade idoso',
    fields: [
      { id: 's', label: 'Pontuação total do MEEM', type: 'number', unit: 'pontos', min: 0, max: 30 },
      { id: 'e', label: 'Escolaridade', type: 'select', options: [
        { v: '19', t: 'Analfabeto' }, { v: '23', t: '1 a 3 anos' }, { v: '24', t: '4 a 7 anos' }, { v: '28', t: '8 anos ou mais' }] },
    ],
    compute(v) {
      const cut = +v.e;
      const below = v.s < cut;
      return {
        main: v.s + ' / 30',
        sub: below ? 'Abaixo do ponto de corte para a escolaridade' : 'Dentro do esperado para a escolaridade',
        level: below ? 'high' : 'low',
        details: `Ponto de corte para esta escolaridade: ${cut} pontos (Ministério da Saúde). ` +
          'O MEEM é rastreio, não diagnóstico: resultado alterado pede avaliação cognitiva ampla e exclusão de causas reversíveis ' +
          '(delirium, depressão, déficit sensorial, B12, TSH, medicamentos).',
      };
    },
    ref: 'Folstein MF et al. 1975; Brucki SMD et al. Arq Neuropsiquiatr 2003; Ministério da Saúde — Caderno de Atenção Básica nº 19 (2006).',
  });

  C.push({
    id: 'minicog',
    name: 'Mini-Cog',
    short: 'Rastreio cognitivo rápido: 3 palavras + desenho do relógio.',
    tabs: ['geriatria'],
    category: 'Cognição, humor e delirium',
    keywords: 'mini-cog minicog relógio memória cognição demência rastreio idoso',
    fields: [
      { id: 'w', label: 'Palavras lembradas sem pista', type: 'select', scored: true, options: [
        { v: '0', t: '0 palavras' }, { v: '1', t: '1 palavra' }, { v: '2', t: '2 palavras' }, { v: '3', t: '3 palavras' }] },
      { id: 'c', label: 'Desenho do relógio (números e ponteiros marcando 11h10)', type: 'select', scored: true, options: [
        { v: '2', t: 'Normal' }, { v: '0', t: 'Alterado ou recusou' }] },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const pos = s < 3;
      return {
        main: s + ' / 5', sub: pos ? 'Rastreio positivo para comprometimento cognitivo' : 'Rastreio negativo',
        level: pos ? 'high' : 'low',
        details: 'Escore < 3 sugere avaliação cognitiva mais detalhada. É triagem e não substitui a avaliação completa.',
      };
    },
    ref: 'Borson S et al. Int J Geriatr Psychiatry 2000.',
  });

  C.push({
    id: 'gds15',
    name: 'Escala de Depressão Geriátrica (GDS-15)',
    short: 'Rastreio de depressão em idosos — 15 perguntas sobre a última semana.',
    tabs: ['geriatria'],
    category: 'Cognição, humor e delirium',
    keywords: 'gds depressão geriátrica yesavage humor tristeza idoso',
    fields: [
      ['Está satisfeito(a) com sua vida?', 0],
      ['Interrompeu muitas de suas atividades?', 1],
      ['Acha sua vida vazia?', 1],
      ['Aborrece-se com frequência?', 1],
      ['Sente-se de bem com a vida na maior parte do tempo?', 0],
      ['Teme que algo ruim lhe aconteça?', 1],
      ['Sente-se alegre a maior parte do tempo?', 0],
      ['Sente-se desamparado(a) com frequência?', 1],
      ['Prefere ficar em casa a sair e fazer coisas novas?', 1],
      ['Acha que tem mais problemas de memória que a maioria?', 1],
      ['Acha que é maravilhoso estar vivo(a) agora?', 0],
      ['Vale a pena viver como vive agora?', 0],
      ['Sente-se cheio(a) de energia?', 0],
      ['Acha que sua situação não tem saída?', 1],
      ['Acha que a maioria das pessoas está melhor que você?', 1],
    ].map(([t, yesScores], i) => ynq('q' + (i + 1), `${i + 1}. ${t}`, yesScores, 1 - yesScores)),
    compute(v) {
      const s = sumPoints(this, v);
      let sub, level;
      if (s <= 4) { sub = 'Sem sintomas depressivos significativos'; level = 'low'; }
      else if (s <= 10) { sub = 'Sugestivo de depressão leve a moderada'; level = 'mod'; }
      else { sub = 'Sugestivo de depressão grave'; level = 'high'; }
      return {
        main: s + ' / 15', sub, level,
        details: 'Ponto de corte ≥ 5 (Almeida & Almeida, 1999). Confirme o diagnóstico em entrevista clínica. ' +
          'Menos confiável em demência moderada a grave.',
        warn: s >= 5 ? 'Pergunte ativamente sobre ideação suicida. Se presente, avalie risco e encaminhe com urgência (CVV: 188).' : undefined,
      };
    },
    ref: 'Yesavage JA et al. 1983; Almeida OP, Almeida SA. Arq Neuropsiquiatr 1999 (GDS-15 brasileira).',
  });

  C.push({
    id: '4at',
    name: '4AT — Rastreio de delirium',
    short: 'Rastreio rápido de delirium e comprometimento cognitivo (< 2 min).',
    tabs: ['geriatria', 'clinica', 'cirurgia'],
    category: 'Cognição, humor e delirium',
    keywords: '4at delirium confusão mental agudo internação pós-operatório idoso',
    fields: [
      { id: 'al', label: '1. Alerta', type: 'select', scored: true, options: [
        { v: '0', t: 'Normal (inclui sonolência leve < 10 s após acordar)' }, { v: '4', t: 'Claramente alterado' }] },
      { id: 'amt', label: '2. AMT4 (idade, data de nascimento, local, ano atual)', type: 'select', scored: true, options: [
        { v: '0', t: 'Nenhum erro' }, { v: '1', t: '1 erro' }, { v: '2', t: '2 ou mais erros / não testável' }] },
      { id: 'at', label: '3. Atenção: meses do ano em ordem inversa', type: 'select', scored: true, options: [
        { v: '0', t: '7 meses ou mais corretos' }, { v: '1', t: 'Começa, mas < 7 meses / recusa' }, { v: '2', t: 'Não testável (sonolento, desatento)' }] },
      { id: 'ac', label: '4. Mudança aguda ou curso flutuante (últimas 2 semanas, ainda presente nas últimas 24 h)', type: 'select', scored: true, options: [
        { v: '0', t: 'Não' }, { v: '4', t: 'Sim' }] },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      let sub, level;
      if (s >= 4) { sub = 'Possível delirium ± comprometimento cognitivo'; level = 'high'; }
      else if (s >= 1) { sub = 'Possível comprometimento cognitivo'; level = 'mod'; }
      else { sub = 'Delirium ou comprometimento cognitivo grave improváveis'; level = 'low'; }
      return {
        main: s + ' / 12', sub, level,
        details: 'Escore 0 não exclui delirium se a mudança ocorreu antes ou se os sintomas flutuam: reavalie.',
        warn: s >= 4 ? 'Delirium é emergência médica: investigue causa (infecção, medicamentos, distúrbio hidroeletrolítico, retenção urinária, dor, hipóxia) ' +
          'e prefira medidas não farmacológicas; evite benzodiazepínicos, exceto na abstinência de álcool ou de benzodiazepínicos.' : undefined,
      };
    },
    ref: 'Bellelli G et al. Age Ageing 2014; www.the4at.com.',
  });

  C.push({
    id: 'mnasf',
    name: 'Miniavaliação Nutricional (MNA-SF)',
    short: 'Triagem de desnutrição em idosos.',
    tabs: ['geriatria'],
    category: 'Cuidados e funcionalidade',
    keywords: 'mna mna-sf nutrição desnutrição peso apetite panturrilha idoso',
    fields: [
      { id: 'a', label: 'A. Ingesta alimentar diminuiu nos últimos 3 meses?', type: 'select', scored: true, options: [
        { v: '0', t: 'Diminuição grave' }, { v: '1', t: 'Diminuição moderada' }, { v: '2', t: 'Sem diminuição' }] },
      { id: 'b', label: 'B. Perda de peso nos últimos 3 meses', type: 'select', scored: true, options: [
        { v: '0', t: 'Mais de 3 kg' }, { v: '1', t: 'Não sabe informar' }, { v: '2', t: 'Entre 1 e 3 kg' }, { v: '3', t: 'Sem perda de peso' }] },
      { id: 'c', label: 'C. Mobilidade', type: 'select', scored: true, options: [
        { v: '0', t: 'Restrito ao leito ou cadeira' }, { v: '1', t: 'Sai do leito/cadeira, mas não de casa' }, { v: '2', t: 'Sai de casa' }] },
      { id: 'd', label: 'D. Estresse psicológico ou doença aguda nos últimos 3 meses?', type: 'select', scored: true, options: [
        { v: '0', t: 'Sim' }, { v: '2', t: 'Não' }] },
      { id: 'e', label: 'E. Problemas neuropsicológicos', type: 'select', scored: true, options: [
        { v: '0', t: 'Demência ou depressão grave' }, { v: '1', t: 'Demência leve' }, { v: '2', t: 'Sem problemas' }] },
      { id: 'f', label: 'F. IMC (ou, se indisponível, circunferência da panturrilha)', type: 'select', scored: true, options: [
        { v: '0', t: 'IMC < 19 kg/m²' }, { v: '1', t: 'IMC 19 a < 21' }, { v: '2', t: 'IMC 21 a < 23' }, { v: '3', t: 'IMC ≥ 23' },
        { v: '0.0', t: 'Panturrilha < 31 cm' }, { v: '3.0', t: 'Panturrilha ≥ 31 cm' }] },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      let sub, level;
      if (s >= 12) { sub = 'Estado nutricional normal'; level = 'low'; }
      else if (s >= 8) { sub = 'Risco de desnutrição'; level = 'mod'; }
      else { sub = 'Desnutrido'; level = 'high'; }
      return {
        main: s + ' / 14', sub, level,
        details: 'Risco ou desnutrição: avaliação nutricional completa, investigação de causas (dentição, deglutição, depressão, ' +
          'medicamentos, isolamento social) e suplementação quando indicada.',
      };
    },
    ref: 'Rubenstein LZ et al. J Gerontol 2001; Kaiser MJ et al. J Nutr Health Aging 2009.',
  });

  /* ============================== PNEUMOLOGIA ============================== */

  C.push({
    id: 'gold',
    name: 'DPOC — GOLD (grau e grupo ABE)',
    short: 'Gravidade espirométrica (GOLD 1–4), grupo A/B/E e tratamento farmacológico inicial.',
    tabs: ['clinica', 'geriatria'],
    category: 'Pneumologia',
    keywords: 'dpoc gold enfisema bronquite crônica abe mmrc cat espirometria vef1 exacerbação broncodilatador lama laba tratamento',
    fields: [
      { id: 'ratio', label: 'VEF₁/CVF pós-broncodilatador', type: 'select', options: [
        { v: '1', t: '< 0,70 (obstrução confirmada)' }, { v: '0', t: '≥ 0,70' }] },
      { id: 'fev1', label: 'VEF₁ pós-broncodilatador', type: 'number', unit: '% do previsto', min: 5, max: 150 },
      { id: 'mmrc', label: 'Dispneia — escala mMRC', type: 'select', options: [
        { v: '0', t: '0 — Só com exercício intenso' },
        { v: '1', t: '1 — Ao andar depressa no plano ou subir ladeira leve' },
        { v: '2', t: '2 — Anda mais devagar que pessoas da mesma idade ou precisa parar no próprio passo' },
        { v: '3', t: '3 — Para para respirar após ~100 m ou poucos minutos no plano' },
        { v: '4', t: '4 — Não sai de casa ou tem falta de ar ao se vestir' }] },
      { id: 'cat', label: 'Pontuação total do CAT (opcional)', type: 'number', unit: 'pontos', min: 0, max: 40, optional: true },
      { id: 'exmod', label: 'Exacerbações moderadas no último ano (corticoide e/ou antibiótico, sem internação)', type: 'number', unit: 'n.º', min: 0, max: 20 },
      { id: 'exhosp', label: 'Exacerbações com internação no último ano', type: 'number', unit: 'n.º', min: 0, max: 20 },
      { id: 'eos', label: 'Eosinófilos no sangue (opcional)', type: 'number', unit: 'células/µL', min: 0, max: 5000, optional: true },
    ],
    compute(v) {
      if (v.ratio === '0') {
        return {
          main: 'Sem obstrução fixa', sub: 'VEF₁/CVF ≥ 0,70 não confirma DPOC pelo critério GOLD', level: 'info',
          details: 'Com sintomas respiratórios e VEF₁/CVF ≥ 0,70, considere outros diagnósticos (asma, IC, bronquiectasias) e ' +
            'PRISm (VEF₁ < 80% com relação preservada). Valores limítrofes (0,60–0,80) podem ser repetidos em outra ocasião.',
        };
      }
      const grade = v.fev1 >= 80 ? 1 : v.fev1 >= 50 ? 2 : v.fev1 >= 30 ? 3 : 4;
      const gradeName = ['Leve', 'Moderada', 'Grave', 'Muito grave'][grade - 1];
      const symptomatic = +v.mmrc >= 2 || (v.cat != null && v.cat >= 10);
      const group = v.exmod >= 2 || v.exhosp >= 1 ? 'E' : symptomatic ? 'B' : 'A';
      const eos = v.eos;
      let tx;
      if (group === 'A') tx = 'um broncodilatador — de preferência de longa duração (LAMA ou LABA), salvo dispneia muito ocasional.';
      else if (group === 'B') tx = 'LABA + LAMA, de preferência em dispositivo único.';
      else tx = 'LABA + LAMA' + (eos != null && eos >= 300 ? '; com eosinófilos ≥ 300/µL, considerar LABA + LAMA + CI (terapia tripla).' : '.');
      const fu = 'Seguimento: dispneia persistente em monoterapia → LABA + LAMA. Exacerbações em LABA + LAMA → eosinófilos ≥ 100/µL: ' +
        'acrescentar CI (tripla); < 100/µL: roflumilaste (VEF₁ < 50% e bronquite crônica) ou azitromicina (preferencialmente ex-tabagistas). ' +
        'Em tripla com eosinófilos ≥ 300/µL e bronquite crônica, considerar imunobiológico (dupilumabe). LABA + CI isolado não é recomendado na DPOC ' +
        '(se houver asma associada, o esquema deve conter CI).';
      return {
        main: `GOLD ${grade} · Grupo ${group}`,
        sub: `Obstrução ${gradeName.toLowerCase()} (VEF₁ ${fmt(v.fev1, 0)}%) · ${symptomatic ? 'mais sintomas' : 'menos sintomas'}` +
          (group === 'E' ? ' · exacerbador' : ''),
        level: group === 'A' ? 'low' : group === 'B' ? 'mod' : 'high',
        scale: { step: group === 'A' ? 1 : group === 'B' ? 2 : 3, labels: ['A', 'B', 'E'], fill: false,
          names: ['Grupo A', 'Grupo B', 'Grupo E'] },
        note: 'Tratamento inicial: ' + tx,
        details: 'Para todos: cessação do tabagismo, vacinas (influenza, pneumocócica, covid-19, dTpa, zóster e VSR conforme idade), ' +
          'técnica inalatória, plano de ação e atividade física. Reabilitação pulmonar nos grupos B e E. ' +
          'Sintomas altos = mMRC ≥ 2 ou CAT ≥ 10. Grupo E = ≥ 2 exacerbações moderadas ou ≥ 1 com internação no último ano. ' + fu,
        warn: grade >= 3 ? 'VEF₁ < 50%: meça a SpO₂ em repouso; se ≤ 92%, faça gasometria arterial para avaliar oxigenoterapia domiciliar ' +
          '(PaO₂ ≤ 55 mmHg, ou ≤ 59 mmHg com cor pulmonale ou policitemia).' : undefined,
        edu: 'dpoc-oque',
      };
    },
    ref: 'Global Initiative for Chronic Obstructive Lung Disease (GOLD) — Global Strategy for Prevention, Diagnosis and Management of COPD, 2025 report.',
  });

  const GINA_STEPS = {
    2: 'Etapas 1–2: CI-formoterol em dose baixa conforme necessidade (alívio anti-inflamatório, sem manutenção diária).',
    3: 'Etapa 3: CI-formoterol em dose baixa de manutenção + alívio com o mesmo inalador (MART).',
    4: 'Etapa 4: CI-formoterol em dose média de manutenção + alívio (MART).',
    5: 'Etapa 5: acrescentar LAMA; encaminhar para avaliação fenotípica e considerar imunobiológico (anti-IgE, anti-IL-5/5R, anti-IL-4Rα, anti-TSLP); considerar CI-formoterol em dose alta.',
  };
  const GINA_TRACK2 = 'Via alternativa (alívio com SABA): etapa 1 — CI sempre que usar SABA; etapa 2 — CI dose baixa diário; ' +
    'etapa 3 — CI-LABA dose baixa; etapa 4 — CI-LABA dose média/alta; etapa 5 — como acima. Só use se o paciente tiver boa adesão ao controle diário.';
  const GINA_DOSES = 'Budesonida-formoterol 200/6 µg (dose medida): alívio — 1 inalação conforme necessidade; MART dose baixa — 1 inalação 1–2×/dia + alívio; ' +
    'MART dose média — 2 inalações 2×/dia + alívio. Máximo de 12 inalações/dia (adultos).';

  C.push({
    id: 'gina_inicial',
    name: 'Asma — tratamento inicial (GINA)',
    short: 'Etapa inicial de tratamento para adultos e adolescentes ≥ 12 anos.',
    tabs: ['clinica'],
    category: 'Pneumologia',
    keywords: 'asma gina tratamento inicial etapa step budesonida formoterol mart air corticoide inalatório',
    fields: [
      { id: 'p', label: 'Apresentação inicial', type: 'select', options: [
        { v: '2', t: 'Sintomas em menos de 4–5 dias por semana, função pulmonar normal ou pouco reduzida' },
        { v: '3', t: 'Sintomas na maioria dos dias ou despertar noturno ≥ 1×/semana' },
        { v: '4', t: 'Sintomas diários, despertar ≥ 1×/semana e função pulmonar baixa' },
        { v: '4e', t: 'Primeira apresentação com crise (exacerbação) aguda' }] },
    ],
    compute(v) {
      const crisis = v.p === '4e';
      const step = crisis ? 4 : +v.p;
      return {
        main: step === 2 ? 'Etapas 1–2' : 'Etapa ' + step,
        sub: 'Via preferencial: CI-formoterol como alívio' + (step >= 3 ? ' e manutenção' : ''),
        level: step === 2 ? 'low' : step === 3 ? 'mod' : 'high',
        note: GINA_STEPS[step] + (crisis || step === 4 ? ' Na doença grave não controlada ou na crise, considere curso curto de corticoide oral.' : ''),
        details: GINA_DOSES + ' ' + GINA_TRACK2 + ' Não trate asma só com SABA. Antes de iniciar: confirme o diagnóstico (espirometria com ' +
          'resposta ao broncodilatador ou PFE), ensine a técnica inalatória, entregue plano de ação escrito e reavalie em 2–3 meses.',
        warn: crisis ? 'Trate a crise primeiro: avalie gravidade (fala, FR, SpO₂, uso de musculatura acessória). SpO₂ < 90%, sonolência ou ' +
          'tórax silencioso indicam crise grave — encaminhe para emergência.' : undefined,
        edu: 'asma-remedios',
      };
    },
    ref: 'Global Initiative for Asthma (GINA) — Global Strategy for Asthma Management and Prevention, 2025 update; SBPT — Recomendações para o manejo da asma.',
  });

  C.push({
    id: 'gina_controle',
    name: 'Asma — controle dos sintomas (GINA)',
    short: 'Controle nas últimas 4 semanas e sugestão de ajuste de etapa.',
    tabs: ['clinica'],
    category: 'Pneumologia',
    keywords: 'asma gina controle sintomas bem controlada parcialmente não controlada ajuste etapa step up step down',
    checkLegend: 'Nas últimas 4 semanas, o paciente teve',
    fields: [
      { id: 'step', label: 'Etapa de tratamento atual (opcional)', type: 'select', optional: true, options: [
        { v: '0', t: 'Sem tratamento de controle' }, { v: '2', t: 'Etapas 1–2' }, { v: '3', t: 'Etapa 3' },
        { v: '4', t: 'Etapa 4' }, { v: '5', t: 'Etapa 5' }] },
      { id: 'd', label: 'Sintomas diurnos mais de 2×/semana', type: 'check', points: 1 },
      { id: 'n', label: 'Algum despertar noturno por asma', type: 'check', points: 1 },
      { id: 'r', label: 'Uso de medicação de alívio mais de 2×/semana (exceto antes de exercício)', type: 'check', points: 1 },
      { id: 'l', label: 'Alguma limitação de atividades por asma', type: 'check', points: 1 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      const [sub, level] = s === 0 ? ['Asma bem controlada', 'low'] : s <= 2 ? ['Asma parcialmente controlada', 'mod'] : ['Asma não controlada', 'high'];
      let note;
      if (v.step != null) {
        const st = +v.step;
        if (st === 0) note = 'Sem tratamento de controle: veja a calculadora “Asma — tratamento inicial (GINA)”. Nenhum adulto ou adolescente deve ficar só com SABA.';
        else if (s > 0 && st < 5) note = 'Após checar técnica, adesão, exposições e comorbidades, considere subir: ' + GINA_STEPS[st + 1];
        else if (s > 0) note = 'Já na etapa 5: confirme o diagnóstico e encaminhe a serviço de asma grave para fenotipagem e imunobiológico.';
        else if (st >= 3) note = 'Controlada: se estável há ≥ 3 meses e sem fatores de risco, considere reduzir para a menor etapa eficaz (sem suspender o CI).';
        else note = 'Controlada na etapa 1–2: mantenha o CI-formoterol conforme necessidade e reavalie periodicamente.';
      }
      return {
        main: s + ' / 4', sub, level,
        scale: { step: s === 0 ? 1 : s <= 2 ? 2 : 3, labels: ['Controlada', 'Parcial', 'Não controlada'], fill: false },
        note,
        details: 'Antes de subir de etapa: confirme o diagnóstico, observe a técnica inalatória, cheque adesão, exposições (tabaco, alérgenos, ' +
          'ocupação) e comorbidades (rinite, DRGE, obesidade, apneia do sono, ansiedade). Avalie também o risco de crises, independente do ' +
          'controle: ≥ 1 crise grave no último ano, VEF₁ baixo, uso de ≥ 3 frascos de SABA/ano, ausência de CI, tabagismo e eosinofilia. ' + GINA_DOSES,
        edu: 'asma-crise',
      };
    },
    ref: 'Global Initiative for Asthma (GINA) — Global Strategy for Asthma Management and Prevention, 2025 update.',
  });

  /* ============================== CUIDADOS PALIATIVOS ============================== */

  C.push({
    id: 'spict',
    name: 'SPICT-BR',
    short: 'Identifica pessoas com doença avançada que podem se beneficiar de cuidados paliativos.',
    tabs: ['paliativos', 'geriatria'],
    category: 'Identificação',
    keywords: 'spict spict-br cuidados paliativos identificação doença avançada fim de vida planejamento',
    groups: [
      { legend: 'Indicadores gerais de piora da saúde', ids: ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'], hidePts: true },
      { legend: 'Indicadores clínicos de doença avançada', ids: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'], hidePts: true },
    ],
    fields: [
      { id: 'g1', label: 'Internações hospitalares não programadas', type: 'check', points: 1 },
      { id: 'g2', label: 'Capacidade funcional ruim ou em declínio, pouco reversível (ex.: passa ≥ 50% do dia na cama ou cadeira)', type: 'check', points: 1 },
      { id: 'g3', label: 'Depende de outros para cuidados por problemas físicos e/ou mentais; cuidador precisa de mais apoio', type: 'check', points: 1 },
      { id: 'g4', label: 'Perda de peso significativa nos últimos 3–6 meses e/ou IMC baixo', type: 'check', points: 1 },
      { id: 'g5', label: 'Sintomas persistentes apesar do tratamento otimizado das condições de base', type: 'check', points: 1 },
      { id: 'g6', label: 'A pessoa ou a família pede cuidados paliativos, ou escolhe reduzir, suspender ou não iniciar tratamentos', type: 'check', points: 1 },
      { id: 'c1', label: 'Câncer: declínio funcional por câncer progressivo, ou frágil demais para tratamento oncológico / tratamento só para controle de sintomas', type: 'check', points: 1 },
      { id: 'c2', label: 'Demência/fragilidade: não se veste, anda ou come sem ajuda; come menos ou tem disfagia; incontinência; não se comunica; quedas ou fratura de fêmur; infecções ou pneumonia aspirativa recorrentes', type: 'check', points: 1 },
      { id: 'c3', label: 'Neurológica (Parkinson, ELA, EM, AVC): declínio físico e/ou cognitivo progressivo apesar da terapia ótima; disfagia progressiva; pneumonia aspirativa; insuficiência respiratória', type: 'check', points: 1 },
      { id: 'c4', label: 'Cardiovascular: IC ou DAC grave com dispneia ou dor torácica em repouso ou a mínimos esforços; doença vascular periférica grave e inoperável', type: 'check', points: 1 },
      { id: 'c5', label: 'Respiratória: doença pulmonar crônica grave com dispneia em repouso ou a mínimos esforços entre exacerbações; hipoxemia com O₂ domiciliar; ventilação necessária ou contraindicada', type: 'check', points: 1 },
      { id: 'c6', label: 'Renal: DRC estágio 4–5 (TFG < 30) com piora clínica; ou decisão de não iniciar ou de suspender diálise', type: 'check', points: 1 },
      { id: 'c7', label: 'Hepática: cirrose com ≥ 1 complicação no último ano (ascite refratária, encefalopatia, síndrome hepatorrenal, PBE, sangramento varicoso recorrente); transplante contraindicado', type: 'check', points: 1 },
      { id: 'c8', label: 'Outras: deterioração e risco de morrer por outra condição ou complicação irreversível, sem tratamento que mude o desfecho', type: 'check', points: 1 },
    ],
    compute(v) {
      const g = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'].filter((k) => v[k]).length;
      const c = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'].filter((k) => v[k]).length;
      const pos = g >= 2 || c >= 1;
      return {
        main: `${g} geral(is) · ${c} clínico(s)`,
        sub: pos ? 'Pode se beneficiar de cuidados paliativos' : 'Sem indicadores suficientes no momento',
        level: pos ? 'mod' : 'low',
        details: 'Critério usado em estudos: ≥ 2 indicadores gerais e/ou ≥ 1 indicador clínico de doença avançada. Se positivo: revise o tratamento ' +
          'e os medicamentos, avalie e trate sintomas, converse sobre valores, prioridades e preferências, registre um plano de cuidados ' +
          'antecipado e apoie a família e os cuidadores. O SPICT é uma ferramenta de identificação, não de prognóstico; reavalie quando a situação mudar.',
      };
    },
    ref: 'Highet G et al. BMJ Support Palliat Care 2014 (SPICT); Supportive and Palliative Care Indicators Tool, versão SPICT-BR (2022).',
  });

  C.push({
    id: 'pps',
    name: 'Palliative Performance Scale (PPS)',
    short: 'Funcionalidade em cuidados paliativos, de 100% a 10%.',
    tabs: ['paliativos'],
    category: 'Prognóstico',
    keywords: 'pps palliative performance scale funcionalidade paliativo prognóstico karnofsky',
    fields: [
      { id: 'pps', label: 'Nível (leia da esquerda para a direita: deambulação, atividade, autocuidado, ingesta, consciência)', type: 'select', options: [
        { v: '100', t: '100% — Deambulação completa; atividade normal, sem evidência de doença; autocuidado completo; ingesta normal; consciência plena' },
        { v: '90', t: '90% — Completa; atividade normal, alguma evidência de doença; autocuidado completo; ingesta normal; plena' },
        { v: '80', t: '80% — Completa; atividade normal com esforço, alguma evidência de doença; completo; normal ou reduzida; plena' },
        { v: '70', t: '70% — Reduzida; incapaz para o trabalho, doença significativa; completo; normal ou reduzida; plena' },
        { v: '60', t: '60% — Reduzida; incapaz para hobbies/trabalho doméstico, doença significativa; assistência ocasional; normal ou reduzida; plena ou confusão' },
        { v: '50', t: '50% — Maior parte do tempo sentado ou deitado; incapaz para qualquer trabalho, doença extensa; assistência considerável; normal ou reduzida; plena ou confusão' },
        { v: '40', t: '40% — Maior parte do tempo acamado; incapaz para a maioria das atividades; assistência quase completa; normal ou reduzida; plena, sonolência ou confusão' },
        { v: '30', t: '30% — Totalmente acamado; incapaz para qualquer atividade; dependência completa; normal ou reduzida; plena, sonolência ou confusão' },
        { v: '20', t: '20% — Totalmente acamado; dependência completa; ingesta mínima (goles); plena, sonolência ou confusão' },
        { v: '10', t: '10% — Totalmente acamado; dependência completa; apenas cuidados com a boca; sonolência ou coma' }] },
    ],
    compute(v) {
      const n = +v.pps;
      const [sub, level] = n >= 70 ? ['Funcionalidade preservada', 'low'] : n >= 40 ? ['Funcionalidade reduzida', 'mod'] : ['Funcionalidade muito reduzida', 'high'];
      return {
        main: 'PPS ' + n + '%', sub, level,
        details: 'Classifique pela coluna mais à esquerda que descreve o paciente (a deambulação tem peso maior). Em coortes de cuidados ' +
          'paliativos, PPS ≤ 30% associa-se a sobrevida medida em dias a poucas semanas, 40–60% a semanas a poucos meses, e ≥ 70% a meses — ' +
          'com grande variação individual. Use em série: a queda do PPS é mais informativa que um valor isolado. É um dos componentes do PPI.',
      };
    },
    ref: 'Anderson F et al. J Palliat Care 1996; Victoria Hospice Society — PPS versão 2 (2001); Lau F et al. J Pain Symptom Manage 2006.',
  });

  C.push({
    id: 'ppi',
    name: 'Índice Prognóstico Paliativo (PPI)',
    short: 'Estima sobrevida em semanas em pacientes com doença avançada.',
    tabs: ['paliativos'],
    category: 'Prognóstico',
    keywords: 'ppi palliative prognostic index prognóstico sobrevida paliativo semanas morita',
    fields: [
      { id: 'pps', label: 'PPS', type: 'select', scored: true, options: [
        { v: '0', t: '≥ 60%' }, { v: '2.5', t: '30–50%' }, { v: '4', t: '10–20%' }] },
      { id: 'oral', label: 'Ingesta oral', type: 'select', scored: true, options: [
        { v: '0', t: 'Normal' }, { v: '1', t: 'Reduzida, mas mais que poucas colheradas' }, { v: '2.5', t: 'Gravemente reduzida (poucas colheradas ou menos)' }] },
      { id: 'edema', label: 'Edema', type: 'check', points: 1 },
      { id: 'dysp', label: 'Dispneia em repouso', type: 'check', points: 3.5 },
      { id: 'delir', label: 'Delirium (não causado apenas por um medicamento)', type: 'check', points: 4 },
    ],
    compute(v) {
      const s = sumPoints(this, v);
      let sub, level;
      if (s > 6) { sub = 'Sobrevida provável < 3 semanas'; level = 'high'; }
      else if (s > 4) { sub = 'Sobrevida provável < 6 semanas'; level = 'mod'; }
      else { sub = 'Sobrevida provável > 6 semanas'; level = 'low'; }
      return {
        main: fmt(s) + ' pontos', sub, level,
        scale: { step: s > 6 ? 3 : s > 4 ? 2 : 1, labels: ['> 6 sem.', '< 6 sem.', '< 3 sem.'], fill: false },
        details: 'No estudo original (pacientes com câncer em hospice), PPI > 6 previu sobrevida < 3 semanas com sensibilidade de 80% e ' +
          'especificidade de 85%; PPI > 4 previu < 6 semanas. A estimativa orienta conversas e planejamento, mas não deve ser usada ' +
          'isoladamente para decisões individuais; comunique-a como faixa de tempo e com incerteza.',
      };
    },
    ref: 'Morita T et al. Support Care Cancer 1999;7:128-133; Stone CA et al. Palliat Med 2008 (validação).',
  });

  C.push({
    id: 'ecog',
    name: 'ECOG / Karnofsky',
    short: 'Capacidade funcional (performance status) com equivalência aproximada entre as escalas.',
    tabs: ['paliativos', 'clinica'],
    category: 'Prognóstico',
    keywords: 'ecog karnofsky kps performance status capacidade funcional oncologia paliativo zubrod',
    fields: [
      { id: 'e', label: 'Situação do paciente', type: 'select', options: [
        { v: '0', t: 'ECOG 0 — Totalmente ativo, sem restrições' },
        { v: '1', t: 'ECOG 1 — Restrito para esforço intenso, mas deambula e faz trabalho leve' },
        { v: '2', t: 'ECOG 2 — Deambula e faz autocuidado, mas não trabalha; fora do leito > 50% do dia' },
        { v: '3', t: 'ECOG 3 — Autocuidado limitado; no leito ou cadeira > 50% do dia' },
        { v: '4', t: 'ECOG 4 — Completamente incapacitado; totalmente restrito ao leito ou cadeira' }] },
    ],
    compute(v) {
      const e = +v.e;
      const kps = ['90–100%', '70–80%', '50–60%', '30–40%', '10–20%'][e];
      return {
        main: `ECOG ${e} · Karnofsky ≈ ${kps}`,
        sub: ['Totalmente ativo', 'Sintomático, ambulatorial', 'Fora do leito > 50% do dia', 'No leito > 50% do dia', 'Restrito ao leito'][e],
        level: e <= 1 ? 'low' : e === 2 ? 'mod' : 'high',
        details: 'A equivalência entre ECOG e Karnofsky é aproximada. ECOG ≥ 3 (Karnofsky ≤ 40%) costuma contraindicar quimioterapia citotóxica ' +
          'e sinaliza a necessidade de discutir objetivos de cuidado; ECOG 5 corresponde a óbito.',
      };
    },
    ref: 'Oken MM et al. Am J Clin Oncol 1982 (ECOG); Karnofsky DA, Burchenal JH 1949.',
  });

  const ESAS_ITEMS = [
    ['dor', 'Dor'], ['cans', 'Cansaço (falta de energia)'], ['sono', 'Sonolência'], ['nau', 'Náusea (enjoo)'],
    ['apet', 'Falta de apetite'], ['ar', 'Falta de ar'], ['dep', 'Depressão (tristeza)'], ['ans', 'Ansiedade (nervosismo)'],
    ['bem', 'Bem-estar (0 = melhor, 10 = pior)'],
  ];
  C.push({
    id: 'esas',
    name: 'ESAS-r (Edmonton)',
    short: 'Intensidade de 9 sintomas comuns em cuidados paliativos, de 0 a 10.',
    tabs: ['paliativos'],
    category: 'Sintomas',
    keywords: 'esas esas-r edmonton sintomas dor cansaço náusea falta de ar ansiedade depressão paliativo',
    fields: ESAS_ITEMS.map(([id, label]) => ({ id, label, type: 'number', unit: '0–10', min: 0, max: 10 })),
    compute(v) {
      const total = ESAS_ITEMS.reduce((a, [id]) => a + v[id], 0);
      const sev = ESAS_ITEMS.filter(([id]) => v[id] >= 7).map(([, l]) => l.split(' (')[0]);
      const mod = ESAS_ITEMS.filter(([id]) => v[id] >= 4 && v[id] < 7).map(([, l]) => l.split(' (')[0]);
      return {
        main: total + ' / 90',
        sub: sev.length ? `${sev.length} sintoma(s) intenso(s)` : mod.length ? `${mod.length} sintoma(s) moderado(s)` : 'Sintomas leves ou ausentes',
        level: sev.length ? 'high' : mod.length ? 'mod' : 'low',
        note: (sev.length ? 'Intensos (7–10): ' + sev.join(', ') + '. ' : '') + (mod.length ? 'Moderados (4–6): ' + mod.join(', ') + '.' : '') || undefined,
        details: 'O paciente marca a intensidade no momento da avaliação (ou o cuidador, se ele não puder). Sintomas ≥ 4 merecem avaliação ' +
          'detalhada e plano de manejo; ≥ 7 pedem intervenção prioritária. O total (0–90) serve para acompanhar a carga de sintomas ao longo do tempo. ' +
          'Repita a escala em cada visita.',
      };
    },
    ref: 'Watanabe SM et al. J Pain Symptom Manage 2011 (ESAS-r); Monteiro DR et al. Rev Gaúcha Enferm 2013 (versão brasileira).',
  });

  window.CALCS = C;
  window.CALC_UTILS = { sumPoints, fmt };
})();
