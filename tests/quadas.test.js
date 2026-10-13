const test = require('node:test'), assert = require('node:assert');
const Q = require('../js/lc-quadas.js');
test('4 domínios, 11 perguntas de sinalização, original em inglês', () => {
  assert.equal(Q.DOMINIOS.length, 4);
  assert.deepEqual(Q.DOMINIOS.map((d) => d.perguntas.length), [3, 2, 2, 4]);
  Q.DOMINIOS.forEach((d) => { assert.ok(d.risco && d.riscoEn); d.perguntas.forEach((q) => assert.ok(q.pt && q.en)); });
});
test('Aplicabilidade só nos domínios 1 a 3', () => {
  assert.deepEqual(Q.DOMINIOS.map((d) => !!d.aplic), [true, true, true, false]);
  assert.deepEqual(Q.RESP, ['Y', 'N', 'U']);
});
test('Resumo apenas conta julgamentos', () => {
  const s = Q.resumo({ D1: 'baixo', D2: 'alto', D3: 'incerto' }, { D1: 'baixo' });
  assert.deepEqual(s.risco, { baixo: 1, alto: 1, incerto: 1, faltam: 1 });
  assert.deepEqual(s.aplic, { baixo: 1, alto: 0, incerto: 0, faltam: 2 });
});
