const test = require('node:test'), assert = require('node:assert');
const A = require('../js/lc-amstar.js');
const mk = (ids) => Object.fromEntries(ids.map((i) => [i, true]));
const item = (n) => A.ITENS.find((x) => x.n === n);

test('16 itens, todos com texto original em inglês', () => {
  assert.equal(A.ITENS.length, 16);
  A.ITENS.forEach((it, i) => { assert.equal(it.n, i + 1); assert.ok(it.en && it.pt); });
});
test('Item 1: Sim só com P, I, C e O (tempo de seguimento é opcional)', () => {
  assert.equal(A.nivel(item(1), mk(['p', 'i', 'c', 'o'])), 'yes');
  assert.equal(A.nivel(item(1), mk(['p', 'i', 'c', 'o', 't'])), 'yes');
  assert.equal(A.nivel(item(1), mk(['p', 'i', 'c'])), 'no');
  assert.equal(A.nivel(item(1), mk(['t'])), 'no');
});
test('Item 2: Sim parcial, Sim e Não', () => {
  const py = ['q', 's', 'e', 'r'];
  assert.equal(A.nivel(item(2), mk(py)), 'partial');
  assert.equal(A.nivel(item(2), mk(py.concat(['reg', 'ma', 'het', 'dev']))), 'yes');
  assert.equal(A.nivel(item(2), mk(py.concat(['reg', 'ma', 'het']))), 'partial');
  assert.equal(A.nivel(item(2), mk(['q', 's', 'e'])), 'no');
  assert.equal(A.nivel(item(2), mk(['reg', 'ma', 'het', 'dev'])), 'no'); // extras sem o protocolo escrito não bastam
});
test('Item 4', () => {
  assert.equal(A.nivel(item(4), mk(['db', 'kw', 'rs'])), 'partial');
  assert.equal(A.nivel(item(4), mk(['db', 'kw'])), 'no');
  assert.equal(A.nivel(item(4), mk(['db', 'kw', 'rs', 'ref', 'reg', 'exp', 'gl', 'm24'])), 'yes');
  assert.equal(A.nivel(item(4), mk(['db', 'kw', 'rs', 'ref', 'reg', 'exp', 'gl'])), 'partial');
});
test('Itens 5 e 6: uma das alternativas basta', () => {
  [5, 6].forEach((n) => { assert.equal(A.nivel(item(n), mk(['a'])), 'yes'); assert.equal(A.nivel(item(n), mk(['b'])), 'yes'); assert.equal(A.nivel(item(n), {}), 'no'); });
});
test('Item 7 e 8', () => {
  assert.equal(A.nivel(item(7), mk(['l'])), 'partial');
  assert.equal(A.nivel(item(7), mk(['l', 'j'])), 'yes');
  assert.equal(A.nivel(item(7), mk(['j'])), 'no');
  assert.equal(A.nivel(item(8), mk(['p', 'i', 'c', 'o', 'd'])), 'partial');
  assert.equal(A.nivel(item(8), mk(['p', 'i', 'c', 'o', 'd', 'pd', 'id', 'cd', 'se', 'tf'])), 'yes');
  assert.equal(A.nivel(item(8), mk(['p', 'i', 'c', 'o', 'd', 'pd', 'id', 'cd', 'se'])), 'partial');
});
test('Item 9 por desenho', () => {
  const r = (est) => A.avaliar(est).find((x) => x.n === 9);
  assert.equal(r({ desenho: 'rct', marcasRct: { 9: mk(['ac', 'bl']) } }).resultado, 'partial');
  assert.equal(r({ desenho: 'rct', marcasRct: { 9: mk(['ac', 'bl', 'sq', 'sr']) } }).resultado, 'yes');
  assert.equal(r({ desenho: 'rct', marcasRct: { 9: mk(['ac']) } }).resultado, 'no');
  assert.equal(r({ desenho: 'nrsi', marcasNrsi: { 9: mk(['cf', 'sb']) } }).resultado, 'partial');
  assert.equal(r({ desenho: 'nrsi', marcasNrsi: { 9: mk(['cf', 'sb', 'ex', 'sr']) } }).resultado, 'yes');
  const amb = r({ desenho: 'ambos', marcasRct: { 9: mk(['ac', 'bl', 'sq', 'sr']) }, marcasNrsi: { 9: mk(['cf']) } });
  assert.equal(amb.resultado, null); assert.deepEqual(amb.partes, { rct: 'yes', nrsi: 'no' });
  assert.equal(r({}).resultado, 'incompleto');
});
test('Item 11: RCT e NRSI; exigência de estimativas separadas só quando há os dois desenhos', () => {
  const r = (est) => A.avaliar(est).find((x) => x.n === 11);
  assert.equal(r({ desenho: 'rct', ma: true, marcasRct: { 11: mk(['j', 'w', 'h']) } }).resultado, 'yes');
  assert.equal(r({ desenho: 'rct', ma: true, marcasRct: { 11: mk(['j', 'w']) } }).resultado, 'no');
  assert.equal(r({ desenho: 'nrsi', ma: true, marcasNrsi: { 11: mk(['j', 'w', 'aj']) } }).resultado, 'yes');
  assert.equal(r({ desenho: 'ambos', ma: true, marcasRct: { 11: mk(['j', 'w', 'h']) }, marcasNrsi: { 11: mk(['j', 'w', 'aj']) } }).partes.nrsi, 'no');
  assert.equal(r({ desenho: 'ambos', ma: true, marcasRct: { 11: mk(['j', 'w', 'h']) }, marcasNrsi: { 11: mk(['j', 'w', 'aj', 'sp']) } }).partes.nrsi, 'yes');
});
test('Sem meta-análise: itens 11, 12 e 15 viram "Sem meta-análise"', () => {
  const out = A.avaliar({ desenho: 'rct', ma: false });
  [11, 12, 15].forEach((n) => assert.equal(out.find((x) => x.n === n).resultado, 'nma'));
  [13, 14, 16].forEach((n) => assert.notEqual(out.find((x) => x.n === n).resultado, 'nma'));
});
test('Itens 10, 12 a 16 (Sim/Não)', () => {
  assert.equal(A.nivel(item(10), mk(['f'])), 'yes');
  [12, 13].forEach((n) => { assert.equal(A.nivel(item(n), mk(['lo'])), 'yes'); assert.equal(A.nivel(item(n), mk(['an', 'di'])), 'yes'); assert.equal(A.nivel(item(n), {}), 'no'); });
  assert.equal(A.nivel(item(14), mk(['sh'])), 'yes'); assert.equal(A.nivel(item(14), mk(['iv'])), 'yes');
  assert.equal(A.nivel(item(15), mk(['t'])), 'yes');
  assert.equal(A.nivel(item(16), mk(['nc'])), 'yes'); assert.equal(A.nivel(item(16), mk(['fm'])), 'yes');
});

test('Confiança geral (Caixa 2 do artigo)', () => {
  const todos = (v) => A.ITENS.map((it) => ({ n: it.n, resultado: v }));
  const com = (base, mud) => base.map((r) => (mud[r.n] ? { n: r.n, resultado: mud[r.n] } : r));
  assert.deepEqual(A.CRITICOS, [2, 4, 7, 9, 11, 13, 15]);
  assert.equal(A.confianca(todos('yes')).nivel, 'alta');
  assert.equal(A.confianca(com(todos('yes'), { 1: 'no' })).nivel, 'alta');            // uma fraqueza não crítica
  assert.equal(A.confianca(com(todos('yes'), { 1: 'no', 3: 'no' })).nivel, 'moderada'); // mais de uma não crítica
  assert.equal(A.confianca(com(todos('yes'), { 4: 'no' })).nivel, 'baixa');             // uma falha crítica
  assert.equal(A.confianca(com(todos('yes'), { 4: 'no', 1: 'no', 3: 'no' })).nivel, 'baixa');
  assert.equal(A.confianca(com(todos('yes'), { 2: 'no', 7: 'no' })).nivel, 'criticamente_baixa');
  assert.equal(A.confianca(com(todos('yes'), { 4: 'partial' })).nivel, 'alta');          // parcial não conta por padrão
  assert.equal(A.confianca(com(todos('yes'), { 4: 'partial' }), { parcialFalha: true }).nivel, 'baixa');
  assert.equal(A.confianca(com(todos('yes'), { 11: 'nma', 15: 'nma' })).nivel, 'alta');  // sem meta-análise não conta
  const por = com(todos('yes'), {}); por.find((r) => r.n === 9).resultado = null; por.find((r) => r.n === 9).partes = { rct: 'yes', nrsi: 'no' };
  assert.equal(A.confianca(por).nivel, 'baixa');                                          // item por desenho: uma parte com falha
  assert.equal(A.confianca(com(todos('yes'), { 5: 'incompleto' })).provisorio, true);
});
