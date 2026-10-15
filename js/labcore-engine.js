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
  /* Arredonda a 3 casas para que subtrações como 5,5 − 3,7 não caiam em 1,7999999 e atravessem um corte exato. */
  const r3 = (x) => Math.round(x * 1000) / 1000;
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
    /* Proteínas e hematologia avançada (adendo) */
    F('pt', 'Proteínas totais', 'g/dL', 2, 15, 'prot'),
    F('ht', 'Hematócrito', '%', 5, 70, 'hemato'), F('rdw', 'RDW', '%', 8, 40, 'hemato'), F('ret', 'Reticulócitos', '%', 0, 50, 'hemato'),
    F('transf', 'Transferrina', 'mg/dL', 50, 700, 'hemato'), F('leuco', 'Leucócitos', '×10⁹/L', 0.1, 500, 'hemato'),
    F('seg', 'Neutrófilos segmentados', '%', 0, 100, 'hemato'), F('bast', 'Bastões', '%', 0, 100, 'hemato'),
    F('tp', 'Tempo de protrombina', 's', 5, 120, 'coag'), F('tpC', 'TP do controle', 's', 5, 60, 'coag'), F('isi', 'ISI do reagente', '', 0.5, 3, 'coag'),
    F('inr', 'INR (se já informado)', '', 0.5, 15, 'coag'), F('ttpa', 'TTPa', 's', 15, 200, 'coag'), F('ttpaC', 'TTPa do controle', 's', 15, 60, 'coag'),
    F('fibrin', 'Fibrinogênio', 'mg/dL', 20, 1500, 'coag'),
    /* Painéis estratégicos da APS */
    F('psaT', 'PSA total', 'ng/mL', 0.01, 1000, 'prost'), F('psaL', 'PSA livre', 'ng/mL', 0.01, 500, 'prost'), F('vprost', 'Volume prostático (USG)', 'cm³', 5, 500, 'prost'),
    F('pth', 'PTH intacto', 'pg/mL', 1, 3000, 'osso'), F('vitd', '25-OH-vitamina D', 'ng/mL', 1, 200, 'osso'), F('fosforo', 'Fósforo sérico', 'mg/dL', 0.5, 15, 'osso'), F('fa', 'Fosfatase alcalina', 'U/L', 10, 3000, 'osso'),
    F('b12', 'Vitamina B12', 'pg/mL', 20, 5000, 'b12'), F('hcy', 'Homocisteína', 'µmol/L', 1, 500, 'b12'), F('mma', 'Ácido metilmalônico (AMM)', 'nmol/L', 10, 20000, 'b12'),
    F('iga', 'IgA sérica total', 'mg/dL', 1, 2000, 'gastro'), F('calpro', 'Calprotectina fecal', 'µg/g', 1, 10000, 'gastro'), F('elastase', 'Elastase pancreática fecal', 'µg/g', 1, 1000, 'gastro'),
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
      if (f.id === 'leuco' && x > 100) { notes.push(`Leucócitos ${fmt(x, 0)} /mm³ convertidos para ${fmt(x / 1000, 1)} ×10⁹/L.`); x = x / 1000; }
      if (f.id === 'albumina' && x > 10) { notes.push(`Albumina ${fmt(x, 1)} g/L convertida para ${fmt(x / 10, 1)} g/dL.`); x = x / 10; }
      if (x < f.min || x > f.max) { warnings.push(`${f.label} ${fmt(x, 2)} ${f.unit} fora da faixa plausível (${f.min} a ${f.max}); valor ignorado. Confira a unidade.`); return; }
      v[f.id] = x;
    });
    const age = parseNum(raw.idade);
    if (age != null && age >= 18 && age <= 120) v.idade = age;
    else if (age != null) warnings.push(`Idade ${age} fora de 18 a 120 anos: as fórmulas deste módulo são para adultos; idade ignorada.`);
    v.sexo = raw.sexo === 'F' || raw.sexo === 'M' ? raw.sexo : null;
    v.gestante = !!raw.gestante;
    ['dm', 'icc', 'persistente', 'picoM', 'ari', 'semGluten', 'metIBP', 'sintB12', 'psaProstatite', 'psaEjac', 'psaBike', 'psaInstr'].forEach((k) => { v[k] = !!raw[k]; });
    v.ttg = raw.ttgIgA === 'pos' || raw.ttgIgA === 'neg' ? raw.ttgIgA : null;
    v.dgp = raw.dgpIgG === 'pos' || raw.dgpIgG === 'neg' ? raw.dgpIgG : null;
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
    if (v.ctlf == null && v.transf != null) v.ctlf = v.transf * p['transf.factor'], v.ctlfEstimada = true;
    if (v.ferro != null && v.ctlf != null) {
      const t = (v.ferro / v.ctlf) * 100;
      v.ist = t;
      const low = t < p['tsat.low'];
      const det = v.ctlfEstimada ? [`CTLF estimada pela transferrina (${fmt(v.transf, 0)} × ${fmt(p['transf.factor'], 2)}).`] : [];
      det.push('Ferritina é reagente de fase aguda: pode estar normal ou alta em inflamação, infecção, doença hepática ou neoplasia mesmo com deficiência de ferro.');
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


  /* ---------- Adendo: proteínas, CRAB, IPR, Green & King, cinética do ferro, ANC, coagulograma, EDTA ---------- */
  function proteinas(v, reg) {
    if (v.pt == null || v.albumina == null) return null;
    const p = gp(reg, 'proteinas');
    const glob = r3(v.pt - v.albumina);
    if (glob <= 0) return { id: 'prot', title: 'Globulinas', main: '—', sub: 'Albumina ≥ proteínas totais: confira os valores', level: 'info', guideline: ['proteinas'], details: [] };
    const ag = v.albumina / glob;
    const alto = glob > p['glob.high'] || ag < p['ag.low'];
    const baixo = glob < p['glob.low'];
    v.glob = glob; v.ag = ag;
    return {
      id: 'prot', title: 'Globulinas e relação A/G', main: `${fmt(glob, 1)} g/dL`, sub: `A/G ${fmt(ag, 2)}${alto ? ' · hiperglobulinemia' : ''}`, level: alto || baixo ? 'mod' : 'info', value: glob, ag, baixo, guideline: ['proteinas'],
      details: [`Globulinas = proteínas totais − albumina; A/G = albumina / globulinas.`, alto ? `Globulinas > ${fmt(p['glob.high'], 1)} g/dL ou A/G < ${fmt(p['ag.low'], 1)}: solicitar eletroforese de proteínas séricas (EPS) com imunofixação se houver pico.` : 'Sem sinal de hiperglobulinemia pelos cortes do Registry.'],
      recs: alto ? ['Solicitar eletroforese de proteínas séricas (EPS).'] : [],
    };
  }
  /* Checklist CRAB: globulinas altas (ou pico M) + hipercalcemia, renal ou anemia → alerta prioritário. */
  function crab(v, reg, tfge) {
    const g = gp(reg, 'imwg'), p = gp(reg, 'proteinas');
    const gatilho = (v.glob != null && v.glob > p['glob.high']) || v.picoM;
    if (!gatilho) return null;
    const c = [];
    const caCorr = v.ca != null && v.albumina != null ? v.ca + gp(reg, 'eletrolitos')['ca.factor'] * (gp(reg, 'eletrolitos')['ca.albRef'] - v.albumina) : v.ca;
    if (caCorr != null && caCorr > g['crab.ca']) c.push(`cálcio${v.albumina != null ? ' corrigido' : ''} ${fmt(caCorr, 1)} mg/dL (> ${fmt(g['crab.ca'], 1)})`);
    if (v.cr != null && v.cr > g['crab.cr']) c.push(`creatinina ${fmt(v.cr, 1)} mg/dL (> ${fmt(g['crab.cr'], 1)})`);
    else if (tfge != null && tfge < g['crab.crcl']) c.push(`TFGe ${fmt(tfge, 0)} mL/min/1,73 m² (< ${fmt(g['crab.crcl'], 0)})`);
    if (v.hb != null && v.hb < g['crab.hb']) c.push(`hemoglobina ${fmt(v.hb, 1)} g/dL (< ${fmt(g['crab.hb'], 1)})`);
    if (!c.length) return null;
    return { level: 'high', title: 'Investigação hematológica prioritária (CRAB)', text: `${v.picoM ? 'Pico monoclonal presente' : `Globulinas ${fmt(v.glob, 1)} g/dL`} com ${c.join('; ')}. Pode ser mieloma múltiplo: pedir EPS com imunofixação, cadeias leves livres, B2-microglobulina e encaminhar com urgência à Hematologia (encaminhamento prioritário via CROSS/SISREG). A TFGe é usada no lugar da depuração (IMWG usa a depuração de creatinina < 40 mL/min).` };
  }
  function ipr(v, reg) {
    if (v.ret == null || v.ht == null) return null;
    const p = gp(reg, 'hemato');
    const crc = v.ret * (v.ht / p['crc.htRef']);
    const fm = v.ht >= p['fm.ht1'] ? p['fm.v1'] : v.ht >= p['fm.ht2'] ? p['fm.v2'] : v.ht >= p['fm.ht3'] ? p['fm.v3'] : p['fm.v4'];
    const x = crc / fm;
    const hipo = x < p['ipr.cut'];
    return {
      id: 'ipr', title: 'Índice de Produção Reticulocitária (IPR)', main: fmt(x, 1), sub: hipo ? 'Anemia hipoproliferativa' : 'Anemia hiperproliferativa', level: 'mod', value: x, guideline: ['hemato'],
      details: [`Reticulócitos corrigidos ${fmt(crc, 2)}% (reticulócitos × Ht/${fmt(p['crc.htRef'], 0)}); fator de maturação ${fmt(fm, 1)}.`, hipo ? 'Medula não responde de forma adequada: ferropenia, deficiência de B12/folato, doença crônica ou renal, aplasia ou infiltração medular.' : 'Medula responde: investigar hemólise (LDH, bilirrubina indireta, haptoglobina, Coombs direto, esfregaço) ou sangramento agudo.', 'Só tem sentido na presença de anemia.'],
      recs: hipo ? ['Avaliar ferro, B12, folato, função renal e tireoide; considerar mielograma se não houver causa.'] : ['Pedir LDH, bilirrubina indireta, haptoglobina, Coombs direto e esfregaço; descartar sangramento.'],
    };
  }
  function greenKing(v, reg) {
    if (v.vcm == null || v.rdw == null || v.hb == null) return null;
    const p = gp(reg, 'hemato');
    const x = (v.vcm * v.vcm * v.rdw) / (100 * v.hb);
    const micro = v.vcm < p['micro.vcm'];
    const sub = !micro ? 'VCM não microcítico: índice sem aplicação' : x < p['green.cut'] ? 'Sugere talassemia' : x > p['green.cut'] ? 'Sugere ferropenia' : 'Indeterminado (no ponto de corte)';
    return { id: 'green', title: 'Índice de Green & King', main: fmt(x, 1), sub, level: micro && x !== p['green.cut'] ? 'mod' : 'info', value: x, guideline: ['hemato'], details: ['(VCM² × RDW) / (100 × Hb). Índice sugestivo, não diagnóstico; confirmar com ferritina, saturação e eletroforese de hemoglobina.'] };
  }
  function ferroCin(v, reg) {
    if (v.ferritina == null || v.ist == null) return null;
    const p = gp(reg, 'hemato');
    const alta = v.sexo === 'F' ? p['ferr.highF'] : v.sexo === 'M' ? p['ferr.highM'] : Math.min(p['ferr.highF'], p['ferr.highM']);
    const low = v.ist < p['tsat.low'];
    let sub, level = 'mod', rec;
    if (v.ist > p['ist.high'] && v.ferritina > alta) { sub = 'Sobrecarga de ferro (investigar hemocromatose)'; level = 'high'; rec = 'Genotipagem HFE (C282Y/H63D), enzimas hepáticas, excluir álcool, transfusões e inflamação; encaminhar à Hepatologia/Hematologia.'; }
    else if (v.ist > p['ist.high']) { sub = 'Saturação elevada com ferritina não alta'; rec = 'Repetir ferro e saturação em jejum; interferem ferro oral e coleta pós-prandial.'; }
    else if (low && v.ferritina < p['ferr.def']) { sub = 'Ferropenia clássica'; rec = 'Repor ferro e investigar a causa (perda GI/menstrual, dieta, má absorção); reavaliar em semanas.'; }
    else if (low && v.ferritina > p['ferr.inflam']) {
      const ctlfBaixa = v.ctlf != null && v.ctlf < p['ctlf.low'];
      sub = ctlfBaixa ? 'Anemia da inflamação' : 'Ferritina alta com IST baixa: inflamação, com CTLF não baixa (considerar ferropenia funcional mista)'; rec = 'Tratar a doença de base; ferro oral costuma não resolver; dosar PCR e, se dúvida, receptor solúvel de transferrina.';
    }
    else if (low) { sub = 'Deficiência funcional de ferro (ferritina entre 30 e 100 com IST baixa)'; rec = 'Repetir com PCR; considerar prova terapêutica com ferro ou receptor solúvel de transferrina; investigar inflamação ou perda crônica.'; }
    else { sub = 'Sem padrão de ferropenia pela saturação'; level = 'low'; rec = 'Se há anemia microcítica, considerar talassemia (eletroforese de hemoglobina).'; }
    return { id: 'ferro_cin', title: 'Cinética do ferro', main: `Ferritina ${fmt(v.ferritina, 0)} · IST ${fmt(v.ist, 0)}%`, sub, level, guideline: ['hemato'], details: ['Classificação por ferritina e saturação de transferrina (limites do Registry; limites de CTLF e de ferritina alta estão "a verificar").'], recs: [rec] };
  }
  function anc(v, reg) {
    if (v.leuco == null || v.seg == null) return null;
    const p = gp(reg, 'hemato');
    const x = (v.leuco * (v.seg + (v.bast || 0))) / 100;
    const sub = x < p['anc.sev'] ? 'Neutropenia grave' : x < p['anc.mod'] ? 'Neutropenia moderada' : x < p['anc.low'] ? 'Neutropenia leve' : 'Sem neutropenia';
    return { id: 'anc', title: 'Neutrófilos absolutos (ANC)', main: `${fmt(x, 2)} ×10⁹/L`, sub, level: x < p['anc.low'] ? (x < p['anc.mod'] ? 'high' : 'mod') : 'info', value: x, guideline: ['hemato'], details: ['ANC = leucócitos × (segmentados + bastões) / 100. Neutropenia constitucional é comum em pessoas de ascendência africana (Duffy-nulo); correlacionar com a clínica.', 'Os graus de neutropenia estão "a verificar" no Registry.'], recs: x < p['anc.low'] ? ['Repetir com esfregaço; revisar fármacos e infecções virais; febre com neutropenia é urgência.'] : [] };
  }
  function coag(v) {
    const out = [];
    let inr = v.inr != null ? v.inr : null, nota = '';
    if (inr == null && v.tp != null && v.tpC != null && v.isi != null) { inr = Math.pow(v.tp / v.tpC, v.isi); nota = `INR = (TP/TP controle)^ISI = (${fmt(v.tp, 1)}/${fmt(v.tpC, 1)})^${fmt(v.isi, 2)}.`; }
    const rt = v.ttpa != null && v.ttpaC != null ? v.ttpa / v.ttpaC : null;
    if (inr == null && rt == null && v.fibrin == null) return null;
    const partes = [];
    if (inr != null) partes.push(`INR ${fmt(inr, 2)}`);
    if (rt != null) partes.push(`relação TTPa ${fmt(rt, 2)}`);
    if (v.fibrin != null) partes.push(`fibrinogênio ${fmt(v.fibrin, 0)} mg/dL`);
    return { id: 'coag', title: 'Coagulograma', main: partes.join(' · '), sub: '', level: 'info', value: inr, ratio: rt, guideline: [], details: [nota, 'Sem pontos de corte automáticos: a faixa normal depende do reagente e do laboratório. Padrões: TP/INR prolongado isolado (vitamina K, varfarina, hepatopatia, fator VII); TTPa prolongado isolado (hemofilia, von Willebrand, heparina, anticoagulante lúpico); ambos (via comum, hepatopatia, CIVD); fibrinogênio baixo reforça CIVD ou hepatopatia.'].filter(Boolean) };
  }
  function edta(v, reg) {
    if (v.plaq == null) return null;
    const p = gp(reg, 'hemato');
    if (v.plaq >= p['pseudo.plq']) return null;
    const anem = v.hb != null && v.hb < (v.sexo === 'M' ? p['anemia.hbM'] : p['anemia.hbF']);
    const leucop = v.leuco != null && v.leuco < p['leuco.low'];
    if (anem || leucop) return null;
    return { level: 'mod', title: 'Possível pseudotrombocitopenia por EDTA', text: `Plaquetas ${fmt(v.plaq, 0)} ×10⁹/L isoladas, sem anemia nem leucopenia${v.hb == null || v.leuco == null ? ' (hemoglobina ou leucócitos não informados: confirme)' : ''}. Solicite nova contagem em tubo de citrato de sódio (corrigir a diluição) e revisão de lâmina para agregados plaquetários antes de investigar ou tratar.` };
  }


  /* ---------- Painel 1: eixo prostático ---------- */
  function psa(v, reg) {
    if (v.psaT == null) return { items: [], alerts: [] };
    const p = gp(reg, 'psa');
    const items = [], alerts = [];
    const eff = v.ari ? v.psaT * p['ari.factor'] : v.psaT;
    if (v.ari) {
      items.push({ id: 'psa_corr', title: 'PSA corrigido (5-ARI)', main: `${fmt(eff, 1)} ng/mL`, sub: `PSA total ${fmt(v.psaT, 1)} × ${fmt(p['ari.factor'], 1)}`, level: eff >= p['tot.hi'] ? 'high' : 'mod', value: eff, guideline: ['psa'], details: [`Uso de finasterida ou dutasterida há ${fmt(p['ari.months'], 0)} meses ou mais: o PSA sérico cai cerca de 50%; use o valor corrigido na decisão clínica.`] });
      alerts.push({ level: eff >= p['tot.hi'] ? 'high' : 'mod', title: 'Finasterida / dutasterida: PSA reduzido em cerca de 50%', text: 'Finasterida e Dutasterida reduzem o PSA sérico em ~50%. O valor corrigido deve ser usado para decisão clínica; qualquer elevação confirmada na vigência de 5-ARI, mesmo dentro da faixa normal aparente, exige investigação urológica imediata.' });
    }
    if (v.psaL != null && v.psaT > 0) {
      const lt = (v.psaL / v.psaT) * 100;
      const dentro = eff >= p['tot.lo'] && eff <= p['tot.hi'];
      let sub, level = 'info', rec = [];
      if (!dentro) sub = `Relação aplicável com PSA entre ${fmt(p['tot.lo'], 1)} e ${fmt(p['tot.hi'], 1)} ng/mL`;
      else if (lt < p['lt.high']) { sub = lt < p['lt.veryHigh'] ? 'Risco muito alto de adenocarcinoma de próstata' : 'Alto risco de adenocarcinoma de próstata'; level = 'high'; rec = ['Encaminhar à Urologia para avaliação e biópsia.']; }
      else if (lt > p['lt.bph']) { sub = 'Sugestivo de hiperplasia prostática benigna (HPB)'; level = 'low'; }
      else { sub = 'Faixa intermediária'; level = 'mod'; }
      items.push({ id: 'psa_lt', title: 'Relação PSA livre / total', main: `${fmt(lt, 1)}%`, sub, level, value: lt, guideline: ['psa'], details: [`Aplicável com PSA total (ou corrigido) entre ${fmt(p['tot.lo'], 1)} e ${fmt(p['tot.hi'], 1)} ng/mL: abaixo de ${fmt(p['lt.high'], 0)}% o risco é alto; acima de ${fmt(p['lt.bph'], 0)}% sugere HPB.`], recs: rec });
    }
    if (v.vprost != null) {
      const d = eff / v.vprost;
      const alto = d >= p['psad.cut'];
      items.push({ id: 'psad', title: 'Densidade do PSA (PSAD)', main: `${fmt(d, 2)} ng/mL/cm³`, sub: alto ? 'Risco elevado de neoplasia maligna' : 'Abaixo do corte', level: alto ? 'high' : 'low', value: d, guideline: ['psa'], details: [`PSA${v.ari ? ' corrigido' : ' total'} / volume prostático; risco elevado se ≥ ${fmt(p['psad.cut'], 2)}.`], recs: alto ? ['Encaminhar à Urologia (considerar ressonância multiparamétrica e biópsia).'] : [] });
    }
    const pre = [v.psaProstatite && 'prostatite ou infecção urinária recente', v.psaEjac && 'ejaculação nas últimas 48 h', v.psaBike && 'exercício intenso em bicicleta', v.psaInstr && 'instrumentação uretral ou toque retal vigoroso recente'].filter(Boolean);
    if (pre.length) alerts.push({ level: 'mod', title: 'Interferente pré-analítico do PSA', text: `Relato de ${pre.join(', ')}: o PSA pode estar falsamente elevado. Repetir após ${fmt(p['repeat.weeks'], 0)} a 6 semanas da resolução antes de decidir.` });
    return { items, alerts };
  }

  /* ---------- Painel 2: metabolismo ósseo e paratireoide ---------- */
  function osso(v, reg, tfge) {
    if (v.ca == null || v.pth == null) return [];
    const p = gp(reg, 'osso'), e = gp(reg, 'eletrolitos');
    const caC = v.albumina != null ? r3(v.ca + e['ca.factor'] * (e['ca.albRef'] - v.albumina)) : v.ca;
    const nota = v.albumina != null ? `Ca corrigido ${fmt(caC, 1)} mg/dL` : `Ca total ${fmt(caC, 1)} mg/dL (sem albumina: não corrigido)`;
    const out = [];
    const I = (id, level, title, sub, details, recs) => out.push({ id: 'osso_' + id, title, main: `${nota} · PTH ${fmt(v.pth, 0)} pg/mL`, sub, level, guideline: ['osso'], details, recs: recs || [] });
    if (caC > p['ca.malig'] && v.pth < p['pth.supr']) {
      I('malig', 'high', 'Hipercalcemia PTH-independente', 'PTH suprimido', ['Investigar neoplasia oculta (mieloma múltiplo, metástases ósseas líticas, produção de PTHrP), doença granulomatosa (sarcoidose, tuberculose) ou intoxicação por vitamina D.'], ['Dosar PTHrP, 25-OH e 1,25-OH vitamina D, EPS com imunofixação e imagem; encaminhar com urgência se o cálcio for alto ou houver sintomas.']);
    } else if (caC > p['ca.hpp'] && v.pth > p['pth.inap']) {
      const fBaixo = v.fosforo != null && v.fosforo < p['p.low'];
      I('hpp', 'high', 'Hiperparatireoidismo primário provável', fBaixo ? 'Fósforo baixo (típico)' : v.fosforo == null ? 'Fósforo não informado' : 'Fósforo não baixo', [`Ca corrigido > ${fmt(p['ca.hpp'], 1)} mg/dL com PTH elevado ou inapropriadamente normal (> ${fmt(p['pth.inap'], 0)} pg/mL).${fBaixo ? '' : ' O fósforo baixo é típico, mas um fósforo normal não exclui.'}`],
        ['Solicitar calciúria de 24 h (afastar hipercalcemia hipocalciúrica familiar), ultrassom de rins e vias urinárias e densitometria óssea, incluindo rádio distal 33%.', 'Encaminhar à Endocrinologia / Cirurgia de Cabeça e Pescoço.']);
    } else if (caC > p['ca.hpp']) {
      I('hipercalcemia', 'mod', 'Hipercalcemia com PTH não elevado', 'PTH baixo-normal', ['PTH entre o suprimido e o inapropriadamente normal: repetir PTH e investigar causas PTH-independentes (PTHrP, vitamina D, doenças granulomatosas, neoplasia).'], ['Repetir cálcio, albumina e PTH; dosar 25-OH e 1,25-OH vitamina D.']);
    }
    if (v.pth > p['pth.high'] && caC <= p['ca.hpp']) {
      let alguma = false;
      if (v.vitd != null && v.vitd < p['vitd.ins'] && (v.fosforo == null || v.fosforo <= p['p.high'])) {
        alguma = true;
        I('sec_vitd', 'mod', 'Hiperparatireoidismo secundário à deficiência de vitamina D', v.vitd < p['vitd.def'] ? 'Deficiência' : 'Insuficiência', [`25-OH vitamina D ${fmt(v.vitd, 0)} ng/mL (< ${fmt(p['vitd.def'], 0)} deficiência; < ${fmt(p['vitd.ins'], 0)} insuficiência) com PTH elevado e cálcio não alto.`, 'Corrija a vitamina D com colecalciferol antes de rotular doença paratireoidiana.'], ['Repor colecalciferol e repetir PTH, cálcio e 25-OH vitamina D após o tratamento (cerca de 2 a 3 meses).']);
      }
      if (tfge != null && tfge < p['tfge.drc'] && (v.fosforo == null || v.fosforo >= p['p.low'])) {
        alguma = true;
        I('sec_drc', 'mod', 'Hiperparatireoidismo secundário da doença renal crônica (DMO-DRC)', `TFGe ${fmt(tfge, 0)}`, [`TFGe < ${fmt(p['tfge.drc'], 0)} mL/min/1,73 m² com fósforo normal ou elevado e PTH elevado.`], ['Avaliar fósforo, vitamina D e bicarbonato e encaminhar à Nefrologia.']);
      }
      if (!alguma) I('sec', 'mod', 'PTH elevado com cálcio não alto: hiperparatireoidismo secundário', '', ['Procure a causa: vitamina D baixa, doença renal, baixa ingestão de cálcio, má absorção, fármacos (lítio, diuréticos de alça).'], ['Dosar 25-OH vitamina D, creatinina/TFGe e fósforo.']);
    }
    if (caC < p['ca.hipo'] && v.pth <= p['pth.inap'] && v.fosforo != null && v.fosforo > p['p.high']) {
      I('hipo', 'high', 'Hipoparatireoidismo provável', 'Fósforo elevado', ['Cálcio baixo com PTH baixo ou inapropriadamente normal e fósforo alto; é comum após tireoidectomia ou cirurgia cervical.'], ['Avaliar sintomas (parestesias, tetania), ECG e magnésio; encaminhar à Endocrinologia.']);
    }
    if (!out.length) I('sem', 'info', 'Sem padrão de distúrbio do metabolismo mineral pelos cortes', '', ['Cálcio e PTH não preenchem os padrões do Registry. A faixa do PTH depende do ensaio.']);
    if (v.fa != null) out[0].details.push(`Fosfatase alcalina ${fmt(v.fa, 0)} U/L: interprete com a faixa do seu laboratório (aumenta em alto remodelamento ósseo, doença de Paget e colestase).`);
    return out;
  }

  /* ---------- Painel 3: vitamina B12, folato e metabólitos ---------- */
  function b12(v, reg) {
    if (v.b12 == null && v.hcy == null && v.mma == null) return { items: [], alerts: [] };
    const p = gp(reg, 'b12');
    const items = [], alerts = [];
    const risco = v.metIBP || v.sintB12;
    if (v.b12 != null) {
      if (v.b12 < p['b12.def']) {
        items.push({ id: 'b12', title: 'Vitamina B12', main: `${fmt(v.b12, 0)} pg/mL`, sub: 'Deficiência confirmada', level: 'high', value: v.b12, guideline: ['b12'], details: [`B12 < ${fmt(p['b12.def'], 0)} pg/mL.`], recs: [v.sintB12 ? 'Com sintomas neurológicos: reposição parenteral (IM).' : 'Reposição parenteral (IM) se houver sintomas neurológicos, pós-bariátrica ou anemia perniciosa; do contrário, alta dose oral ou sublingual.', 'Investigar a causa (anemia perniciosa, uso de metformina ou IBP, dieta, má absorção).'] });
      } else if (v.b12 <= p['b12.gray']) {
        items.push({ id: 'b12', title: 'Vitamina B12', main: `${fmt(v.b12, 0)} pg/mL`, sub: 'Zona cinzenta metrológica', level: 'mod', value: v.b12, guideline: ['b12'], details: [`B12 entre ${fmt(p['b12.def'], 0)} e ${fmt(p['b12.gray'], 0)} pg/mL não confirma nem exclui deficiência.`], recs: ['Dosar homocisteína e ácido metilmalônico (AMM) para decidir.'] });
        if (risco) alerts.push({ level: 'mod', title: 'B12 limítrofe com fator de risco ou sintomas', text: 'A Metformina reduz a absorção ileal de cobalamina dependente de cálcio no complexo fator intrínseco-cubilina; IBPs reduzem a clivagem ácida da B12 alimentar. Valores entre 200-350 pg/mL NÃO excluem deficiência funcional neuro-hematológica!' });
      } else items.push({ id: 'b12', title: 'Vitamina B12', main: `${fmt(v.b12, 0)} pg/mL`, sub: 'Acima da zona cinzenta', level: 'low', value: v.b12, guideline: ['b12'], details: [v.sintB12 ? 'Com sintomas neurológicos ou VCM alto, valor normal não exclui deficiência funcional; considere AMM/homocisteína.' : 'Deficiência de B12 pouco provável.'] });
    }
    if (v.hcy != null && v.mma != null) {
      const h = v.hcy > p['hcy.uln'], m = v.mma > p['mma.uln'];
      let sub, level, det, recs = [];
      if (h && m) { sub = 'Deficiência tecidual confirmada de vitamina B12'; level = 'high'; det = 'Homocisteína e AMM elevados.'; recs = ['Repor B12 (parenteral se houver sintomas neurológicos).']; }
      else if (h && !m) { sub = 'Deficiência isolada de ácido fólico (B9)'; level = 'mod'; det = 'Homocisteína elevada com AMM normal.'; recs = ['Repor ácido fólico depois de excluir deficiência de B12.']; alerts.push({ level: 'high', title: 'Não repor ácido fólico isoladamente sem excluir a B12', text: 'Nunca repor ácido fólico isoladamente sem antes excluir ou tratar deficiência de B12: a anemia megaloblástica pode melhorar e mascarar a deficiência, enquanto a degeneração combinada subaguda da medula espinhal progride.' }); }
      else if (!h && m) { sub = 'AMM elevado isolado'; level = 'mod'; det = 'Considere deficiência precoce de B12 e também insuficiência renal, que eleva o AMM.'; }
      else { sub = 'Homocisteína e AMM normais'; level = 'low'; det = 'Deficiência tecidual de B12 improvável.'; }
      items.push({ id: 'b12_dupla', title: 'Dupla metabólica (homocisteína e AMM)', main: `Hcy ${fmt(v.hcy, 1)} · AMM ${fmt(v.mma, 0)}`, sub, level, guideline: ['b12'], details: [det, 'Os limites superiores dependem do método (marcados como referência do laboratório no Registry).'], recs });
    } else if (v.hcy != null || v.mma != null) {
      items.push({ id: 'b12_dupla', title: 'Metabólitos da B12', main: v.hcy != null ? `Hcy ${fmt(v.hcy, 1)}` : `AMM ${fmt(v.mma, 0)}`, sub: 'Falta o par', level: 'info', guideline: ['b12'], details: ['A resolução exige homocisteína e AMM juntos.'] });
    }
    if (v.vcm != null && v.vcm > p['mcv.macro'] && !items.some((i) => i.id === 'b12' && i.level === 'high')) alerts.push({ level: 'mod', title: `Macrocitose (VCM > ${fmt(p['mcv.macro'], 0)} fL)`, text: 'Investigue B12 e folato (mesmo com B12 normal-baixa), hepatopatia, álcool, hipotireoidismo e fármacos.' });
    return { items, alerts };
  }

  /* ---------- Painel 4: celíaca, calprotectina e elastase ---------- */
  function gastro(v, reg) {
    const p = gp(reg, 'celiaca');
    const items = [], alerts = [];
    if (v.ttg || v.dgp) {
      const sorologiaNeg = (!v.ttg || v.ttg === 'neg') && (!v.dgp || v.dgp === 'neg');
      if (v.semGluten && sorologiaNeg) alerts.push({ level: 'high', title: 'Falso-negativo pré-analítico: dieta sem glúten', text: `A sorologia e a biópsia duodenal exigem consumo ativo de glúten por pelo menos ${fmt(p['gluten.weeks'], 0)} a 8 semanas antes do exame. Sorologia negativa em dieta isenta de glúten não exclui doença celíaca: não retire o glúten antes de investigar; se já retirou, discuta a reintrodução supervisionada.` });
      if (v.ttg === 'neg') {
        if (v.iga == null) alerts.push({ level: 'mod', title: 'Confira a IgA sérica total', text: 'Sempre confira a IgA Sérica Total! A deficiência seletiva de IgA é 10 a 15x mais frequente em celíacos.' });
        else if (v.iga < p['iga.low']) {
          const ausente = v.iga < p['iga.absent'];
          alerts.push({ level: 'high', title: 'Exame inválido: falso-negativo por deficiência de IgA', text: `Anti-tTG IgA negativo com IgA total ${fmt(v.iga, 0)} mg/dL (< ${fmt(p['iga.low'], 0)}${ausente ? `; deficiência seletiva, < ${fmt(p['iga.absent'], 0)}` : ''}) não vale. Solicitar imediatamente anti-transglutaminase IgG (anti-tTG IgG) e/ou anti-gliadina deaminada IgG (anti-DGP IgG).` });
        }
      }
      const positivo = v.ttg === 'pos' || (v.dgp === 'pos' && v.ttg !== 'pos');
      items.push({ id: 'celiaca', title: 'Doença celíaca: sorologia', main: [v.ttg ? `anti-tTG IgA ${v.ttg === 'pos' ? 'positivo' : 'negativo'}` : '', v.dgp ? `anti-DGP IgG ${v.dgp === 'pos' ? 'positivo' : 'negativo'}` : ''].filter(Boolean).join(' · '), sub: positivo ? 'Compatível com doença celíaca: confirmar' : 'Sorologia negativa', level: positivo ? 'high' : 'info', guideline: ['celiaca'], details: [positivo ? 'Sorologia positiva não é diagnóstico isolado.' : 'Ver alertas sobre IgA total e dieta.'], recs: positivo ? ['Endoscopia digestiva alta com biópsias da segunda porção duodenal (classificação de Marsh), com o paciente ainda consumindo glúten.'] : [] });
    }
    if (v.calpro != null) {
      const sub = v.calpro < p['calpro.norm'] ? 'Normal: sugere distúrbio funcional (síndrome do intestino irritável)' : v.calpro <= p['calpro.active'] ? 'Zona cinzenta' : 'Inflamação intestinal orgânica ativa';
      const level = v.calpro < p['calpro.norm'] ? 'low' : v.calpro <= p['calpro.active'] ? 'mod' : 'high';
      const recs = v.calpro < p['calpro.norm'] ? ['Sem sinais de alarme (sangue, perda de peso, anemia, febre, início após os 50 anos), evita colonoscopia desnecessária.'] : v.calpro <= p['calpro.active'] ? ['Descartar uso de AINEs (elevam a calprotectina) e infecção enteroinvasiva; repetir em 4 a 6 semanas.'] : ['Alta probabilidade de doença de Crohn ou retocolite ulcerativa: colonoscopia com íleo terminal e biópsias seriadas; encaminhar à Gastroenterologia.'];
      items.push({ id: 'calpro', title: 'Calprotectina fecal', main: `${fmt(v.calpro, 0)} µg/g`, sub, level, value: v.calpro, guideline: ['celiaca'], details: [`Normal < ${fmt(p['calpro.norm'], 0)}; zona cinzenta até ${fmt(p['calpro.active'], 0)}; acima, inflamação ativa.`], recs });
    }
    if (v.elastase != null) {
      const sub = v.elastase > p['elas.norm'] ? 'Normal' : v.elastase >= p['elas.sev'] ? 'Insuficiência pancreática exócrina leve a moderada' : 'Insuficiência pancreática exócrina grave';
      items.push({ id: 'elastase', title: 'Elastase pancreática fecal', main: `${fmt(v.elastase, 0)} µg/g`, sub, level: v.elastase > p['elas.norm'] ? 'low' : v.elastase >= p['elas.sev'] ? 'mod' : 'high', value: v.elastase, guideline: ['celiaca'], details: ['Fezes líquidas (diarreia aquosa) diluem a amostra e dão valor baixo espúrio: repetir com fezes formadas.'], recs: v.elastase < p['elas.sev'] ? ['Indicar reposição de enzimas pancreáticas (pancreatina) e investigar a causa (pancreatite crônica, fibrose cística).'] : [] });
    }
    return { items, alerts };
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
    push(proteinas(v, reg));
    push(ipr(v, reg)); push(greenKing(v, reg)); push(ferroCin(v, reg)); push(anc(v, reg)); push(coag(v));
    const alerts = preAnalitico(v, reg);
    const tfgeIt = items.find((i) => i.id === 'tfge');
    const ps = psa(v, reg), bb = b12(v, reg), gg = gastro(v, reg);
    [ps, bb, gg].forEach((x) => { x.items.forEach(push); x.alerts.forEach((a) => alerts.push(a)); });
    osso(v, reg, tfgeIt ? tfgeIt.value : null).forEach(push);
    [crab(v, reg, tfgeIt ? tfgeIt.value : null), edta(v, reg)].forEach((x) => { if (x) alerts.push(x); });
    const globBaixo = items.find((i) => i.id === 'prot' && i.baixo);
    if (globBaixo) alerts.push({ level: 'mod', title: 'Hipogamaglobulinemia', text: `Globulinas ${fmt(globBaixo.value, 1)} g/dL (< ${fmt(gp(reg, 'proteinas')['glob.low'], 1)}): investigar perda renal (síndrome nefrótica), imunodeficiência ou mieloma de cadeias leves (EPS com imunofixação e cadeias leves livres séricas).` });
    const globAlto = items.find((i) => i.id === 'prot' && i.level === 'mod' && !i.baixo);
    if (globAlto) alerts.push({ level: 'mod', title: 'Hiperglobulinemia', text: 'Globulinas elevadas ou relação A/G invertida: solicitar eletroforese de proteínas séricas (EPS).' });
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
        L.push(`- ${it.title}: ${it.main}${it.sub ? ' (' + it.sub + ')' : ''} ${g || it.selo || ''}`.trimEnd());
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
    pt: ['proteinas totais', 'prot totais', 'proteina total', 'ptn'], ht: ['hematocrito', 'htc', 'hct', 'ht'], rdw: ['rdw'], ret: ['reticulocitos', 'retic', 'ret'],
    transf: ['transferrina'], leuco: ['leucocitos', 'leuco', 'leuc', 'wbc'], seg: ['segmentados', 'seg'], bast: ['bastoes', 'bast'],
    tpC: ['tp controle', 'controle tp'], tp: ['tempo de protrombina', 'tp'], isi: ['isi'], inr: ['inr', 'rni'],
    psaL: ['psa livre', 'psa l'], psaT: ['psa total', 'psa'], vprost: ['volume prostatico', 'vol prostatico'], pth: ['paratormonio', 'pth'],
    vitd: ['25 oh vitamina d', '25 oh', '25ohd', 'vitamina d', 'vit d'], fosforo: ['fosforo', 'fosf'], fa: ['fosfatase alcalina', 'fa'],
    b12: ['vitamina b12', 'b12', 'cobalamina'], hcy: ['homocisteina', 'hcy'], mma: ['acido metilmalonico', 'amm', 'mma'],
    iga: ['iga serica total', 'iga total', 'iga serica', 'iga'], calpro: ['calprotectina fecal', 'calprotectina'], elastase: ['elastase pancreatica fecal', 'elastase fecal', 'elastase'],
    ttpaC: ['ttpa controle', 'controle ttpa'], ttpa: ['tempo de tromboplastina parcial ativada', 'ttpa', 'ptt'], fibrin: ['fibrinogenio'],
  };
  const CONTAGEM = { plaq: 1, rbc: 1 };
  function parseReport(texto, extra) {
    const t = semAcento(String(texto || '')).replace(/[-–]+/g, ' ');
    const values = {}, found = [];
    const pares = [];
    Object.entries(ALIASES).forEach(([id, al]) => al.forEach((a) => pares.push([id, a])));
    Object.entries(extra || {}).forEach(([id, al]) => (al || []).forEach((a) => { const x = semAcento(String(a)).trim(); if (x) pares.push([id, x]); }));
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
    let mm = t.match(/(?:anti[ -]?ttg|anti[ -]?transglutaminase|transglutaminase)(?: iga)?[^a-z0-9]{0,6}(positivo|reagente|negativo|nao reagente)/);
    if (mm) values.ttgIgA = /^(positivo|reagente)$/.test(mm[1]) ? 'pos' : 'neg';
    mm = t.match(/(?:anti[ -]?dgp|gliadina deaminada)(?: igg)?[^a-z0-9]{0,6}(positivo|reagente|negativo|nao reagente)/);
    if (mm) values.dgpIgG = /^(positivo|reagente)$/.test(mm[1]) ? 'pos' : 'neg';
    if (/\b(finasterida|dutasterida)\b/.test(t)) values.ari = true;
    if (/\b(pico monoclonal|componente m)\b/.test(t) && !/\b(sem|ausencia de|nao ha) (pico|componente)/.test(t)) values.picoM = true;
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

  /* ---------- Modo A: OpenRouter com busca na web (funções puras; a chamada de rede fica na interface) ---------- */
  const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
  function openrouterBody(model, prompt) {
    return {
      model, temperature: 0.1, max_tokens: 4000,
      plugins: [{ id: 'web', max_results: 8 }],
      messages: [
        { role: 'system', content: 'Você audita diretrizes de medicina laboratorial. Use a busca na web para verificar publicações oficiais e responda SOMENTE com o JSON pedido, sem texto fora dele.' },
        { role: 'user', content: prompt },
      ],
    };
  }
  /* Devolve { text, citations:[{uri,title}], truncated } ou { error }. */
  function openrouterParse(j) {
    if (j && j.error) return { error: `OpenRouter: ${j.error.message || 'erro do provedor'}.` };
    const c = j && j.choices && j.choices[0];
    const m = c && c.message;
    if (!m) return { error: 'O OpenRouter não devolveu resposta.' };
    const text = typeof m.content === 'string' ? m.content : Array.isArray(m.content) ? m.content.map((x) => x.text || '').join('') : '';
    const citations = (m.annotations || []).filter((a) => a && a.type === 'url_citation' && a.url_citation && /^https?:\/\//.test(a.url_citation.url || '')).map((a) => ({ uri: a.url_citation.url, title: a.url_citation.title || '' }));
    const seen = new Set();
    return { text, citations: citations.filter((x) => (seen.has(x.uri) ? false : seen.add(x.uri))).slice(0, 8), truncated: c.finish_reason === 'length' };
  }
  function openrouterErro(status, j) {
    const det = j && j.error && j.error.message ? ` (${j.error.message})` : '';
    if (status === 401) return 'Chave do OpenRouter recusada (401). Confira a chave em openrouter.ai/settings/keys.';
    if (status === 402) return 'Créditos insuficientes no OpenRouter (402). Adicione créditos em openrouter.ai/settings/credits.';
    if (status === 403) return `Acesso negado pelo OpenRouter ou pelo modelo (403)${det}.`;
    if (status === 404) return `Modelo não encontrado no OpenRouter (404)${det}. Confira o nome do modelo.`;
    if (status === 429) return 'Limite de uso do OpenRouter atingido (429). Tente mais tarde.';
    return `Erro ${status} do OpenRouter${det}.`;
  }

  /* Prompt do Modo B (cole em ChatGPT/Perplexity/Claude com acesso à web). */
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
    selo, effective, cycleStatus, extractJson, OPENROUTER_URL, openrouterBody, openrouterParse, openrouterErro, validatePackage, applyRows, buildAuditPrompt, keyOf, splitKey, G_ORDER,
  };
});
