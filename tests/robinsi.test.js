const test = require('node:test'), assert = require('node:assert');
const R = require('../js/lc-robinsi.js');
const ids = (dom, r, aim) => R.visiveis(dom, r, aim);

test('7 domínios e 34 perguntas, todas com original em inglês', () => {
  assert.equal(R.DOMINIOS.length, 7);
  assert.equal(R.DOMINIOS.reduce((n, d) => n + d.perguntas.length, 0), 34);
  R.DOMINIOS.forEach((d) => { d.perguntas.forEach((q) => assert.ok(q.pt && q.en)); R.NIVEIS.forEach((n) => assert.ok(d.criterios[n] && d.criterios_en[n], d.id + n)); });
});
test('1.1 não tem opção "sem informação"; perguntas condicionais aceitam NA', () => {
  const q = (id) => R.DOMINIOS[0].perguntas.find((x) => x.id === id);
  assert.deepEqual(R.opcoes(q('1.1')), ['Y', 'PY', 'PN', 'N']);
  assert.deepEqual(R.opcoes(q('1.2')), ['NA', 'Y', 'PY', 'PN', 'N', 'NI']);
});
test('Domínio 1: caminho da Caixa 4', () => {
  assert.deepEqual(ids('D1', {}), ['1.1']);
  assert.deepEqual(ids('D1', { '1.1': 'N' }), ['1.1']);
  assert.deepEqual(ids('D1', { '1.1': 'Y' }), ['1.1', '1.2']);
  assert.deepEqual(ids('D1', { '1.1': 'PY', '1.2': 'N' }), ['1.1', '1.2', '1.4', '1.6']);
  assert.deepEqual(ids('D1', { '1.1': 'Y', '1.2': 'N', '1.4': 'Y' }), ['1.1', '1.2', '1.4', '1.5', '1.6']);
  assert.deepEqual(ids('D1', { '1.1': 'Y', '1.2': 'Y' }), ['1.1', '1.2', '1.3']);
  assert.deepEqual(ids('D1', { '1.1': 'Y', '1.2': 'Y', '1.3': 'N' }), ['1.1', '1.2', '1.3', '1.4', '1.6']);
  assert.deepEqual(ids('D1', { '1.1': 'Y', '1.2': 'Y', '1.3': 'PY' }), ['1.1', '1.2', '1.3', '1.7']);
  assert.deepEqual(ids('D1', { '1.1': 'Y', '1.2': 'Y', '1.3': 'Y', '1.7': 'PY' }), ['1.1', '1.2', '1.3', '1.7', '1.8']);
});
test('Domínio 2: caminho da Caixa 5', () => {
  assert.deepEqual(ids('D2', {}), ['2.1']);
  assert.deepEqual(ids('D2', { '2.1': 'N' }), ['2.1', '2.4']);
  assert.deepEqual(ids('D2', { '2.1': 'N', '2.4': 'N' }), ['2.1', '2.4', '2.5']);
  assert.deepEqual(ids('D2', { '2.1': 'N', '2.4': 'Y' }), ['2.1', '2.4']);
  assert.deepEqual(ids('D2', { '2.1': 'Y' }), ['2.1', '2.2']);
  assert.deepEqual(ids('D2', { '2.1': 'Y', '2.2': 'N' }), ['2.1', '2.2', '2.4']);
  assert.deepEqual(ids('D2', { '2.1': 'Y', '2.2': 'Y' }), ['2.1', '2.2', '2.3']);
  assert.deepEqual(ids('D2', { '2.1': 'Y', '2.2': 'Y', '2.3': 'Y', '2.4': 'Y' }), ['2.1', '2.2', '2.3', '2.4', '2.5']);
  assert.deepEqual(ids('D2', { '2.1': 'Y', '2.2': 'Y', '2.3': 'N', '2.4': 'Y' }), ['2.1', '2.2', '2.3', '2.4']);
});
test('Domínio 4 depende do efeito de interesse; domínio 5 condicional', () => {
  assert.deepEqual(ids('D4', {}, 'assignment'), ['4.1']);
  assert.deepEqual(ids('D4', { '4.1': 'Y' }, 'assignment'), ['4.1', '4.2']);
  assert.deepEqual(ids('D4', {}, 'adhering'), ['4.3', '4.4', '4.5']);
  assert.deepEqual(ids('D4', { '4.3': 'Y', '4.4': 'Y', '4.5': 'PN' }, 'adhering'), ['4.3', '4.4', '4.5', '4.6']);
  assert.deepEqual(ids('D5', { '5.1': 'Y', '5.2': 'N', '5.3': 'N' }), ['5.1', '5.2', '5.3']);
  assert.deepEqual(ids('D5', { '5.1': 'PN' }), ['5.1', '5.2', '5.3', '5.4', '5.5']);
  assert.deepEqual(ids('D5', { '5.1': 'Y', '5.3': 'PY' }), ['5.1', '5.2', '5.3', '5.4', '5.5']);
  assert.deepEqual(ids('D3', {}), ['3.1', '3.2', '3.3']);
  assert.deepEqual(ids('D6', {}), ['6.1', '6.2', '6.3', '6.4']);
  assert.deepEqual(ids('D7', {}), ['7.1', '7.2', '7.3']);
});
test('Tabela 2: julgamento global', () => {
  const base = (o) => Object.assign({ D1: 'baixo', D2: 'baixo', D3: 'baixo', D4: 'baixo', D5: 'baixo', D6: 'baixo', D7: 'baixo' }, o);
  assert.equal(R.global(base()).global, 'baixo');
  assert.equal(R.global(base({ D1: 'moderado' })).global, 'moderado');
  assert.equal(R.global(base({ D1: 'moderado', D5: 'moderado' })).global, 'moderado');
  assert.equal(R.global(base({ D1: 'moderado', D5: 'grave' })).global, 'grave');
  assert.equal(R.global(base({ D3: 'grave', D6: 'critico' })).global, 'critico');
  assert.equal(R.global(base({ D4: 'ni' })).global, 'ni');
  assert.equal(R.global(base({ D4: 'ni', D1: 'moderado' })).global, 'ni');
  assert.equal(R.global(base({ D4: 'ni', D2: 'grave' })).global, 'grave');
  assert.equal(R.global(base({ D7: undefined })).global, null);
  assert.equal(R.global(base({ D7: undefined, D2: 'critico' })).global, 'critico');
  assert.ok(R.global(base({ D1: 'moderado', D2: 'moderado' })).notas.length);
  assert.ok(R.global(base({ D1: 'grave', D2: 'grave' })).notas.length);
});
test('Sugestão do guia: 1.1 N/PN = baixo risco no domínio 1', () => {
  assert.equal(R.sugestaoDominio('D1', { '1.1': 'N' }), 'baixo');
  assert.equal(R.sugestaoDominio('D1', { '1.1': 'Y' }), null);
  assert.equal(R.sugestaoDominio('D2', { '1.1': 'N' }), null);
});
