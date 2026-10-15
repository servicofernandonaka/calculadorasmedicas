/* LabCore APS — motor determinístico (sem DOM). Funções puras que leem os parâmetros do GUIDELINES_REGISTRY (js/labcore-registry.js).
   Fórmulas: CKD-EPI 2021 sem raça (Inker, NEJM 2021), FIB-4, Friedewald/Sampson, Mentzer, Katz, Ca corrigido, HOMA-IR, ânion gap.
   Nenhum dado de paciente sai daqui; as funções de governança só manipulam o Registry. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./labcore-registry.js'));
  else root.LabCore = factory(root.LabCoreRegistry);
})(typeof self !== 'undefined' ? self : this, function (RegMod) {
  'use strict';
  const REGISTRY = RegMod.GUIDELINES_REGISTRY;

  /* ---------- formatação pt-BR ---------- */
  const fmt = (n, d) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d == null ? 1 : d, maximumFractionDigits: d == null ? 1 : d });
  const MES_ABR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const MES_EXT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const isoDate = (iso) => (/^\d{4}-\d{2}-\d{2}/.test(String(iso)) ? String(iso).slice(0, 10) : null);
  const mesAno = (iso) => { const d = isoDate(iso); return d ? `${MES_ABR[+d.slice(5, 7) - 1]}/${d.slice(0, 4)}` : 'sem data'; };
  const mesAnoExt = (iso) => { const d = isoDate(iso); return d ? `${MES_EXT[+d.slice(5, 7) - 1]}/${d.slice(0, 4)}` : 'sem data'; };
  const daysSince = (iso, nowISO) => {
    const a = isoDate(iso), b = isoDate(nowISO);
    if (!a || !b) return null;
    return Math.floor((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
  };

  /* ---------- entrada: campos, normalização de unidades e validação de plausibilidade ----------
     min/max são limites de plausibilidade (erro de digitação), não pontos de corte clínicos. */
  const F = (id, label, unit, min, max, group) => ({ id, label, unit, min, max, group });
  const FIELDS = [
    F('hb', 'Hemoglobina', 'g/dL', 2, 25, 'hemato'), F('vcm', 'VCM', 'fL', 40, 150, 'hemato'), F('rbc', 'Eritrócitos', '10⁶/µL', 1, 10, 'hemato'),
    F('plaq', 'Plaquetas', '10⁹/L', 1, 2000, 'hemato'), F('ferro', 'Ferro sérico', 'µg/dL', 1, 1000, 'hemato'), F('ctlf', 'CTLF (TIBC)', 'µg/dL', 50, 800, 'hemato'),
    F('ferritina', 'Ferritina', 'ng/mL', 1, 10000, 'hemato'),
    F('cr', 'Creatinina', 'mg/dL', 0.1, 20, 'renal'), F('rac', 'RAC urinária', 'mg/g', 0, 20000, 'renal'),
    F('na', 'Sódio', 'mEq/L', 90, 190, 'eletro'), F('k', 'Potássio', 'mEq/L', 1.5, 10, 'eletro'), F('cl', 'Cloro', 'mEq/L', 60, 140, 'eletro'),
    F('hco3', 'Bicarbonato', 'mEq/L', 3, 50, 'eletro'), F('ca', 'Cálcio total', 'mg/dL', 4, 18, 'eletro'), F('albumina', 'Albumina', 'g/dL', 1, 6.5, 'eletro'),
    F('glicemia', 'Glicemia', 'mg/dL', 10, 1500, 'metab'), F('hba1c', 'HbA1c', '%', 3, 20, 'metab'), F('insulina', 'Insulina', 'µUI/mL', 0.5, 500, 'metab'),
    F('ast', 'AST (TGO)', 'U/L', 3, 20000, 'hepat'), F('alt', 'ALT (TGP)', 'U/L', 3, 20000, 'hepat'), F('ldh', 'LDH', 'U/L', 20, 20000, 'hepat'), F('folato', 'Folato', 'ng/mL', 0.5, 100, 'hepat'),
    F('ct', 'Colesterol total', 'mg/dL', 40, 1500, 'lipid'), F('hdl', 'HDL', 'mg/dL', 5, 200, 'lipid'), F('tg', 'Triglicerídeos', 'mg/dL', 20, 10000, 'lipid'),
    F('tsh', 'TSH', 'mUI/L', 0.001, 500, 'tireo'), F('t4l', 'T4 livre', 'ng/dL', 0.05, 20, 'tireo'),
  ];
  const FIELD = Object.fromEntries(FIELDS.map((f) => [f.id, f]));

  /* Aceita vírgula ou ponto ("1,4", "1.4", "1.234,5"); devolve null se não for número. */
  function parseNum(s) {
    if (typeof s === 'number') return Number.isFinite(s) ? s : null;
    let t = String(s == null ? '' : s).trim().replace(/\s/g, '');
    if (!t) return null;
    if (t.includes(',') && t.includes('.')) t = t.replace(/\./g, '').replace(',', '.');
    else t = t.replace(',', '.');
    if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
    return Number(t);
  }

  /* raw: { idade, sexo:'F'|'M', gestante, dm, icc, persistente, flags:{hemolise,lipemia,ictericia,biotina}, <campos de FIELDS como texto ou número> } */
  function normalize(raw) {
    const v = {}, notes = [], warnings = [];
    FIELDS.forEach((f) => {
      let x = parseNum(raw[f.id]);
      if (x == null) { if (raw[f.id] != null && String(raw[f.id]).trim() !== '') warnings.push(`${f.label}: valor "${raw[f.id]}" não é um número.`); return; }
      if (f.id === 'plaq' && x > 1000) { notes.push(`Plaquetas ${fmt(x, 0)} /mm³ convertidas para ${fmt(x / 1000, 0)} ×10⁹/L.`); x = x / 1000; }
      if (f.id === 'rbc' && x > 1000) { notes.push(`Eritrócitos ${fmt(x, 0)} /mm³ convertidos para ${fmt(x / 1e6, 2)} ×10⁶/µL.`); x = x / 1e6; }
      if (f.id === 'albumina' && x > 10) { notes.push(`Albumina ${fmt(x, 1)} g/L convertida para ${fmt(x / 10, 1)} g/dL.`); x = x / 10; }
      if (x < f.min || x > f.max) { warnings.push(`${f.label} ${fmt(x, 2)} ${f.unit} fora da faixa plausível (${f.min} a ${f.max}); valor ignorado. Confira a unidade.`); return; }
      v[f.id] = x;
    });
    const age = parseNum(raw.idade);
    if (age != null && age >= 18 && age <= 120) v.idade = age;
    else if (age != null) warnings.push(`Idade ${age} fora de 18 a 120 anos: as fórmulas deste módulo são para adultos; idade ignorada.`);
    v.sexo = raw.sexo === 'F' || raw.sexo === 'M' ? raw.sexo : null;
    v.gestante = !!raw.gestante;
    ['dm', 'icc', 'persistente'].forEach((k) => { v[k] = !!raw[k]; });
    v.flags = Object.assign({ hemolise: false, lipemia: false, ictericia: false, biotina: false }, raw.flags || {});
    return { v, notes, warnings };
  }

  /* ---------- acesso ao Registry ---------- */
  const gp = (reg, gid) => {
    const out = {};
    Object.entries(reg.guidelines[gid].params).forEach(([k, p]) => { out[k] = p.value; });
    return out;
  };
  const selo = (reg, gid) => `[${reg.guidelines[gid].selo} | Auditado: ${mesAno(reg.guidelines[gid].lastAuditedISO)}]`;

  /* ---------- 1) TFGe CKD-EPI 2021 + KDIGO ---------- */
  function ckdepi(scr, idade, sexo, reg) {
    const p = gp(reg || REGISTRY, 'ckdepi');
    const fem = sexo === 'F';
    const kappa = fem ? p['fem.kappa'] : p['male.kappa'];
    const alpha = fem ? p['fem.alpha'] : p['male.alpha'];
    const e = scr <= kappa ? alpha : p['exp.high'];
    return p.const * Math.pow(scr / kappa, e) * Math.pow(p.age, idade) * (fem ? p['fem.factor'] : 1);
  }
  const G_ORDER = ['G1', 'G2', 'G3a', 'G3b', 'G4', 'G5'];
  function stageG(tfg, reg) {
    const p = gp(reg, 'kdigo');
    if (tfg >= p['gfr.g1']) return 'G1';
    if (tfg >= p['gfr.g2']) return 'G2';
    if (tfg >= p['gfr.g3a']) return 'G3a';
    if (tfg >= p['gfr.g3b']) return 'G3b';
    if (tfg >= p['gfr.g4']) return 'G4';
    return 'G5';
  }
  function stageA(rac, reg) {
    const p = gp(reg, 'kdigo');
    if (rac > p['alb.a3']) return 'A3';
    if (rac >= p['alb.a2']) return 'A2';
    return 'A1';
  }
  /* Mapa de calor KDIGO (cor = risco de progressão/complicações): baixo, moderado, alto, muito alto */
  const RISCO = {
    G1: ['baixo', 'moderado', 'alto'], G2: ['baixo', 'moderado', 'alto'], G3a: ['moderado', 'alto', 'muito alto'],
    G3b: ['alto', 'muito alto', 'muito alto'], G4: ['muito alto', 'muito alto', 'muito alto'], G5: ['muito alto', 'muito alto', 'muito alto'],
  };
  const riscoKdigo = (g, a) => RISCO[g][['A1', 'A2', 'A3'].indexOf(a)];

  function renal(v, reg) {
    if (v.cr == null || v.idade == null || !v.sexo) return null;
    const p = gp(reg, 'kdigo');
    const tfg = ckdepi(v.cr, v.idade, v.sexo, reg);
    const g = stageG(tfg, reg);
    const a = v.rac != null ? stageA(v.rac, reg) : null;
    const det = [];
    const rec = [];
    let level = g === 'G1' || g === 'G2' ? 'low' : g === 'G3a' ? 'mod' : 'high';
    let risco = null;
    if (a) {
      risco = riscoKdigo(g, a);
      level = risco === 'baixo' ? 'low' : risco === 'moderado' ? 'mod' : 'high';
      det.push(`Matriz de risco KDIGO (${g}/${a}): risco ${risco}.`);
    } else det.push(`Sem RAC: a matriz de risco KDIGO precisa da albuminúria. Solicite a razão albumina/creatinina urinária.`);
    if (!v.persistente) det.push('Atenção: o diagnóstico de DRC exige alteração persistente por mais de 3 meses; um exame isolado pode refletir lesão aguda.');
    // Indicações de tratamento (apenas se há DRC confirmada pelos critérios informados)
    const drc = v.persistente && (g !== 'G1' && g !== 'G2' || (a && a !== 'A1'));
    if (drc) {
      if (tfg >= p['sglt2.egfrMin'] && (v.dm || v.icc || (a && v.rac >= p['sglt2.racMin']))) {
        rec.push(`iSGLT2: considerar (TFGe ≥ ${fmt(p['sglt2.egfrMin'], 0)} e ${v.dm ? 'diabetes' : v.icc ? 'insuficiência cardíaca' : 'RAC ≥ ' + fmt(p['sglt2.racMin'], 0) + ' mg/g'}).`);
      }
      if (a && (a === 'A3' || (a === 'A2' && v.dm))) rec.push(`IECA/BRA: considerar${v.dm ? ' (diabetes com albuminúria)' : ' (albuminúria grave)'}, titulando até a dose máxima tolerada com controle de K+ e creatinina.`);
      else if (a === 'A2' && !v.dm) rec.push('IECA/BRA: sugerido em albuminúria moderada sem diabetes, se hipertenso ou conforme avaliação clínica.');
      if (tfg < p['neph.egfr'] || (a && v.rac >= p['neph.rac'])) rec.push(`Encaminhar à Nefrologia (TFGe < ${fmt(p['neph.egfr'], 0)} ou RAC ≥ ${fmt(p['neph.rac'], 0)} mg/g).`);
    } else if (v.persistente === false && (g === 'G3a' || g === 'G3b' || g === 'G4' || g === 'G5' || (a && a !== 'A1'))) {
      rec.push('Repetir creatinina e RAC em até 3 meses para confirmar cronicidade antes de decidir tratamento.');
    }
    return {
      id: 'tfge', title: 'TFGe CKD-EPI 2021 (sem raça)', main: `${fmt(tfg, 0)} mL/min/1,73 m²`, sub: `${g}${a ? ' / ' + a : ''}`, level,
      grade: risco === 'muito alto' ? 3 : risco === 'alto' ? 2 : undefined, value: tfg, stage: g, albStage: a, risk: risco, guideline: ['ckdepi', 'kdigo'], details: det, recs: rec,
    };
  }

  /* ---------- 2) FIB-4 e De Ritis ---------- */
  function fib4(v, reg) {
    if (v.idade == null || v.ast == null || v.alt == null || v.plaq == null) return null;
    const p = gp(reg, 'fib4');
    const val = (v.idade * v.ast) / (v.plaq * Math.sqrt(v.alt));
    let sub, level, rec;
    if (v.idade < p['young.maxAge']) { sub = `Inconclusivo (idade < ${p['young.maxAge']} anos)`; level = 'info'; rec = 'FIB-4 não é validado abaixo de 35 anos; avaliar fibrose por outros meios se houver risco.'; }
    else {
      const old = v.idade >= p['old.minAge'];
      const lo = old ? p['old.low'] : p['mid.low'], hi = old ? p['old.high'] : p['mid.high'];
      if (val < lo) { sub = 'Baixo risco de fibrose avançada'; level = 'low'; rec = 'Manter controle dos fatores de risco metabólicos e repetir a estratificação periodicamente.'; }
      else if (val > hi) { sub = 'Alto risco (F3-F4)'; level = 'high'; rec = 'Encaminhar à Hepatologia.'; }
      else { sub = old ? 'Intermediário' : 'Zona cinzenta'; level = 'mod'; rec = 'Solicitar elastografia hepática (ou teste não invasivo de segunda linha).'; }
    }
    const ritis = v.ast / v.alt;
    return { id: 'fib4', title: 'FIB-4', main: fmt(val, 2), sub, level, value: val, guideline: ['fib4'], details: [`Razão De Ritis (AST/ALT): ${fmt(ritis, 2)}.`], ritis, recs: [rec] };
  }

  /* ---------- 3) Painel lipídico ---------- */
  function lipidos(v, reg) {
    if (v.ct == null || v.hdl == null) return null;
    const p = gp(reg, 'lipid');
    const naoHdl = v.ct - v.hdl;
    const det = [`Colesterol não-HDL: ${fmt(naoHdl, 0)} mg/dL.`];
    if (v.tg != null) det.push(`Razão TG/HDL: ${fmt(v.tg / v.hdl, 2)}.`);
    let ldl = null, metodo = null, level = 'info', sub = '';
    if (v.tg != null) {
      if (v.tg <= p['fw.maxTg']) { ldl = v.ct - v.hdl - v.tg / p['fw.divisor']; metodo = 'Friedewald'; }
      else if (v.tg <= p['sampson.maxTg']) {
        ldl = v.ct / p['sampson.a'] - v.hdl / p['sampson.b'] - (v.tg / p['sampson.c'] + (v.tg * naoHdl) / p['sampson.d'] - (v.tg * v.tg) / p['sampson.e']) - p['sampson.f'];
        metodo = 'Sampson (NIH)';
        sub = `Friedewald bloqueado (TG > ${fmt(p['fw.maxTg'], 0)} mg/dL)`;
      }
    }
    let alerta = null;
    if (v.tg != null && v.tg > p['tg.pancreatitis']) {
      alerta = { level: 'high', title: 'Triglicerídeos muito altos', text: `TG ${fmt(v.tg, 0)} mg/dL (> ${fmt(p['tg.pancreatitis'], 0)}): risco de pancreatite aguda. LDL calculado não é confiável; usar LDL direto e tratar a hipertrigliceridemia.` };
      level = 'high'; sub = `TG > ${fmt(p['tg.pancreatitis'], 0)} mg/dL: LDL não calculado`;
    }
    if (ldl != null && ldl < 0) { ldl = null; det.push('LDL calculado negativo: resultado inválido; solicite LDL direto.'); }
    return {
      id: 'lipid', title: ldl != null ? `LDL-c (${metodo})` : 'Painel lipídico', main: ldl != null ? `${fmt(ldl, 0)} mg/dL` : `Não-HDL ${fmt(naoHdl, 0)} mg/dL`,
      sub: sub || (ldl != null ? '' : v.tg == null ? 'Sem TG: LDL não calculado' : ''), level, value: ldl, naoHdl, metodo, guideline: ['lipid'], details: det, alerta,
    };
  }

  /* ---------- 4) Hematimetria ---------- */
  function hematimetria(v, reg) {
    const p = gp(reg, 'hemato');
    const out = [];
    if (v.vcm != null && v.rbc != null) {
      const m = v.vcm / v.rbc;
      const micro = v.vcm < p['micro.vcm'];
      let sub, level = 'info';
      if (!micro) sub = `VCM não é microcítico (< ${fmt(p['micro.vcm'], 0)} fL): o índice de Mentzer só se aplica à microcitose.`;
      else if (m > p['mentzer.cut']) { sub = 'Sugere anemia ferropriva'; level = 'mod'; }
      else if (m < p['mentzer.cut']) { sub = 'Sugere traço talassêmico'; level = 'mod'; }
      else sub = 'Indeterminado (no ponto de corte)';
      out.push({ id: 'mentzer', title: 'Índice de Mentzer', main: fmt(m, 1), sub, level, value: m, guideline: ['hemato'], details: ['Índice sugestivo, não diagnóstico: confirmar com ferritina/saturação e, se indicado, eletroforese de hemoglobina.'] });
    }
    if (v.ferro != null && v.ctlf != null) {
      const t = (v.ferro / v.ctlf) * 100;
      const low = t < p['tsat.low'];
      const det = ['Ferritina é reagente de fase aguda: pode estar normal ou alta em inflamação, infecção, doença hepática ou neoplasia mesmo com deficiência de ferro.'];
      if (v.ferritina != null) det.unshift(`Ferritina informada: ${fmt(v.ferritina, 0)} ng/mL.`);
      out.push({ id: 'tsat', title: 'Saturação de transferrina', main: `${fmt(t, 0)}%`, sub: low ? `Baixa (< ${fmt(p['tsat.low'], 0)}%)` : '', level: low ? 'mod' : 'info', value: t, guideline: ['hemato'], details: det });
    }
    return out;
  }

  /* ---------- 5) Hidroeletrolítico e metabólico ---------- */
  function metabolico(v, reg) {
    const p = gp(reg, 'eletrolitos');
    const out = [];
    if (v.na != null && v.glicemia != null) {
      const x = v.na + p['katz.factor'] * (v.glicemia - p['katz.glucoseRef']);
      out.push({ id: 'na_corr', title: 'Sódio corrigido pela glicemia', main: `${fmt(x, 1)} mEq/L`, sub: '', level: 'info', value: x, guideline: ['eletrolitos'], details: ['Na + 0,016 × (glicemia − 100).'] });
    }
    if (v.ca != null && v.albumina != null) {
      const x = v.ca + p['ca.factor'] * (p['ca.albRef'] - v.albumina);
      out.push({ id: 'ca_corr', title: 'Cálcio corrigido pela albumina', main: `${fmt(x, 1)} mg/dL`, sub: '', level: 'info', value: x, guideline: ['eletrolitos'], details: ['Ca + 0,8 × (4,0 − albumina). Em dúvida, dosar cálcio iônico.'] });
    }
    if (v.glicemia != null && v.insulina != null) {
      const x = (v.glicemia * v.insulina) / p['homa.divisor'];
      out.push({ id: 'homa', title: 'HOMA-IR', main: fmt(x, 2), sub: '', level: 'info', value: x, guideline: ['eletrolitos'], details: ['Glicemia e insulina em jejum. O ponto de corte depende do método e da população; sem corte padronizado no Registry.'] });
    }
    if (v.na != null && v.cl != null && v.hco3 != null) {
      const x = v.na - (v.cl + v.hco3);
      out.push({ id: 'ag', title: 'Ânion gap sérico', main: `${fmt(x, 0)} mEq/L`, sub: '', level: 'info', value: x, guideline: ['eletrolitos'], details: ['Na − (Cl + HCO₃). Sem K+. Não corrigido para albumina; a faixa normal depende do método do laboratório.'] });
    }
    return out;
  }

  /* ---------- filtros pré-analíticos ---------- */
  function preAnalitico(v, reg) {
    const p = gp(reg, 'prean');
    const al = [];
    const f = v.flags;
    if (f.hemolise) {
      const lista = [];
      if (v.k != null && v.k > p['k.uln']) lista.push(`K+ ${fmt(v.k, 1)} mEq/L`);
      if (v.ast != null && v.ast > p['ast.uln']) lista.push(`AST ${fmt(v.ast, 0)} U/L`);
      if (v.ldh != null && v.ldh > p['ldh.uln']) lista.push(`LDH ${fmt(v.ldh, 0)} U/L`);
      if (v.folato != null && v.folato > p['folato.uln']) lista.push(`folato ${fmt(v.folato, 1)} ng/mL`);
      if (lista.length) {
        let t = `Amostra hemolisada com ${lista.join(', ')} elevado(s): o rompimento das hemácias libera K+, AST, LDH e folato para o soro, produzindo valores falsamente altos (pseudo-hipercalemia). Não decida conduta só por este resultado: recoletar sem garroteamento prolongado e sem punho fechado repetido, com transporte rápido.`;
        if (v.k != null && v.k > p['k.ecg']) t += ` K+ > ${fmt(p['k.ecg'], 1)} mEq/L: fazer ECG enquanto aguarda a recoleta.`;
        al.push({ level: 'high', title: 'Hemólise: resultados não confiáveis', text: t });
      } else al.push({ level: 'mod', title: 'Hemólise assinalada', text: 'K+, AST, LDH e folato podem estar falsamente aumentados nesta amostra. Se algum for decisivo para a conduta, recoletar.' });
    } else if (v.k != null && v.k > p['k.ecg']) {
      al.push({ level: 'high', title: `K+ > ${fmt(p['k.ecg'], 1)} mEq/L`, text: 'Fazer ECG e avaliar clinicamente; confirmar com recoleta se a amostra for suspeita de hemólise (sem garroteamento prolongado).' });
    }
    if (f.lipemia) al.push({ level: 'mod', title: 'Lipemia intensa', text: 'Pode interferir em dosagens fotométricas e em eletrodo indireto (ex.: pseudo-hiponatremia) e invalida o LDL calculado. Pedir ao laboratório tratamento da amostra ou recoletar em jejum.' });
    if (f.ictericia) al.push({ level: 'mod', title: 'Icterícia na amostra', text: 'Bilirrubina elevada pode interferir em métodos colorimétricos (ex.: creatinina pelo método de Jaffé e lipídios). Confirmar o método com o laboratório.' });
    if (f.biotina) {
      const t = v.tsh != null || v.t4l != null ? ' TSH/T4 livre informados: padrão discordante da clínica (ex.: TSH baixo com T4L alto sem sintomas) sugere artefato.' : '';
      al.push({ level: 'mod', title: 'Biotina / polivitamínico', text: 'Biotina interfere nos imunoensaios com biotina-estreptavidina (TSH, T4L, T3, troponina, PTH, vitamina D e outros), com resultados falsamente altos (ensaios competitivos) ou baixos (ensaios sanduíche).' + t + ' Repetir após suspender a biotina pelo prazo orientado pelo fabricante do ensaio ou pelo laboratório.' });
    }
    return al;
  }

  /* ---------- análise completa ---------- */
  function analyze(raw, regIn) {
    const reg = regIn || REGISTRY;
    const { v, notes, warnings } = normalize(raw);
    if (v.gestante) warnings.push('Gestante: as fórmulas e cortes deste módulo são para adultos não gestantes (TFGe, lipídios e hematimetria mudam na gestação). Interprete com valores de referência gestacionais.');
    const items = [];
    const push = (x) => { if (x) items.push(x); };
    push(renal(v, reg));
    push(fib4(v, reg));
    push(lipidos(v, reg));
    hematimetria(v, reg).forEach(push);
    metabolico(v, reg).forEach(push);
    const alerts = preAnalitico(v, reg);
    items.forEach((it) => { if (it.alerta) alerts.push(it.alerta); });
    if (v.cr != null && (v.idade == null || !v.sexo)) warnings.push('TFGe precisa de idade e sexo biológico.');
    if (v.ast != null && v.alt != null && v.plaq != null && v.idade == null) warnings.push('FIB-4 precisa da idade.');
    return { v, items, alerts, notes, warnings, reg };
  }

  /* ---------- Gerador SOAP / e-SUS ---------- */
  function soap(raw, a, nowISO) {
    const v = a.v, reg = a.reg;
    const L = [];
    const dem = [v.idade != null ? `${fmt(v.idade, 0)} anos` : null, v.sexo ? (v.sexo === 'F' ? 'sexo biológico feminino' : 'sexo biológico masculino') : null, v.gestante ? 'gestante' : null].filter(Boolean).join(', ');
    L.push(`Avaliação laboratorial (LabCore APS) — ${nowISO ? nowISO.split('-').reverse().join('/') : ''}`);
    L.push('');
    L.push(`S: ${dem ? 'Paciente ' + dem + '. ' : ''}[queixas e história a completar no atendimento]`);
    const ex = FIELDS.filter((f) => v[f.id] != null).map((f) => `${f.label} ${fmt(v[f.id], v[f.id] % 1 === 0 ? 0 : 2)} ${f.unit}`);
    L.push(`O: ${ex.length ? ex.join('; ') + '.' : 'sem exames informados.'}`);
    const fl = [v.flags.hemolise && 'hemólise', v.flags.lipemia && 'lipemia intensa', v.flags.ictericia && 'icterícia', v.flags.biotina && 'uso de biotina/polivitamínico'].filter(Boolean);
    if (fl.length) L.push(`Condições pré-analíticas: ${fl.join(', ')}.`);
    if (a.items.length) {
      L.push('Índices calculados:');
      a.items.forEach((it) => {
        const g = (it.guideline || []).map((id) => selo(reg, id)).join(' ');
        L.push(`- ${it.title}: ${it.main}${it.sub ? ' (' + it.sub + ')' : ''} ${g}`);
      });
    }
    if (a.alerts.length) { L.push('Alertas:'); a.alerts.forEach((x) => L.push(`- ${x.title}: ${x.text}`)); }
    L.push('A: [avaliação do médico]');
    const recs = a.items.flatMap((it) => it.recs || []);
    L.push('P: [conduta do médico]');
    if (recs.length) { L.push('Sugestões do sistema (revisar antes de adotar):'); recs.forEach((r) => L.push(`- ${r}`)); }
    L.push('');
    L.push('Apoio à decisão; não substitui o julgamento clínico. Diretrizes e pontos de corte conforme o Registry local do LabCore APS.');
    return L.join('\n');
  }

  /* ---------- Parser de laudo em texto livre (módulo 4) ---------- */
  const semAcento = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const ALIASES = {
    hba1c: ['hba1c', 'a1c', 'hemoglobina glicada', 'hb glicada'], hb: ['hb', 'hemoglobina'], vcm: ['vcm'],
    rbc: ['hemacias', 'hem', 'rbc', 'eritrocitos', 'eri'], plaq: ['plaquetas', 'plaq', 'plt'],
    ferritina: ['ferritina', 'ferr'], ferro: ['ferro', 'fe'], ctlf: ['ctlf', 'ctff', 'tibc', 'ctf'],
    cr: ['creatinina', 'creat', 'cr'], rac: ['rac', 'relacao albumina creatinina'], k: ['potassio', 'k'], na: ['sodio', 'na'], cl: ['cloro', 'cl'],
    hco3: ['bicarbonato', 'hco3', 'bic'], glicemia: ['glicemia', 'glicose', 'glic', 'gj'], insulina: ['insulina', 'ins'],
    ca: ['calcio', 'ca'], albumina: ['albumina', 'alb'], ast: ['ast', 'tgo'], alt: ['alt', 'tgp'], ldh: ['ldh'],
    folato: ['folato', 'acido folico'], ct: ['colesterol total', 'ct', 'col'], hdl: ['hdl'], tg: ['triglicerides', 'triglicerideos', 'trig', 'tg'],
    tsh: ['tsh'], t4l: ['t4 livre', 't4l', 'ft4'],
  };
  const CONTAGEM = { plaq: 1, rbc: 1 };
  function parseReport(texto) {
    const t = semAcento(String(texto || ''));
    const values = {}, found = [];
    const pares = [];
    Object.entries(ALIASES).forEach(([id, al]) => al.forEach((a) => pares.push([id, a])));
    pares.sort((x, y) => y[1].length - x[1].length);
    const usados = [];
    pares.forEach(([id, alias]) => {
      if (values[id] != null) return;
      const esc = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
      const re = new RegExp(`(?<![a-z0-9])${esc}\\s*[:=]?\\s*(\\d{1,3}(?:\\.\\d{3})+(?![\\d,])|\\d+(?:[.,]\\d+)?)`, 'g');
      let m;
      while ((m = re.exec(t))) {
        const ini = m.index, fim = ini + m[0].length;
        if (usados.some(([a, b]) => ini < b && fim > a)) continue;
        let raw = m[1], x;
        if (/^\d{1,3}(\.\d{3})+$/.test(raw) && CONTAGEM[id]) x = Number(raw.replace(/\./g, ''));
        else x = parseNum(raw);
        if (x == null) continue;
        values[id] = x; usados.push([ini, fim]);
        found.push({ field: id, alias, raw, value: x });
        break;
      }
    });
    let m;
    if ((m = t.match(/idade\s*[:=]?\s*(\d{1,3})/) || t.match(/(\d{1,3})\s*anos/))) values.idade = Number(m[1]);
    if (/\b(feminino|fem|mulher|sexo\s*[:=]?\s*f)\b/.test(t)) values.sexo = 'F';
    else if (/\b(masculino|masc|homem|sexo\s*[:=]?\s*m)\b/.test(t)) values.sexo = 'M';
    if (/\b(gestante|gravida)\b/.test(t)) values.gestante = true;
    return { values, found };
  }

  /* ---------- Governança: Registry efetivo, auditoria, pacotes de atualização, changelog ---------- */
  const keyOf = (gid, k) => `${gid}:${k}`;
  const splitKey = (s) => { const i = s.indexOf(':'); return [s.slice(0, i), s.slice(i + 1)]; };

  /* Registry com ajustes locais (custom) e datas de auditoria por fonte (audits) aplicados. Não altera o original. */
  function effective(custom, audits) {
    const reg = JSON.parse(JSON.stringify(REGISTRY));
    Object.entries(custom || {}).forEach(([k, c]) => {
      const [gid, key] = splitKey(k);
      const p = reg.guidelines[gid] && reg.guidelines[gid].params[key];
      if (p && Number.isFinite(c.value)) { p.value = c.value; p.custom = c.origin || 'manual'; }
    });
    reg.sources.forEach((s) => { if (audits && isoDate(audits[s.id])) s.lastAuditedISO = isoDate(audits[s.id]); });
    Object.values(reg.guidelines).forEach((g) => {
      const datas = g.sources.map((id) => reg.sources.find((s) => s.id === id).lastAuditedISO).sort();
      g.lastAuditedISO = datas[0] || g.lastAuditedISO;
    });
    reg.lastAuditedISO = reg.sources.map((s) => s.lastAuditedISO).sort()[0];
    return reg;
  }

  /* Relógio de conformidade: dias desde a auditoria mais antiga; vencido se > ttlDays. */
  function cycleStatus(reg, nowISO) {
    const rows = reg.sources.map((s) => ({ id: s.id, sigla: s.sigla, nome: s.nome, escopo: s.escopo, lastAuditedISO: s.lastAuditedISO, days: daysSince(s.lastAuditedISO, nowISO) }));
    rows.forEach((r) => { r.overdue = r.days == null || r.days > reg.ttlDays; });
    const maxDays = Math.max(...rows.map((r) => (r.days == null ? Infinity : r.days)));
    return { rows, maxDays, overdue: rows.some((r) => r.overdue), ttlDays: reg.ttlDays };
  }

  /* Extrai o primeiro objeto JSON de um texto (aceita cercas ```json e texto em volta). */
  function extractJson(text) {
    const s = String(text || '');
    const a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
  }

  /* Valida o pacote de atualização. Uma proposta só é aplicável se: parâmetro existe, valor numérico dentro de min/max, fonte citada e valor diferente do atual. */
  function validatePackage(pkg, reg) {
    const erros = [];
    if (!pkg || typeof pkg !== 'object') return { ok: false, erros: ['O conteúdo não é um objeto JSON.'], rows: [] };
    if (pkg.schema !== 'labcore-update/1') erros.push('Esquema inválido: esperado "schema": "labcore-update/1".');
    if (!Array.isArray(pkg.proposals)) erros.push('Faltou a lista "proposals".');
    if (erros.length) return { ok: false, erros, rows: [] };
    const rows = pkg.proposals.map((pr, i) => {
      const gid = pr && pr.guideline, key = pr && pr.param;
      const p = reg.guidelines[gid] && reg.guidelines[gid].params[key];
      const row = { idx: i, gid, key, label: p ? `${reg.guidelines[gid].title}: ${p.label}` : `${gid}/${key}`, unit: p ? p.unit : '', current: p ? p.value : null, proposed: pr ? pr.value : null, source: pr && typeof pr.source === 'string' ? pr.source.trim() : '', evidence: pr && typeof pr.evidence === 'string' ? pr.evidence.trim() : '', url: pr && typeof pr.url === 'string' ? pr.url : '', valid: false, problem: '' };
      if (!p) row.problem = 'Parâmetro inexistente no Registry.';
      else if (typeof pr.value !== 'number' || !Number.isFinite(pr.value)) row.problem = 'Valor proposto não é numérico.';
      else if (pr.value < p.min || pr.value > p.max) row.problem = `Fora da faixa de segurança do parâmetro (${p.min} a ${p.max}).`;
      else if (!row.source) row.problem = 'Sem fonte citada: proposta sem fonte não é aplicada.';
      else if (pr.value === p.value) row.problem = 'Igual ao valor atual.';
      else row.valid = true;
      return row;
    });
    return { ok: true, erros: [], rows, audited: pkg.audited === true };
  }

  /* Aplica propostas aprovadas: devolve novo custom e entradas de changelog. */
  function applyRows(custom, rows, nowISO, tipo) {
    const next = Object.assign({}, custom), log = [];
    rows.filter((r) => r.valid).forEach((r) => {
      next[keyOf(r.gid, r.key)] = { value: r.proposed, origin: tipo || 'atualizacao', atISO: nowISO, source: r.source };
      log.push({ atISO: nowISO, tipo: tipo || 'atualizacao', gid: r.gid, key: r.key, label: r.label, from: r.current, to: r.proposed, source: r.source, evidence: r.evidence });
    });
    return { custom: next, log };
  }

  /* Prompt do Modo B (cole em Gemini/Perplexity/Claude com acesso à web). */
  function buildAuditPrompt(reg, nowISO) {
    const snap = {};
    Object.entries(reg.guidelines).forEach(([gid, g]) => {
      snap[gid] = { titulo: g.title, versao: g.version, ano: g.year, referencia: g.ref, parametros: {} };
      Object.entries(g.params).forEach(([k, p]) => { snap[gid].parametros[k] = { descricao: p.label, valor: p.value, unidade: p.unit, status: p.status }; });
    });
    const fontes = reg.sources.map((s) => `- ${s.sigla}: ${s.nome} (${s.escopo})`).join('\n');
    return `Você é um auditor de diretrizes de medicina laboratorial. Mês da auditoria: ${mesAnoExt(nowISO)} (data ${nowISO}). Última auditoria do Registry: ${reg.lastAuditedISO}.

TAREFA: com acesso à web, verifique se alguma das 12 fontes abaixo publicou diretriz, consenso ou atualização oficial desde ${reg.lastAuditedISO} que altere algum parâmetro do JSON "registry" abaixo (pontos de corte, constantes de fórmulas, versões).
Fontes monitoradas:
${fontes}

REGRAS:
1. Proponha mudança SOMENTE se houver publicação oficial verificável; cite título, ano e URL em "source" e "url", e a passagem que sustenta a mudança em "evidence".
2. Nunca invente valor, extrapole ou use memória: se não achar fonte, não proponha.
3. "guideline" e "param" devem ser exatamente as chaves do registry; "value" deve ser numérico, na mesma unidade do valor atual.
4. Parâmetros com status "lab_local" dependem do kit do laboratório: não os altere.
5. Se não houver nenhuma mudança, devolva "proposals": [].
6. Responda APENAS com um JSON válido neste formato, sem texto fora dele:
{"schema":"labcore-update/1","generatedISO":"${nowISO}","audited":true,"proposals":[{"guideline":"<chave>","param":"<chave>","value":0,"source":"<sociedade, título, ano>","url":"<link>","evidence":"<trecho/resumo>"}]}

registry:
${JSON.stringify(snap, null, 1)}`;
  }

  return {
    REGISTRY, FIELDS, FIELD, fmt, mesAno, mesAnoExt, daysSince, parseNum, normalize, ckdepi, stageG, stageA, riscoKdigo, analyze, soap, parseReport,
    selo, effective, cycleStatus, extractJson, validatePackage, applyRows, buildAuditPrompt, keyOf, splitKey, G_ORDER,
  };
});
