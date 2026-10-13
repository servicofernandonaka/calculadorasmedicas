const test = require('node:test'), assert = require('node:assert');
const E = require('../js/lc-efeito.js');
const close = (a, b, tol, m) => assert.ok(Math.abs(a - b) <= tol, `${m || ''} ${a} vs ${b}`);
test('Wilson e Newcombe contra valores publicados (Newcombe 1998)', () => {
  const w = E.wilson(81, 263); close(w[0], 0.2553, 5e-4); close(w[1], 0.3662, 5e-4);
  const n = E.newcombe(56, 70, 48, 80); close(n[0], 0.0524, 5e-4); close(n[1], 0.3339, 5e-4);
});
test('Dicotômico: RR, OR, RRR, RAR, NNT', () => {
  const r = E.dicotomico({ ev1: 10, n1: 100, ev0: 20, n0: 100 });
  close(r.rar, 0.1, 1e-12); close(r.rr, 0.5, 1e-12); close(r.rrr, 0.5, 1e-12); close(r.or, 4 / 9, 1e-12);
  close(r.rr_ic[0], 0.2466, 5e-4); close(r.rr_ic[1], 1.0136, 5e-4);
  close(r.nnt.valor, 10, 1e-9); assert.equal(r.nnt.tipo, 'NNT (benefício)');
  assert.ok(r.avisos.some((a) => a.includes('limítrofe')), 'aviso quando RAR exclui 0 e RR inclui 1');
});
test('IC do NNT que cruza zero não é apresentado como intervalo comum', () => {
  const r = E.dicotomico({ ev1: 15, n1: 100, ev0: 20, n0: 100 });
  assert.equal(r.cruza_nulo, true); assert.equal(r.nnt.ic, null); assert.ok(r.nnt.ic_texto.includes('infinito'));
});
test('Dano: NNH quando o experimental aumenta o risco', () => {
  const r = E.dicotomico({ ev1: 40, n1: 100, ev0: 20, n0: 100 });
  assert.equal(r.nnt.tipo, 'NNH (dano)'); close(r.nnt.valor, 5, 1e-9); assert.ok(r.rar < 0);
});
test('Zero eventos: correção de 0,5 nas razões, avisos e sem divisão por zero', () => {
  const r = E.dicotomico({ ev1: 0, n1: 50, ev0: 5, n0: 50 });
  assert.ok(r.avisos.some((a) => a.includes('0,5'))); assert.ok(isFinite(r.rr) && isFinite(r.or));
  const z = E.dicotomico({ ev1: 0, n1: 50, ev0: 0, n0: 50 });
  assert.equal(z.rr, null); assert.equal(z.nnt.tipo, 'indefinido');
});
test('Validação de entradas', () => {
  assert.ok(E.dicotomico({ ev1: 5, n1: 3, ev0: 1, n0: 3 }).erro);
  assert.ok(E.dicotomico({ ev1: -1, n1: 3, ev0: 1, n0: 3 }).erro);
  assert.ok(E.dicotomico({ ev1: 1.5, n1: 3, ev0: 1, n0: 3 }).erro);
  assert.ok(E.dicotomico({ ev1: 1, n1: 0, ev0: 1, n0: 3 }).erro);
});
test('NNT individualizado (PEER)', () => {
  const r = E.nntIndividual(0.5, 0.2); close(r.rar, 0.1, 1e-12); close(r.nnt, 10, 1e-9);
  const r2 = E.nntIndividual(0.5, 0.02, [0.3, 0.8]); close(r2.nnt, 100, 1e-9); close(r2.rar_ic[0], 0.004, 1e-12); close(r2.rar_ic[1], 0.014, 1e-12);
  assert.ok(E.nntIndividual(0.5, 0).erro); assert.ok(E.nntIndividual(0.5, 1).erro);
});
test('Contínuo', () => {
  const r = E.continuo({ m1: 10, sd1: 2, n1: 50, m0: 12, sd0: 2, n0: 50 });
  close(r.dm, -2, 1e-12); close(r.se, 0.4, 1e-12); close(r.dm_ic[0], -2.7840, 1e-3); close(r.dm_ic[1], -1.2160, 1e-3);
  close(r.d, -1, 1e-12); assert.ok(Math.abs(r.g) < Math.abs(r.d));
  assert.ok(E.continuo({ m1: 1, sd1: 1, n1: 1, m0: 1, sd0: 1, n0: 5 }).erro);
});
