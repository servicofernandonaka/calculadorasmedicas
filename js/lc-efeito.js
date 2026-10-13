/* Calculadora de efeito (determinística). Desfecho dicotômico e contínuo. IC 95% (z=1,959964). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Efeito = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const Z = 1.959963984540054;
  const inteiro = (x) => Number.isInteger(x) && x >= 0;
  /* Intervalo de Wilson (escore) para uma proporção */
  function wilson(x, n, z) {
    z = z || Z;
    const p = x / n, z2 = z * z, d = 1 + z2 / n;
    const c = (p + z2 / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n))) / d;
    return [Math.max(0, c - h), Math.min(1, c + h)];
  }
  /* Diferença de proporções p1 - p2: método híbrido de escore de Newcombe (método 10) */
  function newcombe(x1, n1, x2, n2) {
    const p1 = x1 / n1, p2 = x2 / n2, [l1, u1] = wilson(x1, n1), [l2, u2] = wilson(x2, n2);
    const d = p1 - p2;
    return [d - Math.sqrt((p1 - l1) ** 2 + (u2 - p2) ** 2), d + Math.sqrt((u1 - p1) ** 2 + (p2 - l2) ** 2)];
  }
  /* Dicotômico. Experimental: ev1/n1. Controle: ev0/n0. Desfecho = evento indesejável. */
  function dicotomico(i) {
    const { ev1, n1, ev0, n0 } = i;
    if (![ev1, n1, ev0, n0].every(inteiro)) return { erro: 'Informe números inteiros não negativos.' };
    if (n1 < 1 || n0 < 1) return { erro: 'O tamanho de cada grupo deve ser pelo menos 1.' };
    if (ev1 > n1 || ev0 > n0) return { erro: 'Eventos não podem exceder o tamanho do grupo.' };
    const r1 = ev1 / n1, r0 = ev0 / n0;
    const out = { r1, r0, avisos: [] };
    // Diferença absoluta de risco, positiva quando o experimental reduz o risco (RAR)
    const dif = newcombe(ev0, n0, ev1, n1); // r0 - r1
    out.rar = r0 - r1; out.rar_ic = dif;
    // Risco relativo (log, Katz), com correção de 0,5 se alguma célula for 0
    const zero = ev1 === 0 || ev0 === 0 || ev1 === n1 || ev0 === n0;
    let a = ev1, b = n1, c = ev0, d = n0;
    if (zero) { a += 0.5; b += 1; c += 0.5; d += 1; out.avisos.push('Há célula com zero (ou todos com evento): aplicada correção de 0,5 nas razões (RR, OR). A diferença absoluta não usa correção.'); }
    const rr = (a / b) / (c / d);
    const se = Math.sqrt(1 / a - 1 / b + 1 / c - 1 / d);
    out.rr = (r0 === 0 && r1 === 0) ? null : rr;
    if (r0 === 0 && r1 === 0) { out.avisos.push('Nenhum evento nos dois grupos: razões não estimáveis.'); }
    else {
      out.rr_ic = [Math.exp(Math.log(rr) - Z * se), Math.exp(Math.log(rr) + Z * se)];
      out.rrr = 1 - rr; out.rrr_ic = [1 - out.rr_ic[1], 1 - out.rr_ic[0]];
      const oa = a, ob = b - a, oc = c, od = d - c;
      const or = (oa * od) / (ob * oc), seo = Math.sqrt(1 / oa + 1 / ob + 1 / oc + 1 / od);
      out.or = or; out.or_ic = [Math.exp(Math.log(or) - Z * seo), Math.exp(Math.log(or) + Z * seo)];
    }
    // NNT
    out.nnt = nnt(out.rar, out.rar_ic);
    const cruzaRar = out.rar_ic[0] <= 0 && out.rar_ic[1] >= 0;
    if (out.rr_ic && cruzaRar !== (out.rr_ic[0] <= 1 && out.rr_ic[1] >= 1))
      out.avisos.push('Resultado limítrofe: o IC da diferença absoluta e o IC do risco relativo discordam quanto à inclusão da nulidade (métodos de cálculo diferentes). Não conclua só pelo valor de p implícito.');
    out.cruza_nulo = cruzaRar;
    return out;
  }
  /* NNT a partir da RAR e do IC (Altman 1998): se o IC da RAR inclui 0, o IC do NNT inclui infinito. */
  function nnt(rar, ic) {
    const r = { valor: null, tipo: null, ic_texto: null };
    if (rar === 0) { r.tipo = 'indefinido'; r.ic_texto = 'Sem diferença: NNT indefinido.'; return r; }
    const benef = rar > 0;
    r.valor = 1 / Math.abs(rar);
    r.tipo = benef ? 'NNT (benefício)' : 'NNH (dano)';
    const [lo, hi] = ic;
    const f = (x) => 1 / Math.abs(x);
    if (lo > 0 || hi < 0) {
      const a = f(lo), b = f(hi);
      r.ic = [Math.min(a, b), Math.max(a, b)];
      r.ic_texto = 'IC 95%: ' + r.ic[0].toFixed(1) + ' a ' + r.ic[1].toFixed(1);
    } else {
      // IC cruza zero: do NNTB (1/hi) até infinito e de infinito até NNTH (1/|lo|)
      r.ic = null;
      r.ic_texto = 'IC 95% da diferença inclui zero: NNT de ' + f(hi).toFixed(1) + ' (benefício) passando por infinito até ' + f(lo).toFixed(1) + ' (dano). Não interpretar como um intervalo comum.';
    }
    return r;
  }
  /* NNT individualizado: aplica o RR do estudo ao risco basal do paciente (PEER) */
  function nntIndividual(rr, riscoBasal, rrIc) {
    if (!(riscoBasal > 0 && riscoBasal < 1) || !(rr > 0)) return { erro: 'Risco basal deve estar entre 0 e 1 (exclusive) e RR positivo.' };
    const rar = riscoBasal * (1 - rr);
    const out = { rar, nnt: rar === 0 ? null : 1 / Math.abs(rar) };
    if (rrIc) {
      const a = riscoBasal * (1 - rrIc[1]), b = riscoBasal * (1 - rrIc[0]);
      out.rar_ic = [a, b];
      out.nnt_info = nnt(rar, [a, b]);
    }
    return out;
  }
  /* Contínuo: diferença de médias (Welch) e d de Cohen / g de Hedges */
  function continuo(i) {
    const { m1, sd1, n1, m0, sd0, n0 } = i;
    if (![m1, sd1, n1, m0, sd0, n0].every((x) => typeof x === 'number' && isFinite(x))) return { erro: 'Informe todos os valores numéricos.' };
    if (n1 < 2 || n0 < 2 || !Number.isInteger(n1) || !Number.isInteger(n0)) return { erro: 'Cada grupo precisa de n inteiro >= 2.' };
    if (sd1 < 0 || sd0 < 0) return { erro: 'Desvio padrão não pode ser negativo.' };
    const md = m1 - m0;
    const v1 = sd1 * sd1 / n1, v0 = sd0 * sd0 / n0, se = Math.sqrt(v1 + v0);
    const out = { dm: md, se, avisos: ['Intervalo com aproximação normal (z=1,96); em grupos pequenos o IC t de Welch é um pouco mais largo.'] };
    out.dm_ic = [md - Z * se, md + Z * se];
    const sp = Math.sqrt(((n1 - 1) * sd1 * sd1 + (n0 - 1) * sd0 * sd0) / (n1 + n0 - 2));
    if (sp > 0) {
      const d = md / sp, J = 1 - 3 / (4 * (n1 + n0 - 2) - 1);
      out.d = d; out.g = d * J;
    }
    return out;
  }
  return { wilson, newcombe, dicotomico, nnt, nntIndividual, continuo };
});
