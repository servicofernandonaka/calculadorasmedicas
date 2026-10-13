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

test('Sugestão por domínio (artigo, fase 4)', () => {
  assert.equal(Q.sugestaoRisco('D1', { '1.1': 'Y', '1.2': 'Y', '1.3': 'Y' }), 'baixo');
  assert.equal(Q.sugestaoRisco('D1', { '1.1': 'Y', '1.2': 'N', '1.3': 'Y' }), 'potencial');
  assert.equal(Q.sugestaoRisco('D1', { '1.1': 'Y', '1.2': 'U', '1.3': 'Y' }), null);
  assert.equal(Q.sugestaoRisco('D1', { '1.1': 'Y', '1.2': 'Y' }), null);
  assert.equal(Q.sugestaoRisco('D4', { '4.1': 'Y', '4.2': 'Y', '4.3': 'Y', '4.4': 'Y' }), 'baixo');
  assert.equal(Q.sugestaoRisco('D4', { '4.1': 'Y', '4.2': 'Y', '4.3': 'Y', '4.4': 'N' }), 'potencial');
});
test('Global do estudo: baixo em todos = baixo; alto ou incerto em 1 ou mais = em risco', () => {
  assert.equal(Q.globalEstudo({ D1: 'baixo', D2: 'baixo', D3: 'baixo', D4: 'baixo' }), 'baixo');
  assert.equal(Q.globalEstudo({ D1: 'baixo', D2: 'alto', D3: 'baixo', D4: 'baixo' }), 'em_risco');
  assert.equal(Q.globalEstudo({ D1: 'baixo', D2: 'baixo', D3: 'baixo', D4: 'incerto' }), 'em_risco');
  assert.equal(Q.globalEstudo({ D1: 'baixo', D2: 'baixo', D3: 'baixo' }), null);
  assert.equal(Q.globalEstudo({ D1: 'baixo', D2: 'baixo', D3: 'baixo' }, 'aplic'), 'baixo');
  assert.equal(Q.globalEstudo({ D1: 'baixo', D2: 'alto', D3: 'baixo' }, 'aplic'), 'em_risco');
});
