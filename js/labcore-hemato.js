/* LabCore APS — Módulo 2 (adendo): simulador de eletroforese de proteínas séricas (EPS, com curva SVG) e interpretador de eletroforese de hemoglobina / HPLC.
   Motores determinísticos sem DOM; o SVG é devolvido como texto. Cortes lidos do Registry (guidelines 'eps', 'hplc', 'imwg', 'hemato'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./labcore-engine.js'));
  else root.LabCoreHemato = factory(root.LabCore);
})(typeof self !== 'undefined' ? self : this, function (LC) {
  'use strict';
  const fmt = LC.fmt;
  const gp = (reg, g) => { const o = {}; Object.entries(reg.guidelines[g].params).forEach(([k, p]) => { o[k] = p.value; }); return o; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- EPS ---------- */
  const FRACOES = [
    { id: 'alb', k: 'alb', nome: 'Albumina', x: 0.10, sd: 0.035 },
    { id: 'a1', k: 'a1', nome: 'Alfa-1', x: 0.245, sd: 0.018 },
    { id: 'a2', k: 'a2', nome: 'Alfa-2', x: 0.345, sd: 0.028 },
    { id: 'b1', k: 'b1', nome: 'Beta-1', x: 0.48, sd: 0.02 },
    { id: 'b2', k: 'b2', nome: 'Beta-2', x: 0.575, sd: 0.02 },
    { id: 'g', k: 'g', nome: 'Gama', x: 0.78, sd: 0.07 },
  ];
  const ZONA_PICO = { g: 0.72, b: 0.54, a2: 0.345 };
  const campo = { alb: 'alb', a1: 'a1', a2: 'a2', b1: 'b1', b2: 'b2', g: 'gama' };

  function nivel(x, lo, hi) { return x < lo ? 'baixo' : x > hi ? 'alto' : 'normal'; }

  /* v: { alb, a1, a2, b1, b2, gama, pico, picoZona:'g'|'b'|'a2', ca, albSerica?, cr, hb, osso }  (g/dL, mg/dL) */
  function eps(v, reg) {
    const e = gp(reg, 'eps'), im = gp(reg, 'imwg');
    const lv = {};
    FRACOES.forEach((f) => { if (v[campo[f.id]] != null) lv[f.id] = nivel(v[campo[f.id]], e[f.k + '.lo'], e[f.k + '.hi']); });
    const padroes = [];
    const P = (id, level, title, text) => padroes.push({ id, level, title, text });
    const tem = (id, n) => lv[id] === n;
    if (tem('a1', 'alto') && tem('a2', 'alto')) P('inflamacao', 'mod', 'Padrão de inflamação aguda', 'Alfa-1 e alfa-2 altas (reagentes de fase aguda), em geral com albumina baixa. Correlacione com PCR, infecção, trauma ou neoplasia.');
    if (tem('alb', 'baixo') && tem('g', 'baixo') && tem('a2', 'alto')) P('nefrotico', 'mod', 'Padrão de síndrome nefrótica', 'Albumina e gama baixas com alfa-2 elevada (retenção de alfa-2-macroglobulina). Pedir proteinúria de 24 h ou RAC, creatinina e urina I; encaminhar à Nefrologia.');
    if (tem('alb', 'baixo') && tem('b2', 'alto') && tem('g', 'alto')) P('cirrose', 'mod', 'Possível ponte beta-gama (cirrose)', 'Beta-2 e gama aumentadas com albumina baixa: aumento de IgA pode fundir beta e gama (beta-gamma bridging). Confirmar o fechamento do vale na curva e avaliar hepatopatia (enzimas, INR, plaquetas, FIB-4, ultrassom).');
    if (tem('a1', 'baixo')) P('aat', 'mod', 'Alfa-1 achatada', 'Pode refletir deficiência de alfa-1-antitripsina (também surge com hipoalbuminemia grave). Dosar alfa-1-antitripsina sérica e, se baixa, fenotipar; avaliar pulmão e fígado.');
    if (tem('b1', 'alto')) P('ferropenia', 'mod', 'Beta-1 elevada', 'A transferrina migra na beta-1 e aumenta na ferropenia (e na gestação e uso de estrogênio). Correlacionar com ferritina e saturação de transferrina.');
    if (tem('g', 'baixo') && !tem('a2', 'alto')) P('hipogama', 'mod', 'Hipogamaglobulinemia', 'Gama baixa: imunodeficiência, perda proteica (nefrótica, enteropatia), fármacos imunossupressores ou doença linfoproliferativa. Dosar imunoglobulinas e, se indicado, cadeias leves livres.');

    let pico = null;
    if (v.pico != null && v.pico > 0) {
      const crabs = [];
      if (v.ca != null && v.ca > im['crab.ca']) crabs.push('hipercalcemia');
      if (v.cr != null && v.cr > im['crab.cr']) crabs.push('creatinina alta');
      if (v.hb != null && v.hb < im['crab.hb']) crabs.push('anemia');
      if (v.osso) crabs.push('lesão óssea');
      const mm = v.pico >= im['mgus.mMax'] || crabs.length > 0;
      pico = { crab: crabs, classe: mm ? 'mieloma' : 'mgus' };
      if (crabs.length) P('pico_mm', 'high', 'Pico monoclonal com CRAB: suspeita de mieloma múltiplo', `Componente M ${fmt(v.pico, 2)} g/dL com ${crabs.join(', ')}. Imunofixação sérica e urinária, cadeias leves livres, medula óssea (plasmócitos ≥ ${fmt(im['mm.pcMin'], 0)}%) e imagem; encaminhar com urgência à Hematologia.`);
      else if (mm) P('pico_mm', 'high', 'Pico monoclonal ≥ 3 g/dL sem CRAB: mieloma indolente ou mieloma', `Componente M ${fmt(v.pico, 2)} g/dL (≥ ${fmt(im['mgus.mMax'], 1)}). Sem CRAB informado, o diagnóstico depende da medula óssea (IMWG 2014): encaminhar à Hematologia.`);
      else P('pico_mgus', 'mod', 'Pico monoclonal < 3 g/dL sem CRAB: compatível com MGUS', `Componente M ${fmt(v.pico, 2)} g/dL. Confirmar com imunofixação e cadeias leves livres; seguimento e estratificação com a Hematologia (a medula só é necessária em caso de risco ou suspeita).`);
    } else if (tem('g', 'alto')) P('policlonal', 'mod', 'Hipergamaglobulinemia sem pico', 'Aumento difuso da gama: inflamação crônica, hepatopatia, doença autoimune ou infecção. Procure a causa; imunofixação se o perfil sugerir banda estreita.');

    if (!padroes.length) P('normal', 'low', 'Sem alteração pelas faixas do Registry', 'Todas as frações informadas estão dentro das faixas (que dependem do seu laboratório; confira-as no editor de cutoffs). Um pico pequeno pode passar despercebido: se houver suspeita, pedir imunofixação.');
    return { niveis: lv, padroes, pico, selos: [LC.selo(reg, 'eps'), LC.selo(reg, 'imwg')], svg: svgEps(v, reg) };
  }

  const gauss = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2);
  function curva(valor, pico, zona) {
    // altura = concentração / (sd·√2π) para que a área sob cada pico seja proporcional à fração
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const x = i / 240;
      let y = 0;
      FRACOES.forEach((f) => { y += (valor[f.id] || 0) / (f.sd * Math.sqrt(2 * Math.PI)) * gauss(x, f.x, f.sd); });
      if (pico > 0) y += pico / (0.011 * Math.sqrt(2 * Math.PI)) * gauss(x, ZONA_PICO[zona] || ZONA_PICO.g, 0.011);
      pts.push([x, y]);
    }
    return pts;
  }
  /* Curva densitométrica: normal (tracejada, ponto médio da faixa de cada fração) × paciente. Devolve o SVG como texto. */
  function svgEps(v, reg) {
    const e = gp(reg, 'eps');
    const normal = {}, pac = {};
    FRACOES.forEach((f) => { normal[f.id] = (e[f.k + '.lo'] + e[f.k + '.hi']) / 2; pac[f.id] = v[campo[f.id]] != null ? v[campo[f.id]] : normal[f.id]; });
    const A = curva(normal, 0, 'g'), B = curva(pac, v.pico || 0, v.picoZona);
    const ymax = Math.max(...A.map((p) => p[1]), ...B.map((p) => p[1])) * 1.08;
    const W = 600, H = 250, ox = 30, oy = 20, w = W - ox - 10, h = H - oy - 36;
    const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${(ox + p[0] * w).toFixed(1)} ${(oy + h - (p[1] / ymax) * h).toFixed(1)}`).join('');
    const rot = FRACOES.map((f) => `<text x="${(ox + f.x * w).toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="12" fill="currentColor">${f.id === 'alb' ? 'Alb' : f.id === 'a1' ? 'α1' : f.id === 'a2' ? 'α2' : f.id === 'b1' ? 'β1' : f.id === 'b2' ? 'β2' : 'γ'}</text>`).join('');
    const resumo = FRACOES.filter((f) => v[campo[f.id]] != null).map((f) => `${f.nome} ${fmt(v[campo[f.id]], 2)} g/dL`).join('; ') + (v.pico > 0 ? `; pico monoclonal ${fmt(v.pico, 2)} g/dL` : '');
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc('Curva densitométrica da eletroforese de proteínas séricas. ' + resumo)}" style="width:100%;height:auto;color:var(--text)">
<line x1="${ox}" y1="${oy + h}" x2="${W - 10}" y2="${oy + h}" stroke="currentColor" stroke-opacity=".5"/>
<path d="${path(A)}" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="2" stroke-dasharray="6 5"/>
<path d="${path(B)}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linejoin="round"/>
${rot}
<g font-size="12" fill="currentColor"><line x1="${W - 190}" y1="14" x2="${W - 160}" y2="14" stroke="currentColor" stroke-opacity=".55" stroke-width="2" stroke-dasharray="6 5"/><text x="${W - 155}" y="18">normal</text><line x1="${W - 100}" y1="14" x2="${W - 70}" y2="14" stroke="var(--primary)" stroke-width="2.5"/><text x="${W - 65}" y="18">paciente</text></g></svg>`;
  }

  /* ---------- Eletroforese de hemoglobina / HPLC ---------- */
  /* v: { a1, a2, f, s, c, vcm, rbc?, ferritina?, ferropenia(bool) } em % */
  function hplc(v, reg) {
    const g = gp(reg, 'hplc'), h = gp(reg, 'hemato');
    const a1 = v.a1 || 0, a2 = v.a2 || 0, f = v.f || 0, s = v.s || 0, c = v.c || 0;
    const aviso = [], padroes = [], alertas = [];
    const P = (id, level, title, text, recs) => padroes.push({ id, level, title, text, recs: recs || [] });
    const soma = a1 + a2 + f + s + c;
    if (soma < 90 || soma > 110) aviso.push(`As frações somam ${fmt(soma, 1)}%: confira os valores (devem somar cerca de 100%).`);
    const micro = v.vcm != null && v.vcm < h['micro.vcm'];
    if (v.vcm == null) aviso.push('VCM não informado: as regras de talassemia dependem da microcitose.');
    const temS = s >= g['var.presence'], temC = c >= g['var.presence'];
    const mentzer = v.vcm != null && v.rbc ? v.vcm / v.rbc : null;
    const ferrNormal = v.ferritina != null && v.ferritina >= h['ferr.def'];
    const recFerro = ferrNormal ? ['Ferritina normal: sulfato ferroso não está indicado; não repor ferro sem comprovar a ferropenia.'] : v.ferritina == null ? ['Não prescrever sulfato ferroso empiricamente: confirme a ferropenia (ferritina e saturação) antes de repor.'] : [];

    if (temS) {
      if (temC) {
        if (s >= g['sc.min'] && s <= g['sc.max'] && c >= g['sc.min'] && c <= g['sc.max']) P('sc', 'high', 'Doença da hemoglobina SC (HbSC)', `HbS ${fmt(s, 0)}% e HbC ${fmt(c, 0)}%. Doença falciforme: encaminhar à Hematologia, orientar crises, vacinas e acompanhamento oftalmológico.`, ['Confirmar com a Hematologia; pode haver retinopatia e necrose avascular.']);
        else P('sc_indef', 'mod', 'HbS e HbC presentes fora do padrão SC', 'Revisar o resultado com o laboratório e a Hematologia (outras combinações, como C-beta ou S-beta, ou amostra atípica).');
      } else if (a1 > s) {
        P('as', 'mod', 'Traço falciforme (HbAS)', `HbA1 ${fmt(a1, 0)}% maior que HbS ${fmt(s, 0)}%. Em geral assintomático; aconselhamento genético, atenção a esforço extremo, desidratação e altitude; avaliar parceiro na gestação.`, ['Não é doença falciforme.']);
      } else if (a2 > g['a2.hi'] && micro) {
        const q = a1 <= g['ss.a1Max'] ? 'bzero' : a1 >= g['sbeta.a1Min'] && a1 <= g['sbeta.a1Max'] ? 'bmais' : 'indef';
        if (q === 'bzero') P('sbeta0', 'high', 'S-beta⁰ talassemia', `HbS predominante, HbA1 ausente, HbA2 ${fmt(a2, 1)}% elevada e microcitose. Clinicamente semelhante à anemia falciforme: encaminhar à Hematologia.`);
        else if (q === 'bmais') P('sbeta1', 'high', 'S-beta⁺ talassemia', `HbS predominante com HbA1 ${fmt(a1, 0)}% (entre ${fmt(g['sbeta.a1Min'], 0)}% e ${fmt(g['sbeta.a1Max'], 0)}%), HbA2 elevada e microcitose. Em geral mais leve que a anemia falciforme; encaminhar à Hematologia.`);
        else P('sbeta_i', 'mod', 'S-beta talassemia provável, com HbA1 fora das faixas', `HbA1 ${fmt(a1, 1)}%: fora de 0% (S-beta⁰) e de ${fmt(g['sbeta.a1Min'], 0)}-${fmt(g['sbeta.a1Max'], 0)}% (S-beta⁺). Discutir com o laboratório e a Hematologia.`);
      } else if (s > g['ss.sMin'] && a1 <= g['ss.a1Max'] && a2 <= g['a2.hi']) {
        P('ss', 'high', 'Anemia falciforme (HbSS)', `HbS ${fmt(s, 0)}% com HbA1 ausente e HbA2 ${fmt(a2, 1)}% (não elevada). HbF esperada entre ${fmt(g['ss.fMin'], 0)}% e ${fmt(g['ss.fMax'], 0)}%${f >= g['ss.fMin'] && f <= g['ss.fMax'] ? ` (observada ${fmt(f, 1)}%)` : ` (observada ${fmt(f, 1)}%: fora do esperado, revisar)`}. Encaminhar à Hematologia.`, ['Se a pessoa foi transfundida ou usa hidroxiureia, a interpretação muda (HbA1 transfundida, HbF elevada).']);
      } else P('s_indef', 'mod', 'Padrão com HbS não classificável pelas regras', 'Discutir com o laboratório e a Hematologia; considerar transfusão recente, hidroxiureia e coleta atípica.');
    } else if (temC) {
      if (a1 > c) P('ac', 'mod', 'Traço de hemoglobina C (HbAC)', `HbA1 ${fmt(a1, 0)}% maior que HbC ${fmt(c, 0)}%. Em geral assintomático; aconselhamento genético.`);
      else P('c_pred', 'mod', 'HbC predominante', 'Considerar doença da hemoglobina C (HbCC) ou C-beta talassemia: encaminhar à Hematologia.');
    } else {
      if (a2 > g['a2.hi']) {
        if (micro && a2 <= g['a2.betaMax']) {
          P('betaMenor', 'high', 'Beta-talassemia menor', `Microcitose com HbA2 ${fmt(a2, 1)}% (de ${fmt(g['a2.hi'], 1)}% a ${fmt(g['a2.betaMax'], 1)}%). Em geral não requer tratamento; aconselhamento genético, especialmente no casal em idade fértil.`, recFerro.concat(v.ferropenia ? ['A HbA2 permaneceu elevada apesar da ferropenia, o que sustenta o diagnóstico (a ferropenia tende a reduzi-la).'] : []));
        } else if (a2 > g['a2.betaMax']) P('a2_muito', 'mod', 'HbA2 muito elevada', `HbA2 ${fmt(a2, 1)}% acima de ${fmt(g['a2.betaMax'], 1)}%: considerar variantes que coeluem com a HbA2 (como HbE) ou outras causas; discutir com o laboratório.`);
        else P('a2_semmicro', 'mod', 'HbA2 elevada sem microcitose', 'Beta-talassemia pode coexistir com normocitose (por exemplo, com deficiência de B12/folato ou associação com alfa-talassemia); outras causas incluem hipertireoidismo e alguns antirretrovirais. Revisar com a Hematologia.');
      } else if (micro) {
        if (v.ferropenia) {
          alertas.push({ level: 'high', title: 'A ferropenia reduz falsamente a HbA2', text: 'A ferropenia reduz falsamente a HbA2: com ferropenia concomitante, uma HbA2 normal ou limítrofe NÃO exclui beta-talassemia. Corrija o ferro e repita a eletroforese antes de descartar o diagnóstico.' });
          P('ferropenia_ocultando', 'high', 'Microcitose com ferropenia e HbA2 não elevada: não descarte beta-talassemia', 'Trate a ferropenia (se confirmada) e repita a eletroforese após a reposição.', recFerro);
        } else if (mentzer != null && mentzer < h['mentzer.cut'] && f < g['f.normalMax']) {
          P('alfa', 'mod', 'Traço alfa-talassêmico provável', `Microcitose, índice de Mentzer ${fmt(mentzer, 1)} (< ${fmt(h['mentzer.cut'], 0)}), sem ferropenia e eletroforese normal no adulto. A confirmação exige biologia molecular (deleções alfa); aconselhamento genético se houver planejamento familiar.`, recFerro);
        } else if (mentzer == null) P('micro_sem_mentzer', 'mod', 'Microcitose com HPLC normal', 'Informe os eritrócitos para calcular o índice de Mentzer e avalie ferritina/saturação; HPLC normal com microcitose e ferro normal sugere traço alfa-talassêmico.', recFerro);
        else P('micro_mentzer_alto', 'mod', 'Microcitose com HPLC normal e Mentzer não sugestivo de talassemia', `Índice de Mentzer ${fmt(mentzer, 1)} (≥ ${fmt(h['mentzer.cut'], 0)}): investigar ferropenia (ferritina, saturação) e doença crônica.`, recFerro);
      } else if (f >= g['f.normalMax']) {
        P('f_alta', 'mod', 'HbF elevada isolada', `HbF ${fmt(f, 1)}% (≥ ${fmt(g['f.normalMax'], 0)}%): persistência hereditária de HbF, hidroxiureia, gestação, algumas hemoglobinopatias e doenças hematológicas. Correlacionar com a história.`);
      } else if (a1 > g['a1.normalMin'] && a2 >= g['a2.lo'] && a2 <= g['a2.hi']) {
        P('normal', 'low', 'Padrão normal', `HbA1 ${fmt(a1, 0)}%, HbA2 ${fmt(a2, 1)}% e HbF ${fmt(f, 1)}%, sem variantes.`);
      } else if (a2 < g['a2.lo']) P('a2_baixa', 'mod', 'HbA2 baixa', 'Pode ocorrer na ferropenia e na alfa-talassemia; correlacionar com VCM e ferritina e repetir após corrigir o ferro.');
      else P('indef', 'mod', 'Padrão fora das regras', 'Revisar valores e método com o laboratório.');
    }
    return { padroes, alertas, avisos: aviso, mentzer, selos: [LC.selo(reg, 'hplc'), LC.selo(reg, 'hemato')] };
  }

  return { eps, svgEps, hplc, FRACOES };
});
